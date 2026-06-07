import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Mohalla" },
      { name: "description", content: "Important Mohalla community announcements." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Announcements"
      subtitle="Important community announcements will be restored here as the next Mohalla page."
      icon={Megaphone}
    />
  ),
});