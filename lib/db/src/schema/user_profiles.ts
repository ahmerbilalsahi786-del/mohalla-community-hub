import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name").notNull().default(""),
  unitNumber: text("unit_number").notNull().default(""),
  avatarUrl: text("avatar_url"),
  whatsappNumber: text("whatsapp_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Notification preferences
  notifyComments: boolean("notify_comments").notNull().default(true),
  notifyLikes: boolean("notify_likes").notNull().default(false),
  notifySafety: boolean("notify_safety").notNull().default(true),
  notifyAnnouncements: boolean("notify_announcements").notNull().default(true),
  notifyMarketplace: boolean("notify_marketplace").notNull().default(true),
  notifyApprovals: boolean("notify_approvals").notNull().default(true),
});

export type UserProfile = typeof userProfilesTable.$inferSelect;
