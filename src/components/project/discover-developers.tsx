"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Mail, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Developer = {
  id: string;
  username: string;
  profilePicture: string;
  bio: string;
  skills: string[];
  location: string;
};

type InviteStatus = "none" | "pending" | "invited" | "accepted" | "rejected";

type DeveloperWithInvite = Developer;

type Pagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export default function DiscoverDevelopers() {
  const [developers, setDevelopers] = useState<DeveloperWithInvite[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [activeFilters, setActiveFilters] = useState({
    search: "",
    skill: "",
    sort: "newest",
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveFilters({
      search,
      skill,
      sort,
    });
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSkill("");
    setSort("newest");
    setActiveFilters({
      search: "",
      skill: "",
      sort: "newest",
    });
    setPage(1);
  };

  useEffect(() => {
    const fetchDevelopers = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: "12",
          sort: activeFilters.sort,
        });

        if (activeFilters.search) queryParams.set("search", activeFilters.search);
        if (activeFilters.skill) queryParams.set("skill", activeFilters.skill);

        const res = await fetch(`/api/developers?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load developers");
        }
        const data = await res.json();
        setDevelopers(data.developers || []);
        setPagination(data.pagination || null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "An error occurred while fetching developers.");
      } finally {
        setLoading(false);
      }
    };

    fetchDevelopers();
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
              placeholder="Search developers by name, location..."
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

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2 border border-zinc-800 bg-black/90">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Skill
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. React, Python"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                  />
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
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2.5 mt-2">
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

      {/* Grid of Developers */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 space-y-4">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="space-y-1.5">
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-4 w-2/3" />
              </div>
              <div className="skeleton h-16 w-full" />
              <div className="flex gap-2">
                <div className="skeleton h-6 w-16 rounded-full" />
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : developers.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center space-y-4">
          <p className="text-gray-400 text-lg">No developers match your search criteria.</p>
          <button
            onClick={handleClearFilters}
            className="text-indigo-400 hover:text-indigo-300 font-medium underline"
          >
            Clear filters and start over
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {developers.map((dev) => (
            <motion.div
              key={dev.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass hover-card rounded-2xl p-6 flex flex-col justify-between border border-zinc-800 bg-zinc-950/40 group"
            >
              <div className="space-y-4">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dev.profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                    alt={dev.username}
                    className="h-12 w-12 rounded-full object-cover border border-zinc-800 mb-2"
                  />
                  <p className="text-sm font-bold text-white">@{dev.username}</p>
                  {dev.location && (
                    <p className="text-xs text-zinc-500 mt-1">{dev.location}</p>
                  )}
                </div>

                {/* Bio */}
                {dev.bio && (
                  <p className="text-xs text-zinc-400 line-clamp-2 text-center leading-relaxed">
                    {dev.bio}
                  </p>
                )}

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                  {dev.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="tag text-[10px]"
                    >
                      {skill}
                    </span>
                  ))}
                  {dev.skills.length > 4 && (
                    <span className="text-zinc-500 text-[10px] self-center px-1">
                      +{dev.skills.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* View Profile Button */}
              <div className="pt-4 mt-4 border-t border-zinc-900">
                <Link
                  href={`/developers/${dev.username}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  View Profile
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
