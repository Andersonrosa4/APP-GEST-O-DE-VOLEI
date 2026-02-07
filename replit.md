# Beach Manager - Sistema de Gerenciamento de Torneios de Vôlei de Praia

## Overview
Beach volleyball tournament management system built entirely in Portuguese. Supports three access levels: Admin Master, Organizers, and Athletes (read-only via 4-digit codes).

## Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + Passport (local auth) + WebSocket
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (frontend), Express (backend)

## Project Structure
```
shared/schema.ts       - Database schema & types (Drizzle + Zod)
server/auth.ts         - Passport local authentication
server/storage.ts      - DatabaseStorage class (all CRUD operations)
server/routes.ts       - API routes + WebSocket + match generation algorithms
client/src/App.tsx     - Main app with routes
client/src/pages/      - Pages: home, login, athlete-access, admin, tournament-details
client/src/hooks/      - use-auth.tsx, use-tournaments.ts, use-matches.ts
client/src/components/ - layout-shell.tsx, match-card.tsx, ui/
```

## Access Levels
1. **Admin Master**: Fixed login admin / ADM007 (username, not email) - full system control
2. **Organizers**: Created by admin with username/password - manage tournaments, categories, athletes, teams, scores
3. **Athletes**: 4-digit code access (no login) - view tournament info and scores only

## Database Schema
- users (admin/organizer roles)
- tournaments (rascunho/aberto/em_andamento/finalizado)
- categories (masculino/feminino/misto)
- athletes (registered by organizers)
- teams (2 players per team, with group/stats)
- matches (grupo/quartas/semifinal/final/terceiro stages)
- athlete_codes (4-digit access codes)

## Key Routes
- POST /api/login - Username/password authentication
- POST /api/athlete-access - 4-digit code access
- GET/POST /api/tournaments - Tournament CRUD
- GET/POST /api/categories - Category CRUD
- POST /api/categories/:id/generate-matches - Generate round-robin group matches
- POST /api/categories/:id/generate-bracket - Generate knockout bracket
- PATCH /api/matches/:id - Update scores (broadcasts via WebSocket)
- GET /api/categories/:id/standings - Group standings

## Frontend Routes
- / - Home (tournament listings)
- /login - Admin/Organizer login
- /atleta - Athlete 4-digit code access
- /torneio/:id - Public tournament view
- /admin - Admin dashboard
- /admin/torneio/:id - Tournament management
- /admin/organizadores - Organizer management (admin only)

## User Preferences
- All UI text must be in Portuguese
- Portuguese enum values throughout (rascunho, aberto, em_andamento, etc.)
