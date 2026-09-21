import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, joinRequests, notifications, projectUsers } from "@/lib/db/schema";
import { createJoinRequestSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";

type RouteParams = { params: Promise<{ slug: string }> };

/**
 * POST /api/projects/[slug]/join
 * Request to join a project
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // 1. Fetch project
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    const project = projectResult[0];

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Prevent owner from joining their own project
    if (project.ownerId === currentUserId) {
      return NextResponse.json(
        { error: "You are already the owner of this project" },
        { status: 400 }
      );
    }

    // 3. Check if user is already a member
    const existingMember = await db
      .select()
      .from(projectUsers)
      .where(
        and(
          eq(projectUsers.projectId, project.id),
          eq(projectUsers.userId, currentUserId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: "You are already a member of this project" },
        { status: 400 }
      );
    }

    // 4. Check if request is already pending
    const existingRequest = await db
      .select()
      .from(joinRequests)
      .where(
        and(
          eq(joinRequests.projectId, project.id),
          eq(joinRequests.userId, currentUserId),
          eq(joinRequests.status, "pending")
        )
      )
      .limit(1);

    if (existingRequest.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending request for this project" },
        { status: 400 }
      );
    }

    // 5. Parse request body message
    const body = await req.json().catch(() => ({}));
    const parseResult = createJoinRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { message } = parseResult.data;

    // 6. Insert join request and notification inside transaction
    const newRequest = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(joinRequests)
        .values({
          projectId: project.id,
          userId: currentUserId,
          message,
          status: "pending",
        })
        .returning();

      // Notify project owner
      await tx.insert(notifications).values({
        recipientId: project.ownerId,
        senderId: currentUserId,
        projectId: project.id,
        type: "join_request",
        message: `${session.user.username || session.user.name || "A user"} requested to join your project "${project.title}"`,
      });

      return inserted[0];
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Error submitting join request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
