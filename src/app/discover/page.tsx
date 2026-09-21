"use client";

import type { Metadata } from "next";
import { useState } from "react";
import { Users, FolderGit2 } from "lucide-react";
import DiscoverCatalog from "@/components/project/discover-catalog";
import DiscoverDevelopers from "@/components/project/discover-developers";

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<"projects" | "devs">("projects");

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-white">
            Discover <span className="text-indigo-400">Talent & Projects</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Find developers to collaborate with or open projects that match your skills.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-12 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 px-4 py-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === "projects"
                ? "text-white border-indigo-500"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
          >
            <FolderGit2 className="h-4 w-4" />
            Projects
          </button>
          <button
            onClick={() => setActiveTab("devs")}
            className={`flex items-center gap-2 px-4 py-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === "devs"
                ? "text-white border-indigo-500"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
          >
            <Users className="h-4 w-4" />
            Developers
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "projects" && <DiscoverCatalog />}
        {activeTab === "devs" && <DiscoverDevelopers />}
      </div>
    </div>
  );
}
