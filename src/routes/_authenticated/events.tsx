import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "Events — Mohalla" },
      { name: "description", content: "Upcoming Mohalla community events." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Events"
      subtitle="Upcoming community events will be restored here as the next Mohalla page."
      icon={Calendar}
    />
  ),
});