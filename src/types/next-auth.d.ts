import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      username: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    username?: string;
    isAdmin?: boolean;
    accessToken?: string;
  }
}
