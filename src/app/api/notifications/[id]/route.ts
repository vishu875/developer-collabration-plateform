import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/notifications/[id]
 * Mark a single notification as read
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.recipientId, session.user.id)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
