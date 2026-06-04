import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  unitNumber: text("unit_number").notNull().default(""),
  role: text("role").notNull().default("resident"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
