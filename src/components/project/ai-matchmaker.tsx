"use client";

import { useState, useEffect } from "react";
import { Sparkles, Brain } from "lucide-react";

type Recommendation = {
  id: string;
  username: string;
  profilePicture: string;
  skills: string[];
  matchingSkills: string[];
  reason: string;
};

type AIMatchmakerProps = {
  projectId: string;
};

export default function AIMatchmaker({ projectId }: AIMatchmakerProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/ai/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });

        if (!res.ok) {
          throw new Error("Failed to load matchmaker recommendations");
        }

        const data = await res.json();
        setRecommendations(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Matchmaker is currently unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [projectId]);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 space-y-4 border border-zinc-800 bg-zinc-950/40">
        <div className="flex items-center gap-2 text-zinc-400">
          <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          <h3 className="font-bold text-xs text-white uppercase tracking-wider">Finding ideal teammates...</h3>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-12 w-full rounded-xl" />
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Don't show anything if there are no matching users or an error occurs
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-4 border border-zinc-800 bg-zinc-950/40">
      <div className="flex items-center gap-2 text-zinc-400">
        <Sparkles className="h-4.5 w-4.5" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI-Recommended Teammates</h3>
      </div>
      <p className="text-xs text-zinc-500">
        These developers possess skills that complement your project requirements.
      </p>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-900 space-y-3"
          >
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rec.profilePicture}
                alt={rec.username}
                className="w-8 h-8 rounded-full object-cover border border-zinc-850"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-300">@{rec.username}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {rec.matchingSkills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="tag text-[9px]"
                    >
                      {s}
                    </span>
                  ))}
                  {rec.matchingSkills.length > 3 && (
                    <span className="text-[9px] text-zinc-500 self-center">
                      +{rec.matchingSkills.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Reasoning Block */}
            <div className="bg-indigo-950/10 border border-indigo-900/20 rounded-xl p-3 flex items-start gap-2.5">
              <Brain className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300 leading-relaxed italic">
                &quot;{rec.reason}&quot;
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
