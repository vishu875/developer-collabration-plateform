import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, githubRepos, projectUsers } from "@/lib/db/schema";
import { generateDeveloperSummary } from "@/lib/groq";
import { eq, sql } from "drizzle-orm";

/**
 * POST /api/ai/summary
 * Generate an AI developer profile bio/summary using Groq
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Fetch user data (skills, username)
    const userResult = await db
      .select({
        username: users.username,
        skills: users.skills,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userResult[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch user's synced repos
    const repos = await db
      .select({
        name: githubRepos.name,
        language: githubRepos.language,
        description: githubRepos.description,
      })
      .from(githubRepos)
      .where(eq(githubRepos.userId, userId))
      .limit(15);

    // 3. Count projects they are collaborating on
    const collabCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(projectUsers)
      .where(eq(projectUsers.userId, userId));

    const projectCount = collabCountResult[0]?.count || 0;

    // 4. Generate AI profile summary via Groq
    const generatedBio = await generateDeveloperSummary(
      user.username,
      user.skills,
      repos,
      projectCount
    );

    if (!generatedBio) {
      throw new Error("Empty response received from Groq AI client");
    }

    // 5. Update user's bio in database
    await db
      .update(users)
      .set({ bio: generatedBio, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      bio: generatedBio,
    });
  } catch (error) {
    console.error("Error generating developer AI summary:", error);
    return NextResponse.json(
      { error: "Failed to generate profile summary via Groq AI" },
      { status: 500 }
    );
  }
}
