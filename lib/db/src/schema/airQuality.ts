import {
  pgTable,
  serial,
  text,
  real,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const readingsTable = pgTable("readings", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  pm25: real("pm25").notNull(),
  pm10: real("pm10").notNull(),
  aqi: real("aqi").notNull(),
  co: real("co").notNull(),
  o3: real("o3").notNull(),
  nox: real("nox").notNull(),
  temperature: real("temperature").notNull(),
  humidity: real("humidity").notNull(),
});

export const insertReadingSchema = createInsertSchema(readingsTable).omit({ id: true });
export type InsertReading = z.infer<typeof insertReadingSchema>;
export type Reading = typeof readingsTable.$inferSelect;

export const spikesTable = pgTable("spikes", {
  id: serial("id").primaryKey(),
  readingId: integer("reading_id").notNull(),
  city: text("city").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  method: text("method").notNull(),
  severity: text("severity").notNull(),
  isAnomaly: boolean("is_anomaly").notNull().default(true),
  pm25: real("pm25").notNull(),
  aqi: real("aqi").notNull(),
});

export const insertSpikeSchema = createInsertSchema(spikesTable).omit({ id: true });
export type InsertSpike = z.infer<typeof insertSpikeSchema>;
export type Spike = typeof spikesTable.$inferSelect;

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  severity: text("severity").notNull(),
  messageEn: text("message_en").notNull(),
  messageUr: text("message_ur").notNull(),
  source: text("source").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
