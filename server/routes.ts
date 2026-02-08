import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import type { User, Team, Match } from "@shared/schema";
import { insertTournamentSchema, insertCategorySchema, insertTeamSchema, insertUserSchema } from "@shared/schema";
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
      const existing = await storage.getUserByUsername(parsed.username);
      if (existing) return res.status(400).json({ message: "Usuário já cadastrado" });
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

  // === ATHLETE ACCESS (4-digit tournament code) ===
  app.post("/api/athlete-access", async (req, res) => {
    const { code } = req.body;
    const tournament = await storage.getTournamentByCode(code);
    if (tournament) {
      return res.json({ tournament });
    }
    const ac = await storage.getAthleteCodeByCode(code);
    if (!ac) return res.status(404).json({ message: "Código inválido" });
    const t = await storage.getTournament(ac.tournamentId);
    res.json({ athleteName: ac.athleteName, tournament: t });
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

      let code: string;
      let codeExists = true;
      do {
        code = String(Math.floor(1000 + Math.random() * 9000));
        const check = await storage.getTournamentByCode(code);
        codeExists = !!check;
      } while (codeExists);
      body.code = code;

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

  // === TEAMS (Duplas) ===
  app.get("/api/categories/:categoryId/teams", async (req, res) => {
    const teams = await storage.getTeams(Number(req.params.categoryId));
    res.json(teams);
  });

  app.get("/api/categories/:categoryId/matches", async (req, res) => {
    const matches = await storage.getMatches(Number(req.params.categoryId));
    res.json(matches);
  });

  app.get("/api/tournaments/:id/teams", async (req, res) => {
    const teams = await storage.getTeamsByTournament(Number(req.params.id));
    res.json(teams);
  });

  app.post("/api/teams", requireAuth, async (req, res) => {
    try {
      const body = { ...req.body };
      if (!body.player1Name) body.player1Name = body.name;
      if (!body.player2Name) body.player2Name = "";
      const parsed = insertTeamSchema.parse(body);
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

  app.post("/api/categories/:categoryId/generate-teams", requireAuth, async (req, res) => {
    try {
      const categoryId = Number(req.params.categoryId);
      const { quantity } = req.body;
      const count = Math.min(Math.max(1, Number(quantity) || 1), 64);
      const existing = await storage.getTeams(categoryId);
      const startNum = existing.length + 1;
      const category = await storage.getCategory(categoryId);
      if (!category) return res.status(404).json({ message: "Categoria não encontrada" });
      const created: Team[] = [];
      for (let i = 0; i < count; i++) {
        const num = startNum + i;
        const team = await storage.createTeam({
          categoryId,
          tournamentId: category.tournamentId,
          name: `Dupla ${num}`,
          player1Name: `Dupla ${num}`,
          player2Name: "",
        });
        created.push(team);
      }
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // === GROUP DRAW (Sorteio de Chaves) ===
  app.post("/api/categories/:categoryId/draw-groups", requireAuth, async (req, res) => {
    const categoryId = Number(req.params.categoryId);
    const { numGroups } = req.body;

    if (!numGroups || numGroups < 1) return res.status(400).json({ message: "Número de chaves inválido" });

    const teamsList = await storage.getTeams(categoryId);
    if (teamsList.length < 2) return res.status(400).json({ message: "Mínimo de 2 duplas necessário" });
    if (numGroups > teamsList.length) return res.status(400).json({ message: "Número de chaves maior que o número de duplas" });

    const shuffled = [...teamsList].sort(() => Math.random() - 0.5);
    const groupLetters = Array.from({ length: numGroups }, (_, i) => String.fromCharCode(65 + i));

    for (let i = 0; i < shuffled.length; i++) {
      const groupIndex = i % numGroups;
      const groupName = `Chave ${groupLetters[groupIndex]}`;
      await storage.updateTeam(shuffled[i].id, {
        groupName,
        groupWins: 0, groupLosses: 0,
        setsWon: 0, setsLost: 0,
        pointsScored: 0, pointsConceded: 0,
      });
    }

    const updatedTeams = await storage.getTeams(categoryId);
    res.json(updatedTeams);
  });

  // === GENERATE MATCHES BY ROUNDS ===
  app.post("/api/categories/:categoryId/generate-matches", requireAuth, async (req, res) => {
    const categoryId = Number(req.params.categoryId);
    await storage.deleteMatchesByCategory(categoryId);

    const teamsList = await storage.getTeams(categoryId);
    if (teamsList.length < 2) return res.status(400).json({ message: "Mínimo de 2 duplas necessário" });

    const groups: Record<string, Team[]> = {};
    for (const team of teamsList) {
      const g = team.groupName || "Chave A";
      if (!groups[g]) groups[g] = [];
      groups[g].push(team);
    }

    const groupNames = Object.keys(groups).sort();

    const groupRounds: Record<string, { team1: Team; team2: Team }[][]> = {};
    for (const gName of groupNames) {
      groupRounds[gName] = generateRoundRobin(groups[gName]);
    }

    const maxRounds = Math.max(...Object.values(groupRounds).map(r => r.length));

    const createdMatches: Match[] = [];
    const category = await storage.getCategory(categoryId);
    const tournament = category ? await storage.getTournament(category.tournamentId) : null;
    const totalCourts = tournament?.courts || 1;
    let courtNum = 1;
    let matchNum = 1;

    for (let roundIdx = 0; roundIdx < maxRounds; roundIdx++) {
      for (const gName of groupNames) {
        const roundGames = groupRounds[gName][roundIdx] || [];
        for (const game of roundGames) {
          const match = await storage.createMatch({
            categoryId,
            team1Id: game.team1.id,
            team2Id: game.team2.id,
            matchNumber: matchNum,
            courtNumber: ((courtNum - 1) % totalCourts) + 1,
            roundNumber: roundIdx + 1,
            status: "agendado",
            stage: "grupo",
            groupName: gName,
          });
          createdMatches.push(match);
          courtNum++;
          matchNum++;
        }
      }
    }

    res.status(201).json(createdMatches);
  });

  async function classifyTeamsForBracket(
    categoryId: number,
    qualifyPerGroup: number,
    qualifyByIndex: number
  ): Promise<{
    qualified: { team: Team; position: number; group: string; qualifiedBy: "group" | "index" }[];
    sortedGroups: Record<string, Team[]>;
    groupNames: string[];
  }> {
    const teamsList = await storage.getTeams(categoryId);
    const allMatches = await storage.getMatches(categoryId);

    const groups: Record<string, Team[]> = {};
    for (const team of teamsList) {
      const g = team.groupName || "Chave A";
      if (!groups[g]) groups[g] = [];
      groups[g].push(team);
    }

    const sortedGroups: Record<string, Team[]> = {};
    for (const [gName, gTeams] of Object.entries(groups)) {
      sortedGroups[gName] = sortTeamsByStandings(gTeams, allMatches);
    }

    const groupNames = Object.keys(sortedGroups).sort();
    const qualified: { team: Team; position: number; group: string; qualifiedBy: "group" | "index" }[] = [];
    const qualifiedIds = new Set<number>();

    for (const gName of groupNames) {
      const sorted = sortedGroups[gName];
      for (let i = 0; i < qualifyPerGroup && i < sorted.length; i++) {
        qualified.push({ team: sorted[i], position: i + 1, group: gName, qualifiedBy: "group" });
        qualifiedIds.add(sorted[i].id);
      }
    }

    if (qualifyByIndex > 0) {
      const remaining: { team: Team; position: number; group: string }[] = [];
      for (const gName of groupNames) {
        const sorted = sortedGroups[gName];
        for (let i = qualifyPerGroup; i < sorted.length; i++) {
          if (!qualifiedIds.has(sorted[i].id)) {
            remaining.push({ team: sorted[i], position: i + 1, group: gName });
          }
        }
      }

      remaining.sort((a, b) => {
        const aWins = a.team.groupWins || 0;
        const bWins = b.team.groupWins || 0;
        if (bWins !== aWins) return bWins - aWins;

        const aSetDiff = (a.team.setsWon || 0) - (a.team.setsLost || 0);
        const bSetDiff = (b.team.setsWon || 0) - (b.team.setsLost || 0);
        if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;

        const aPointDiff = (a.team.pointsScored || 0) - (a.team.pointsConceded || 0);
        const bPointDiff = (b.team.pointsScored || 0) - (b.team.pointsConceded || 0);
        if (bPointDiff !== aPointDiff) return bPointDiff - aPointDiff;

        const aScored = a.team.pointsScored || 0;
        const bScored = b.team.pointsScored || 0;
        if (bScored !== aScored) return bScored - aScored;

        return Math.random() - 0.5;
      });

      for (let i = 0; i < qualifyByIndex && i < remaining.length; i++) {
        qualified.push({ team: remaining[i].team, position: remaining[i].position, group: remaining[i].group, qualifiedBy: "index" });
        qualifiedIds.add(remaining[i].team.id);
      }
    }

    return { qualified, sortedGroups, groupNames };
  }

  // === BRACKET PREVIEW (show classified teams before generating) ===
  app.post("/api/categories/:categoryId/bracket-preview", requireAuth, async (req, res) => {
    const categoryId = Number(req.params.categoryId);
    const { qualifyPerGroup = 2, qualifyByIndex = 0 } = req.body;

    const { qualified, sortedGroups, groupNames } = await classifyTeamsForBracket(
      categoryId, qualifyPerGroup, qualifyByIndex
    );

    const totalQualified = qualified.length;
    const bracketSize = totalQualified <= 2 ? 2 : totalQualified <= 4 ? 4 : 8;

    res.json({
      qualified: qualified.map(q => ({
        teamId: q.team.id,
        teamName: q.team.name,
        position: q.position,
        group: q.group,
        qualifiedBy: q.qualifiedBy,
        wins: q.team.groupWins || 0,
        setDiff: (q.team.setsWon || 0) - (q.team.setsLost || 0),
        pointDiff: (q.team.pointsScored || 0) - (q.team.pointsConceded || 0),
      })),
      totalTeams: (await storage.getTeams(categoryId)).length,
      numGroups: groupNames.length,
      bracketSize,
      qualifyPerGroup,
      qualifyByIndex,
    });
  });

  // === GENERATE BRACKET (Knockout) ===
  app.post("/api/categories/:categoryId/generate-bracket", requireAuth, async (req, res) => {
    const categoryId = Number(req.params.categoryId);
    const { qualifyPerGroup = 2, qualifyByIndex = 0 } = req.body;

    await storage.updateCategory(categoryId, { qualifyPerGroup, qualifyByIndex });

    const { qualified, groupNames } = await classifyTeamsForBracket(
      categoryId, qualifyPerGroup, qualifyByIndex
    );

    const numGroups = groupNames.length;

    if (qualified.length < 2) return res.status(400).json({ message: "Duplas insuficientes para fase eliminatória" });

    const existingBracketMatches = (await storage.getMatches(categoryId)).filter(m => m.stage !== "grupo");
    for (const m of existingBracketMatches) {
      await storage.updateMatch(m.id, { team1Id: null, team2Id: null, winnerId: null, status: "agendado",
        set1Team1: 0, set1Team2: 0, set2Team1: 0, set2Team2: 0, set3Team1: 0, set3Team2: 0 });
    }

    const allMatches = await storage.getMatches(categoryId);
    const maxGroupMatchNum = Math.max(0, ...allMatches.filter(m => m.stage === "grupo").map(m => m.matchNumber || 0));
    let bracketMatchNum = maxGroupMatchNum + 1;

    const createdMatches: Match[] = [];

    if (numGroups === 4 && qualifyPerGroup <= 2 && qualifyByIndex === 0) {
      const pairings = generateOlympicCrossover(qualified, groupNames);

      if (qualified.length <= 4) {
        for (const p of pairings.slice(0, 2)) {
          const match = await storage.createMatch({
            categoryId, team1Id: p.team1.id, team2Id: p.team2.id,
            matchNumber: bracketMatchNum++, stage: "semifinal", status: "agendado", courtNumber: 1,
          });
          createdMatches.push(match);
        }
      } else {
        for (const p of pairings) {
          const match = await storage.createMatch({
            categoryId, team1Id: p.team1.id, team2Id: p.team2.id,
            matchNumber: bracketMatchNum++, stage: "quartas", status: "agendado", courtNumber: 1,
          });
          createdMatches.push(match);
        }
      }

      if (qualified.length > 4) {
        for (let i = 0; i < 2; i++) {
          const match = await storage.createMatch({
            categoryId, team1Id: null, team2Id: null,
            matchNumber: bracketMatchNum++, stage: "semifinal", status: "agendado", courtNumber: 1,
          });
          createdMatches.push(match);
        }
      }

      const finalMatch = await storage.createMatch({
        categoryId, team1Id: null, team2Id: null,
        matchNumber: bracketMatchNum++, stage: "final", status: "agendado", courtNumber: 1,
      });
      createdMatches.push(finalMatch);

      const bronzeMatch = await storage.createMatch({
        categoryId, team1Id: null, team2Id: null,
        matchNumber: bracketMatchNum++, stage: "terceiro", status: "agendado", courtNumber: 1,
      });
      createdMatches.push(bronzeMatch);
    } else {
      const pairings = generateSmartBracket(qualified);

      if (pairings.length >= 4) {
        for (const p of pairings) {
          const match = await storage.createMatch({
            categoryId, team1Id: p.team1.id, team2Id: p.team2.id,
            matchNumber: bracketMatchNum++, stage: "quartas", status: "agendado", courtNumber: 1,
          });
          createdMatches.push(match);
        }
        for (let i = 0; i < 2; i++) {
          const match = await storage.createMatch({
            categoryId, team1Id: null, team2Id: null,
            matchNumber: bracketMatchNum++, stage: "semifinal", status: "agendado", courtNumber: 1,
          });
          createdMatches.push(match);
        }
      } else {
        for (const p of pairings) {
          const match = await storage.createMatch({
            categoryId, team1Id: p.team1.id, team2Id: p.team2.id,
            matchNumber: bracketMatchNum++, stage: "semifinal", status: "agendado", courtNumber: 1,
          });
          createdMatches.push(match);
        }
      }

      const finalMatch = await storage.createMatch({
        categoryId, team1Id: null, team2Id: null,
        matchNumber: bracketMatchNum++, stage: "final", status: "agendado", courtNumber: 1,
      });
      createdMatches.push(finalMatch);

      const bronzeMatch = await storage.createMatch({
        categoryId, team1Id: null, team2Id: null,
        matchNumber: bracketMatchNum++, stage: "terceiro", status: "agendado", courtNumber: 1,
      });
      createdMatches.push(bronzeMatch);
    }

    res.status(201).json(createdMatches);
  });

  // === UPDATE TEAM NAME ===
  app.patch("/api/teams/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Nome da dupla e obrigatorio" });
    }
    const team = await storage.updateTeam(id, { name: name.trim(), player1Name: name.trim() });
    broadcast({ type: "TEAM_UPDATE", payload: team });
    res.json(team);
  });

  // === UPDATE MATCH SCORE ===
  app.patch("/api/matches/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const updates = req.body;
    const match = await storage.updateMatch(id, updates);

    if (updates.status === "finalizado" && updates.winnerId) {
      const fullMatch = await storage.getMatch(id);
      if (fullMatch && fullMatch.stage === "grupo") {
        await recalculateGroupStats(fullMatch.categoryId);
        await checkAutoAdvance(fullMatch.categoryId, broadcast);
      }

      if (fullMatch && fullMatch.stage === "quartas") {
        await updateQuartasProgression(fullMatch);
      }

      if (fullMatch && fullMatch.stage === "semifinal") {
        await updateBracketProgression(fullMatch);
      }

      if (fullMatch && fullMatch.stage === "final") {
        broadcast({ type: "CHAMPION_DECLARED", payload: { categoryId: fullMatch.categoryId, winnerId: updates.winnerId } });
      }
    }

    broadcast({ type: "MATCH_UPDATE", payload: match });
    res.json(match);
  });

  // === STANDINGS ===
  app.get("/api/categories/:categoryId/standings", async (req, res) => {
    const categoryId = Number(req.params.categoryId);
    const teamsList = await storage.getTeams(categoryId);
    const allMatches = await storage.getMatches(categoryId);

    const groups: Record<string, Team[]> = {};
    for (const team of teamsList) {
      const g = team.groupName || "Sem Grupo";
      if (!groups[g]) groups[g] = [];
      groups[g].push(team);
    }

    for (const [, groupTeams] of Object.entries(groups)) {
      const sorted = sortTeamsByStandings(groupTeams, allMatches);
      groupTeams.length = 0;
      groupTeams.push(...sorted);
    }

    res.json(groups);
  });

  // === TOURNAMENT DATA FOR ATHLETE ===
  app.get("/api/tournaments/:id/full-data", async (req, res) => {
    const tournamentId = Number(req.params.id);
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Torneio não encontrado" });

    const cats = await storage.getCategories(tournamentId);
    const allTeams = await storage.getTeamsByTournament(tournamentId);
    const allMatches: Match[] = [];
    const allStandings: Record<number, Record<string, Team[]>> = {};

    for (const cat of cats) {
      const catMatches = await storage.getMatches(cat.id);
      allMatches.push(...catMatches);

      const groups: Record<string, Team[]> = {};
      const catTeams = allTeams.filter(t => t.categoryId === cat.id);
      for (const team of catTeams) {
        const g = team.groupName || "Sem Grupo";
        if (!groups[g]) groups[g] = [];
        groups[g].push(team);
      }
      for (const groupTeams of Object.values(groups)) {
        const sorted = sortTeamsByStandings(groupTeams, catMatches);
        groupTeams.length = 0;
        groupTeams.push(...sorted);
      }
      allStandings[cat.id] = groups;
    }

    res.json({ tournament, categories: cats, teams: allTeams, matches: allMatches, standings: allStandings });
  });

  // Helper: Generate round-robin schedule ensuring no back-to-back games
  function generateRoundRobin(teamsList: Team[]): { team1: Team; team2: Team }[][] {
    const teams = [...teamsList];
    const n = teams.length;
    if (n < 2) return [];

    if (n % 2 !== 0) {
      teams.push(null as any);
    }

    const numTeams = teams.length;
    const rounds: { team1: Team; team2: Team }[][] = [];
    const fixed = teams[0];
    const rotating = teams.slice(1);

    for (let r = 0; r < numTeams - 1; r++) {
      const round: { team1: Team; team2: Team }[] = [];
      const current = [fixed, ...rotating];

      for (let i = 0; i < numTeams / 2; i++) {
        const t1 = current[i];
        const t2 = current[numTeams - 1 - i];
        if (t1 && t2) {
          round.push({ team1: t1, team2: t2 });
        }
      }

      if (round.length > 0) rounds.push(round);
      rotating.push(rotating.shift()!);
    }

    return reorderToAvoidConsecutive(rounds, teamsList);
  }

  function reorderToAvoidConsecutive(rounds: { team1: Team; team2: Team }[][], allTeams: Team[]): { team1: Team; team2: Team }[][] {
    if (rounds.length <= 1) return rounds;

    const result: { team1: Team; team2: Team }[][] = [rounds[0]];
    const remaining = rounds.slice(1);

    while (remaining.length > 0) {
      const lastRound = result[result.length - 1];
      const lastTeamIds = new Set<number>();
      for (const game of lastRound) {
        lastTeamIds.add(game.team1.id);
        lastTeamIds.add(game.team2.id);
      }

      let bestIdx = 0;
      let bestConflicts = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        let conflicts = 0;
        for (const game of remaining[i]) {
          if (lastTeamIds.has(game.team1.id)) conflicts++;
          if (lastTeamIds.has(game.team2.id)) conflicts++;
        }
        if (conflicts < bestConflicts) {
          bestConflicts = conflicts;
          bestIdx = i;
        }
      }

      result.push(remaining.splice(bestIdx, 1)[0]);
    }

    return result;
  }

  // Sort teams by: 1. Wins, 2. Head-to-head (if 2 tied), 3. Point difference
  function sortTeamsByStandings(teamsList: Team[], allMatches: Match[]): Team[] {
    const groupMatches = allMatches.filter(m => m.stage === "grupo" && m.status === "finalizado");

    const sorted = [...teamsList].sort((a, b) => {
      const aWins = a.groupWins || 0;
      const bWins = b.groupWins || 0;
      if (bWins !== aWins) return bWins - aWins;

      const tiedTeams = teamsList.filter(t => (t.groupWins || 0) === aWins);
      if (tiedTeams.length === 2) {
        const h2h = getHeadToHead(a.id, b.id, groupMatches);
        if (h2h !== 0) return h2h;
      }

      const aPointDiff = (a.pointsScored || 0) - (a.pointsConceded || 0);
      const bPointDiff = (b.pointsScored || 0) - (b.pointsConceded || 0);
      return bPointDiff - aPointDiff;
    });

    return sorted;
  }

  function getHeadToHead(teamAId: number, teamBId: number, matches: Match[]): number {
    for (const m of matches) {
      if ((m.team1Id === teamAId && m.team2Id === teamBId) || (m.team1Id === teamBId && m.team2Id === teamAId)) {
        if (m.winnerId === teamAId) return -1;
        if (m.winnerId === teamBId) return 1;
      }
    }
    return 0;
  }

  // Olympic crossover: ensures same-group teams are on OPPOSITE sides of bracket
  // QF1: A1vD2 → Semi1  |  QF2: B1vC2 → Semi1
  // QF3: C1vB2 → Semi2  |  QF4: D1vA2 → Semi2
  // This guarantees same-group teams can only meet in the FINAL
  function generateOlympicCrossover(
    qualified: { team: Team; position: number; group: string }[],
    groupNames: string[]
  ): { team1: Team; team2: Team }[] {
    const byGroup: Record<string, { first?: Team; second?: Team }> = {};
    for (const gn of groupNames) byGroup[gn] = {};

    for (const q of qualified) {
      if (q.position === 1) byGroup[q.group].first = q.team;
      else byGroup[q.group].second = q.team;
    }

    const A = groupNames[0], B = groupNames[1], C = groupNames[2], D = groupNames[3];
    const pairings: { team1: Team; team2: Team }[] = [];

    if (byGroup[A]?.first && byGroup[D]?.second)
      pairings.push({ team1: byGroup[A].first, team2: byGroup[D].second });
    if (byGroup[B]?.first && byGroup[C]?.second)
      pairings.push({ team1: byGroup[B].first, team2: byGroup[C].second });
    if (byGroup[C]?.first && byGroup[B]?.second)
      pairings.push({ team1: byGroup[C].first, team2: byGroup[B].second });
    if (byGroup[D]?.first && byGroup[A]?.second)
      pairings.push({ team1: byGroup[D].first, team2: byGroup[A].second });

    return pairings;
  }

  // Smart bracket: avoid same group in quarters AND semis
  function generateSmartBracket(
    qualified: { team: Team; position: number; group: string }[]
  ): { team1: Team; team2: Team }[] {
    const firsts = qualified.filter(q => q.position === 1);
    const seconds = qualified.filter(q => q.position === 2);

    const shuffledFirsts = [...firsts].sort(() => Math.random() - 0.5);
    const shuffledSeconds = [...seconds].sort(() => Math.random() - 0.5);

    const pairings: { team1: Team; team2: Team }[] = [];
    const usedSeconds = new Set<number>();

    for (const first of shuffledFirsts) {
      let paired = false;
      for (const second of shuffledSeconds) {
        if (!usedSeconds.has(second.team.id) && second.group !== first.group) {
          pairings.push({ team1: first.team, team2: second.team });
          usedSeconds.add(second.team.id);
          paired = true;
          break;
        }
      }
      if (!paired) {
        for (const second of shuffledSeconds) {
          if (!usedSeconds.has(second.team.id)) {
            pairings.push({ team1: first.team, team2: second.team });
            usedSeconds.add(second.team.id);
            break;
          }
        }
      }
    }

    const remaining = shuffledSeconds.filter(s => !usedSeconds.has(s.team.id));
    for (let i = 0; i < remaining.length - 1; i += 2) {
      pairings.push({ team1: remaining[i].team, team2: remaining[i + 1].team });
    }

    return fixBracketSameGroupSemis(pairings, qualified);
  }

  // Ensure adjacent pairs (which feed into the same semifinal) don't have
  // teams from the same group. Try all permutations of pair ordering to find
  // a valid arrangement where same-group teams can only meet in the final.
  function fixBracketSameGroupSemis(
    pairings: { team1: Team; team2: Team }[],
    qualified: { team: Team; position: number; group: string }[]
  ): { team1: Team; team2: Team }[] {
    if (pairings.length < 4) return pairings;

    const getGroup = (teamId: number) => qualified.find(q => q.team.id === teamId)?.group;

    const isValidOrder = (ordered: { team1: Team; team2: Team }[]) => {
      for (let i = 0; i < ordered.length - 1; i += 2) {
        const groups = [
          getGroup(ordered[i].team1.id),
          getGroup(ordered[i].team2.id),
          getGroup(ordered[i + 1].team1.id),
          getGroup(ordered[i + 1].team2.id),
        ].filter(Boolean);
        if (new Set(groups).size < groups.length) return false;
      }
      return true;
    };

    if (isValidOrder(pairings)) return pairings;

    // Try all permutations of pairings order
    const indices = pairings.map((_, i) => i);
    const permutations = getPermutations(indices);
    for (const perm of permutations) {
      const reordered = perm.map(i => pairings[i]);
      if (isValidOrder(reordered)) return reordered;
    }

    return pairings;
  }

  function getPermutations(arr: number[]): number[][] {
    if (arr.length <= 1) return [arr];
    const result: number[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const perm of getPermutations(rest)) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  }

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

  // Auto-advance: check if all group matches finished, then generate bracket
  async function checkAutoAdvance(categoryId: number, broadcast: (msg: any) => void) {
    const allMatches = await storage.getMatches(categoryId);
    const groupMatches = allMatches.filter(m => m.stage === "grupo");
    const bracketMatches = allMatches.filter(m => m.stage !== "grupo");

    if (groupMatches.length === 0) return;
    if (bracketMatches.length > 0) return;

    const allGroupFinished = groupMatches.every(m => m.status === "finalizado");
    if (!allGroupFinished) return;

    broadcast({ type: "GROUP_PHASE_COMPLETE", payload: { categoryId } });
  }

  // Helper: Quartas progression
  async function updateQuartasProgression(finishedMatch: Match) {
    const allMatches = await storage.getMatches(finishedMatch.categoryId);
    const quartas = allMatches.filter(m => m.stage === "quartas" && m.status === "finalizado");
    const semis = allMatches.filter(m => m.stage === "semifinal");

    if (quartas.length >= 2 && semis.length >= 1) {
      const sortedQuartas = quartas.sort((a, b) => a.id - b.id);

      if (sortedQuartas.length >= 2 && semis[0] && !semis[0].team1Id) {
        await storage.updateMatch(semis[0].id, {
          team1Id: sortedQuartas[0].winnerId,
          team2Id: sortedQuartas[1].winnerId,
        });
      }
    }

    if (quartas.length >= 4 && semis.length >= 2) {
      const sortedQuartas = quartas.sort((a, b) => a.id - b.id);

      if (semis[1] && !semis[1].team1Id) {
        await storage.updateMatch(semis[1].id, {
          team1Id: sortedQuartas[2].winnerId,
          team2Id: sortedQuartas[3].winnerId,
        });
      }
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
        const updatedFinal = await storage.updateMatch(finalMatch.id, { team1Id: winners[0], team2Id: winners[1] });
        broadcast({ type: "MATCH_UPDATE", payload: updatedFinal });
      }
      if (bronzeMatch && losers.length === 2) {
        const updatedBronze = await storage.updateMatch(bronzeMatch.id, { team1Id: losers[0], team2Id: losers[1] });
        broadcast({ type: "MATCH_UPDATE", payload: updatedBronze });
      }
    }
  }

  // Seed admin
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const admin = await storage.getUserByUsername("admin");
  if (!admin) {
    const adminHash = await hashPassword("ADM007");
    await storage.createUser({
      username: "admin",
      password: adminHash,
      name: "Admin Master",
      role: "admin",
    });
  }
}
