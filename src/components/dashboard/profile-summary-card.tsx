"use client";

import { useState, useEffect } from "react";
import { Brain, Sparkles, Loader2, RefreshCw } from "lucide-react";

export default function ProfileSummaryCard() {
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = async (): Promise<void> => {
    try {
      const profileRes = await fetch("/api/profile");
      if (!profileRes.ok) {
        throw new Error("Failed to fetch bio");
      }
      const data = await profileRes.json();
      setBio(data.bio || "");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load biography.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!ignore) {
        await fetchProfileData();
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleGenerateBio = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate bio");
      }

      setBio(data.bio);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "AI summary generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 space-y-3">
        <div className="skeleton h-5 w-1/4" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-4 border border-zinc-800 bg-zinc-950/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <Brain className="h-4.5 w-4.5" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Developer Biography</h2>
        </div>
        {bio && (
          <button
            onClick={handleGenerateBio}
            disabled={generating}
            className="text-[11px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Regenerate
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {bio ? (
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed italic bg-zinc-950/50 p-4 rounded-xl border border-zinc-900">
          &quot;{bio}&quot;
        </p>
      ) : (
        <div className="space-y-4 py-1.5">
          <p className="text-xs text-zinc-400 leading-relaxed">
            You don&apos;t have an AI developer biography yet. Generate one based on your skills and synced repositories.
          </p>
          <button
            onClick={handleGenerateBio}
            disabled={generating}
            className="btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating Summary...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate AI Bio
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
