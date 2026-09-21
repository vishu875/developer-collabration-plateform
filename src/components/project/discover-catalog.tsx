"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Users, ArrowRight, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  technologies: string[];
  requiredSkills: string[];
  teamSize: number;
  status: string;
  aiSummary: string;
  createdAt: string;
  owner: {
    id: string;
    username: string;
    profilePicture: string;
  } | null;
};

type Pagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export default function DiscoverCatalog() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [technology, setTechnology] = useState("");
  const [skill, setSkill] = useState("");
  const [status, setStatus] = useState("open");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // Debounced/Triggered filters
  const [activeFilters, setActiveFilters] = useState({
    search: "",
    technology: "",
    skill: "",
    status: "open",
    sort: "newest",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Trigger search/filters when form is submitted
  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveFilters({
      search,
      technology,
      skill,
      status,
      sort,
    });
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setTechnology("");
    setSkill("");
    setStatus("open");
    setSort("newest");
    setActiveFilters({
      search: "",
      technology: "",
      skill: "",
      status: "open",
      sort: "newest",
    });
    setPage(1);
  };

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: "9",
          sort: activeFilters.sort,
        });

        if (activeFilters.search) queryParams.set("search", activeFilters.search);
        if (activeFilters.technology) queryParams.set("technology", activeFilters.technology);
        if (activeFilters.skill) queryParams.set("skill", activeFilters.skill);
        if (activeFilters.status) queryParams.set("status", activeFilters.status);

        const res = await fetch(`/api/projects?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load projects");
        }
        const data = await res.json();
        setProjects(data.projects || []);
        setPagination(data.pagination || null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "An error occurred while fetching projects.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [page, activeFilters]);

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <form onSubmit={handleApplyFilters} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search projects by title, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors text-sm"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-150 cursor-pointer ${
                showFilters
                  ? "bg-zinc-900 border-zinc-750 text-white"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
            <button
              type="submit"
              className="btn-primary rounded-xl px-6 py-3 font-semibold transition-all shadow-sm"
            >
              Search
            </button>
          </div>
        </div>

        {/* Advanced Filters Expandable Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2 border border-zinc-800 bg-black/90">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Technology
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js, Go"
                    value={technology}
                    onChange={(e) => setTechnology(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Required Skill
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend, DB Admin"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                  >
                    <option value="open" className="bg-black text-white">Open</option>
                    <option value="in-progress" className="bg-black text-white">In Progress</option>
                    <option value="completed" className="bg-black text-white">Completed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Sort By
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                  >
                    <option value="newest" className="bg-black text-white">Newest First</option>
                    <option value="oldest" className="bg-black text-white">Oldest First</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-4 py-2 text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFilters()}
                    className="btn-secondary rounded-xl px-4 py-2 text-xs font-semibold"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-center">
          {error}
        </div>
      )}

      {/* Grid of Projects */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="skeleton h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              </div>
              <div className="skeleton h-5 w-full mt-2" />
              <div className="skeleton h-16 w-full" />
              <div className="flex gap-2">
                <div className="skeleton h-6 w-16 rounded-full" />
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center space-y-4">
          <p className="text-gray-400 text-lg">No projects match your search criteria.</p>
          <button
            onClick={handleClearFilters}
            className="text-indigo-400 hover:text-indigo-300 font-medium underline"
          >
            Clear filters and start over
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass hover-card rounded-2xl p-6 flex flex-col justify-between border border-zinc-800 bg-zinc-950/40"
            >
              <div className="space-y-4">
                {/* Header: User Profile */}
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.owner?.profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                    alt={project.owner?.username || "user"}
                    className="h-8 w-8 rounded-full object-cover border border-zinc-850"
                  />
                  <div>
                    <p className="text-[10px] text-zinc-500">Posted by</p>
                    <p className="text-xs font-semibold text-zinc-400">
                      @{project.owner?.username || "anonymous"}
                    </p>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold text-white line-clamp-1 tracking-tight">
                    {project.title}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* AI Summary Block (if exists) */}
                {project.aiSummary && (
                  <div className="bg-indigo-950/10 border border-indigo-900/20 rounded-xl p-3 flex items-start gap-2.5">
                    <Brain className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                        AI Summary
                      </p>
                      <p className="text-xs text-zinc-300 line-clamp-2 mt-0.5 leading-relaxed">
                        {project.aiSummary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Technologies */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.technologies.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="tag text-[10px]"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="text-zinc-500 text-[10px] self-center px-1">
                      +{project.technologies.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-6">
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  <span>Team Size: {project.teamSize}</span>
                </div>
                <Link
                  href={`/projects/${project.slug}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors group"
                >
                  View details
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary rounded-xl px-4 py-2 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500 px-2 font-medium">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="btn-secondary rounded-xl px-4 py-2 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
