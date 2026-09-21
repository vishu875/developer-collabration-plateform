"use client";

import { useState, useEffect } from "react";
import { Github, RefreshCw, Star, GitFork, Loader2, Award } from "lucide-react";

type Repo = {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  language: string;
  stargazersCount: number;
  forksCount: number;
};

export default function GithubSyncCard() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReposData = async (): Promise<void> => {
    try {
      const res = await fetch("/api/github/repos");
      if (!res.ok) {
        throw new Error("Failed to fetch synced repositories");
      }
      const data = await res.json();
      setRepos(data.repos || []);
      setSkills(data.skills || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load GitHub data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!ignore) {
        await fetchReposData();
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync repositories");
      }

      // Re-fetch repos and skills after syncing
      await fetchReposData();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Sync failed. Make sure your GitHub session is valid.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton h-8 w-full" />
        <div className="space-y-2">
          <div className="skeleton h-12 w-full rounded-xl" />
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-6 border border-zinc-800 bg-zinc-950/40">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-wider">
          <Github className="h-4.5 w-4.5 text-white" />
          GitHub Portfolios
        </h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-secondary rounded-xl px-4 py-2 text-xs font-semibold"
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {syncing ? "Syncing..." : "Sync Repos"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Skills Section */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-zinc-400" />
          Detected Languages & Skills
        </h3>
        {skills.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">
            No skills detected. Click &quot;Sync Repos&quot; to extract skills.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="tag text-[10px]"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Synced Repositories List */}
      <div className="space-y-3.5 border-t border-zinc-900 pt-5">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          Synced Repositories ({repos.length})
        </h3>

        {repos.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-500 bg-zinc-950/20 rounded-xl border border-zinc-900">
            No repositories synced yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {repos.slice(0, 5).map((repo) => (
              <div
                key={repo.id}
                className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-xs text-zinc-200 hover:text-white transition-colors truncate"
                  >
                    {repo.name}
                  </a>
                  {repo.language && (
                    <span className="text-[9px] font-medium bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-850">
                      {repo.language}
                    </span>
                  )}
                </div>

                {repo.description && (
                  <p className="text-[11px] text-zinc-400 line-clamp-1 leading-relaxed">
                    {repo.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[10px] text-zinc-500 pt-0.5">
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
            {repos.length > 5 && (
              <p className="text-center text-[9px] text-zinc-500 pt-1">
                Showing top 5 repositories sorted by stars
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
