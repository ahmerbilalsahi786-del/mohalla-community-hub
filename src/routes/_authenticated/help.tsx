import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { title: "Help — Mohalla" },
      { name: "description", content: "Help and support for Mohalla residents." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Help"
      subtitle="Support resources will be restored here as the next Mohalla page."
      icon={HelpCircle}
    />
  ),
});