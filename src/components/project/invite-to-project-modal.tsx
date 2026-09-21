"use client";

import { useState, useEffect } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  requiredSkills: string[];
  teamSize: number;
  status: string;
  isMember?: boolean;
};

type InviteToProjectModalProps = {
  developerId: string;
  developerName: string;
  onClose: () => void;
  onInvite: (projectId: string) => Promise<void>;
};

export default function InviteToProjectModal({
  developerId,
  developerName,
  onClose,
  onInvite,
}: InviteToProjectModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`/api/my-projects?developerId=${developerId}`);
        if (!res.ok) throw new Error("Failed to load projects");
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [developerId]);

  const handleInvite = async () => {
    if (!selectedProject) return;

    setInviting(true);
    try {
      await onInvite(selectedProject);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-950">
          <h2 className="text-xl font-bold text-white">
            Invite @{developerName} to Project
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-zinc-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">
                You don't have any projects yet.{" "}
                <a href="/projects/create" className="text-indigo-400 hover:text-indigo-300">
                  Create one
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => !project.isMember && setSelectedProject(project.id)}
                  disabled={project.isMember}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    project.isMember
                      ? "bg-zinc-900/30 border-zinc-700 opacity-50 cursor-not-allowed"
                      : selectedProject === project.id
                      ? "bg-indigo-950/40 border-indigo-500"
                      : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white truncate">
                          {project.title}
                        </h3>
                        {project.isMember && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 whitespace-nowrap">
                            Already member
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {project.description.substring(0, 80)}...
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.requiredSkills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 text-xs bg-indigo-950/30 text-indigo-300 rounded border border-indigo-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                        {project.requiredSkills.length > 3 && (
                          <span className="px-2 py-1 text-xs text-zinc-500">
                            +{project.requiredSkills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
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
                </button>
              ))}
            </div>
          )}

          {/* Selected Project Preview */}
          {selectedProjectData && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
              <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                Preview
              </p>
              <p className="text-sm text-zinc-300">
                Inviting <span className="font-semibold text-white">@{developerName}</span> to join{" "}
                <span className="font-semibold text-white">{selectedProjectData.title}</span>
              </p>
              <p className="text-xs text-zinc-500">
                They will receive a notification and can accept or decline the invitation.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 p-6 border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={!selectedProject || inviting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            <Send className="h-4 w-4" />
            {inviting ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
