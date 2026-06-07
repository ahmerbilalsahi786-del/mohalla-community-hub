import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export const Route = createFileRoute("/_authenticated/safety")({
  head: () => ({
    meta: [
      { title: "Safety & Alerts — Mohalla" },
      { name: "description", content: "Community safety reports and alerts." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Safety & Alerts"
      subtitle="Community safety reports will be restored here as the next Mohalla page."
      icon={ShieldAlert}
    />
  ),
});