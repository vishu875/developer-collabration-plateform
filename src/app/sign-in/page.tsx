"use client";

import { signIn } from "next-auth/react";
import { Github, Code2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function SignInPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10"
      >
        {/* Card */}
        <div className="glass rounded-2xl p-8 sm:p-10 border border-zinc-800 bg-black/90">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center mb-4 border border-zinc-800"
            >
              <Code2 className="w-6 h-6 text-black" />
            </motion.div>
            <h1 className="text-xl font-bold text-center text-white tracking-tight">
              Welcome to <span className="gradient-text">DevConnect</span>
            </h1>
            <p className="text-zinc-400 text-xs mt-2 text-center">
              A professional environment to build collaboration teams.
            </p>
          </div>

          {/* GitHub Sign In */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 text-black font-semibold text-sm transition-all duration-150 cursor-pointer shadow-sm"
            id="github-sign-in-btn"
          >
            <Github className="w-4 h-4" />
            Continue with GitHub
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              Integrations
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Benefits */}
          <ul className="space-y-3.5">
            {[
              "Auto-sync your repositories & tech stacks",
              "AI-powered developer summaries",
              "Secure, single-click credentials setup",
            ].map((benefit, idx) => (
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.3 }}
                key={idx}
                className="flex items-start gap-2.5 text-xs text-zinc-400"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                {benefit}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Footer text */}
        <p className="text-center text-[10px] text-zinc-600 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
