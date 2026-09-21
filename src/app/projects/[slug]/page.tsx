import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, projectUsers, joinRequests, users, developerInvites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import JoinProjectButton from "@/components/project/join-button";
import AIMatchmaker from "@/components/project/ai-matchmaker";
import ConnectGithubButton from "@/components/project/connect-github-button";
import InvitationResponseButton from "@/components/project/invitation-response-button";
import { Calendar, Users, FolderGit2, Briefcase, Github, Brain, MessageSquare } from "lucide-react";
import type { Metadata } from "next";

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata(
  { params }: PageParams
): Promise<Metadata> {
  const { slug } = await params;
  const projectResult = await db
    .select({ title: projects.title, description: projects.description })
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  const project = projectResult[0];

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: project.title,
    description: project.description.substring(0, 150),
  };
}

export default async function ProjectDetailPage(
  { params }: PageParams
) {
  const { slug } = await params;
  const session = await auth();

  // 1. Fetch project details
  const projectResult = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      description: projects.description,
      technologies: projects.technologies,
      requiredSkills: projects.requiredSkills,
      teamSize: projects.teamSize,
      responsibilities: projects.responsibilities,
      startDate: projects.startDate,
      endDate: projects.endDate,
      status: projects.status,
      ownerId: projects.ownerId,
      aiSummary: projects.aiSummary,
      githubRepoUrl: projects.githubRepoUrl,
      isGithubConnected: projects.isGithubConnected,
      createdAt: projects.createdAt,
      owner: {
        id: users.id,
        username: users.username,
        profilePicture: users.profilePicture,
        bio: users.bio,
      },
    })
    .from(projects)
    .leftJoin(users, eq(projects.ownerId, users.id))
    .where(eq(projects.slug, slug))
    .limit(1);

  const project = projectResult[0];

  if (!project) {
    notFound();
  }

  // 2. Fetch project members
  const members = await db
    .select({
      id: users.id,
      username: users.username,
      profilePicture: users.profilePicture,
      bio: users.bio,
    })
    .from(projectUsers)
    .innerJoin(users, eq(projectUsers.userId, users.id))
    .where(eq(projectUsers.projectId, project.id));

  // 3. User relationship checks
  const currentUserId = session?.user?.id;
  const isOwner = currentUserId === project.ownerId;
  const isMember = members.some((member) => member.id === currentUserId);

  let hasPendingRequest = false;
  let pendingInvite: { id: string } | null = null;

  if (currentUserId && !isOwner && !isMember) {
    // Check for join request
    const pendingRequestResult = await db
      .select()
      .from(joinRequests)
      .where(
        and(
          eq(joinRequests.projectId, project.id),
          eq(joinRequests.userId, currentUserId),
          eq(joinRequests.status, "pending")
        )
      )
      .limit(1);
    hasPendingRequest = pendingRequestResult.length > 0;

    // Check for developer invitation
    const inviteResult = await db
      .select({ id: developerInvites.id })
      .from(developerInvites)
      .where(
        and(
          eq(developerInvites.projectId, project.id),
          eq(developerInvites.recipientId, currentUserId),
          eq(developerInvites.status, "pending")
        )
      )
      .limit(1);
    pendingInvite = inviteResult[0] || null;
  }

  const startDateStr = new Date(project.startDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const endDateStr = new Date(project.endDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Back Button */}
        <Link
          href="/discover"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-12 uppercase tracking-wider font-semibold"
        >
          ← Back to Discover
        </Link>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Main Content */}
          <div className="flex-1 space-y-12">
            {/* Hero Section */}
            <div className="space-y-6">
              <div className="flex items-baseline gap-4 flex-wrap">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                  {project.title}
                </h1>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
                    project.status === "open"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : project.status === "in-progress"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-zinc-800/50 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  {project.status.replace("-", " ")}
                </span>
              </div>

              {/* Creator & Timeline */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.owner?.profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                    alt={project.owner?.username || "owner"}
                    className="w-10 h-10 rounded-full border border-zinc-800 object-cover"
                  />
                  <div>
                    <p className="text-xs text-zinc-500">Created by</p>
                    <p className="text-sm font-semibold text-white">
                      @{project.owner?.username || "anonymous"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  <span>{startDateStr} – {endDateStr}</span>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {project.aiSummary && (
              <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/15 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Brain className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">AI Summary</span>
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed italic">
                  "{project.aiSummary}"
                </p>
              </div>
            )}

            {/* Description Section */}
            <div className="space-y-4 border-t border-zinc-900 pt-12">
              <h2 className="text-lg font-bold text-white tracking-tight">About this project</h2>
              <p className="text-base text-zinc-300 leading-relaxed whitespace-pre-wrap max-w-2xl">
                {project.description}
              </p>
            </div>

            {/* Responsibilities Section */}
            <div className="space-y-4 border-t border-zinc-900 pt-12">
              <h2 className="text-lg font-bold text-white tracking-tight">Roles & Responsibilities</h2>
              <p className="text-base text-zinc-300 leading-relaxed whitespace-pre-wrap max-w-2xl">
                {project.responsibilities}
              </p>
            </div>

            {/* AI Matchmaker for Owner */}
            {isOwner && (
              <div className="border-t border-zinc-900 pt-12">
                <AIMatchmaker projectId={project.id} />
              </div>
            )}

            {/* Team Members */}
            {members.length > 0 && (
              <div className="space-y-6 border-t border-zinc-900 pt-12">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-zinc-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Team ({members.length}/{project.teamSize})
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={member.profilePicture}
                        alt={member.username}
                        className="w-8 h-8 rounded-full object-cover border border-zinc-800"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-200 truncate">
                          @{member.username}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {member.id === project.ownerId ? "Owner" : "Member"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 flex flex-col gap-8">
            {/* Action Panel */}
            <div className="sticky top-8">
              <div className="space-y-3 mb-8">
                {isOwner ? (
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">You own this project</p>
                  </div>
                ) : isMember ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">You're on this team</p>
                  </div>
                ) : pendingInvite && session ? (
                  <InvitationResponseButton
                    inviteId={pendingInvite.id}
                    projectTitle={project.title}
                  />
                ) : session ? (
                  <JoinProjectButton
                    projectSlug={project.slug}
                    isPending={hasPendingRequest}
                  />
                ) : (
                  <Link
                    href="/sign-in"
                    className="block w-full btn-primary font-semibold rounded-xl py-3 px-4 text-center transition-colors text-sm"
                  >
                    Sign in to join
                  </Link>
                )}

                {(isOwner || isMember) && (
                  <Link
                    href={`/projects/${project.slug}/chat`}
                    className="flex items-center justify-center gap-2 w-full btn-primary font-semibold rounded-xl py-3 px-4 transition-colors text-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Team Chat
                  </Link>
                )}

                {project.isGithubConnected && project.githubRepoUrl && project.githubRepoUrl.trim() !== "" ? (
                  <a
                    href={project.githubRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full btn-secondary rounded-xl py-3 px-4 transition-colors text-sm font-semibold"
                  >
                    <Github className="h-4 w-4" />
                    GitHub Repo
                  </a>
                ) : (
                  isOwner && (
                    <ConnectGithubButton projectSlug={project.slug} label="Connect GitHub" />
                  )
                )}
              </div>

              {/* Requirements */}
              <div className="space-y-6 p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800">
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                    Technologies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 text-xs font-medium bg-zinc-900 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 text-xs font-medium bg-indigo-950/30 text-indigo-300 border border-indigo-500/20 rounded-lg hover:bg-indigo-950/50 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-xs text-zinc-400">
                    <span className="font-semibold">{members.length}</span> of <span className="font-semibold">{project.teamSize}</span> spots filled
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
