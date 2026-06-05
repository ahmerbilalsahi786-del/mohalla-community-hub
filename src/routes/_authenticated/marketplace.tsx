import { createFileRoute } from "@tanstack/react-router";
import Marketplace from "@/features/marketplace/Marketplace";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Mohalla" },
      { name: "description", content: "Buy, sell, and give away items in your Mohalla community." },
    ],
  }),
  component: Marketplace,
});
