import { useRoute } from "wouter";
import { useTournament, useCategories } from "@/hooks/use-tournaments";
import { useMatches, useTeams, useLiveMatchUpdates } from "@/hooks/use-matches";
import { LayoutShell } from "@/components/layout-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/match-card";
import { Loader2, Calendar, MapPin, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function TournamentDetailsPage() {
  const [, params] = useRoute("/tournaments/:id");
  const tournamentId = Number(params?.id);
  
  const { data: tournament, isLoading: loadingTournament } = useTournament(tournamentId);
  const { data: categories, isLoading: loadingCategories } = useCategories(tournamentId);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  if (loadingTournament || loadingCategories) {
    return (
      <LayoutShell>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </LayoutShell>
    );
  }

  if (!tournament) return <div>Tournament not found</div>;

  // Default to first category if none selected
  const activeCategoryId = selectedCategoryId ? Number(selectedCategoryId) : categories?.[0]?.id;

  return (
    <LayoutShell>
      {/* Tournament Header */}
      <div className="bg-slate-900 text-white py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-ocean-gradient opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <Badge className="bg-white/10 text-white hover:bg-white/20 mb-4 border-none">
            {tournament.status.toUpperCase()}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{tournament.name}</h1>
          <div className="flex flex-wrap gap-6 text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {format(new Date(tournament.startDate), "MMMM d, yyyy")}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {tournament.location}
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {categories?.length} Categories
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Selector */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-display text-slate-900">Competition</h2>
          <div className="w-[200px]">
             <Select 
               value={activeCategoryId?.toString()} 
               onValueChange={setSelectedCategoryId}
             >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name} ({cat.gender})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeCategoryId ? (
          <CategoryView categoryId={activeCategoryId} />
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed">
            <p className="text-muted-foreground">No categories available for this tournament.</p>
          </div>
        )}
      </div>
    </LayoutShell>
  );
}

function CategoryView({ categoryId }: { categoryId: number }) {
  const { data: matches, isLoading: loadingMatches } = useMatches(categoryId);
  const { data: teams, isLoading: loadingTeams } = useTeams(categoryId);
  useLiveMatchUpdates(categoryId);

  if (loadingMatches || loadingTeams) {
     return <div className="py-20 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  // Sort matches: Live -> Scheduled -> Finished
  const sortedMatches = [...(matches || [])].sort((a, b) => {
    const statusOrder = { in_progress: 0, scheduled: 1, finished: 2, warmup: 0 };
    return (statusOrder[a.status as keyof typeof statusOrder] || 3) - (statusOrder[b.status as keyof typeof statusOrder] || 3);
  });

  return (
    <Tabs defaultValue="matches" className="w-full">
      <TabsList className="mb-8 w-full md:w-auto">
        <TabsTrigger value="matches">Matches</TabsTrigger>
        <TabsTrigger value="standings">Standings</TabsTrigger>
        <TabsTrigger value="teams">Teams</TabsTrigger>
      </TabsList>

      <TabsContent value="matches" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMatches.map((match) => {
             const t1 = teams?.find(t => t.id === match.team1Id);
             const t2 = teams?.find(t => t.id === match.team2Id);
             return (
               <MatchCard 
                 key={match.id} 
                 match={match} 
                 team1={t1} 
                 team2={t2} 
                 isLive={match.status === 'in_progress'} 
               />
             );
          })}
          {sortedMatches.length === 0 && <p className="col-span-full text-center text-muted-foreground">No matches scheduled yet.</p>}
        </div>
      </TabsContent>

      <TabsContent value="standings">
        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Team</th>
                  <th className="p-3 text-center">Played</th>
                  <th className="p-3 text-center">Won</th>
                  <th className="p-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {teams?.sort((a,b) => (b.points || 0) - (a.points || 0)).map((team, idx) => (
                  <tr key={team.id} className="border-t">
                    <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-3 font-medium text-slate-900">{team.name}</td>
                    <td className="p-3 text-center">{team.matchesPlayed}</td>
                    <td className="p-3 text-center text-green-600 font-bold">{team.setsWon}</td> {/* Simple heuristic */}
                    <td className="p-3 text-right font-bold">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </TabsContent>

       <TabsContent value="teams">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {teams?.map(team => (
            <div key={team.id} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="font-bold text-lg">{team.name}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {team.player1Name} & {team.player2Name}
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
