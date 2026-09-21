import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateBioFromGitHub } from "@/lib/github-bio";

/**
 * POST /api/profile/generate-bio
 * Generate an authentic bio from GitHub profile and update user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's GitHub username
    const userResult = await db
      .select({ githubUsername: users.githubUsername })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const user = userResult[0];
    if (!user || !user.githubUsername) {
      return NextResponse.json(
        { error: "GitHub username not connected" },
        { status: 400 }
      );
    }

    // Generate bio from GitHub
    const bio = await generateBioFromGitHub(user.githubUsername);

    // Update user bio
    await db
      .update(users)
      .set({ bio, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      bio,
      message: "Bio generated and updated from GitHub profile",
    });
  } catch (error) {
    console.error("Error generating bio:", error);
    return NextResponse.json(
      { error: "Failed to generate bio from GitHub" },
      { status: 500 }
    );
  }
}
