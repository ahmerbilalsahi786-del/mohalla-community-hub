import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pollsTable = pgTable("polls", {
  id: serial("id").primaryKey(),
  communityId: text("community_id").notNull().default("default"),
  userId: text("user_id").notNull().default("ahmed"),
  userName: text("user_name").notNull().default("Ahmed Khan"),
  unitNumber: text("unit_number").notNull().default("B-204"),
  question: text("question").notNull(),
  options: text("options").array().notNull().default([]),
  endsAt: timestamp("ends_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pollVotesTable = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  userId: text("user_id").notNull().default("ahmed"),
  userName: text("user_name").notNull().default("Ahmed Khan"),
  optionIndex: integer("option_index").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPollSchema = createInsertSchema(pollsTable).omit({ id: true, createdAt: true });
export const insertPollVoteSchema = createInsertSchema(pollVotesTable).omit({ id: true, createdAt: true });

export type Poll = typeof pollsTable.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type PollVote = typeof pollVotesTable.$inferSelect;
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;
