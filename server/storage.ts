
import { db } from "./db";
import {
  users, tournaments, categories, teams, matches,
  type User, type InsertUser,
  type Tournament, type InsertTournament,
  type Category, type InsertCategory,
  type Team, type InsertTeam,
  type Match, type InsertMatch,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tournaments
  getAllTournaments(): Promise<Tournament[]>;
  getTournament(id: number): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  deleteTournament(id: number): Promise<void>;
  
  // Categories
  getCategories(tournamentId: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Teams
  getTeams(categoryId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeamStatus(id: number, status: string): Promise<Team>;
  
  // Matches
  getMatches(categoryId: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, updates: Partial<InsertMatch>): Promise<Match>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Tournaments
  async getAllTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments).orderBy(desc(tournaments.startDate));
  }

  async getTournament(id: number): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament;
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const [tournament] = await db.insert(tournaments).values(insertTournament).returning();
    return tournament;
  }
  
  async deleteTournament(id: number): Promise<void> {
    await db.delete(tournaments).where(eq(tournaments.id, id));
  }

  // Categories
  async getCategories(tournamentId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.tournamentId, tournamentId));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  // Teams
  async getTeams(categoryId: number): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.categoryId, categoryId));
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }
  
  async updateTeamStatus(id: number, status: string): Promise<Team> {
    // @ts-ignore
    const [team] = await db.update(teams).set({ status }).where(eq(teams.id, id)).returning();
    return team;
  }

  // Matches
  async getMatches(categoryId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.categoryId, categoryId)).orderBy(matches.scheduledTime);
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }

  async updateMatch(id: number, updates: Partial<InsertMatch>): Promise<Match> {
    const [match] = await db.update(matches).set(updates).where(eq(matches.id, id)).returning();
    return match;
  }
}

export const storage = new DatabaseStorage();
