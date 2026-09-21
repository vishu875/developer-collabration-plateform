"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import InviteToProjectModal from "@/components/project/invite-to-project-modal";

type InviteButtonProps = {
  developerId: string;
  developerName: string;
};

export default function InviteButton({ developerId, developerName }: InviteButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleInvite = async (projectId: string) => {
    try {
      const res = await fetch("/api/developers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          recipientId: developerId,
          message: `You're invited to join this project!`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send invite");
      }

      setShowModal(false);
    } catch (error) {
      console.error("Error sending invite:", error);
      throw error;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
      >
        <Mail className="h-4 w-4" />
        Invite
      </button>

      {showModal && (
        <InviteToProjectModal
          developerId={developerId}
          developerName={developerName}
          onClose={() => setShowModal(false)}
          onInvite={handleInvite}
        />
      )}
    </>
  );
}
