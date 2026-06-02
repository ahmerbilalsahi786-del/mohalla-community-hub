import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  communityId: text("community_id").notNull().default("default"),
  userId: text("user_id").notNull().default("ahmed"),
  userName: text("user_name").notNull().default("Ahmed Khan"),
  unitNumber: text("unit_number").notNull().default("B-204"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  date: text("date").notNull(),
  time: text("time").notNull().default(""),
  location: text("location").notNull().default(""),
  imageUrl: text("image_url"),
  rsvpCount: integer("rsvp_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rsvpsTable = pgTable("rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: text("user_id").notNull().default("ahmed"),
  userName: text("user_name").notNull().default("Ahmed Khan"),
  status: text("status").notNull().default("going"),  // going | maybe | not_going
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true, rsvpCount: true });
export const insertRsvpSchema = createInsertSchema(rsvpsTable).omit({ id: true, createdAt: true });

export type Event = typeof eventsTable.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Rsvp = typeof rsvpsTable.$inferSelect;
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;
