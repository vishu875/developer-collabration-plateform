import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, projectUsers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import ProjectChat from "@/components/project/project-chat";
import type { Metadata } from "next";

type ChatPageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata(
  { params }: ChatPageParams
): Promise<Metadata> {
  const { slug } = await params;
  const projectResult = await db
    .select({ title: projects.title })
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  const project = projectResult[0];
  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: `${project.title} | Team Chat`,
  };
}

export default async function ProjectChatPage(
  { params }: ChatPageParams
) {
  const { slug } = await params;
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  // 1. Fetch project details
  const projectResult = await db
    .select({
      id: projects.id,
      title: projects.title,
      ownerId: projects.ownerId,
    })
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  const project = projectResult[0];

  if (!project) {
    notFound();
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
    // Return a forbidden view
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
        <p className="text-sm text-gray-400">
          You must be an accepted team member or owner of this project to view this chat.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ProjectChat
        projectSlug={slug}
        projectTitle={project.title}
        currentUserId={userId}
      />
    </div>
  );
}
