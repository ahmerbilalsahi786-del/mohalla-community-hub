import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export const Route = createFileRoute("/_authenticated/volunteer")({
  head: () => ({
    meta: [
      { title: "Volunteer — Mohalla" },
      { name: "description", content: "Volunteer opportunities in your Mohalla community." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Volunteer"
      subtitle="Volunteer opportunities will be restored here as the next Mohalla page."
      icon={Heart}
    />
  ),
});