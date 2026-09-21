import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, messages, projectUsers, users } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

type RouteParams = { params: Promise<{ slug: string }> };

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty").max(2000),
});

/**
 * GET /api/projects/[slug]/messages
 * Retrieve chat history for the project team members
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Fetch project details
    const projectResult = await db
      .select({ id: projects.id, ownerId: projects.ownerId })
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    const project = projectResult[0];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Validate membership
    const isOwner = project.ownerId === userId;
    const teamMember = await db
      .select()
      .from(projectUsers)
      .where(
        and(
          eq(projectUsers.projectId, project.id),
          eq(projectUsers.userId, userId)
        )
      )
      .limit(1);

    if (!isOwner && teamMember.length === 0) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this project team" },
        { status: 403 }
      );
    }

    // 3. Fetch chat history
    const data = await db
      .select({
        id: messages.id,
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          username: users.username,
          profilePicture: users.profilePicture,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.projectId, project.id))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching project messages:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[slug]/messages
 * Post a new chat message in the project workspace channel
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

    const userId = session.user.id;

    // 1. Fetch project details
    const projectResult = await db
      .select({ id: projects.id, ownerId: projects.ownerId })
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    const project = projectResult[0];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Validate membership
    const isOwner = project.ownerId === userId;
    const teamMember = await db
      .select()
      .from(projectUsers)
      .where(
        and(
          eq(projectUsers.projectId, project.id),
          eq(projectUsers.userId, userId)
        )
      )
      .limit(1);

    if (!isOwner && teamMember.length === 0) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this project team" },
        { status: 403 }
      );
    }

    // 3. Parse message body
    const body = await req.json();
    const result = sendMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { content } = result.data;

    // 4. Insert message
    const inserted = await db
      .insert(messages)
      .values({
        projectId: project.id,
        senderId: userId,
        content,
        messageType: "text",
      })
      .returning();

    // Fetch and return the full message with sender profile context
    const fullMessage = await db
      .select({
        id: messages.id,
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          username: users.username,
          profilePicture: users.profilePicture,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.id, inserted[0].id))
      .limit(1);

    return NextResponse.json(fullMessage[0], { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
