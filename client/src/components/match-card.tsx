import { Match, Team } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock } from "lucide-react";
import { format } from "date-fns";

const stageLabels: Record<string, string> = {
  grupo: "Fase de Grupos",
  quartas: "Quartas de Final",
  semifinal: "Semifinal",
  final: "Final",
  terceiro: "Disputa 3o Lugar",
};

const statusLabels: Record<string, string> = {
  agendado: "Agendado",
  em_andamento: "Ao Vivo",
  finalizado: "Finalizado",
};

interface MatchCardProps {
  match: Match;
  team1?: Team;
  team2?: Team;
}

export function MatchCard({ match, team1, team2 }: MatchCardProps) {
  const isLive = match.status === "em_andamento";
  const isFinished = match.status === "finalizado";
  const isScheduled = match.status === "agendado";

  return (
    <div className={cn(
      "relative rounded-md border bg-white p-4 shadow-sm transition-all",
      isLive && "ring-2 ring-red-400 border-red-200"
    )} data-testid={`card-match-${match.id}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span className="bg-slate-100 px-2 py-0.5 rounded-md">Quadra {match.courtNumber}</span>
          <span>{stageLabels[match.stage] || match.stage}</span>
          {match.groupName && <span className="text-primary font-semibold">{match.groupName}</span>}
        </div>
        {isLive && (
          <Badge variant="destructive" className="animate-pulse" data-testid={`badge-live-${match.id}`}>
            AO VIVO
          </Badge>
        )}
        {isFinished && <Badge variant="secondary">Final</Badge>}
        {isScheduled && match.scheduledTime && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {format(new Date(match.scheduledTime), "HH:mm")}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <TeamScoreRow
          teamName={team1?.name || "A definir"}
          sets={[match.set1Team1 || 0, match.set2Team1 || 0, match.set3Team1 || 0]}
          isWinner={match.winnerId === match.team1Id && isFinished}
          showScores={!isScheduled}
          hasSet3={(match.set3Team1 || 0) > 0 || (match.set3Team2 || 0) > 0}
        />
        <div className="h-px bg-slate-100" />
        <TeamScoreRow
          teamName={team2?.name || "A definir"}
          sets={[match.set1Team2 || 0, match.set2Team2 || 0, match.set3Team2 || 0]}
          isWinner={match.winnerId === match.team2Id && isFinished}
          showScores={!isScheduled}
          hasSet3={(match.set3Team1 || 0) > 0 || (match.set3Team2 || 0) > 0}
        />
      </div>
    </div>
  );
}

function TeamScoreRow({ teamName, sets, isWinner, showScores, hasSet3 }: {
  teamName: string;
  sets: number[];
  isWinner: boolean;
  showScores: boolean;
  hasSet3: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        {isWinner && <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />}
        <span className={cn(
          "font-semibold truncate",
          isWinner ? "text-slate-900" : "text-slate-500"
        )}>
          {teamName}
        </span>
      </div>
      {showScores && (
        <div className="flex gap-1.5 font-mono text-sm flex-shrink-0">
          <ScoreBox score={sets[0]} />
          <ScoreBox score={sets[1]} />
          {hasSet3 && <ScoreBox score={sets[2]} />}
        </div>
      )}
    </div>
  );
}

function ScoreBox({ score }: { score: number }) {
  return (
    <div className={cn(
      "w-7 h-7 flex items-center justify-center rounded-md bg-slate-50 text-slate-600 text-xs font-bold",
      score >= 21 && "bg-primary/10 text-primary"
    )}>
      {score}
    </div>
  );
}
