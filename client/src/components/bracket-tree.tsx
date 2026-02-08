import { Match, Team } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Trophy, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BracketTreeProps {
  matches: Match[];
  teams: Team[];
  onMatchClick?: (match: Match) => void;
}

export function ChampionBanner({ matches, teams }: { matches: Match[]; teams: Team[] }) {
  const finalMatch = matches.find(m => m.stage === "final" && m.status === "finalizado" && m.winnerId);
  if (!finalMatch) return null;

  const champion = teams.find(t => t.id === finalMatch.winnerId);
  if (!champion) return null;

  return (
    <div className="relative overflow-visible rounded-md border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-950/40 dark:via-yellow-950/40 dark:to-amber-950/40 p-6 text-center" data-testid="champion-banner">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Crown className="w-8 h-8 text-amber-500" />
        <Trophy className="w-6 h-6 text-amber-500" />
      </div>
      <div className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
        Campeao do Torneio
      </div>
      <div className="text-2xl font-black text-amber-700 dark:text-amber-300" data-testid="text-champion-name">
        {champion.name}
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        {finalMatch.set1Team1}-{finalMatch.set1Team2} / {finalMatch.set2Team1}-{finalMatch.set2Team2}
        {((finalMatch.set3Team1 || 0) > 0 || (finalMatch.set3Team2 || 0) > 0) && <> / {finalMatch.set3Team1}-{finalMatch.set3Team2}</>}
      </div>
    </div>
  );
}

