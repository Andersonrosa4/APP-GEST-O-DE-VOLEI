
import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Acts as email
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "organizer", "athlete"] }).default("athlete").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// === TOURNAMENTS ===
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  description: text("description"),
  status: text("status", { enum: ["draft", "open", "ongoing", "completed"] }).default("draft").notNull(),
  organizerId: integer("organizer_id").notNull(), // Linked to users.id
  courts: integer("courts").default(1).notNull(),
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true });

// === CATEGORIES ===
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull(),
  name: text("name").notNull(), // e.g. "Open Male", "U18 Female"
  gender: text("gender", { enum: ["male", "female", "mixed"] }).notNull(),
  minTeams: integer("min_teams").default(4),
  maxTeams: integer("max_teams").default(32),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });

// === TEAMS ===
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(), // e.g. "Bruno/Alison"
  player1Id: integer("player1_id"), // Can be null if manual entry
  player2Id: integer("player2_id"),
  player1Name: text("player1_name").notNull(), // Fallback or direct name
  player2Name: text("player2_name").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  points: integer("points").default(0), // For ranking
  setsWon: integer("sets_won").default(0),
  setsLost: integer("sets_lost").default(0),
  matchesPlayed: integer("matches_played").default(0),
});

export const insertTeamSchema = createInsertSchema(teams).omit({ 
  id: true, 
  points: true, 
  setsWon: true, 
  setsLost: true, 
  matchesPlayed: true 
});

// === MATCHES ===
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  team1Id: integer("team1_id"), // Can be null in bracket template
  team2Id: integer("team2_id"),
  courtNumber: integer("court_number").default(1),
  scheduledTime: timestamp("scheduled_time"),
  
  // Scores (Best of 3)
  scoreTeam1Set1: integer("score_team1_set1").default(0),
  scoreTeam2Set1: integer("score_team2_set1").default(0),
  scoreTeam1Set2: integer("score_team1_set2").default(0),
  scoreTeam2Set2: integer("score_team2_set2").default(0),
  scoreTeam1Set3: integer("score_team1_set3").default(0),
  scoreTeam2Set3: integer("score_team2_set3").default(0),
  
  winnerId: integer("winner_id"),
  status: text("status", { enum: ["scheduled", "warmup", "in_progress", "finished"] }).default("scheduled").notNull(),
  stage: text("stage", { enum: ["group", "quarter_final", "semi_final", "final", "bronze"] }).default("group").notNull(),
  groupName: text("group_name"), // "Group A", etc.
});

export const insertMatchSchema = createInsertSchema(matches).omit({ id: true });

// === RELATIONS ===
export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  organizer: one(users, {
    fields: [tournaments.organizerId],
    references: [users.id],
  }),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [categories.tournamentId],
    references: [tournaments.id],
  }),
  teams: many(teams),
  matches: many(matches),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  category: one(categories, {
    fields: [matches.categoryId],
    references: [categories.id],
  }),
  team1: one(teams, {
    fields: [matches.team1Id],
    references: [teams.id],
    relationName: "team1Matches",
  }),
  team2: one(teams, {
    fields: [matches.team2Id],
    references: [teams.id],
    relationName: "team2Matches",
  }),
}));

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type UpdateMatchScore = {
  scoreTeam1Set1?: number;
  scoreTeam2Set1?: number;
  scoreTeam1Set2?: number;
  scoreTeam2Set2?: number;
  scoreTeam1Set3?: number;
  scoreTeam2Set3?: number;
  status?: string;
  winnerId?: number;
};

// WebSocket Types
export type WSMessage = {
  type: "MATCH_UPDATE";
  payload: Match;
};
