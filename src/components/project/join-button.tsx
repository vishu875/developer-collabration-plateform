"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Check } from "lucide-react";

type JoinProjectButtonProps = {
  projectSlug: string;
  isPending: boolean;
};

export default function JoinProjectButton({
  projectSlug,
  isPending: initialPending,
}: JoinProjectButtonProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(initialPending);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectSlug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccess(true);
      setOpenModal(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full bg-emerald-950/10 border border-emerald-900/20 text-emerald-400 text-xs font-semibold rounded-xl py-3 px-4 text-center flex items-center justify-center gap-2">
        <Check className="h-3.5 w-3.5" />
        Join Request Pending
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpenModal(true)}
        className="w-full btn-primary font-semibold rounded-xl py-3 px-4 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
      >
        <Send className="h-3.5 w-3.5" />
        Request to Join Team
      </button>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass max-w-md w-full rounded-2xl p-6 space-y-4 relative border border-zinc-800 bg-black/95">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Join Collaboration Team</h3>
            <p className="text-xs text-zinc-500">
              Introduce yourself and explain why you&apos;re interested in joining this project.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Hi! I'm a fullstack developer with experience in Next.js and PostgreSQL. I'd love to help out with database structure and backend routing..."
                rows={4}
                required
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-zinc-700 resize-none"
              />

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  disabled={loading}
                  className="px-4 py-2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary rounded-xl px-4 py-2 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
