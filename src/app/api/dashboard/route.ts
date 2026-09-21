import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, projectUsers, joinRequests, users } from "@/lib/db/schema";
import { eq, and, not } from "drizzle-orm";

/**
 * GET /api/dashboard
 * Retrieve data for the logged-in user's dashboard:
 * - Owned projects
 * - Member projects
 * - Incoming join requests (requests to user's projects)
 * - Outgoing join requests (requests from user to other projects)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Fetch owned projects
    const owned = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        description: projects.description,
        technologies: projects.technologies,
        requiredSkills: projects.requiredSkills,
        teamSize: projects.teamSize,
        status: projects.status,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(eq(projects.ownerId, userId));

    // 2. Fetch member projects (where user is member but NOT the owner)
    const joinedResult = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        description: projects.description,
        technologies: projects.technologies,
        requiredSkills: projects.requiredSkills,
        teamSize: projects.teamSize,
        status: projects.status,
        createdAt: projects.createdAt,
        owner: {
          id: users.id,
          username: users.username,
          profilePicture: users.profilePicture,
        },
      })
      .from(projectUsers)
      .innerJoin(projects, eq(projectUsers.projectId, projects.id))
      .leftJoin(users, eq(projects.ownerId, users.id))
      .where(
        and(
          eq(projectUsers.userId, userId),
          not(eq(projects.ownerId, userId))
        )
      );

    // 3. Fetch incoming join requests (requests sent to the user's projects)
    const incomingRequests = await db
      .select({
        id: joinRequests.id,
        message: joinRequests.message,
        status: joinRequests.status,
        createdAt: joinRequests.createdAt,
        project: {
          id: projects.id,
          title: projects.title,
          slug: projects.slug,
        },
        user: {
          id: users.id,
          username: users.username,
          profilePicture: users.profilePicture,
          bio: users.bio,
        },
      })
      .from(joinRequests)
      .innerJoin(projects, eq(joinRequests.projectId, projects.id))
      .innerJoin(users, eq(joinRequests.userId, users.id))
      .where(
        and(
          eq(projects.ownerId, userId),
          eq(joinRequests.status, "pending")
        )
      );

    // 4. Fetch outgoing join requests (requests sent by the user)
    const outgoingRequests = await db
      .select({
        id: joinRequests.id,
        message: joinRequests.message,
        status: joinRequests.status,
        createdAt: joinRequests.createdAt,
        project: {
          id: projects.id,
          title: projects.title,
          slug: projects.slug,
        },
      })
      .from(joinRequests)
      .innerJoin(projects, eq(joinRequests.projectId, projects.id))
      .where(eq(joinRequests.userId, userId));

    return NextResponse.json({
      owned,
      joined: joinedResult,
      incomingRequests,
      outgoingRequests,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
