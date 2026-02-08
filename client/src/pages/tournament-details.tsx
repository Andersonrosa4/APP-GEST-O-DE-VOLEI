import { useRoute } from "wouter";
import { useTournament, useCategories } from "@/hooks/use-tournaments";
import { useMatches, useTeams, useStandings, useLiveMatchUpdates } from "@/hooks/use-matches";
import { LayoutShell } from "@/components/layout-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/match-card";
import { BracketTree } from "@/components/bracket-tree";
import { Loader2, Calendar, MapPin, Users, Trophy, Swords, BarChart3, Clock, ListOrdered } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Match, Team } from "@shared/schema";

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  aberto: "Inscricoes Abertas",
  em_andamento: "Em Andamento",
  finalizado: "Finalizado",
};

const stageLabels: Record<string, string> = {
  grupo: "Fase de Grupos",
  quartas: "Quartas de Final",
  semifinal: "Semifinal",
  final: "Final",
  terceiro: "Disputa 3o Lugar",
};

export default function TournamentDetailsPage() {
  const [, params] = useRoute("/torneio/:id");
  const tournamentId = Number(params?.id);
  const { data: tournament, isLoading: lt } = useTournament(tournamentId);
  const { data: categories, isLoading: lc } = useCategories(tournamentId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  if (lt || lc) {
    return (
      <LayoutShell>
        <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      </LayoutShell>
    );
  }

  if (!tournament) return <LayoutShell><div className="text-center py-12">Torneio nao encontrado</div></LayoutShell>;

  const activeCategoryId = selectedCategoryId ? Number(selectedCategoryId) : categories?.[0]?.id;

  return (
    <LayoutShell>
      <div className="bg-hero-gradient text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className="bg-white/10 text-white border-none" data-testid="badge-tournament-status">
              {statusLabels[tournament.status]}
            </Badge>
            {tournament.code && (
              <Badge className="bg-white/20 text-white border-none font-mono tracking-wider" data-testid="badge-public-code">
                Codigo: {tournament.code}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-white" data-testid="text-tournament-name">{tournament.name}</h1>
          <div className="flex flex-wrap gap-6 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(tournament.startDate), "dd MMM yyyy", { locale: ptBR })} - {format(new Date(tournament.endDate), "dd MMM yyyy", { locale: ptBR })}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {tournament.location}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {tournament.courts} quadra{tournament.courts > 1 ? "s" : ""}
            </div>
          </div>
          {tournament.description && (
            <p className="text-white/60 mt-4 max-w-2xl">{tournament.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 className="section-title text-xl" data-testid="text-competition-title">Competicao</h2>
          {categories && categories.length > 0 && (
            <div className="w-[200px]">
              <Select value={activeCategoryId?.toString()} onValueChange={setSelectedCategoryId}>
                <SelectTrigger data-testid="select-public-category"><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {activeCategoryId ? (
          <CategoryPublicView categoryId={activeCategoryId} />
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Nenhuma categoria disponivel para este torneio.
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutShell>
  );
}

function CategoryPublicView({ categoryId }: { categoryId: number }) {
  const { data: matches, isLoading: lm } = useMatches(categoryId);
  const { data: teams, isLoading: lt } = useTeams(categoryId);
  const { data: standings } = useStandings(categoryId);
  useLiveMatchUpdates(categoryId);

  if (lm || lt) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const groupMatches = (matches || []).filter((m: Match) => m.stage === "grupo");
  const bracketMatches = (matches || []).filter((m: Match) => m.stage !== "grupo");

  const liveMatches = (matches || []).filter((m: Match) => m.status === "em_andamento");
  const nextMatches = (matches || []).filter((m: Match) => m.status === "agendado").slice(0, 4);

  const roundMap: Record<number, Match[]> = {};
  for (const m of groupMatches) {
    const r = m.roundNumber || 1;
    if (!roundMap[r]) roundMap[r] = [];
    roundMap[r].push(m);
  }
  const roundNumbers = Object.keys(roundMap).map(Number).sort((a, b) => a - b);

  return (
    <Tabs defaultValue="sequencia">
      <TabsList className="mb-6 flex-wrap">
        <TabsTrigger value="sequencia" data-testid="tab-public-sequence">
          <ListOrdered className="w-4 h-4 mr-1.5" /> Sequencia de Jogos
        </TabsTrigger>
        <TabsTrigger value="jogos" data-testid="tab-public-matches">
          <Swords className="w-4 h-4 mr-1.5" /> Por Rodada
        </TabsTrigger>
        <TabsTrigger value="classificacao" data-testid="tab-public-standings">
          <BarChart3 className="w-4 h-4 mr-1.5" /> Classificacao
        </TabsTrigger>
        <TabsTrigger value="duplas" data-testid="tab-public-teams">
          <Users className="w-4 h-4 mr-1.5" /> Duplas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sequencia" className="space-y-6">
        {liveMatches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h3 className="section-subtitle">Ao Vivo</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((m: Match) => (
                <MatchCard key={m.id} match={m} team1={teams?.find((t: Team) => t.id === m.team1Id)} team2={teams?.find((t: Team) => t.id === m.team2Id)} />
              ))}
            </div>
          </div>
        )}

        {(() => {
          const allSorted = [...(matches || [])].sort((a, b) => (a.matchNumber || 999) - (b.matchNumber || 999) || a.id - b.id);
          const groupSorted = allSorted.filter((m: Match) => m.stage === "grupo");
          const bracketSorted = allSorted.filter((m: Match) => m.stage !== "grupo");

          return (
            <>
              {groupSorted.length > 0 && (
                <div className="space-y-3">
                  <h3 className="section-subtitle flex items-center gap-2" data-testid="text-sequence-group-title">
                    <Swords className="w-5 h-5 text-primary" /> Fase de Grupos - Sequencia de Jogos
                  </h3>
                  <div className="space-y-2">
                    {groupSorted.map((m: Match) => {
                      const t1 = teams?.find((t: Team) => t.id === m.team1Id);
                      const t2 = teams?.find((t: Team) => t.id === m.team2Id);
                      const isFinished = m.status === "finalizado";
                      const isLive = m.status === "em_andamento";
                      return (
                        <div key={m.id} className={`match-row flex items-center gap-3 p-3 rounded-md border bg-card ${isLive ? "ring-2 ring-red-400 border-red-200 shadow-md" : ""} ${isFinished ? "opacity-70" : ""}`} data-testid={`row-sequence-${m.id}`}>
                          <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm" data-testid={`text-seq-number-${m.id}`}>
                            {m.matchNumber || "---"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="team-name text-sm truncate">{t1?.name || "A definir"}</span>
                              <span className="text-muted-foreground text-xs font-medium">vs</span>
                              <span className="team-name text-sm truncate">{t2?.name || "A definir"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              {m.groupName && <span className="text-primary font-medium">{m.groupName}</span>}
                              <span>Quadra {m.courtNumber}</span>
                              {m.roundNumber && <span>R{m.roundNumber}</span>}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            {isLive && <Badge variant="destructive" className="animate-pulse">AO VIVO</Badge>}
                            {isFinished && (
                              <div className="text-xs font-mono font-bold">
                                {m.set1Team1}-{m.set1Team2} / {m.set2Team1}-{m.set2Team2}
                                {((m.set3Team1 || 0) > 0 || (m.set3Team2 || 0) > 0) && <> / {m.set3Team1}-{m.set3Team2}</>}
                              </div>
                            )}
                            {!isLive && !isFinished && (
                              <Badge variant="outline" className="text-xs">Agendado</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {bracketSorted.length > 0 && (
                <div className="space-y-3">
                  <h3 className="section-subtitle flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" /> Fase Eliminatoria
                  </h3>
                  <div className="space-y-2">
                    {bracketSorted.map((m: Match) => {
                      const t1 = teams?.find((t: Team) => t.id === m.team1Id);
                      const t2 = teams?.find((t: Team) => t.id === m.team2Id);
                      const isFinished = m.status === "finalizado";
                      const isLive = m.status === "em_andamento";
                      return (
                        <div key={m.id} className={`match-row flex items-center gap-3 p-3 rounded-md border bg-card ${isLive ? "ring-2 ring-red-400 border-red-200 shadow-md" : ""} ${isFinished ? "opacity-70" : ""}`} data-testid={`row-sequence-${m.id}`}>
                          <div className="w-10 h-10 rounded-md bg-amber-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                            {m.matchNumber || "---"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="team-name text-sm truncate">{t1?.name || "A definir"}</span>
                              <span className="text-muted-foreground text-xs font-medium">vs</span>
                              <span className="team-name text-sm truncate">{t2?.name || "A definir"}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {stageLabels[m.stage] || m.stage} - Quadra {m.courtNumber}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            {isLive && <Badge variant="destructive" className="animate-pulse">AO VIVO</Badge>}
                            {isFinished && (
                              <div className="text-xs font-mono font-bold">
                                {m.set1Team1}-{m.set1Team2} / {m.set2Team1}-{m.set2Team2}
                                {((m.set3Team1 || 0) > 0 || (m.set3Team2 || 0) > 0) && <> / {m.set3Team1}-{m.set3Team2}</>}
                              </div>
                            )}
                            {!isLive && !isFinished && (
                              <Badge variant="outline" className="text-xs">{stageLabels[m.stage]}</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {bracketSorted.length > 0 && (
                <BracketTree matches={matches || []} teams={teams || []} />
              )}

              {(matches || []).length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <ListOrdered className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p>Nenhum jogo agendado ainda.</p>
                    <p className="text-xs mt-1">A sequencia dos jogos aparecera aqui quando o organizador gerar as partidas.</p>
                  </CardContent>
                </Card>
              )}
            </>
          );
        })()}
      </TabsContent>

      <TabsContent value="jogos" className="space-y-8">
        {liveMatches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h3 className="section-subtitle" data-testid="text-live-title">Ao Vivo</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((m: Match) => (
                <MatchCard key={m.id} match={m} team1={teams?.find((t: Team) => t.id === m.team1Id)} team2={teams?.find((t: Team) => t.id === m.team2Id)} />
              ))}
            </div>
          </div>
        )}

        {nextMatches.length > 0 && liveMatches.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="section-subtitle">Proximos Jogos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nextMatches.map((m: Match) => (
                <MatchCard key={m.id} match={m} team1={teams?.find((t: Team) => t.id === m.team1Id)} team2={teams?.find((t: Team) => t.id === m.team2Id)} />
              ))}
            </div>
          </div>
        )}

        {roundNumbers.length > 0 && (
          <div className="space-y-6">
            <h3 className="section-subtitle flex items-center gap-2">
              <Swords className="w-5 h-5 text-primary" /> Fase de Grupos
            </h3>
            {roundNumbers.map(roundNum => (
              <div key={roundNum}>
                <h4 className="font-bold mb-3 text-primary" style={{ fontFamily: 'var(--font-display)' }} data-testid={`text-public-round-${roundNum}`}>Rodada {roundNum}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roundMap[roundNum].map((m: Match) => (
                    <MatchCard key={m.id} match={m} team1={teams?.find((t: Team) => t.id === m.team1Id)} team2={teams?.find((t: Team) => t.id === m.team2Id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {bracketMatches.length > 0 && (
          <div className="space-y-4">
            <h3 className="section-subtitle flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Fase Eliminatoria
            </h3>
            {["quartas", "semifinal", "terceiro", "final"].map(stage => {
              const stageMatches = bracketMatches.filter((m: Match) => m.stage === stage);
              if (stageMatches.length === 0) return null;
              return (
                <div key={stage}>
                  <h4 className="font-bold mb-3 text-primary" style={{ fontFamily: 'var(--font-display)' }}>{stageLabels[stage]}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stageMatches.map((m: Match) => (
                      <MatchCard key={m.id} match={m} team1={teams?.find((t: Team) => t.id === m.team1Id)} team2={teams?.find((t: Team) => t.id === m.team2Id)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(matches || []).length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Swords className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p>Nenhum jogo agendado ainda.</p>
              <p className="text-xs mt-1">Os jogos aparecerão aqui quando o organizador gerar as partidas.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="classificacao" className="space-y-4">
        {standings && Object.keys(standings).length > 0 ? (
          Object.entries(standings).map(([groupName, groupTeams]: [string, any]) => (
            <Card key={groupName} data-testid={`card-standings-${groupName}`}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  {groupName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Dupla</th>
                        <th className="p-2 text-center">V</th>
                        <th className="p-2 text-center">D</th>
                        <th className="p-2 text-center">Sets</th>
                        <th className="p-2 text-center">Saldo Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupTeams.map((t: Team, idx: number) => (
                        <tr key={t.id} className={`border-t ${idx < 2 ? "bg-green-50/50 dark:bg-green-950/20" : ""}`} data-testid={`row-standing-${t.id}`}>
                          <td className="p-2 font-bold text-muted-foreground">{idx + 1}</td>
                          <td className="p-2 team-name text-sm">{t.name}</td>
                          <td className="p-2 text-center text-green-600 font-semibold">{t.groupWins || 0}</td>
                          <td className="p-2 text-center text-red-500">{t.groupLosses || 0}</td>
                          <td className="p-2 text-center text-muted-foreground">{t.setsWon || 0}/{t.setsLost || 0}</td>
                          <td className="p-2 text-center font-medium">{(t.pointsScored || 0) - (t.pointsConceded || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Classificacao ainda nao disponivel.</CardContent></Card>
        )}
      </TabsContent>

      <TabsContent value="duplas">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams?.map((t: Team) => (
            <Card key={t.id} className="card-hover" data-testid={`card-team-${t.id}`}>
              <CardContent className="p-5">
                <div className="team-name-lg">{t.name}</div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {t.seed && <Badge variant="secondary" className="text-xs">Cab. {t.seed}</Badge>}
                  {t.groupName && <Badge variant="outline" className="text-xs">{t.groupName}</Badge>}
                  {(t.groupWins || 0) > 0 && (
                    <Badge variant="outline" className="text-xs text-green-600">{t.groupWins}V {t.groupLosses}D</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {teams?.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Nenhuma dupla inscrita.</p>}
        </div>
      </TabsContent>
    </Tabs>
  );
}
