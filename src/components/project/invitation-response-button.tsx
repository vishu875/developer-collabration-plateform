"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

type InvitationResponseButtonProps = {
  inviteId: string;
  projectTitle: string;
};

export default function InvitationResponseButton({
  inviteId,
  projectTitle,
}: InvitationResponseButtonProps) {
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState(false);
  const [response, setResponse] = useState<"accepted" | "declined" | null>(null);

  const handleResponse = async (action: "accept" | "reject") => {
    setResponding(true);
    try {
      const res = await fetch(`/api/developers/invite/${inviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        throw new Error("Failed to respond to invitation");
      }

      setResponded(true);
      setResponse(action === "accept" ? "accepted" : "declined");

      // Refresh page after 2 seconds
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error("Error responding to invitation:", error);
      setResponding(false);
    }
  };

  if (responded) {
    return (
      <div
        className={`p-4 rounded-xl text-center ${
          response === "accepted"
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-zinc-800/50 border border-zinc-700"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-wider ${
            response === "accepted" ? "text-emerald-400" : "text-zinc-400"
          }`}
        >
          {response === "accepted"
            ? `✓ You joined "${projectTitle}"`
            : `Invitation declined`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400 px-1">
        You've been invited to this project
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handleResponse("accept")}
          disabled={responding}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <Check className="h-4 w-4" />
          Accept
        </button>
        <button
          onClick={() => handleResponse("reject")}
          disabled={responding}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <X className="h-4 w-4" />
          Decline
        </button>
      </div>
    </div>
  );
}
