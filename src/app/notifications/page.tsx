import type { Metadata } from "next";
import NotificationsList from "@/components/notifications/notifications-list";

export const metadata: Metadata = {
  title: "Notifications",
  description: "View your project notifications and team updates.",
};

export default function NotificationsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">
        <span className="gradient-text">Notifications</span>
      </h1>

      <NotificationsList />
    </div>
  );
}
