import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, projectUsers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/projects/[slug]/members
 * Get all team members for a project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Fetch project
    const projectResult = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    const project = projectResult[0];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch team members
    const members = await db
      .select({
        id: users.id,
        username: users.username,
        profilePicture: users.profilePicture,
        bio: users.bio,
      })
      .from(projectUsers)
      .innerJoin(users, eq(projectUsers.userId, users.id))
      .where(eq(projectUsers.projectId, project.id));

    return NextResponse.json({
      members,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
