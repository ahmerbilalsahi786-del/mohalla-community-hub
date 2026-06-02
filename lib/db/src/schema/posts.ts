import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  communityId: text("community_id").notNull().default("default"),
  userId: text("user_id").notNull().default("ahmed"),
  userName: text("user_name").notNull().default("Ahmed Khan"),
  unitNumber: text("unit_number").notNull().default("B-204"),
  type: text("type").notNull().default("general"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  imageUrls: text("image_urls").array().notNull().default([]),
  isPinned: boolean("is_pinned").notNull().default(false),
  likesCount: integer("likes_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: text("user_id").notNull().default("ahmed"),
  userName: text("user_name").notNull().default("Ahmed Khan"),
  unitNumber: text("unit_number").notNull().default("B-204"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true, createdAt: true });
export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true, createdAt: true });

export type Post = typeof postsTable.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof commentsTable.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
