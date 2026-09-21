import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { developerInvites, projects, notifications, projectUsers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/developers/invite
 * Send an invitation to a developer to join a project
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, recipientId, message } = await req.json();

    if (!projectId || !recipientId) {
      return NextResponse.json(
        { error: "Missing projectId or recipientId" },
        { status: 400 }
      );
    }

    // Verify project exists and user is owner or member
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const project = projectResult[0];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only project owner can send invites" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const memberCheck = await db
      .select()
      .from(projectUsers)
      .where(
        and(
          eq(projectUsers.projectId, projectId),
          eq(projectUsers.userId, recipientId)
        )
      )
      .limit(1);

    if (memberCheck.length > 0) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const existingInvite = await db
      .select()
      .from(developerInvites)
      .where(
        and(
          eq(developerInvites.projectId, projectId),
          eq(developerInvites.recipientId, recipientId),
          eq(developerInvites.status, "pending")
        )
      )
      .limit(1);

    if (existingInvite.length > 0) {
      return NextResponse.json(
        { error: "Invitation already sent" },
        { status: 400 }
      );
    }

    // Create invitation
    const invite = await db
      .insert(developerInvites)
      .values({
        projectId,
        senderId: session.user.id,
        recipientId,
        message: message || "",
        status: "pending",
      })
      .returning();

    // Create notification for recipient
    await db.insert(notifications).values({
      recipientId,
      senderId: session.user.id,
      projectId,
      type: "developer_invited",
      message: `You've been invited to join "${project.title}" project`,
      isRead: false,
    });

    return NextResponse.json({ success: true, invite: invite[0] });
  } catch (error) {
    console.error("Error in invite endpoint:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
