import { useTournaments } from "@/hooks/use-tournaments";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutShell } from "@/components/layout-shell";
import { MapPin, Calendar, ChevronRight, Trophy, KeyRound, LogIn, Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  aberto: { label: "Inscrições Abertas", variant: "default" },
  em_andamento: { label: "Em Andamento", variant: "destructive" },
  finalizado: { label: "Finalizado", variant: "outline" },
};

export default function HomePage() {
  const { data: tournaments, isLoading } = useTournaments();

  return (
    <LayoutShell>
      <section className="bg-ocean-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
              <Trophy className="w-4 h-4" />
              Gerenciamento de Torneios
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
              Beach Manager
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Sistema completo para organização de campeonatos de vôlei de praia.
              Acompanhe jogos, placares e classificações em tempo real.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/login">
                <Button variant="secondary" size="lg" data-testid="button-home-login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Painel Admin
                </Button>
              </Link>
              <Link href="/atleta">
                <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white" size="lg" data-testid="button-home-athlete">
                  <KeyRound className="w-4 h-4 mr-2" />
                  Acesso Atleta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Torneios Disponíveis</h2>
            <p className="text-muted-foreground text-sm mt-1">Acompanhe os campeonatos em andamento</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t: any) => {
              const status = statusLabels[t.status] || statusLabels.rascunho;
              return (
                <Link key={t.id} href={`/torneio/${t.id}`}>
                  <Card className="cursor-pointer transition-all hover:shadow-lg group h-full" data-testid={`card-tournament-${t.id}`}>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <Badge variant={status.variant} data-testid={`badge-status-${t.id}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {t.name}
                      </h3>
                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{t.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {format(new Date(t.startDate), "dd MMM yyyy", { locale: ptBR })} - {format(new Date(t.endDate), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span>{t.courts} quadra{t.courts > 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      {t.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                      )}
                      <div className="flex items-center text-sm text-primary font-medium pt-2">
                        Ver detalhes <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum torneio disponível</h3>
              <p className="text-muted-foreground">Os torneios aparecerão aqui quando forem criados.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </LayoutShell>
  );
}
