import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "organizer"] }).notNull().default("organizer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export const athleteCodes = pgTable("athlete_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 4 }).notNull().unique(),
  athleteName: text("athlete_name").notNull(),
  tournamentId: integer("tournament_id").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAthleteCodeSchema = createInsertSchema(athleteCodes).omit({ id: true, createdAt: true });

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 4 }),
  location: text("location").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  description: text("description"),
  status: text("status", { enum: ["rascunho", "aberto", "em_andamento", "finalizado"] }).default("rascunho").notNull(),
  organizerId: integer("organizer_id").notNull(),
  courts: integer("courts").default(1).notNull(),
  setsPerMatch: integer("sets_per_match").default(3).notNull(),
  pointsPerSet: integer("points_per_set").default(21).notNull(),
  pointsTiebreak: integer("points_tiebreak").default(15).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true, createdAt: true });

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull(),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["masculino", "feminino", "misto"] }).notNull(),
  maxTeams: integer("max_teams").default(32),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });

export const athletes = pgTable("athletes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  tournamentId: integer("tournament_id").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({ id: true, createdAt: true });

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  tournamentId: integer("tournament_id"),
  name: text("name").notNull(),
  player1Id: integer("player1_id"),
  player2Id: integer("player2_id"),
  player1Name: text("player1_name").notNull(),
  player2Name: text("player2_name").notNull(),
  seed: integer("seed"),
  groupName: text("group_name"),
  groupWins: integer("group_wins").default(0),
  groupLosses: integer("group_losses").default(0),
  setsWon: integer("sets_won").default(0),
  setsLost: integer("sets_lost").default(0),
  pointsScored: integer("points_scored").default(0),
  pointsConceded: integer("points_conceded").default(0),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true, groupWins: true, groupLosses: true,
  setsWon: true, setsLost: true, pointsScored: true, pointsConceded: true,
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  team1Id: integer("team1_id"),
  team2Id: integer("team2_id"),
  courtNumber: integer("court_number").default(1),
  scheduledTime: timestamp("scheduled_time"),
  roundNumber: integer("round_number"),
  set1Team1: integer("set1_team1").default(0),
  set1Team2: integer("set1_team2").default(0),
  set2Team1: integer("set2_team1").default(0),
  set2Team2: integer("set2_team2").default(0),
  set3Team1: integer("set3_team1").default(0),
  set3Team2: integer("set3_team2").default(0),
  winnerId: integer("winner_id"),
  status: text("status", { enum: ["agendado", "em_andamento", "finalizado"] }).default("agendado").notNull(),
  stage: text("stage", { enum: ["grupo", "quartas", "semifinal", "final", "terceiro"] }).default("grupo").notNull(),
  groupName: text("group_name"),
});

export const insertMatchSchema = createInsertSchema(matches).omit({ id: true });

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  organizer: one(users, { fields: [tournaments.organizerId], references: [users.id] }),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  tournament: one(tournaments, { fields: [categories.tournamentId], references: [tournaments.id] }),
  teams: many(teams),
  matches: many(matches),
}));

export const teamsRelations = relations(teams, ({ one }) => ({
  category: one(categories, { fields: [teams.categoryId], references: [categories.id] }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  category: one(categories, { fields: [matches.categoryId], references: [categories.id] }),
  team1: one(teams, { fields: [matches.team1Id], references: [teams.id], relationName: "matchTeam1" }),
  team2: one(teams, { fields: [matches.team2Id], references: [teams.id], relationName: "matchTeam2" }),
  winner: one(teams, { fields: [matches.winnerId], references: [teams.id], relationName: "matchWinner" }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Athlete = typeof athletes.$inferSelect;
export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type AthleteCode = typeof athleteCodes.$inferSelect;
export type InsertAthleteCode = z.infer<typeof insertAthleteCodeSchema>;
