import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({
    meta: [
      { title: "Community — Mohalla" },
      { name: "description", content: "Mohalla members and neighborhood connections." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Community"
      subtitle="Member profiles and neighborhood connections will be restored here as the next Mohalla page."
      icon={Users}
    />
  ),
});