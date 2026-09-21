import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/profile
 * Fetch profile details (such as bio) for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        bio: users.bio,
        skills: users.skills,
        location: users.location,
        profilePicture: users.profilePicture,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile details:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile details" },
      { status: 500 }
    );
  }
}
