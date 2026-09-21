import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, projectUsers, users } from "@/lib/db/schema";
import { createProjectSchema, projectFilterSchema } from "@/lib/validations";
import { createSlug } from "@/lib/utils";
import { generateProjectSummary } from "@/lib/groq";
import { eq, and, or, ilike, sql, desc, asc } from "drizzle-orm";

/**
 * GET /api/projects
 * Browse projects with search, filter, and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse filters
    const filterResult = projectFilterSchema.safeParse({
      search: searchParams.get("search") || undefined,
      technology: searchParams.get("technology") || undefined,
      skill: searchParams.get("skill") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      sort: searchParams.get("sort") || undefined,
    });

    if (!filterResult.success) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: filterResult.error.format() },
        { status: 400 }
      );
    }

    const query = filterResult.data;

    const offset = (query.page - 1) * query.limit;

    // Build conditions list
    const conditions = [];

    if (query.status) {
      conditions.push(eq(projects.status, query.status));
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(projects.title, `%${query.search}%`),
          ilike(projects.description, `%${query.search}%`)
        )
      );
    }

    if (query.technology) {
      conditions.push(sql`${query.technology} = any(${projects.technologies})`);
    }

    if (query.skill) {
      conditions.push(sql`${query.skill} = any(${projects.requiredSkills})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch projects
    const data = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        description: projects.description,
        technologies: projects.technologies,
        requiredSkills: projects.requiredSkills,
        teamSize: projects.teamSize,
        status: projects.status,
        aiSummary: projects.aiSummary,
        createdAt: projects.createdAt,
        owner: {
          id: users.id,
          username: users.username,
          profilePicture: users.profilePicture,
        },
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .where(whereClause)
      .limit(query.limit)
      .offset(offset)
      .orderBy(query.sort === "newest" ? desc(projects.createdAt) : asc(projects.createdAt));

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(whereClause);
      
    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / query.limit);

    return NextResponse.json({
      projects: data,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createProjectSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      technologies,
      requiredSkills,
      teamSize,
      responsibilities,
      startDate,
      endDate,
      githubRepoUrl,
      autoCreateRepo,
    } = result.data;

    // Generate unique slug
    let slug = createSlug(title);
    const existing = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    // Generate AI Summary using Groq
    let aiSummary = "";
    try {
      aiSummary = await generateProjectSummary(
        title,
        description,
        technologies,
        requiredSkills
      );
    } catch (err) {
      console.error("Groq AI summary generation failed:", err);
      // Fallback to manual snippet if Groq fails
      aiSummary = description.substring(0, 150) + "...";
    }

    // Fetch owner GitHub username
    const ownerUsers = await db
      .select({ githubUsername: users.githubUsername })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    const ownerGithubUsername = ownerUsers[0]?.githubUsername || session.user.username || "github-user";

    // Auto-create a public GitHub repository if requested and session has accessToken
    let finalGithubRepoUrl = githubRepoUrl || "";
    if (!finalGithubRepoUrl && autoCreateRepo && session.accessToken) {
      try {
        const repoResponse = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: {
            "Authorization": `token ${session.accessToken}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "DevConnect",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: slug,
            description: description || `Repository for ${title}`,
            private: false,
            auto_init: true,
          }),
        });

        if (repoResponse.ok) {
          const repoData = await repoResponse.json();
          finalGithubRepoUrl = repoData.html_url;
        } else {
          const errText = await repoResponse.text();
          console.error("GitHub repository creation failed. Response:", errText);
          finalGithubRepoUrl = "";
        }
      } catch (err) {
        console.error("Error connecting to GitHub API:", err);
        finalGithubRepoUrl = "";
      }
    }

    const isGithubConnected = !!finalGithubRepoUrl && finalGithubRepoUrl.trim() !== "";

    // Create the project inside a transaction
    const newProject = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(projects)
        .values({
          title,
          slug,
          description,
          technologies,
          requiredSkills,
          teamSize,
          responsibilities,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          ownerId: session.user.id,
          aiSummary,
          githubRepoUrl: finalGithubRepoUrl,
          isGithubConnected,
        })
        .returning();

      const project = inserted[0];

      // Add owner as the first member of the project team
      await tx.insert(projectUsers).values({
        projectId: project.id,
        userId: session.user.id,
      });

      return project;
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
