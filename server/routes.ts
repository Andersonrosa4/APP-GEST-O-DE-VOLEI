import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import type { User, Team, Match } from "@shared/schema";
import { insertTournamentSchema, insertCategorySchema, insertAthleteSchema, insertTeamSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
  if ((req.user as User).role !== "admin") return res.status(403).json({ message: "Acesso negado" });
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const broadcast = (message: any) => {
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });
  };

  // === USERS (Admin only) ===
  app.get("/api/users", requireAdmin, async (_req, res) => {
    const organizers = await storage.getOrganizers();
    res.json(organizers.map(({ password, ...u }) => u));
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const parsed = insertUserSchema.parse({ ...req.body, role: "organizer" });
      const existing = await storage.getUserByEmail(parsed.email);
      if (existing) return res.status(400).json({ message: "Email já cadastrado" });
      const hashedPassword = await hashPassword(parsed.password);
      const user = await storage.createUser({ ...parsed, password: hashedPassword });
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: e.errors });
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    res.json({ message: "Organizador removido" });
  });

  // === ATHLETE ACCESS (4-digit code) ===
  app.post("/api/athlete-access", async (req, res) => {
    const { code } = req.body;
    const ac = await storage.getAthleteCodeByCode(code);
    if (!ac) return res.status(404).json({ message: "Código inválido" });
    const tournament = await storage.getTournament(ac.tournamentId);
    res.json({ athleteName: ac.athleteName, tournament });
  });

  // === ATHLETE CODES ===
  app.get("/api/tournaments/:id/athlete-codes", requireAuth, async (req, res) => {
    const codes = await storage.getAthleteCodes(Number(req.params.id));
    res.json(codes);
  });

  app.post("/api/athlete-codes", requireAuth, async (req, res) => {
    let code: string;
    let exists = true;
    do {
      code = String(Math.floor(1000 + Math.random() * 9000));
      const check = await storage.getAthleteCodeByCode(code);
      exists = !!check;
    } while (exists);

    const ac = await storage.createAthleteCode({
      ...req.body,
      code,
      createdBy: (req.user as User).id,
    });
    res.status(201).json(ac);
  });

  // === TOURNAMENTS ===
  app.get("/api/tournaments", async (_req, res) => {
    const tournaments = await storage.getAllTournaments();
    res.json(tournaments);
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    const t = await storage.getTournament(Number(req.params.id));
    if (!t) return res.status(404).json({ message: "Torneio não encontrado" });
    res.json(t);
  });

  app.post("/api/tournaments", requireAuth, async (req, res) => {
    try {
      const body = { ...req.body, organizerId: (req.user as User).id };
      if (body.startDate) body.startDate = new Date(body.startDate);
      if (body.endDate) body.endDate = new Date(body.endDate);
      const parsed = insertTournamentSchema.parse(body);
      const tournament = await storage.createTournament(parsed);
      res.status(201).json(tournament);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: e.errors });
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/tournaments/:id", requireAuth, async (req, res) => {
    const t = await storage.updateTournament(Number(req.params.id), req.body);
    res.json(t);
  });

  app.delete("/api/tournaments/:id", requireAuth, async (req, res) => {
    await storage.deleteTournament(Number(req.params.id));
    res.json({ message: "Torneio removido" });
  });

  // === CATEGORIES ===
  app.get("/api/tournaments/:id/categories", async (req, res) => {
    const cats = await storage.getCategories(Number(req.params.id));
    res.json(cats);
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const parsed = insertCategorySchema.parse(req.body);
      const cat = await storage.createCategory(parsed);
      res.status(201).json(cat);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: e.errors });
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    res.json({ message: "Categoria removida" });
  });

  // === ATHLETES ===
  app.get("/api/tournaments/:id/athletes", async (req, res) => {
    const athletes = await storage.getAthletes(Number(req.params.id));
    res.json(athletes);
  });

  app.post("/api/athletes", requireAuth, async (req, res) => {
    try {
      const parsed = insertAthleteSchema.parse({
        ...req.body,
        createdBy: (req.user as User).id,
      });
      const athlete = await storage.createAthlete(parsed);
      res.status(201).json(athlete);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: e.errors });
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/athletes/:id", requireAuth, async (req, res) => {
    await storage.deleteAthlete(Number(req.params.id));
    res.json({ message: "Atleta removido" });
  });

  // === TEAMS ===
  app.get("/api/categories/:categoryId/teams", async (req, res) => {
    const teams = await storage.getTeams(Number(req.params.categoryId));
    res.json(teams);
  });

  app.post("/api/teams", requireAuth, async (req, res) => {
    try {
      const parsed = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(parsed);
      res.status(201).json(team);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos", errors: e.errors });
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/teams/:id", requireAuth, async (req, res) => {
    await storage.deleteTeam(Number(req.params.id));
    res.json({ message: "Dupla removida" });
  });

  // === MATCHES ===
  app.get("/api/categories/:categoryId/matches", async (req, res) => {
    const matchesList = await storage.getMatches(Number(req.params.categoryId));
    res.json(matchesList);
  });

  // Generate group stage matches (round robin)
  app.post("/api/categories/:categoryId/generate-matches", requireAuth, async (req, res) => {
    const categoryId = Number(req.params.categoryId);
    await storage.deleteMatchesByCategory(categoryId);

    const teamsList = await storage.getTeams(categoryId);
    if (teamsList.length < 2) return res.status(400).json({ message: "Mínimo de 2 duplas necessário" });

    // Assign groups
    const numGroups = Math.max(1, Math.ceil(teamsList.length / 4));
    const shuffled = [...teamsList].sort(() => Math.random() - 0.5);
    const groups: Record<string, Team[]> = {};

    for (let i = 0; i < shuffled.length; i++) {
      const groupIndex = i % numGroups;
      const groupName = `Grupo ${String.fromCharCode(65 + groupIndex)}`;
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(shuffled[i]);
      await storage.updateTeam(shuffled[i].id, { groupName, groupWins: 0, groupLosses: 0, setsWon: 0, setsLost: 0, pointsScored: 0, pointsConceded: 0 });
    }

    const createdMatches: Match[] = [];
    let courtNum = 1;
    const category = await storage.getCategory(categoryId);
    const tournament = category ? await storage.getTournament(category.tournamentId) : null;
    const totalCourts = tournament?.courts || 1;

    for (const [groupName, groupTeams] of Object.entries(groups)) {
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          const match = await storage.createMatch({
            categoryId,
            team1Id: groupTeams[i].id,
            team2Id: groupTeams[j].id,
            courtNumber: ((courtNum - 1) % totalCourts) + 1,
            status: "agendado",
            stage: "grupo",
            groupName,
          });
          createdMatches.push(match);
          courtNum++;
        }
      }
    }

    res.status(201).json(createdMatches);
  });

  // Generate bracket (knockout stage from group results)
  app.post("/api/categories/:categoryId/generate-bracket", requireAuth, async (req, res) => {
    const categoryId = Number(req.params.categoryId);
    const teamsList = await storage.getTeams(categoryId);

    // Gather group standings
    const groups: Record<string, Team[]> = {};
    for (const team of teamsList) {
      const g = team.groupName || "Grupo A";
      if (!groups[g]) groups[g] = [];
      groups[g].push(team);
    }

    // Sort each group by wins, then set diff, then points
    const qualified: Team[] = [];
    for (const [, groupTeams] of Object.entries(groups)) {
      groupTeams.sort((a, b) => {
        if ((b.groupWins || 0) !== (a.groupWins || 0)) return (b.groupWins || 0) - (a.groupWins || 0);
        const aSetDiff = (a.setsWon || 0) - (a.setsLost || 0);
        const bSetDiff = (b.setsWon || 0) - (b.setsLost || 0);
        if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
        return ((b.pointsScored || 0) - (b.pointsConceded || 0)) - ((a.pointsScored || 0) - (a.pointsConceded || 0));
      });
      qualified.push(...groupTeams.slice(0, 2));
    }

    // Determine bracket size
    let bracketSize = 2;
    while (bracketSize < qualified.length) bracketSize *= 2;

    const stages: string[] = [];
    if (bracketSize >= 8) stages.push("quartas");
    if (bracketSize >= 4) stages.push("semifinal");
    stages.push("final");

    const createdMatches: Match[] = [];

    if (qualified.length >= 4) {
      // Semifinals
      const semis = [
        { team1Id: qualified[0]?.id, team2Id: qualified[3]?.id },
        { team1Id: qualified[1]?.id, team2Id: qualified[2]?.id },
      ];

      for (const s of semis) {
        const match = await storage.createMatch({
          categoryId,
          team1Id: s.team1Id || null,
          team2Id: s.team2Id || null,
          stage: "semifinal",
          status: "agendado",
          courtNumber: 1,
        });
        createdMatches.push(match);
      }

      // Final placeholder
      const finalMatch = await storage.createMatch({
        categoryId,
        team1Id: null,
        team2Id: null,
        stage: "final",
        status: "agendado",
        courtNumber: 1,
      });
      createdMatches.push(finalMatch);

      // Bronze match placeholder
      const bronzeMatch = await storage.createMatch({
        categoryId,
        team1Id: null,
        team2Id: null,
        stage: "terceiro",
        status: "agendado",
        courtNumber: 1,
      });
      createdMatches.push(bronzeMatch);
    } else if (qualified.length >= 2) {
      const finalMatch = await storage.createMatch({
        categoryId,
        team1Id: qualified[0]?.id,
        team2Id: qualified[1]?.id,
        stage: "final",
        status: "agendado",
        courtNumber: 1,
      });
      createdMatches.push(finalMatch);
    }

    res.status(201).json(createdMatches);
  });

  // Update match score
  app.patch("/api/matches/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const updates = req.body;
    const match = await storage.updateMatch(id, updates);

    // If match is finished, update team stats
    if (updates.status === "finalizado" && updates.winnerId) {
      const fullMatch = await storage.getMatch(id);
      if (fullMatch && fullMatch.stage === "grupo") {
        await recalculateGroupStats(fullMatch.categoryId);
      }

      // If this is a semifinal that just finished, update the final/bronze
      if (fullMatch && (fullMatch.stage === "semifinal")) {
        await updateBracketProgression(fullMatch);
      }
    }

    broadcast({ type: "MATCH_UPDATE", payload: match });
    res.json(match);
  });

  // === STANDINGS ===
  app.get("/api/categories/:categoryId/standings", async (req, res) => {
    const categoryId = Number(req.params.categoryId);
    const teamsList = await storage.getTeams(categoryId);

    const groups: Record<string, Team[]> = {};
    for (const team of teamsList) {
      const g = team.groupName || "Sem Grupo";
      if (!groups[g]) groups[g] = [];
      groups[g].push(team);
    }

    for (const groupTeams of Object.values(groups)) {
      groupTeams.sort((a, b) => {
        if ((b.groupWins || 0) !== (a.groupWins || 0)) return (b.groupWins || 0) - (a.groupWins || 0);
        const aSetDiff = (a.setsWon || 0) - (a.setsLost || 0);
        const bSetDiff = (b.setsWon || 0) - (b.setsLost || 0);
        if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
        return ((b.pointsScored || 0) - (b.pointsConceded || 0)) - ((a.pointsScored || 0) - (a.pointsConceded || 0));
      });
    }

    res.json(groups);
  });

  // Helper: Recalculate group stats from all group matches
  async function recalculateGroupStats(categoryId: number) {
    const allMatches = await storage.getMatches(categoryId);
    const groupMatches = allMatches.filter(m => m.stage === "grupo" && m.status === "finalizado");
    const teamsList = await storage.getTeams(categoryId);

    const stats: Record<number, { wins: number; losses: number; setsWon: number; setsLost: number; pointsScored: number; pointsConceded: number }> = {};
    for (const t of teamsList) {
      stats[t.id] = { wins: 0, losses: 0, setsWon: 0, setsLost: 0, pointsScored: 0, pointsConceded: 0 };
    }

    for (const m of groupMatches) {
      if (!m.team1Id || !m.team2Id) continue;
      const t1 = m.team1Id;
      const t2 = m.team2Id;

      const sets = [
        { s1: m.set1Team1 || 0, s2: m.set1Team2 || 0 },
        { s1: m.set2Team1 || 0, s2: m.set2Team2 || 0 },
        { s1: m.set3Team1 || 0, s2: m.set3Team2 || 0 },
      ];

      let t1Sets = 0, t2Sets = 0;
      for (const set of sets) {
        if (set.s1 > 0 || set.s2 > 0) {
          if (set.s1 > set.s2) t1Sets++; else t2Sets++;
          if (stats[t1]) { stats[t1].pointsScored += set.s1; stats[t1].pointsConceded += set.s2; }
          if (stats[t2]) { stats[t2].pointsScored += set.s2; stats[t2].pointsConceded += set.s1; }
        }
      }

      if (stats[t1]) { stats[t1].setsWon += t1Sets; stats[t1].setsLost += t2Sets; }
      if (stats[t2]) { stats[t2].setsWon += t2Sets; stats[t2].setsLost += t1Sets; }

      if (m.winnerId === t1) {
        if (stats[t1]) stats[t1].wins++;
        if (stats[t2]) stats[t2].losses++;
      } else if (m.winnerId === t2) {
        if (stats[t2]) stats[t2].wins++;
        if (stats[t1]) stats[t1].losses++;
      }
    }

    for (const [teamId, s] of Object.entries(stats)) {
      await storage.updateTeam(Number(teamId), {
        groupWins: s.wins,
        groupLosses: s.losses,
        setsWon: s.setsWon,
        setsLost: s.setsLost,
        pointsScored: s.pointsScored,
        pointsConceded: s.pointsConceded,
      });
    }
  }

  // Helper: Progress bracket when semifinals finish
  async function updateBracketProgression(finishedMatch: Match) {
    const allMatches = await storage.getMatches(finishedMatch.categoryId);
    const semis = allMatches.filter(m => m.stage === "semifinal" && m.status === "finalizado");

    if (semis.length === 2) {
      const finalMatch = allMatches.find(m => m.stage === "final");
      const bronzeMatch = allMatches.find(m => m.stage === "terceiro");

      const winners = semis.map(m => m.winnerId).filter(Boolean);
      const losers = semis.map(m => {
        if (m.winnerId === m.team1Id) return m.team2Id;
        return m.team1Id;
      }).filter(Boolean);

      if (finalMatch && winners.length === 2) {
        await storage.updateMatch(finalMatch.id, { team1Id: winners[0], team2Id: winners[1] });
      }
      if (bronzeMatch && losers.length === 2) {
        await storage.updateMatch(bronzeMatch.id, { team1Id: losers[0], team2Id: losers[1] });
      }
    }
  }

  // Seed admin
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const admin = await storage.getUserByEmail("admin@beachmanager.com");
  if (!admin) {
    const adminHash = await hashPassword("ADM007");
    const adminUser = await storage.createUser({
      email: "admin@beachmanager.com",
      password: adminHash,
      name: "Admin Master",
      role: "admin",
    });

    const orgHash = await hashPassword("org123");
    const org = await storage.createUser({
      email: "organizador@beachmanager.com",
      password: orgHash,
      name: "Carlos Silva",
      role: "organizer",
    });

    const t = await storage.createTournament({
      name: "Copacabana Open 2025",
      location: "Rio de Janeiro - Praia de Copacabana",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 3),
      description: "O maior torneio de vôlei de praia do verão! Venha participar desta competição incrível na praia de Copacabana.",
      organizerId: adminUser.id,
      status: "aberto",
      courts: 4,
      setsPerMatch: 3,
      pointsPerSet: 21,
      pointsTiebreak: 15,
    });

    const catM = await storage.createCategory({ tournamentId: t.id, name: "Masculino Pro", gender: "masculino", maxTeams: 16 });
    const catF = await storage.createCategory({ tournamentId: t.id, name: "Feminino Pro", gender: "feminino", maxTeams: 16 });

    const a1 = await storage.createAthlete({ name: "Alison Cerutti", tournamentId: t.id, createdBy: adminUser.id });
    const a2 = await storage.createAthlete({ name: "Bruno Schmidt", tournamentId: t.id, createdBy: adminUser.id });
    const a3 = await storage.createAthlete({ name: "Anders Mol", tournamentId: t.id, createdBy: adminUser.id });
    const a4 = await storage.createAthlete({ name: "Christian Sorum", tournamentId: t.id, createdBy: adminUser.id });
    const a5 = await storage.createAthlete({ name: "Evandro Gonçalves", tournamentId: t.id, createdBy: adminUser.id });
    const a6 = await storage.createAthlete({ name: "Arthur Lanci", tournamentId: t.id, createdBy: adminUser.id });
    const a7 = await storage.createAthlete({ name: "George Wanderley", tournamentId: t.id, createdBy: adminUser.id });
    const a8 = await storage.createAthlete({ name: "André Loyola", tournamentId: t.id, createdBy: adminUser.id });

    await storage.createTeam({ categoryId: catM.id, name: "Alison/Bruno", player1Id: a1.id, player2Id: a2.id, player1Name: a1.name, player2Name: a2.name, seed: 1, groupName: "Grupo A" });
    await storage.createTeam({ categoryId: catM.id, name: "Mol/Sorum", player1Id: a3.id, player2Id: a4.id, player1Name: a3.name, player2Name: a4.name, seed: 2, groupName: "Grupo B" });
    await storage.createTeam({ categoryId: catM.id, name: "Evandro/Arthur", player1Id: a5.id, player2Id: a6.id, player1Name: a5.name, player2Name: a6.name, groupName: "Grupo A" });
    await storage.createTeam({ categoryId: catM.id, name: "George/André", player1Id: a7.id, player2Id: a8.id, player1Name: a7.name, player2Name: a8.name, groupName: "Grupo B" });
  }
}
