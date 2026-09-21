import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: { params: { scope: "read:user user:email repo" } },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        try {
          const githubProfile = profile as {
            login?: string;
            avatar_url?: string;
            id?: number;
            bio?: string;
            location?: string;
          };

          const githubIdStr = String(githubProfile.id);

          // Check if user already exists by githubId
          const existingUsers = await db
            .select()
            .from(users)
            .where(eq(users.githubId, githubIdStr))
            .limit(1);

          let existingUser = existingUsers[0];

          if (!existingUser) {
            // Also check by email to link accounts
            const existingUsersByEmail = user.email
              ? await db
                  .select()
                  .from(users)
                  .where(eq(users.email, user.email))
                  .limit(1)
              : [];

            existingUser = existingUsersByEmail[0];

            if (existingUser) {
              // Link GitHub to existing account
              const updatedUsers = await db
                .update(users)
                .set({
                  githubId: githubIdStr,
                  githubUsername: githubProfile.login || "",
                  profilePicture:
                    githubProfile.avatar_url || existingUser.profilePicture,
                })
                .where(eq(users.id, existingUser.id))
                .returning();
              existingUser = updatedUsers[0];
            } else {
              // Create new user
              const newUsers = await db
                .insert(users)
                .values({
                  username:
                    githubProfile.login ||
                    user.name?.replace(/\s/g, "") ||
                    `user-${Date.now()}`,
                  email: user.email || `${githubProfile.login || "user"}@github.com`,
                  githubId: githubIdStr,
                  githubUsername: githubProfile.login || "",
                  profilePicture: githubProfile.avatar_url || user.image || "",
                  bio: githubProfile.bio || "",
                  location: githubProfile.location || "",
                })
                .returning();
              existingUser = newUsers[0];
            }
          } else {
            // Update profile picture and GitHub username on every login
            const updatedUsers = await db
              .update(users)
              .set({
                profilePicture:
                  githubProfile.avatar_url || existingUser.profilePicture,
                githubUsername: githubProfile.login || existingUser.githubUsername,
              })
              .where(eq(users.id, existingUser.id))
              .returning();
            existingUser = updatedUsers[0];
          }

          return true;
        } catch (error) {
          console.error("Error during GitHub sign-in:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        const githubProfile = profile as { id?: number };
        const dbUsers = await db
          .select()
          .from(users)
          .where(eq(users.githubId, String(githubProfile.id)))
          .limit(1);

        const dbUser = dbUsers[0];

        if (dbUser) {
          token.userId = dbUser.id;
          token.username = dbUser.username;
          token.isAdmin = dbUser.isAdmin;
        }

        if (account.access_token) {
          token.accessToken = account.access_token;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.username = token.username as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.accessToken = token.accessToken as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
