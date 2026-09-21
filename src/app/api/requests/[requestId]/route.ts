import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { joinRequests, projects, projectUsers, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

type RouteParams = { params: Promise<{ requestId: string }> };

const handleRequestSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

/**
 * PUT /api/requests/[requestId]
 * Accept or reject a project join request (owner only)
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { requestId } = await params;
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch join request details including the project info
    const joinRequestResult = await db
      .select({
        id: joinRequests.id,
        projectId: joinRequests.projectId,
        userId: joinRequests.userId,
        status: joinRequests.status,
        project: {
          id: projects.id,
          title: projects.title,
          ownerId: projects.ownerId,
        },
      })
      .from(joinRequests)
      .innerJoin(projects, eq(joinRequests.projectId, projects.id))
      .where(eq(joinRequests.id, requestId))
      .limit(1);

    const joinRequest = joinRequestResult[0];

    if (!joinRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // 2. Validate ownership of the project
    if (joinRequest.project.ownerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Request must still be pending
    if (joinRequest.status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been handled" },
        { status: 400 }
      );
    }

    // 4. Validate body parameters
    const body = await req.json();
    const parseResult = handleRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { action } = parseResult.data;

    // 5. Update request status inside transaction
    const result = await db.transaction(async (tx) => {
      const updatedStatus = action === "accept" ? "accepted" : "rejected";

      // Update join request status
      const updatedRequests = await tx
        .update(joinRequests)
        .set({
          status: updatedStatus,
          updatedAt: new Date(),
        })
        .where(eq(joinRequests.id, requestId))
        .returning();

      if (action === "accept") {
        // Add applicant to project team members
        await tx.insert(projectUsers).values({
          projectId: joinRequest.projectId,
          userId: joinRequest.userId,
        });

        // Notify applicant
        await tx.insert(notifications).values({
          recipientId: joinRequest.userId,
          senderId: session.user.id,
          projectId: joinRequest.projectId,
          type: "request_accepted",
          message: `Your request to join "${joinRequest.project.title}" has been accepted!`,
        });
      } else {
        // Notify applicant
        await tx.insert(notifications).values({
          recipientId: joinRequest.userId,
          senderId: session.user.id,
          projectId: joinRequest.projectId,
          type: "request_rejected",
          message: `Your request to join "${joinRequest.project.title}" was declined.`,
        });
      }

      return updatedRequests[0];
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error handling join request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
