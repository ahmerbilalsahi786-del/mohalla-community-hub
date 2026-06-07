import { createFileRoute } from "@tanstack/react-router";
import { BarChart2 } from "lucide-react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export const Route = createFileRoute("/_authenticated/polls")({
  head: () => ({
    meta: [
      { title: "Polls — Mohalla" },
      { name: "description", content: "Community polls and resident feedback." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Polls"
      subtitle="Community polls will be restored here as the next Mohalla page."
      icon={BarChart2}
    />
  ),
});