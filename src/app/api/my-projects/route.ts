import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, projectUsers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/my-projects?developerId=XXX
 * Get all projects owned by the current user
 * If developerId is provided, includes member status for that developer
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const developerId = searchParams.get("developerId");

    const userProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        description: projects.description,
        requiredSkills: projects.requiredSkills,
        teamSize: projects.teamSize,
        status: projects.status,
      })
      .from(projects)
      .where(eq(projects.ownerId, session.user.id))
      .orderBy(projects.createdAt);

    // If developerId provided, check member status for each project
    if (developerId) {
      const enrichedProjects = await Promise.all(
        userProjects.map(async (project) => {
          const memberCheck = await db
            .select()
            .from(projectUsers)
            .where(
              and(
                eq(projectUsers.projectId, project.id),
                eq(projectUsers.userId, developerId)
              )
            )
            .limit(1);

          return {
            ...project,
            isMember: memberCheck.length > 0,
          };
        })
      );

      return NextResponse.json({
        projects: enrichedProjects,
      });
    }

    return NextResponse.json({
      projects: userProjects,
    });
  } catch (error) {
    console.error("Error fetching user projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
