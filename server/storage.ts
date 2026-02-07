import { db } from "./db";
import {
  users, tournaments, categories, athletes, teams, matches, athleteCodes,
  type User, type InsertUser,
  type Tournament, type InsertTournament,
  type Category, type InsertCategory,
  type Athlete, type InsertAthlete,
  type Team, type InsertTeam,
  type Match, type InsertMatch,
  type AthleteCode, type InsertAthleteCode,
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getOrganizers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;

  getAllTournaments(): Promise<Tournament[]>;
  getTournament(id: number): Promise<Tournament | undefined>;
  getTournamentByCode(code: string): Promise<Tournament | undefined>;
  createTournament(t: InsertTournament): Promise<Tournament>;
  updateTournament(id: number, updates: Partial<InsertTournament>): Promise<Tournament>;
  deleteTournament(id: number): Promise<void>;

  getCategories(tournamentId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(c: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  getAthletes(tournamentId: number): Promise<Athlete[]>;
  getAthlete(id: number): Promise<Athlete | undefined>;
  createAthlete(a: InsertAthlete): Promise<Athlete>;
  deleteAthlete(id: number): Promise<void>;

  getTeams(categoryId: number): Promise<Team[]>;
  getTeamsByTournament(tournamentId: number): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(t: InsertTeam): Promise<Team>;
  deleteTeam(id: number): Promise<void>;
  updateTeam(id: number, updates: Partial<Team>): Promise<Team>;

  getMatches(categoryId: number): Promise<Match[]>;
  getMatch(id: number): Promise<Match | undefined>;
  createMatch(m: InsertMatch): Promise<Match>;
  updateMatch(id: number, updates: Partial<Match>): Promise<Match>;
  deleteMatchesByCategory(categoryId: number): Promise<void>;

  getAthleteCodes(tournamentId: number): Promise<AthleteCode[]>;
  getAthleteCodeByCode(code: string): Promise<AthleteCode | undefined>;
  createAthleteCode(ac: InsertAthleteCode): Promise<AthleteCode>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(u: InsertUser) {
    const [user] = await db.insert(users).values(u).returning();
    return user;
  }
  async getOrganizers() {
    return db.select().from(users).where(eq(users.role, "organizer")).orderBy(desc(users.createdAt));
  }
  async deleteUser(id: number) {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllTournaments() {
    return db.select().from(tournaments).orderBy(desc(tournaments.startDate));
  }
  async getTournament(id: number) {
    const [t] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return t;
  }
  async getTournamentByCode(code: string) {
    const [t] = await db.select().from(tournaments).where(eq(tournaments.code, code));
    return t;
  }
  async createTournament(t: InsertTournament) {
    const [tournament] = await db.insert(tournaments).values(t).returning();
    return tournament;
  }
  async updateTournament(id: number, updates: Partial<InsertTournament>) {
    const [t] = await db.update(tournaments).set(updates).where(eq(tournaments.id, id)).returning();
    return t;
  }
  async deleteTournament(id: number) {
    await db.delete(tournaments).where(eq(tournaments.id, id));
  }

  async getCategories(tournamentId: number) {
    return db.select().from(categories).where(eq(categories.tournamentId, tournamentId));
  }
  async getCategory(id: number) {
    const [c] = await db.select().from(categories).where(eq(categories.id, id));
    return c;
  }
  async createCategory(c: InsertCategory) {
    const [cat] = await db.insert(categories).values(c).returning();
    return cat;
  }
  async deleteCategory(id: number) {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getAthletes(tournamentId: number) {
    return db.select().from(athletes).where(eq(athletes.tournamentId, tournamentId)).orderBy(asc(athletes.name));
  }
  async getAthlete(id: number) {
    const [a] = await db.select().from(athletes).where(eq(athletes.id, id));
    return a;
  }
  async createAthlete(a: InsertAthlete) {
    const [athlete] = await db.insert(athletes).values(a).returning();
    return athlete;
  }
  async deleteAthlete(id: number) {
    await db.delete(athletes).where(eq(athletes.id, id));
  }

  async getTeams(categoryId: number) {
    return db.select().from(teams).where(eq(teams.categoryId, categoryId));
  }
  async getTeamsByTournament(tournamentId: number) {
    return db.select().from(teams).where(eq(teams.tournamentId, tournamentId));
  }
  async getTeam(id: number) {
    const [t] = await db.select().from(teams).where(eq(teams.id, id));
    return t;
  }
  async createTeam(t: InsertTeam) {
    const [team] = await db.insert(teams).values(t).returning();
    return team;
  }
  async deleteTeam(id: number) {
    await db.delete(teams).where(eq(teams.id, id));
  }
  async updateTeam(id: number, updates: Partial<Team>) {
    const [team] = await db.update(teams).set(updates).where(eq(teams.id, id)).returning();
    return team;
  }

  async getMatches(categoryId: number) {
    return db.select().from(matches).where(eq(matches.categoryId, categoryId)).orderBy(asc(matches.roundNumber), asc(matches.id));
  }
  async getMatch(id: number) {
    const [m] = await db.select().from(matches).where(eq(matches.id, id));
    return m;
  }
  async createMatch(m: InsertMatch) {
    const [match] = await db.insert(matches).values(m).returning();
    return match;
  }
  async updateMatch(id: number, updates: Partial<Match>) {
    const [match] = await db.update(matches).set(updates).where(eq(matches.id, id)).returning();
    return match;
  }
  async deleteMatchesByCategory(categoryId: number) {
    await db.delete(matches).where(eq(matches.categoryId, categoryId));
  }

  async getAthleteCodes(tournamentId: number) {
    return db.select().from(athleteCodes).where(eq(athleteCodes.tournamentId, tournamentId));
  }
  async getAthleteCodeByCode(code: string) {
    const [ac] = await db.select().from(athleteCodes).where(eq(athleteCodes.code, code));
    return ac;
  }
  async createAthleteCode(ac: InsertAthleteCode) {
    const [code] = await db.insert(athleteCodes).values(ac).returning();
    return code;
  }
}

export const storage = new DatabaseStorage();
