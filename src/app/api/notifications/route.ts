import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications, users, projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/notifications
 * Fetch user notifications
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        message: notifications.message,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        sender: {
          id: users.id,
          username: users.username,
          profilePicture: users.profilePicture,
        },
        project: {
          id: projects.id,
          title: projects.title,
          slug: projects.slug,
        },
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.senderId, users.id))
      .leftJoin(projects, eq(notifications.projectId, projects.id))
      .where(eq(notifications.recipientId, session.user.id))
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications
 * Mark all notifications as read
 */
export async function PUT() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.recipientId, session.user.id));

    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
