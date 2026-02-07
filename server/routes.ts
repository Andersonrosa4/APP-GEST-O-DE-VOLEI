
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth"; // Will create this next
import { users } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth (Passport)
  setupAuth(app);

  // Setup WebSocket for Realtime Scores
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const broadcast = (message: any) => {
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  // === AUTH ROUTES ===
  // Handled by setupAuth mostly, but explicitly:
  
  // === TOURNAMENTS ===
  app.get(api.tournaments.list.path, async (req, res) => {
    const tournaments = await storage.getAllTournaments();
    res.json(tournaments);
  });

  app.get(api.tournaments.get.path, async (req, res) => {
    const tournament = await storage.getTournament(Number(req.params.id));
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
    res.json(tournament);
  });

  app.post(api.tournaments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const input = api.tournaments.create.input.parse(req.body);
      // Force organizerId to current user
      const tournament = await storage.createTournament({ ...input, organizerId: (req.user as any).id });
      res.status(201).json(tournament);
    } catch (e) {
      res.status(400).json(e);
    }
  });

  app.delete(api.tournaments.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role === 'athlete') return res.status(403).send("Unauthorized");
    await storage.deleteTournament(Number(req.params.id));
    res.status(200).send();
  });

  // === CATEGORIES ===
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories(Number(req.params.id));
    res.json(categories);
  });

  app.post(api.categories.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const category = await storage.createCategory(req.body);
    res.status(201).json(category);
  });

  // === TEAMS ===
  app.get(api.teams.list.path, async (req, res) => {
    const teams = await storage.getTeams(Number(req.params.categoryId));
    res.json(teams);
  });

  app.post(api.teams.create.path, async (req, res) => {
    const team = await storage.createTeam(req.body);
    res.status(201).json(team);
  });
  
  app.patch(api.teams.approve.path, async (req, res) => {
     if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
     const team = await storage.updateTeamStatus(Number(req.params.id), 'approved');
     res.json(team);
  });

  // === MATCHES ===
  app.get(api.matches.list.path, async (req, res) => {
    const matches = await storage.getMatches(Number(req.params.categoryId));
    res.json(matches);
  });

  app.post(api.matches.generate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const categoryId = Number(req.params.categoryId);
    // Simple mock generation: Match every pending team against each other or just create placeholders
    // For MVP, lets just fetch teams and create a few group matches
    const teams = await storage.getTeams(categoryId);
    const matchesList = [];
    
    // Create Round Robin for Group A (first 4 teams)
    if (teams.length >= 2) {
       // Mock: Team 1 vs Team 2
       const m1 = await storage.createMatch({
         categoryId,
         team1Id: teams[0].id,
         team2Id: teams[1].id,
         stage: 'group',
         courtNumber: 1,
         scheduledTime: new Date(Date.now() + 3600000), // 1 hour from now
         status: 'scheduled',
         scoreTeam1Set1: 0, scoreTeam2Set1: 0,
         scoreTeam1Set2: 0, scoreTeam2Set2: 0,
         scoreTeam1Set3: 0, scoreTeam2Set3: 0,
       });
       matchesList.push(m1);
    }
    
    res.status(201).json(matchesList);
  });

  app.patch(api.matches.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const id = Number(req.params.id);
    const updates = api.matches.update.input.parse(req.body);
    const match = await storage.updateMatch(id, updates);
    
    // BROADCAST UPDATE
    broadcast({ type: "MATCH_UPDATE", payload: match });
    
    res.json(match);
  });
  
  // Seed basic data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const admin = await storage.getUserByUsername("admin");
  if (!admin) {
    // Create Default Admin
    const adminUser = await storage.createUser({
      username: "admin",
      password: "adminpassword", // In real app, hash this!
      name: "System Admin",
      role: "admin",
    });
    
    // Create Demo Tournament
    const t = await storage.createTournament({
      name: "Copacabana Open 2025",
      location: "Rio de Janeiro, Brazil",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 3), // 3 days
      description: "The biggest beach volleyball event of the summer!",
      organizerId: adminUser.id,
      status: "open",
      courts: 4
    });
    
    // Create Categories
    const catM = await storage.createCategory({
      tournamentId: t.id,
      name: "Men's Pro",
      gender: "male",
    });
    
    const catF = await storage.createCategory({
      tournamentId: t.id,
      name: "Women's Pro",
      gender: "female",
    });
    
    // Create Teams
    const t1 = await storage.createTeam({ categoryId: catM.id, name: "Alison/Bruno", player1Name: "Alison", player2Name: "Bruno", status: "approved" });
    const t2 = await storage.createTeam({ categoryId: catM.id, name: "Mol/Sorum", player1Name: "Mol", player2Name: "Sorum", status: "approved" });
    
    // Create Match
    await storage.createMatch({
      categoryId: catM.id,
      team1Id: t1.id,
      team2Id: t2.id,
      courtNumber: 1,
      scheduledTime: new Date(),
      status: "in_progress",
      scoreTeam1Set1: 18,
      scoreTeam2Set1: 21,
      scoreTeam1Set2: 15,
      scoreTeam2Set2: 12,
    });
  }
}
