import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  communityId: text("community_id").notNull().default("default"),
  userId: text("user_id").notNull().default("ahmed"),
  userName: text("user_name").notNull().default("Ahmed Khan"),
  unitNumber: text("unit_number").notNull().default("B-204"),
  type: text("type").notNull().default("other"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  locationDetail: text("location_detail").notNull().default(""),
  imageUrl: text("image_url"),
  severity: text("severity").notNull().default("medium"),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const alertCommentsTable = pgTable("alert_comments", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").notNull(),
  userId: text("user_id").notNull().default("ahmed"),
  userName: text("user_name").notNull().default("Ahmed Khan"),
  unitNumber: text("unit_number").notNull().default("B-204"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true });
export const insertAlertCommentSchema = createInsertSchema(alertCommentsTable).omit({ id: true, createdAt: true });

export type Alert = typeof alertsTable.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type AlertComment = typeof alertCommentsTable.$inferSelect;
export type InsertAlertComment = z.infer<typeof insertAlertCommentSchema>;
