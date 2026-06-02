import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communitySettingsTable = pgTable("community_settings", {
  id: serial("id").primaryKey(),
  communityId: text("community_id").notNull().unique().default("default"),
  name: text("name").notNull().default("My Mohalla"),
  area: text("area").notNull().default(""),
  city: text("city").notNull().default(""),
  logoUrl: text("logo_url"),
  rules: text("rules").notNull().default(""),
});

export const insertCommunitySettingsSchema = createInsertSchema(communitySettingsTable).omit({ id: true });

export type CommunitySettings = typeof communitySettingsTable.$inferSelect;
export type InsertCommunitySettings = z.infer<typeof insertCommunitySettingsSchema>;
