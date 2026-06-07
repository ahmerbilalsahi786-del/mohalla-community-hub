import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Mohalla" },
      { name: "description", content: "Manage your Mohalla account settings." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Settings"
      subtitle="Account and community preferences will be restored here as the next Mohalla page."
      icon={Settings}
    />
  ),
});