import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";

export const postLikesTable = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  unique("post_likes_post_user_unique").on(t.postId, t.userId),
]);

export type PostLike = typeof postLikesTable.$inferSelect;
