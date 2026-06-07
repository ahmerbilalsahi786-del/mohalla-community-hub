import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Mohalla" },
      { name: "description", content: "Mohalla community administration tools." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Admin Panel"
      subtitle="Community administration tools will be restored here as the next Mohalla page."
      icon={ShieldCheck}
    />
  ),
});