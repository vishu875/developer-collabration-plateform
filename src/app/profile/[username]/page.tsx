import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { users, githubRepos, projects, projectUsers } from "@/lib/db/schema";
import { eq, and, not, desc } from "drizzle-orm";
import { Github, MapPin, Award, FolderGit2, Star, GitFork, User } from "lucide-react";
import type { Metadata } from "next";

type ProfileParams = { params: Promise<{ username: string }> };

export async function generateMetadata(
  { params }: ProfileParams
): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} | Profile`,
    description: `View developer portfolio, skills, and projects for @${username}.`,
  };
}

export default async function ProfilePage(
  { params }: ProfileParams
) {
  const { username } = await params;

  // 1. Fetch user by username
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  const user = userResult[0];

  if (!user) {
    notFound();
  }

  // 2. Fetch user's synced GitHub repos
  const repos = await db
    .select()
    .from(githubRepos)
    .where(eq(githubRepos.userId, user.id))
    .orderBy(desc(githubRepos.stargazersCount));

  // 3. Fetch projects they own
  const ownedProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, user.id));

  // 4. Fetch projects they are collaborating on (joined teams, excluding owned)
  const memberProjects = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      description: projects.description,
      status: projects.status,
    })
    .from(projectUsers)
    .innerJoin(projects, eq(projectUsers.projectId, projects.id))
    .where(
      and(
        eq(projectUsers.userId, user.id),
        not(eq(projects.ownerId, user.id))
      )
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: User Card & Skills */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 text-center space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.profilePicture}
              alt={user.username}
              className="w-24 h-24 rounded-full mx-auto border-2 border-indigo-500/20 object-cover"
            />
            <div>
              <h1 className="text-xl font-bold text-white">@{user.username}</h1>
              <p className="text-xs text-gray-500 mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>

            {user.location && (
              <div className="flex items-center justify-center gap-1 text-gray-400 text-xs">
                <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                <span>{user.location}</span>
              </div>
            )}
          </div>

          {/* Skills list */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Award className="h-4 w-4 text-violet-400" />
              Developer Skills
            </h3>
            {user.skills.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No skills listed yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2.5 py-1 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Bio, Projects & GitHub Repos */}
        <div className="lg:col-span-2 space-y-8">
          {/* About / Bio section */}
          <div className="glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-400" />
              About Developer
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {user.bio || "No biography provided yet."}
            </p>
          </div>

          {/* Synced GitHub Repos */}
          {repos.length > 0 && (
            <div className="glass rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Github className="h-5 w-5 text-violet-400" />
                GitHub Portfolio ({repos.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {repos.slice(0, 6).map((repo) => (
                  <div
                    key={repo.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-sm text-gray-200 hover:text-indigo-400 transition-colors truncate block max-w-[70%]"
                        >
                          {repo.name}
                        </a>
                        {repo.language && (
                          <span className="text-[10px] font-medium bg-white/5 text-gray-400 px-2 py-0.5 rounded-md">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-amber-500/70" />
                        {repo.stargazersCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <GitFork className="h-3 w-3" />
                        {repo.forksCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User's projects list */}
          <div className="glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-cyan-400" />
              DevConnect Collaboration Teams
            </h2>

            {ownedProjects.length === 0 && memberProjects.length === 0 ? (
              <p className="text-xs text-gray-500 italic">Not participating in any collaboration teams yet.</p>
            ) : (
              <div className="space-y-4">
                {ownedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white">{p.title}</h4>
                      <p className="text-[10px] text-indigo-400 font-semibold mt-1">Project Creator &bull; Status: {p.status}</p>
                    </div>
                    <Link
                      href={`/projects/${p.slug}`}
                      className="text-xs font-semibold text-indigo-400 hover:underline"
                    >
                      View Project &rarr;
                    </Link>
                  </div>
                ))}

                {memberProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white">{p.title}</h4>
                      <p className="text-[10px] text-green-400 font-semibold mt-1">Collaborator &bull; Status: {p.status}</p>
                    </div>
                    <Link
                      href={`/projects/${p.slug}`}
                      className="text-xs font-semibold text-indigo-400 hover:underline"
                    >
                      View Project &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