export function BracketTree({ matches, teams, onMatchClick }: BracketTreeProps) {
  const bracketMatches = matches.filter(m => m.stage !== "grupo");
  if (bracketMatches.length === 0) return null;

  const quartas = bracketMatches.filter(m => m.stage === "quartas").sort((a, b) => (a.matchNumber || 999) - (b.matchNumber || 999));
  const semis = bracketMatches.filter(m => m.stage === "semifinal").sort((a, b) => (a.matchNumber || 999) - (b.matchNumber || 999));
  const finalMatches = bracketMatches.filter(m => m.stage === "final");
  const terceiro = bracketMatches.filter(m => m.stage === "terceiro");

  const hasQuartas = quartas.length > 0;
  const hasSemis = semis.length > 0;
  const hasFinal = finalMatches.length > 0;
  const hasTerceiro = terceiro.length > 0;

  const getTeam = (id: number | null | undefined) => teams.find(t => t.id === id);

  return (
    <div className="space-y-4" data-testid="bracket-tree">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" /> Chaveamento Eliminatorio
      </h3>

      <ChampionBanner matches={matches} teams={teams} />

      <div className="overflow-x-auto pb-4">
        <div className="flex items-stretch min-w-max">
          {hasQuartas && (
            <>
              <BracketColumn
                label="Quartas de Final"
                stage="quartas"
                matches={quartas}
                teams={teams}
                getTeam={getTeam}
                onMatchClick={onMatchClick}
                spacing="normal"
              />
              <ConnectorColumn count={quartas.length} spacing="normal" />
            </>
          )}

          {hasSemis && (
            <>
              <BracketColumn
                label="Semifinal"
                stage="semifinal"
                matches={semis}
                teams={teams}
                getTeam={getTeam}
                onMatchClick={onMatchClick}
                spacing={hasQuartas ? "spread" : "normal"}
              />
              <ConnectorColumn count={semis.length} spacing={hasQuartas ? "spread" : "normal"} />
            </>
          )}

          {hasFinal && (
            <BracketColumn
              label="Final"
              stage="final"
              matches={finalMatches}
              teams={teams}
              getTeam={getTeam}
              onMatchClick={onMatchClick}
              spacing="center"
            />
          )}

          {hasTerceiro && (
            <>
              <div className="w-8" />
              <BracketColumn
                label="3o Lugar"
                stage="terceiro"
                matches={terceiro}
                teams={teams}
                getTeam={getTeam}
                onMatchClick={onMatchClick}
                spacing="center"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectorColumn({ count, spacing }: { count: number; spacing: string }) {
  return (
    <div className="flex flex-col justify-center w-10 relative">
      {Array.from({ length: Math.ceil(count / 2) }).map((_, i) => (
        <div key={i} className="flex items-center h-full relative" style={{ flex: 1 }}>
          <svg className="w-full h-full" viewBox="0 0 40 100" preserveAspectRatio="none">
            <line x1="0" y1="30" x2="20" y2="30" stroke="currentColor" strokeWidth="1.5" className="text-border" />
            <line x1="0" y1="70" x2="20" y2="70" stroke="currentColor" strokeWidth="1.5" className="text-border" />
            <line x1="20" y1="30" x2="20" y2="70" stroke="currentColor" strokeWidth="1.5" className="text-border" />
            <line x1="20" y1="50" x2="40" y2="50" stroke="currentColor" strokeWidth="1.5" className="text-border" />
          </svg>
        </div>
      ))}
    </div>
  );
}

function BracketColumn({ label, stage, matches, teams, getTeam, onMatchClick, spacing }: {
  label: string;
  stage: string;
  matches: Match[];
  teams: Team[];
  getTeam: (id: number | null | undefined) => Team | undefined;
  onMatchClick?: (match: Match) => void;
  spacing: string;
}) {
  return (
    <div className="flex flex-col" data-testid={`bracket-column-${stage}`}>
      <div className="text-center mb-3">
        <Badge variant="outline" className="text-xs font-semibold">
          {label}
        </Badge>
      </div>
      <div className={cn(
        "flex flex-col flex-1",
        spacing === "center" && "justify-center gap-4",
        spacing === "spread" && "justify-around gap-4",
        spacing === "normal" && "justify-around gap-2",
      )}>
        {matches.map((m) => (
          <BracketMatchCard
            key={m.id}
            match={m}
            team1={getTeam(m.team1Id)}
            team2={getTeam(m.team2Id)}
            onMatchClick={onMatchClick}
          />
        ))}
      </div>
    </div>
  );
}

function BracketMatchCard({ match, team1, team2, onMatchClick }: {
  match: Match;
  team1?: Team;
  team2?: Team;
  onMatchClick?: (match: Match) => void;
}) {
  const isFinished = match.status === "finalizado";
  const isLive = match.status === "em_andamento";
  const hasSet3 = (match.set3Team1 || 0) > 0 || (match.set3Team2 || 0) > 0;

  return (
    <div
      className={cn(
        "w-56 rounded-md border shadow-sm bg-card transition-all",
        isLive && "ring-2 ring-red-400 border-red-200",
        onMatchClick && "cursor-pointer hover-elevate",
      )}
      onClick={() => onMatchClick?.(match)}
      data-testid={`bracket-match-${match.id}`}
    >
      <div className="px-3 py-1 border-b bg-muted/30 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground">
          Jogo {match.matchNumber || "—"}
        </span>
        {isLive && (
          <Badge variant="destructive" className="animate-pulse text-[10px] px-1.5 py-0">
            AO VIVO
          </Badge>
        )}
        {isFinished && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Final
          </Badge>
        )}
        {!isLive && !isFinished && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Agendado
          </Badge>
        )}
      </div>
      <div className="p-1.5 space-y-0">
        <BracketTeamRow
          name={team1?.name || "A definir"}
          sets={[match.set1Team1 || 0, match.set2Team1 || 0, match.set3Team1 || 0]}
          isWinner={isFinished && match.winnerId === match.team1Id}
          showScores={isFinished || isLive}
          hasSet3={hasSet3}
          isEmpty={!match.team1Id}
        />
        <div className="h-px bg-border mx-1" />
        <BracketTeamRow
          name={team2?.name || "A definir"}
          sets={[match.set1Team2 || 0, match.set2Team2 || 0, match.set3Team2 || 0]}
          isWinner={isFinished && match.winnerId === match.team2Id}
          showScores={isFinished || isLive}
          hasSet3={hasSet3}
          isEmpty={!match.team2Id}
        />
      </div>
    </div>
  );
}

function BracketTeamRow({ name, sets, isWinner, showScores, hasSet3, isEmpty }: {
  name: string;
  sets: number[];
  isWinner: boolean;
  showScores: boolean;
  hasSet3: boolean;
  isEmpty: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between px-2 py-1 rounded-sm",
      isWinner && "bg-green-50 dark:bg-green-950/30",
    )}>
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {isWinner && <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />}
        <span className={cn(
          "text-xs truncate",
          isWinner ? "font-bold" : "font-medium",
          isEmpty && "text-muted-foreground italic",
        )}>
          {name}
        </span>
      </div>
      {showScores && !isEmpty && (
        <div className="flex gap-0.5 font-mono text-[10px] flex-shrink-0">
          <span className={cn(
            "w-4 h-4 flex items-center justify-center rounded bg-muted text-muted-foreground",
            sets[0] > 0 && "font-bold",
          )}>{sets[0]}</span>
          <span className={cn(
            "w-4 h-4 flex items-center justify-center rounded bg-muted text-muted-foreground",
            sets[1] > 0 && "font-bold",
          )}>{sets[1]}</span>
          {hasSet3 && (
            <span className={cn(
              "w-4 h-4 flex items-center justify-center rounded bg-muted text-muted-foreground",
              sets[2] > 0 && "font-bold",
            )}>{sets[2]}</span>
          )}
        </div>
      )}
    </div>
  );
}
