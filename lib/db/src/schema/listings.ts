import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  communityId: text("community_id").notNull().default("default"),
  userId: text("user_id").notNull().default("ahmed"),
  userName: text("user_name").notNull().default("Ahmed Khan"),
  unitNumber: text("unit_number").notNull().default("B-204"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pricePkr: integer("price_pkr"),
  category: text("category").notNull().default("other"),
  imageUrls: text("image_urls").array().notNull().default([]),
  condition: text("condition").notNull().default("good"),
  status: text("status").notNull().default("available"),
  whatsappNumber: text("whatsapp_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true });

export type Listing = typeof listingsTable.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
