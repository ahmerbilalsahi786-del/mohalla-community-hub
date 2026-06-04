import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  communityId: text("community_id").notNull().default("default"),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  unitNumber: text("unit_number").notNull(),
  phone: text("phone").notNull().default(""),
  status: text("status").notNull().default("pending"),   // pending | approved | rejected
  role: text("role").notNull().default("resident"),       // resident | moderator | admin
  isVerified: boolean("is_verified").notNull().default(false),
  joinDate: timestamp("join_date").notNull().defaultNow(),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({ id: true, joinDate: true });

export type Member = typeof membersTable.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
