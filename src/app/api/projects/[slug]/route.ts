import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, projectUsers, users } from "@/lib/db/schema";
import { updateProjectSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ slug: string }> };

/**
 * GET /api/projects/[slug]
 * Retrieve details for a single project
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;

    // Fetch project and owner
    const projectResult = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        description: projects.description,
        technologies: projects.technologies,
        requiredSkills: projects.requiredSkills,
        teamSize: projects.teamSize,
        responsibilities: projects.responsibilities,
        startDate: projects.startDate,
        endDate: projects.endDate,
        status: projects.status,
        ownerId: projects.ownerId,
        aiSummary: projects.aiSummary,
        githubRepoUrl: projects.githubRepoUrl,
        createdAt: projects.createdAt,
        owner: {
          id: users.id,
          username: users.username,
          profilePicture: users.profilePicture,
          bio: users.bio,
        },
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .where(eq(projects.slug, slug))
      .limit(1);

    const project = projectResult[0];

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch project members
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

    return NextResponse.json({ ...project, members });
  } catch (error) {
    console.error("Error fetching project details:", error);
    return NextResponse.json(
      { error: "Failed to fetch project details" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[slug]
 * Update a project (owner only)
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the project to check ownership
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    const project = projectResult[0];

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const updateData: Partial<typeof projects.$inferInsert> = {
      ...result.data,
      startDate: result.data.startDate ? new Date(result.data.startDate) : undefined,
      endDate: result.data.endDate ? new Date(result.data.endDate) : undefined,
      updatedAt: new Date(),
    };

    const updated = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, project.id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[slug]
 * Delete a project (owner only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch project
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    const project = projectResult[0];

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check ownership
    if (project.ownerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(projects).where(eq(projects.id, project.id));

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
