"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Code2,
  Menu,
  X,
  Bell,
  LogOut,
  LayoutDashboard,
  Compass,
  Plus,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/lib/stores";

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!session) return;
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const list = await res.json();
          const unread = list.filter((n: { isRead: boolean }) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.warn("Failed to fetch notification count:", err);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [session, setUnreadCount]);

  const navLinks = [
    { href: "/discover", label: "Discover", icon: Compass },
    ...(session
      ? [
          { href: "/projects/create", label: "Create", icon: Plus },
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            id="logo-link"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center transition-transform group-hover:scale-105">
              <Code2 className="w-4.5 h-4.5 text-black" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Dev<span className="text-zinc-400">Connect</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" id="desktop-nav">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                id={`nav-${link.label.toLowerCase()}`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full skeleton" />
            ) : session ? (
              <>
                {/* Notification Bell */}
                <Link
                  href="/notifications"
                  className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  id="notification-bell"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" id="user-avatar-link">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={session.user?.image || ""}
                      alt={session.user?.name || "User"}
                      className="w-8 h-8 rounded-full ring-2 ring-zinc-800 hover:ring-zinc-700 transition-all cursor-pointer"
                    />
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    id="sign-out-btn"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => signIn("github")}
                className="btn-primary flex items-center gap-2 px-4 py-2 transition-all"
                id="sign-in-btn"
              >
                <Github className="w-4 h-4" />
                Sign in with GitHub
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-60 pb-4" : "max-h-0"
          )}
          id="mobile-nav"
        >
          <nav className="flex flex-col gap-1 pt-2 border-t border-white/5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {session && (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all sm:hidden"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
