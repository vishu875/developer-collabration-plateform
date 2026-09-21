import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { users, projectUsers, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Github, Mail, MapPin, Code2, ArrowRight } from "lucide-react";
import InviteButton from "@/components/profile/invite-button";

type PageParams = { params: Promise<{ username: string }> };

export default async function DeveloperProfilePage({ params }: PageParams) {
  const { username } = await params;

  // Fetch developer
  const developerResult = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  const developer = developerResult[0];

  if (!developer) {
    notFound();
  }

  // Fetch projects they're part of
  const userProjects = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      description: projects.description,
      technologies: projects.technologies,
      status: projects.status,
    })
    .from(projectUsers)
    .innerJoin(projects, eq(projectUsers.projectId, projects.id))
    .where(eq(projectUsers.userId, developer.id));

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Back Button */}
        <Link
          href="/discover"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-12 uppercase tracking-wider font-semibold"
        >
          ← Back to Discover
        </Link>

        <div className="space-y-12">
          {/* Header Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Avatar */}
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={developer.profilePicture}
                  alt={developer.username}
                  className="w-20 h-20 rounded-2xl border border-zinc-800 object-cover"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    @{developer.username}
                  </h1>
                  {developer.location && (
                    <div className="flex items-center gap-2 text-zinc-400 mt-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{developer.location}</span>
                    </div>
                  )}
                </div>

                {developer.bio && (
                  <p className="text-base text-zinc-300 leading-relaxed max-w-2xl">
                    {developer.bio}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {developer.githubUsername && (
                    <a
                      href={`https://github.com/${developer.githubUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-white text-sm font-semibold transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      GitHub Profile
                    </a>
                  )}
                  <a
                    href={`mailto:${developer.email}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-white text-sm font-semibold transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Contact
                  </a>
                </div>
              </div>

              {/* Invite Button */}
              <div className="sm:ml-auto">
                <InviteButton developerId={developer.id} developerName={developer.username} />
              </div>
            </div>
          </div>

          {/* Skills Section */}
          {developer.skills.length > 0 && (
            <div className="space-y-6 border-t border-zinc-900 pt-12">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-indigo-400" />
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Skills & Technologies
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {developer.skills.map((skill) => (
                  <div
                    key={skill}
                    className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-center"
                  >
                    <p className="text-sm font-semibold text-indigo-300">{skill}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-zinc-400">
                {developer.skills.length} skills • Proficient in multiple technologies
              </p>
            </div>
          )}

          {/* Projects Section */}
          {userProjects.length > 0 && (
            <div className="space-y-6 border-t border-zinc-900 pt-12">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Projects & Experience
              </h2>

              <div className="space-y-4">
                {userProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="group block p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                          {project.title}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                          {project.description}
                        </p>

                        {/* Technologies */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {project.technologies.slice(0, 3).map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-1 text-xs font-medium bg-zinc-900 text-zinc-300 rounded-lg"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 3 && (
                            <span className="px-2 py-1 text-xs text-zinc-500">
                              +{project.technologies.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2 mt-3">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              project.status === "open"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : project.status === "in-progress"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {userProjects.length === 0 && (
            <div className="space-y-6 border-t border-zinc-900 pt-12">
              <div className="text-center py-12 space-y-2">
                <p className="text-zinc-400">No projects yet</p>
                <p className="text-sm text-zinc-500">
                  This developer hasn't joined any projects yet
                </p>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="border-t border-zinc-900 pt-12 grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 text-center">
              <p className="text-2xl font-bold text-white">{developer.skills.length}</p>
              <p className="text-xs text-zinc-400 mt-1">Skills</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 text-center">
              <p className="text-2xl font-bold text-white">{userProjects.length}</p>
              <p className="text-xs text-zinc-400 mt-1">Projects</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 text-center">
              <p className="text-2xl font-bold text-white">
                {Math.floor(
                  (new Date().getTime() - new Date(developer.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Days Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
