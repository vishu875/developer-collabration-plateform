import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserDashboard from "@/components/dashboard/user-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your projects, team, and developer profile.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Welcome Banner */}
      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={session.user?.image || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
            alt={session.user?.name || "avatar"}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/30"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome,{" "}
              <span className="gradient-text">
                {session.user?.username || session.user?.name}
              </span>
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your projects, profile, and team connections.
            </p>
          </div>
        </div>
      </div>

      <UserDashboard />
    </div>
  );
}
