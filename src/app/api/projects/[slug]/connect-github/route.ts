import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ slug: string }> };

/**
 * POST /api/projects/[slug]/connect-github
 * Create and connect a GitHub repository for an existing project (owner only)
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

    // Fetch the project to verify ownership
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    const project = projectResult[0];

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch owner's GitHub username
    const ownerUsers = await db
      .select({ githubUsername: users.githubUsername })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    const ownerGithubUsername = ownerUsers[0]?.githubUsername || session.user.username || "github-user";

    // Try to parse existing repository URL from request body
    let existingRepoUrl = "";
    try {
      const body = await req.json();
      existingRepoUrl = body.githubRepoUrl || "";
    } catch (e) {
      // Ignore body parsing errors for backwards compatibility
    }

    // Connect existing repo URL or auto-create a new one
    let finalGithubRepoUrl = "";
    if (existingRepoUrl && existingRepoUrl.trim() !== "") {
      const trimmed = existingRepoUrl.trim();
      if (!trimmed.startsWith("https://github.com/")) {
        return NextResponse.json(
          { error: "Invalid repository URL. Must start with https://github.com/" },
          { status: 400 }
        );
      }
      finalGithubRepoUrl = trimmed;
    } else if (session.accessToken) {
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
            name: project.slug,
            description: project.description || `Repository for ${project.title}`,
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
          finalGithubRepoUrl = `https://github.com/${ownerGithubUsername}/${project.slug}`;
        }
      } catch (err) {
        console.error("Error connecting to GitHub API:", err);
        finalGithubRepoUrl = `https://github.com/${ownerGithubUsername}/${project.slug}`;
      }
    } else {
      finalGithubRepoUrl = `https://github.com/${ownerGithubUsername}/${project.slug}`;
    }

    // Update project in database
    const updated = await db
      .update(projects)
      .set({
        githubRepoUrl: finalGithubRepoUrl,
        isGithubConnected: true,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error connecting GitHub repository:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
