import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { githubRepos, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/github/sync
 * Sync user's GitHub repositories and extract languages as skills
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session || !session.accessToken || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: Missing GitHub authentication" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const accessToken = session.accessToken;

    // 1. Fetch repositories from GitHub API
    const response = await fetch(
      "https://api.github.com/user/repos?per_page=100&type=owner&sort=updated",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "DevConnect-App",
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("GitHub API error response:", errText);
      return NextResponse.json(
        { error: "Failed to fetch repositories from GitHub" },
        { status: response.status }
      );
    }

    const reposData = await response.json();

    if (!Array.isArray(reposData)) {
      return NextResponse.json(
        { error: "Invalid response from GitHub API" },
        { status: 502 }
      );
    }

    const languagesSet = new Set<string>();

    // 2. Perform DB operations inside a transaction to ensure atomic updates
    const syncedRepos = await db.transaction(async (tx) => {
      const results = [];

      for (const repo of reposData) {
        // Collect primary language for skill extraction
        if (repo.language) {
          languagesSet.add(repo.language);
        }

        // Upsert repository into database
        const values = {
          userId,
          repoId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || "",
          url: repo.html_url,
          language: repo.language || "",
          stargazersCount: repo.stargazers_count || 0,
          forksCount: repo.forks_count || 0,
          updatedAt: new Date(),
        };

        const upserted = await tx
          .insert(githubRepos)
          .values({ ...values, id: undefined }) // Let default random uuid handle id
          .onConflictDoUpdate({
            target: githubRepos.repoId,
            set: {
              name: values.name,
              fullName: values.fullName,
              description: values.description,
              url: values.url,
              language: values.language,
              stargazersCount: values.stargazersCount,
              forksCount: values.forksCount,
              updatedAt: values.updatedAt,
            },
          })
          .returning();

        results.push(upserted[0]);
      }

      // 3. Extract languages, merge with current user skills, and update users table
      if (languagesSet.size > 0) {
        const currentUserResult = await tx
          .select({ skills: users.skills })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const currentSkills = currentUserResult[0]?.skills || [];
        
        // Merge skills maintaining case-insensitive uniqueness
        const mergedSkills = [...currentSkills];
        const lowerCurrent = currentSkills.map((s) => s.toLowerCase());

        languagesSet.forEach((lang) => {
          if (!lowerCurrent.includes(lang.toLowerCase())) {
            mergedSkills.push(lang);
          }
        });

        // Limit to 30 skills max (matches validation constraint)
        const updatedSkills = mergedSkills.slice(0, 30);

        await tx
          .update(users)
          .set({ skills: updatedSkills, updatedAt: new Date() })
          .where(eq(users.id, userId));
      }

      return results;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedRepos.length} repositories.`,
      reposCount: syncedRepos.length,
      extractedLanguages: Array.from(languagesSet),
    });
  } catch (error) {
    console.error("Error syncing GitHub repos:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
