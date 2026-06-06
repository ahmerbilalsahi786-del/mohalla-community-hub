import { createFileRoute } from "@tanstack/react-router";
import Feed from "@/features/feed/Feed";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Community Feed — Mohalla" },
      { name: "description", content: "Your Mohalla community feed: posts, announcements, lost & found and more." },
    ],
  }),
  component: Feed,
});
