import { Match, Team } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

interface MatchCardProps {
  match: Match;
  team1?: Team;
  team2?: Team;
  isLive?: boolean;
}

export function MatchCard({ match, team1, team2, isLive }: MatchCardProps) {
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";
  
  // Calculate total sets to determine leader
  const t1Sets = (match.scoreTeam1Set1 > match.scoreTeam2Set1 ? 1 : 0) + 
                 (match.scoreTeam1Set2 > match.scoreTeam2Set2 ? 1 : 0) + 
                 (match.scoreTeam1Set3 > match.scoreTeam2Set3 ? 1 : 0);
  
  const t2Sets = (match.scoreTeam2Set1 > match.scoreTeam1Set1 ? 1 : 0) + 
                 (match.scoreTeam2Set2 > match.scoreTeam1Set2 ? 1 : 0) + 
                 (match.scoreTeam2Set3 > match.scoreTeam1Set3 ? 1 : 0);

  return (
    <div className={cn(
      "relative rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md",
      isLive && "ring-2 ring-primary border-primary/20 shadow-primary/10"
    )}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <span className="bg-slate-100 px-2 py-0.5 rounded">Court {match.courtNumber}</span>
          <span>{match.stage.replace('_', ' ')}</span>
        </div>
        {match.status === "in_progress" && (
          <Badge variant="default" className="bg-red-500 hover:bg-red-600 animate-pulse">
            LIVE
          </Badge>
        )}
        {match.status === "finished" && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            Final
          </Badge>
        )}
        {match.status === "scheduled" && match.scheduledTime && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {format(new Date(match.scheduledTime), "HH:mm")}
          </div>
        )}
      </div>

      {/* Teams & Scores */}
      <div className="space-y-3">
        {/* Team 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             {match.winnerId === match.team1Id && isFinished && <Trophy className="w-4 h-4 text-amber-500" />}
             <span className={cn(
               "font-display font-semibold text-lg truncate max-w-[120px] sm:max-w-[180px]",
               match.winnerId === match.team1Id ? "text-slate-900" : "text-slate-600"
             )}>
               {team1?.name || "TBD"}
             </span>
          </div>
          <div className="flex gap-2 font-mono text-sm">
            <ScoreBox score={match.scoreTeam1Set1} active={!isScheduled} />
            <ScoreBox score={match.scoreTeam1Set2} active={match.scoreTeam1Set1 > 0 || match.scoreTeam2Set1 > 0} />
            {(match.scoreTeam1Set3 > 0 || match.scoreTeam2Set3 > 0) && (
              <ScoreBox score={match.scoreTeam1Set3} active={true} />
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 my-2" />

        {/* Team 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             {match.winnerId === match.team2Id && isFinished && <Trophy className="w-4 h-4 text-amber-500" />}
             <span className={cn(
               "font-display font-semibold text-lg truncate max-w-[120px] sm:max-w-[180px]",
               match.winnerId === match.team2Id ? "text-slate-900" : "text-slate-600"
             )}>
               {team2?.name || "TBD"}
             </span>
          </div>
          <div className="flex gap-2 font-mono text-sm">
            <ScoreBox score={match.scoreTeam2Set1} active={!isScheduled} />
            <ScoreBox score={match.scoreTeam2Set2} active={match.scoreTeam1Set1 > 0 || match.scoreTeam2Set1 > 0} />
            {(match.scoreTeam1Set3 > 0 || match.scoreTeam2Set3 > 0) && (
              <ScoreBox score={match.scoreTeam2Set3} active={true} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBox({ score, active }: { score: number, active: boolean }) {
  return (
    <div className={cn(
      "w-8 h-8 flex items-center justify-center rounded bg-slate-50 text-slate-400 font-bold",
      active && "bg-slate-100 text-slate-900",
      score >= 21 && "bg-primary/10 text-primary" // Highlighting winning score vaguely
    )}>
      {score}
    </div>
  );
}
