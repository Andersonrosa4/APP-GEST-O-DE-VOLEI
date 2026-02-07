import { useTournaments } from "@/hooks/use-tournaments";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutShell } from "@/components/layout-shell";
import { MapPin, Calendar, ChevronRight, Trophy, KeyRound, LogIn, Loader2, Users, Waves, Sun } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  aberto: { label: "Inscricoes Abertas", variant: "default" },
  em_andamento: { label: "Em Andamento", variant: "destructive" },
  finalizado: { label: "Finalizado", variant: "outline" },
};

export default function HomePage() {
  const { data: tournaments, isLoading } = useTournaments();

  return (
    <LayoutShell>
      <section className="bg-hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 text-sm font-medium">
              <Sun className="w-4 h-4 text-amber-300" />
              Torneios de Volei de Praia
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
              Volei de Praia
            </h1>
            <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
              Sistema completo para organizacao de campeonatos de volei de praia.
              Acompanhe jogos, placares e classificacoes em tempo real.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link href="/login">
                <Button variant="secondary" size="lg" className="shadow-lg" data-testid="button-home-login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Painel Admin
                </Button>
              </Link>
              <Link href="/atleta">
                <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white shadow-lg" size="lg" data-testid="button-home-athlete">
                  <KeyRound className="w-4 h-4 mr-2" />
                  Acesso Atleta
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0,40 C360,80 720,0 1440,40 L1440,60 L0,60 Z" fill="hsl(45 40% 97%)" />
          </svg>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Torneios Disponiveis</h2>
            <p className="text-muted-foreground mt-1">Acompanhe os campeonatos em andamento</p>
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
                  <Card className="cursor-pointer card-hover group h-full" data-testid={`card-tournament-${t.id}`}>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <Badge variant={status.variant} data-testid={`badge-status-${t.id}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {t.name}
                      </h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0 text-accent" />
                          <span>{t.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0 text-primary" />
                          <span>
                            {format(new Date(t.startDate), "dd MMM yyyy", { locale: ptBR })} - {format(new Date(t.endDate), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 flex-shrink-0 text-amber-500" />
                          <span>{t.courts} quadra{t.courts > 1 ? "s" : ""}</span>
                        </div>
                        {t.code && (
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 flex-shrink-0 text-primary" />
                            <span className="font-mono font-bold tracking-wider">{t.code}</span>
                          </div>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                      )}
                      <div className="flex items-center text-sm text-primary font-semibold pt-2">
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
            <CardContent className="p-16 text-center">
              <Waves className="w-14 h-14 text-primary/30 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Nenhum torneio disponivel</h3>
              <p className="text-muted-foreground">Os torneios aparecerão aqui quando forem criados.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </LayoutShell>
  );
}
