"use client";

import { useState } from "react";
import { Github, Loader2 } from "lucide-react";

type GenerateBioButtonProps = {
  onSuccess?: (bio: string) => void;
};

export default function GenerateBioButton({ onSuccess }: GenerateBioButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateBio = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/profile/generate-bio", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate bio");
      }

      const data = await res.json();
      setSuccess(true);
      onSuccess?.(data.bio);

      // Show success message for 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate bio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerateBio}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-800 rounded-xl text-white text-sm font-semibold transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Github className="h-4 w-4" />
            Generate Bio from GitHub
          </>
        )}
      </button>

      {success && (
        <p className="text-xs text-emerald-400">✓ Bio generated from your GitHub profile!</p>
      )}

      {error && <p className="text-xs text-red-400">✗ {error}</p>}

      <p className="text-xs text-zinc-500">
        Analyzes your GitHub repos to create an authentic technical bio based on what you actually work with.
      </p>
    </div>
  );
}
