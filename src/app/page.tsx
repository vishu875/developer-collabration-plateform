import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { users, projects, projectUsers } from "@/lib/db/schema";
import {
  Code2,
  Users,
  Sparkles,
  MessageSquare,
  Github,
  Target,
  Zap,
  ArrowRight,
  Globe,
  Compass,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description:
      "Advanced AI analyzes skills, project needs, and developer profiles to suggest the perfect teammates — beyond basic keyword matching.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Post project ideas, accept join requests, and manage your team. Built-in tools for seamless group coordination.",
  },
  {
    icon: Github,
    title: "GitHub Integration",
    description:
      "Sign in with GitHub, sync your repos, and auto-detect your tech stack. Your profile builds itself.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description:
      "Per-project group chat with polling. Discuss, decide, and ship — all in one place.",
  },
  {
    icon: Target,
    title: "Smart Recommendations",
    description:
      "AI-curated project feed tailored to your skills. Discover projects that match your expertise and interests.",
  },
  {
    icon: Zap,
    title: "Skill Analytics",
    description:
      "AI generates developer summaries, analyzes project complexity, and tracks your growth across collaborations.",
  },
];

// Returns null instead of throwing: this is the public landing page, so a
// database outage should blank out the stats bar rather than 500 the whole
// page for every visitor.
async function countRows(
  table: typeof users | typeof projects | typeof projectUsers,
): Promise<number | null> {
  try {
    const rows = await db.select({ count: sql<number>`count(*)` }).from(table);
    return Number(rows[0]?.count ?? 0);
  } catch (error) {
    console.error("Landing page stats query failed:", error);
    return null;
  }
}

export default async function HomePage() {
  const session = await auth();

  // Fetch dynamic landing page stats from the database
  const [totalUsers, totalProjects, totalMembers] = await Promise.all([
    countRows(users),
    countRows(projects),
    countRows(projectUsers),
  ]);

  const stats = [
    { value: totalUsers?.toString() ?? "—", label: "Registered Developers" },
    { value: totalProjects?.toString() ?? "—", label: "Active Projects" },
    { value: totalMembers?.toString() ?? "—", label: "Successful Matches" },
    { value: "<1s", label: "AI Response Time" },
  ];

  return (
    <div className="relative overflow-hidden bg-black min-h-screen">
      {/* Subtle Background Orbs */}
      <div className="bg-orb bg-orb-1 opacity-5" />
      <div className="bg-orb bg-orb-2 opacity-5" />

      {/* ===== Hero Section ===== */}
      <section className="relative pt-24 pb-32 sm:pt-32 sm:pb-40" id="hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-xs text-zinc-400 mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI-Powered Developer Matchmaker</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none text-white max-w-4xl mx-auto">
            {session ? (
              <>
                Welcome back,{" "}
                <span className="text-zinc-400">
                  {session.user?.username || session.user?.name}
                </span>
              </>
            ) : (
              <>
                Find your perfect <span className="gradient-text">dev team</span>
                <span className="text-zinc-500 block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mt-4">
                  with AI-powered matching.
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="max-w-xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed">
            {session
              ? "Explore new projects, connect with developers, and let AI find your ideal collaborators."
              : "DevConnect uses intelligent AI algorithms to analyze your skills and match you with the perfect projects and teammates. No more guesswork — just build."}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            {session ? (
              <>
                <Link
                  href="/discover"
                  className="btn-primary flex items-center gap-2 text-sm font-semibold shadow-sm w-full sm:w-auto"
                  id="hero-discover-btn"
                >
                  <Compass className="w-4 h-4" />
                  Discover Projects
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="btn-secondary flex items-center gap-2 text-sm font-semibold w-full sm:w-auto"
                  id="hero-dashboard-btn"
                >
                  My Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="btn-primary flex items-center gap-2 text-sm font-semibold shadow-sm w-full sm:w-auto"
                  id="hero-get-started-btn"
                >
                  <Github className="w-4 h-4" />
                  Get Started with GitHub
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/discover"
                  className="btn-secondary flex items-center gap-2 text-sm font-semibold w-full sm:w-auto"
                  id="hero-explore-btn"
                >
                  <Globe className="w-4 h-4" />
                  Explore Projects
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===== Stats Bar ===== */}
      <section className="relative py-12 border-y border-zinc-900 bg-zinc-950/40" id="stats">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features Grid ===== */}
      <section className="relative py-24 sm:py-32" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Everything you need to <span className="text-zinc-400">collaborate</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              From AI-powered skill analysis to real-time team chat — DevConnect
              is the complete toolkit for developer collaboration.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-2xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 transition-all duration-300 flex flex-col gap-4"
                id={`feature-card-${idx}`}
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 transition-transform group-hover:scale-105">
                  <feature.icon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-base font-bold mb-1.5 text-zinc-100">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-xs sm:text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI Showcase ===== */}
      <section
        className="relative py-24 sm:py-32 border-t border-zinc-900 bg-zinc-950/20"
        id="ai-showcase"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Zap className="w-3.5 h-3.5" />
                AI INTEGRATION
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                AI that understands developers.
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Our AI matching engine doesn&apos;t just match keywords — it understands
                that a React developer might also excel with Vue, or that a
                Python ML engineer is perfect for a data science project even
                when &quot;Python&quot; isn&apos;t explicitly listed.
              </p>
              <ul className="space-y-4">
                {[
                  "Auto-generated developer profile summaries",
                  "Smart project-to-developer matching with reasoning",
                  "Project complexity analysis & tech stack extraction",
                  "Personalized project recommendations for your feed",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-xs sm:text-sm text-zinc-300"
                  >
                    <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Demo Card */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                AI-Generated Developer Summary
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed italic">
                <p>
                  <span className="text-white font-bold">@Arnav-Panchal</span> is
                  a full-stack developer with strong expertise in{" "}
                  <span className="tag">React</span>{" "}
                  <span className="tag">Node.js</span>{" "}
                  <span className="tag">PostgreSQL</span>. Based on GitHub
                  repositories, they show particular strength in JavaScript and TypeScript.
                </p>
                <p>
                  Their DevConnect project history shows leadership in team
                  projects focused on real-time applications and AI integration,
                  demonstrating strong skills in system design and team
                  coordination.
                </p>
                <p className="text-zinc-655 text-[10px] not-italic">
                  Generated in 0.6s by DevConnect AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA Section ===== */}
      {!session && (
        <section
          className="relative py-24 sm:py-32 border-t border-zinc-900"
          id="cta"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to find your <span className="text-zinc-400">dream team</span>?
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Join DevConnect and let AI match you with the perfect projects and
              collaborators. It&apos;s free and powered by intelligent matchmaker algorithms.
            </p>
            <Link
              href="/sign-in"
              className="btn-primary inline-flex items-center gap-2 text-sm font-semibold shadow-md pt-3.5 pb-3.5"
              id="cta-sign-up-btn"
            >
              <Github className="w-4 h-4" />
              Get Started — It&apos;s Free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* ===== Footer ===== */}
      <footer className="border-t border-zinc-900 py-8 bg-zinc-950/40" id="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-4.5 h-4.5 text-zinc-400" />
              <span className="text-xs text-zinc-500">
                © {new Date().getFullYear()} DevConnect. Built with passion & AI matching.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="https://github.com/Arnav-Panchal/Developers-Collab-Platform"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                target="_blank"
              >
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
