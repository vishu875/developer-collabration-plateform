import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ne, and, or, ilike, sql, desc } from "drizzle-orm";

/**
 * GET /api/developers
 * Discover developers with search, filtering, and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const skill = searchParams.get("skill") || "";
    const sort = searchParams.get("sort") || "newest";

    const offset = (page - 1) * limit;

    // Build query filters
    const conditions: any[] = [
      ne(users.id, session.user.id), // Exclude current user
      // Only show developers with substantive profiles (has skills OR has bio)
      sql`(array_length(${users.skills}, 1) > 0 OR ${users.bio} != '')`,
    ];

    if (search) {
      conditions.push(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.bio, `%${search}%`),
          ilike(users.location, `%${search}%`)
        )
      );
    }

    if (skill) {
      conditions.push(
        sql`${users.skills}::text[] @> ARRAY[${skill}]::text[]`
      );
    }

    const whereConditions = and(...conditions.filter(Boolean));

    // Build sort
    const orderBy = sort === "oldest" ? users.createdAt : desc(users.createdAt);

    // Fetch total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereConditions);

    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch developers
    const developersList = await db
      .select({
        id: users.id,
        username: users.username,
        profilePicture: users.profilePicture,
        bio: users.bio,
        skills: users.skills,
        location: users.location,
      })
      .from(users)
      .where(whereConditions)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      developers: developersList,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error in developers search:", error);
    return NextResponse.json(
      { error: "Failed to fetch developers" },
      { status: 500 }
    );
  }
}
