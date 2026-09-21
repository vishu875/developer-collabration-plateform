import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { developerInvites, projectUsers, notifications, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * PATCH /api/developers/invite/[inviteId]
 * Accept or reject a developer invitation
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteId } = await params;
    const { action } = await req.json();

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the invitation
    const inviteResult = await db
      .select()
      .from(developerInvites)
      .where(eq(developerInvites.id, inviteId))
      .limit(1);

    const invite = inviteResult[0];

    if (!invite) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Verify the user is the recipient
    if (invite.recipientId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to respond to this invitation" },
        { status: 403 }
      );
    }

    // Check if already responded
    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation has already been responded to" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      // Add user to project
      await db
        .insert(projectUsers)
        .values({
          projectId: invite.projectId,
          userId: invite.recipientId,
        })
        .onConflictDoNothing();

      // Update invitation status
      await db
        .update(developerInvites)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(eq(developerInvites.id, inviteId));

      // Get project info for notification
      const projectResult = await db
        .select()
        .from(projects)
        .where(eq(projects.id, invite.projectId))
        .limit(1);

      const project = projectResult[0];

      // Notify sender that invitation was accepted
      await db.insert(notifications).values({
        recipientId: invite.senderId,
        senderId: invite.recipientId,
        projectId: invite.projectId,
        type: "invite_accepted",
        message: `Your invitation to join "${project?.title || "project"}" was accepted`,
        isRead: false,
      });

      return NextResponse.json({
        success: true,
        message: "Successfully joined the project",
      });
    } else {
      // Reject the invitation
      await db
        .update(developerInvites)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(developerInvites.id, inviteId));

      // Get project info for notification
      const projectResult = await db
        .select()
        .from(projects)
        .where(eq(projects.id, invite.projectId))
        .limit(1);

      const project = projectResult[0];

      // Notify sender that invitation was rejected
      await db.insert(notifications).values({
        recipientId: invite.senderId,
        senderId: invite.recipientId,
        projectId: invite.projectId,
        type: "invite_rejected",
        message: `Your invitation to join "${project?.title || "project"}" was declined`,
        isRead: false,
      });

      return NextResponse.json({
        success: true,
        message: "Invitation declined",
      });
    }
  } catch (error) {
    console.error("Error in invite response endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process invitation response" },
      { status: 500 }
    );
  }
}
