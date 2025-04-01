import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Player model for the game
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  role: text("role").notNull().default("Mouse"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Game zone model for defining boundaries
export const gameZones = pgTable("game_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  coordinates: text("coordinates").notNull(), // Stored as JSON string
});

// Game sessions model
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  isRunning: boolean("is_running").notNull().default(false),
  zoneId: integer("zone_id"),
});

// Player schema for insertion
export const insertPlayerSchema = createInsertSchema(players).pick({
  username: true,
  role: true,
  latitude: true,
  longitude: true,
  isActive: true,
});

// Game zone schema for insertion
export const insertGameZoneSchema = createInsertSchema(gameZones).pick({
  name: true,
  coordinates: true,
});

// Game session schema for insertion
export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  isRunning: true,
  zoneId: true,
});

// Validation schemas with extended rules
export const validatePlayerSchema = insertPlayerSchema.extend({
  username: z.string().min(4).max(16),
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export type InsertGameZone = z.infer<typeof insertGameZoneSchema>;
export type GameZone = typeof gameZones.$inferSelect;

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;

// Coordinate type for map positions
export type Coordinate = {
  latitude: number;
  longitude: number;
};
