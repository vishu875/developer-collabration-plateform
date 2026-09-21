"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Github, Loader2, Link2, Plus, ArrowLeft } from "lucide-react";

interface ConnectGithubButtonProps {
  projectSlug: string;
  label?: string;
}

export default function ConnectGithubButton({
  projectSlug,
  label = "Connect GitHub Repository",
}: ConnectGithubButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [existingUrl, setExistingUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConnect = async (urlToConnect?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectSlug}/connect-github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(urlToConnect ? { githubRepoUrl: urlToConnect } : {}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to connect repository");
      }

      // Refresh the page so server-side data shows the new repo URL
      router.refresh();
    } catch (err: any) {
      console.error("Connect GitHub error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 w-full btn-secondary rounded-xl py-3 px-4 transition-colors text-xs font-semibold cursor-pointer"
      >
        <Github className="h-4 w-4" />
        {label}
      </button>
    );
  }

  return (
    <div className="glass rounded-xl p-4 border border-zinc-800 bg-zinc-950/60 space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
        <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Github className="h-3.5 w-3.5" />
          GitHub Repository
        </h5>
        <button
          onClick={() => {
            setIsOpen(false);
            setError(null);
          }}
          className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-lg text-[10px] font-medium leading-normal">
          {error}
        </div>
      )}

      {/* Option 1: Create New */}
      <div className="space-y-1.5">
        <h6 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Option A: Create New Repo
        </h6>
        <p className="text-[10px] text-zinc-500 leading-normal">
          Create a public repository named after this project under your GitHub profile.
        </p>
        <button
          onClick={() => handleConnect()}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg py-2 px-3 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          {isLoading ? "Creating..." : "Create & Initialize"}
        </button>
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-zinc-800/60"></div>
        <span className="flex-shrink mx-2 text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
          OR
        </span>
        <div className="flex-grow border-t border-zinc-800/60"></div>
      </div>

      {/* Option 2: Connect Existing */}
      <div className="space-y-2">
        <div>
          <h6 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Option B: Link Existing Repo
          </h6>
          <p className="text-[10px] text-zinc-500 leading-normal">
            Link an existing public GitHub repository that you own.
          </p>
        </div>

        <div className="space-y-1.5">
          <input
            type="url"
            value={existingUrl}
            onChange={(e) => setExistingUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
          />
          <button
            onClick={() => handleConnect(existingUrl)}
            disabled={isLoading || !existingUrl.trim()}
            className="flex items-center justify-center gap-1.5 w-full btn-primary text-white rounded-lg py-2 px-3 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Link2 className="h-3 w-3" />
            )}
            {isLoading ? "Linking..." : "Link Repository"}
          </button>
        </div>
      </div>
    </div>
  );
}
