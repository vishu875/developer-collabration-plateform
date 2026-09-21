"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderGit2, Users, Bell, ArrowRight, Check, X, Loader2, GitPullRequest } from "lucide-react";
import GithubSyncCard from "@/components/dashboard/github-sync-card";
import ProfileSummaryCard from "@/components/dashboard/profile-summary-card";

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  technologies: string[];
  requiredSkills: string[];
  teamSize: number;
  status: string;
  createdAt: string;
  owner?: {
    id: string;
    username: string;
    profilePicture: string;
  };
};

type JoinRequest = {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  project: {
    id: string;
    title: string;
    slug: string;
  };
  user?: {
    id: string;
    username: string;
    profilePicture: string;
    bio: string;
  };
};

type DashboardData = {
  owned: Project[];
  joined: Project[];
  incomingRequests: JoinRequest[];
  outgoingRequests: JoinRequest[];
};

export default function UserDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null); // Track which request is being processed

  const fetchDashboardData = async (): Promise<void> => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        throw new Error("Failed to load dashboard data");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!ignore) {
        await fetchDashboardData();
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRequestAction = async (requestId: string, action: "accept" | "reject") => {
    setActionId(requestId);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to process request");
      }

      // Re-fetch data on success
      await fetchDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-lg" />
              <div className="space-y-1.5 flex-1">
                <div className="skeleton h-5 w-1/3" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-red-400 border border-red-500/20">
        {error}
      </div>
    );
  }

  const ownedCount = data?.owned.length || 0;
  const joinedCount = data?.joined.length || 0;
  const pendingRequestsCount = data?.incomingRequests.length || 0;

  const quickStats = [
    { label: "My Projects", value: ownedCount, icon: FolderGit2, color: "text-zinc-300" },
    { label: "Joined Teams", value: joinedCount, icon: Users, color: "text-zinc-300" },
    { label: "Pending Invites", value: pendingRequestsCount, icon: GitPullRequest, color: "text-zinc-300" },
  ];

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {quickStats.map((stat, idx) => (
          <div
            key={idx}
            className="glass rounded-xl p-5 flex items-center gap-4 border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 transition-all"
          >
            <div className={`w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Projects & Teams (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Projects */}
          <div className="glass rounded-2xl p-6 border border-zinc-800 bg-zinc-950/40">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-wider">
                <FolderGit2 className="w-4.5 h-4.5 text-zinc-400" />
                Projects I Own ({ownedCount})
              </h2>
              <Link
                href="/projects/create"
                className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                + Create Project
              </Link>
            </div>

            {ownedCount === 0 ? (
              <div className="text-center py-8 rounded-xl bg-zinc-950/30 border border-dashed border-zinc-850">
                <p className="text-xs text-zinc-500">You haven&apos;t posted any projects yet.</p>
                <Link
                  href="/projects/create"
                  className="inline-block mt-2.5 text-xs text-zinc-300 font-semibold hover:underline"
                >
                  Create one now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.owned.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-white text-sm tracking-tight">{project.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-1 leading-relaxed">{project.description}</p>
                      <div className="flex gap-1.5 mt-2.5">
                        {project.technologies.slice(0, 3).map((tech) => (
                          <span key={tech} className="tag text-[9px]">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="p-2 bg-zinc-900 border border-zinc-855 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 transition-all shrink-0"
                    >
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Joined Teams */}
          <div className="glass rounded-2xl p-6 border border-zinc-800 bg-zinc-950/40">
            <h2 className="text-sm font-bold flex items-center gap-2 text-white mb-5 uppercase tracking-wider">
              <Users className="w-4.5 h-4.5 text-zinc-400" />
              Joined Collaboration Teams ({joinedCount})
            </h2>

            {joinedCount === 0 ? (
              <div className="text-center py-8 rounded-xl bg-zinc-950/30 border border-dashed border-zinc-850">
                <p className="text-xs text-zinc-500">You haven&apos;t joined any project teams yet.</p>
                <Link
                  href="/discover"
                  className="inline-block mt-2.5 text-xs text-zinc-300 font-semibold hover:underline"
                >
                  Discover open projects
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.joined.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-white text-sm tracking-tight">{project.title}</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Owned by @{project.owner?.username || "anonymous"}
                      </p>
                      <div className="flex gap-1.5 mt-2.5">
                        {project.technologies.slice(0, 3).map((tech) => (
                          <span key={tech} className="tag text-[9px]">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="p-2 bg-zinc-900 border border-zinc-855 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 transition-all shrink-0"
                    >
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invites & Requests (Takes 1 col) */}
        <div className="space-y-6">
          {/* Incoming Join Requests */}
          <div className="glass rounded-2xl p-6 border border-zinc-800 bg-zinc-950/40">
            <h2 className="text-sm font-bold flex items-center gap-2 text-white mb-4 uppercase tracking-wider">
              <Bell className="w-4 h-4 text-zinc-400" />
              Incoming Requests
            </h2>

            {pendingRequestsCount === 0 ? (
              <div className="text-center py-6 text-[11px] text-zinc-500 bg-zinc-950/30 border border-dashed border-zinc-850 rounded-xl">
                No active join requests for your projects.
              </div>
            ) : (
              <div className="space-y-3.5">
                {data?.incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-900 flex flex-col gap-3.5"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={req.user?.profilePicture}
                        className="w-7 h-7 rounded-full border border-zinc-850 object-cover mt-0.5"
                        alt="applicant"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-300">
                          @{req.user?.username}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          wants to join <span className="font-semibold text-white">{req.project.title}</span>
                        </p>
                      </div>
                    </div>

                    {req.message && (
                      <p className="text-[11px] text-zinc-400 bg-zinc-950/80 border border-zinc-900 p-2 rounded-lg italic">
                        &quot;{req.message}&quot;
                      </p>
                    )}

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleRequestAction(req.id, "reject")}
                        disabled={actionId !== null}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                        title="Decline"
                      >
                        {actionId === req.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, "accept")}
                        disabled={actionId !== null}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {actionId === req.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3 w-3" />
                            Accept
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing requests */}
          <div className="glass rounded-2xl p-6 border border-zinc-800 bg-zinc-950/40">
            <h2 className="text-sm font-bold flex items-center gap-2 text-white mb-4 uppercase tracking-wider">
              <GitPullRequest className="w-4 h-4 text-zinc-400" />
              My Sent Requests
            </h2>

            {data?.outgoingRequests.length === 0 ? (
              <div className="text-center py-6 text-[11px] text-zinc-500 bg-zinc-950/30 border border-dashed border-zinc-850 rounded-xl">
                You haven&apos;t requested to join any projects.
              </div>
            ) : (
              <div className="space-y-2.5">
                {data?.outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-900 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-zinc-300 truncate">
                        {req.project.title}
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">
                        Sent {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        req.status === "accepted"
                          ? "bg-green-500/10 text-green-400"
                          : req.status === "rejected"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Biography Card */}
          <ProfileSummaryCard />

          {/* GitHub Sync Card */}
          <GithubSyncCard />
        </div>
      </div>
    </div>
  );
}
