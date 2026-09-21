"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectSchema } from "@/lib/validations";
import { Plus, Loader2 } from "lucide-react";

export default function CreateProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    technologiesRaw: "",
    requiredSkillsRaw: "",
    teamSize: 3,
    responsibilities: "",
    startDate: "",
    endDate: "",
    githubRepoUrl: "",
    autoCreateRepo: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox
        ? checked
        : name === "teamSize"
        ? parseInt(value) || 0
        : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    // Process array fields (comma-separated strings to clean string arrays)
    const technologies = formData.technologiesRaw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");

    const requiredSkills = formData.requiredSkillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    const payload = {
      title: formData.title,
      description: formData.description,
      technologies,
      requiredSkills,
      teamSize: formData.teamSize,
      responsibilities: formData.responsibilities,
      startDate: formData.startDate,
      endDate: formData.endDate,
      githubRepoUrl: formData.githubRepoUrl || undefined,
      autoCreateRepo: formData.autoCreateRepo,
    };

    // Zod validation on client
    const validationResult = createProjectSchema.safeParse(payload);
    if (!validationResult.success) {
      const formatted = validationResult.error.format();
      const errors: Record<string, string> = {};
      
      Object.keys(formatted).forEach((key) => {
        if (key !== "_errors") {
          const field = formatted[key as keyof typeof formatted] as { _errors?: string[] } | undefined;
          if (field?._errors?.[0]) {
            errors[key] = field._errors[0];
          }
        }
      });

      if (formatted._errors?.[0]) {
        setError(formatted._errors[0]);
      }

      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      router.push(`/dashboard`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-6 border border-zinc-800 bg-zinc-950/40">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Project Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Realtime Collaborative Code Sandbox"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
        />
        {fieldErrors.title && (
          <span className="text-red-400 text-[10px] block mt-1">{fieldErrors.title}</span>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          name="description"
          required
          rows={5}
          value={formData.description}
          onChange={handleChange}
          placeholder="What is this project about? Give context, goals, and details. (Min 20 characters)"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors resize-none leading-relaxed"
        />
        {fieldErrors.description && (
          <span className="text-red-400 text-[10px] block mt-1">{fieldErrors.description}</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Technologies Used <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="technologiesRaw"
            required
            value={formData.technologiesRaw}
            onChange={handleChange}
            placeholder="React, Next.js, Drizzle, PostgreSQL"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
          />
          <span className="text-zinc-500 text-[10px] block mt-1">Separate items with commas</span>
          {fieldErrors.technologies && (
            <span className="text-red-400 block text-[10px] mt-1">{fieldErrors.technologies}</span>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Required Skills <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="requiredSkillsRaw"
            required
            value={formData.requiredSkillsRaw}
            onChange={handleChange}
            placeholder="Frontend, State Management, Database Admin"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
          />
          <span className="text-zinc-500 text-[10px] block mt-1">Separate items with commas</span>
          {fieldErrors.requiredSkills && (
            <span className="text-red-400 block text-[10px] mt-1">{fieldErrors.requiredSkills}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Target Team Size <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            name="teamSize"
            required
            min={1}
            max={50}
            value={formData.teamSize}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-zinc-700 transition-colors"
          />
          {fieldErrors.teamSize && (
            <span className="text-red-400 text-[10px] block mt-1">{fieldErrors.teamSize}</span>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Start Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            name="startDate"
            required
            value={formData.startDate}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-zinc-700 transition-colors"
          />
          {fieldErrors.startDate && (
            <span className="text-red-400 text-[10px] block mt-1">{fieldErrors.startDate}</span>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            End Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            name="endDate"
            required
            value={formData.endDate}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-zinc-700 transition-colors"
          />
          {fieldErrors.endDate && (
            <span className="text-red-400 text-[10px] block mt-1">{fieldErrors.endDate}</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Responsibilities / Scope of Work <span className="text-red-400">*</span>
        </label>
        <textarea
          name="responsibilities"
          required
          rows={3}
          value={formData.responsibilities}
          onChange={handleChange}
          placeholder="e.g. Design UI prototypes, build authentication flow, integrate backend routes. (Min 10 characters)"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-660 focus:outline-none focus:border-zinc-700 transition-colors resize-none leading-relaxed"
        />
        {fieldErrors.responsibilities && (
          <span className="text-red-400 text-[10px] block mt-1">{fieldErrors.responsibilities}</span>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            GitHub Repository URL <span className="text-zinc-500">(Optional)</span>
          </label>
          <input
            type="url"
            name="githubRepoUrl"
            value={formData.githubRepoUrl}
            onChange={handleChange}
            placeholder="https://github.com/username/repository"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
          />
          {fieldErrors.githubRepoUrl && (
            <span className="text-red-400 text-[10px] block mt-1">{fieldErrors.githubRepoUrl}</span>
          )}
        </div>

        {!formData.githubRepoUrl && (
          <label className="flex items-start gap-2.5 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              name="autoCreateRepo"
              checked={formData.autoCreateRepo}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-zinc-400 focus:ring-zinc-900 focus:ring-offset-black accent-zinc-500"
            />
            <div>
              <span className="text-xs font-semibold text-zinc-300">
                Automatically create a new public GitHub repository
              </span>
              <p className="text-[10px] text-zinc-500 mt-0.5 font-medium leading-normal">
                A public repository named after your project slug will be automatically created under your GitHub account.
              </p>
            </div>
          </label>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary rounded-xl px-6 py-3 font-semibold flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating project...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Create Project
          </>
        )}
      </button>
    </form>
  );
}
