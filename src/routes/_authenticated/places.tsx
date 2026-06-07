import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export const Route = createFileRoute("/_authenticated/places")({
  head: () => ({
    meta: [
      { title: "Places — Mohalla" },
      { name: "description", content: "Nearby places of interest for Mohalla residents." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Places"
      subtitle="Nearby places and recommendations will be restored here as the next Mohalla page."
      icon={MapPin}
    />
  ),
});