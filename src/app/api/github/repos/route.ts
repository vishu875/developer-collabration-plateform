import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { githubRepos, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/github/repos
 * Retrieve user's synced GitHub repositories and their profile skills
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch synced repos
    const repos = await db
      .select()
      .from(githubRepos)
      .where(eq(githubRepos.userId, userId))
      .orderBy(desc(githubRepos.stargazersCount));

    // Fetch user skills to display alongside
    const userResult = await db
      .select({ skills: users.skills })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      repos,
      skills: userResult[0]?.skills || [],
    });
  } catch (error) {
    console.error("Error fetching github repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
