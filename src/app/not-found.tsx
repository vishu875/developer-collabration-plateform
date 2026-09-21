import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="w-full max-w-md text-center">
        <div className="glass rounded-2xl p-8 sm:p-10 space-y-6">
          <p className="text-6xl font-bold gradient-text">404</p>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Page not found</h1>
            <p className="text-sm text-gray-400">
              The page you&apos;re looking for doesn&apos;t exist or may have been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-all"
            >
              <Home className="h-4 w-4" />
              Back home
            </Link>
            <Link
              href="/discover"
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold rounded-xl px-5 py-2.5 text-sm transition-all"
            >
              <Compass className="h-4 w-4" />
              Discover projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
