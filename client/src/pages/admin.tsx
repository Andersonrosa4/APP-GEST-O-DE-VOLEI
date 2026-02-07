import { useAuth } from "@/hooks/use-auth";
import { Link, Route, Switch, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutShell } from "@/components/layout-shell";
import {
  Loader2, Plus, Trash2, Calendar, MapPin, Trophy, Users, UserPlus, Swords, BarChart3, KeyRound, ArrowLeft
} from "lucide-react";
import { useTournaments, useCreateTournament, useDeleteTournament, useCategories, useCreateCategory, useAthletes, useCreateAthlete } from "@/hooks/use-tournaments";
import { useTeams, useCreateTeam, useMatches, useGenerateMatches, useGenerateBracket, useUpdateMatch, useStandings, useLiveMatchUpdates } from "@/hooks/use-matches";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MatchCard } from "@/components/match-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Match, Team } from "@shared/schema";

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  finalizado: "Finalizado",
};

export default function AdminPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login");
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!isAuthenticated) return null;

  return (
    <LayoutShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/torneio/:id" component={AdminTournamentDetail} />
          <Route path="/admin/organizadores" component={AdminOrganizers} />
        </Switch>
      </div>
    </LayoutShell>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const { data: tournaments, isLoading } = useTournaments();
  const deleteTournament = useDeleteTournament();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie seus torneios e campeonatos.</p>
        </div>
        <div className="flex gap-2">
          {user?.role === "admin" && (
            <Link href="/admin/organizadores">
              <Button variant="outline" data-testid="button-manage-organizers">
                <UserPlus className="w-4 h-4 mr-2" /> Organizadores
              </Button>
            </Link>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-tournament"><Plus className="w-4 h-4 mr-2" /> Novo Torneio</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader><DialogTitle>Criar Torneio</DialogTitle></DialogHeader>
              <CreateTournamentForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="grid gap-4">
          {tournaments?.map((t: any) => (
            <Card key={t.id} data-testid={`card-admin-tournament-${t.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-md flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/torneio/${t.id}`}>
                      <h3 className="font-bold text-lg hover:text-primary cursor-pointer truncate" data-testid={`link-tournament-${t.id}`}>{t.name}</h3>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(t.startDate), "dd MMM yyyy", { locale: ptBR })}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.location}</span>
                      <Badge variant="outline">{statusLabels[t.status]}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/torneio/${t.id}`}>
                    <Button variant="outline" size="sm" data-testid={`button-manage-${t.id}`}>Gerenciar</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja excluir este torneio?")) {
                        deleteTournament.mutate(t.id);
                      }
                    }}
                    data-testid={`button-delete-${t.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {tournaments?.length === 0 && (
            <Card><CardContent className="p-12 text-center text-muted-foreground">Nenhum torneio criado ainda.</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}

function CreateTournamentForm({ onSuccess }: { onSuccess: () => void }) {
  const createTournament = useCreateTournament();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [courts, setCourts] = useState("2");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTournament.mutateAsync({
      name, location, description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      courts: Number(courts),
      status: "rascunho",
      setsPerMatch: 3,
      pointsPerSet: 21,
      pointsTiebreak: 15,
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Torneio</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Copa Verão 2025" required data-testid="input-tournament-name" />
      </div>
      <div className="space-y-2">
        <Label>Local</Label>
        <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Praia de Copacabana" required data-testid="input-tournament-location" />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição do torneio..." data-testid="input-tournament-description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data Início</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required data-testid="input-start-date" />
        </div>
        <div className="space-y-2">
          <Label>Data Fim</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required data-testid="input-end-date" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Número de Quadras</Label>
        <Input type="number" min={1} max={20} value={courts} onChange={e => setCourts(e.target.value)} data-testid="input-courts" />
      </div>
      <Button type="submit" className="w-full" disabled={createTournament.isPending} data-testid="button-submit-tournament">
        {createTournament.isPending ? "Criando..." : "Criar Torneio"}
      </Button>
    </form>
  );
}

function AdminOrganizers() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const { data: orgList, isLoading: orgLoading, refetch } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("POST", "/api/users", { name, username, password, role: "organizer" });
      toast({ title: "Organizador criado", description: `${name} adicionado com sucesso.` });
      setOpen(false);
      setName(""); setUsername(""); setPassword("");
      refetch();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este organizador?")) return;
    try {
      await apiRequest("DELETE", `/api/users/${id}`);
      toast({ title: "Removido", description: "Organizador removido." });
      refetch();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">Organizadores</h1>
            <p className="text-muted-foreground text-sm">Gerencie os organizadores do sistema</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-organizer"><UserPlus className="w-4 h-4 mr-2" /> Novo Organizador</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Organizador</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" required data-testid="input-org-name" />
              </div>
              <div className="space-y-2">
                <Label>Usuário</Label>
                <Input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="nome.usuario" required data-testid="input-org-username" />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" required data-testid="input-org-password" />
              </div>
              <Button type="submit" className="w-full" data-testid="button-submit-organizer">Criar Organizador</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {orgLoading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="grid gap-3">
          {orgList?.map((org: any) => (
            <Card key={org.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{org.name}</div>
                  <div className="text-sm text-muted-foreground">{org.username}</div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(org.id)} data-testid={`button-delete-org-${org.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {orgList?.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum organizador cadastrado.</p>}
        </div>
      )}
    </div>
  );
}

function AdminTournamentDetail() {
  const [, params] = useRoute("/admin/torneio/:id");
  const tournamentId = Number(params?.id);
  const { data: tournament, isLoading } = useTournaments();
  const currentTournament = tournament?.find((t: any) => t.id === tournamentId);
  const { data: categories, isLoading: loadingCats } = useCategories(tournamentId);
  const { data: athletes, isLoading: loadingAthletes } = useAthletes(tournamentId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [athleteOpen, setAthleteOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
  if (!currentTournament) return <div className="text-center py-12">Torneio não encontrado</div>;

  const activeCategoryId = selectedCategoryId || categories?.[0]?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">{currentTournament.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{currentTournament.location}</span>
              <Badge variant="outline">{statusLabels[currentTournament.status]}</Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="categorias">
        <TabsList className="mb-6">
          <TabsTrigger value="categorias" data-testid="tab-categories">Categorias</TabsTrigger>
          <TabsTrigger value="atletas" data-testid="tab-athletes">Atletas</TabsTrigger>
          <TabsTrigger value="duplas" data-testid="tab-teams">Duplas & Jogos</TabsTrigger>
          <TabsTrigger value="codigos" data-testid="tab-codes">Códigos de Acesso</TabsTrigger>
        </TabsList>

        <TabsContent value="categorias">
          <CategoriesTab
            tournamentId={tournamentId}
            categories={categories}
            loading={loadingCats}
            open={catOpen}
            setOpen={setCatOpen}
          />
        </TabsContent>

        <TabsContent value="atletas">
          <AthletesTab
            tournamentId={tournamentId}
            athletes={athletes}
            loading={loadingAthletes}
            open={athleteOpen}
            setOpen={setAthleteOpen}
          />
        </TabsContent>

        <TabsContent value="duplas">
          <TeamsAndMatchesTab
            tournamentId={tournamentId}
            categories={categories}
            athletes={athletes}
            selectedCategoryId={activeCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </TabsContent>

        <TabsContent value="codigos">
          <AthleteCodesTab
            tournamentId={tournamentId}
            athletes={athletes}
            open={codeOpen}
            setOpen={setCodeOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoriesTab({ tournamentId, categories, loading, open, setOpen }: any) {
  const createCategory = useCreateCategory();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("masculino");
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCategory.mutateAsync({ tournamentId, name, gender, maxTeams: 32 });
    setOpen(false);
    setName("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover esta categoria?")) return;
    await apiRequest("DELETE", `/api/categories/${id}`);
    queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournamentId, "categories"] });
    toast({ title: "Removida", description: "Categoria removida." });
  };

  const genderLabels: Record<string, string> = { masculino: "Masculino", feminino: "Feminino", misto: "Misto" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Categorias</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-category"><Plus className="w-4 h-4 mr-2" /> Nova Categoria</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Categoria</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Categoria</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Masculino Pro" required data-testid="input-category-name" />
              </div>
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger data-testid="select-gender"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createCategory.isPending} data-testid="button-submit-category">
                {createCategory.isPending ? "Criando..." : "Criar Categoria"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="grid gap-3">
          {categories?.map((cat: any) => (
            <Card key={cat.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold">{cat.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">({genderLabels[cat.gender]})</span>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cat.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {categories?.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma categoria cadastrada.</p>}
        </div>
      )}
    </div>
  );
}

function AthletesTab({ tournamentId, athletes, loading, open, setOpen }: any) {
  const createAthlete = useCreateAthlete();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAthlete.mutateAsync({ name, email: email || null, phone: phone || null, tournamentId });
    setOpen(false);
    setName(""); setEmail(""); setPhone("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este atleta?")) return;
    await apiRequest("DELETE", `/api/athletes/${id}`);
    queryClient.invalidateQueries({ queryKey: ["/api/tournaments", tournamentId, "athletes"] });
    toast({ title: "Removido", description: "Atleta removido." });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Atletas ({athletes?.length || 0})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-athlete"><Plus className="w-4 h-4 mr-2" /> Novo Atleta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Atleta</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Atleta</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" required data-testid="input-athlete-name" />
              </div>
              <div className="space-y-2">
                <Label>Email (opcional)</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="atleta@email.com" data-testid="input-athlete-email" />
              </div>
              <div className="space-y-2">
                <Label>Telefone (opcional)</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" data-testid="input-athlete-phone" />
              </div>
              <Button type="submit" className="w-full" disabled={createAthlete.isPending} data-testid="button-submit-athlete">
                {createAthlete.isPending ? "Cadastrando..." : "Cadastrar Atleta"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {athletes?.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{a.name}</div>
                  {a.email && <div className="text-xs text-muted-foreground">{a.email}</div>}
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {athletes?.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Nenhum atleta cadastrado.</p>}
        </div>
      )}
    </div>
  );
}

function TeamsAndMatchesTab({ tournamentId, categories, athletes, selectedCategoryId, onSelectCategory }: any) {
  const [teamOpen, setTeamOpen] = useState(false);

  if (!categories || categories.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Crie uma categoria primeiro.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Duplas & Jogos</h2>
        <div className="w-[200px]">
          <Select value={selectedCategoryId?.toString()} onValueChange={(v) => onSelectCategory(Number(v))}>
            <SelectTrigger data-testid="select-category"><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
            <SelectContent>
              {categories?.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCategoryId && (
        <CategoryTeamsMatches
          categoryId={selectedCategoryId}
          athletes={athletes}
          teamOpen={teamOpen}
          setTeamOpen={setTeamOpen}
        />
      )}
    </div>
  );
}

function CategoryTeamsMatches({ categoryId, athletes, teamOpen, setTeamOpen }: any) {
  const { data: teams, isLoading: loadingTeams } = useTeams(categoryId);
  const { data: matches, isLoading: loadingMatches } = useMatches(categoryId);
  const { data: standings } = useStandings(categoryId);
  const generateMatches = useGenerateMatches();
  const generateBracket = useGenerateBracket();
  const updateMatch = useUpdateMatch();
  const createTeam = useCreateTeam();
  const { toast } = useToast();
  useLiveMatchUpdates(categoryId);

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [seed, setSeed] = useState("");
  const [scoreOpen, setScoreOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const player1 = athletes?.find((a: any) => a.id === Number(p1));
    const player2 = athletes?.find((a: any) => a.id === Number(p2));
    if (!player1 || !player2) return;
    if (p1 === p2) { toast({ title: "Erro", description: "Selecione dois atletas diferentes", variant: "destructive" }); return; }

    await createTeam.mutateAsync({
      categoryId,
      name: `${player1.name.split(" ")[0]}/${player2.name.split(" ")[0]}`,
      player1Id: player1.id,
      player2Id: player2.id,
      player1Name: player1.name,
      player2Name: player2.name,
      seed: seed ? Number(seed) : null,
    });
    setTeamOpen(false);
    setP1(""); setP2(""); setSeed("");
  };

  const groupMatches = matches?.filter((m: Match) => m.stage === "grupo") || [];
  const bracketMatches = matches?.filter((m: Match) => m.stage !== "grupo") || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Duplas ({teams?.length || 0})</CardTitle>
          <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-team"><Plus className="w-4 h-4 mr-2" /> Nova Dupla</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar Dupla</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label>Jogador 1</Label>
                  <Select value={p1} onValueChange={setP1}>
                    <SelectTrigger data-testid="select-player1"><SelectValue placeholder="Selecionar atleta" /></SelectTrigger>
                    <SelectContent>
                      {athletes?.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Jogador 2</Label>
                  <Select value={p2} onValueChange={setP2}>
                    <SelectTrigger data-testid="select-player2"><SelectValue placeholder="Selecionar atleta" /></SelectTrigger>
                    <SelectContent>
                      {athletes?.filter((a: any) => a.id.toString() !== p1).map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cabeça de Chave (opcional)</Label>
                  <Input type="number" min={1} value={seed} onChange={e => setSeed(e.target.value)} placeholder="Ex: 1" data-testid="input-seed" />
                </div>
                <Button type="submit" className="w-full" disabled={createTeam.isPending} data-testid="button-submit-team">
                  {createTeam.isPending ? "Cadastrando..." : "Cadastrar Dupla"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loadingTeams ? <Loader2 className="animate-spin mx-auto" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {teams?.map((t: Team) => (
                <div key={t.id} className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
                  <div>
                    <span className="font-semibold">{t.name}</span>
                    {t.seed && <Badge variant="secondary" className="ml-2 text-xs">Cab. {t.seed}</Badge>}
                    {t.groupName && <Badge variant="outline" className="ml-2 text-xs">{t.groupName}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.groupWins || 0}V / {t.groupLosses || 0}D
                  </div>
                </div>
              ))}
              {teams?.length === 0 && <p className="col-span-full text-center text-muted-foreground py-4">Nenhuma dupla cadastrada.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => generateMatches.mutate(categoryId)}
          disabled={generateMatches.isPending || (teams?.length || 0) < 2}
          data-testid="button-generate-matches"
        >
          <Swords className="w-4 h-4 mr-2" />
          {generateMatches.isPending ? "Gerando..." : "Gerar Jogos (Grupos)"}
        </Button>
        <Button
          variant="outline"
          onClick={() => generateBracket.mutate(categoryId)}
          disabled={generateBracket.isPending}
          data-testid="button-generate-bracket"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          {generateBracket.isPending ? "Gerando..." : "Gerar Fase Eliminatória"}
        </Button>
      </div>

      {/* Standings */}
      {standings && Object.keys(standings).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Classificação</CardTitle></CardHeader>
          <CardContent>
            {Object.entries(standings).map(([groupName, groupTeams]: [string, any]) => (
              <div key={groupName} className="mb-4">
                <h4 className="font-semibold text-sm text-primary mb-2">{groupName}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Dupla</th>
                        <th className="p-2 text-center">V</th>
                        <th className="p-2 text-center">D</th>
                        <th className="p-2 text-center">Sets</th>
                        <th className="p-2 text-center">Pontos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupTeams.map((t: Team, idx: number) => (
                        <tr key={t.id} className="border-t">
                          <td className="p-2 text-muted-foreground font-bold">{idx + 1}</td>
                          <td className="p-2 font-medium">{t.name}</td>
                          <td className="p-2 text-center text-green-600 font-semibold">{t.groupWins || 0}</td>
                          <td className="p-2 text-center text-red-500">{t.groupLosses || 0}</td>
                          <td className="p-2 text-center">{t.setsWon || 0}/{t.setsLost || 0}</td>
                          <td className="p-2 text-center">{t.pointsScored || 0}/{t.pointsConceded || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Group Matches */}
      {groupMatches.length > 0 && (
        <div>
          <h3 className="font-bold mb-3">Fase de Grupos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupMatches.map((m: Match) => {
              const t1 = teams?.find((t: Team) => t.id === m.team1Id);
              const t2 = teams?.find((t: Team) => t.id === m.team2Id);
              return (
                <div key={m.id} className="cursor-pointer" onClick={() => { setEditingMatch(m); setScoreOpen(true); }}>
                  <MatchCard match={m} team1={t1} team2={t2} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bracket Matches */}
      {bracketMatches.length > 0 && (
        <div>
          <h3 className="font-bold mb-3">Fase Eliminatória</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bracketMatches.map((m: Match) => {
              const t1 = teams?.find((t: Team) => t.id === m.team1Id);
              const t2 = teams?.find((t: Team) => t.id === m.team2Id);
              return (
                <div key={m.id} className="cursor-pointer" onClick={() => { setEditingMatch(m); setScoreOpen(true); }}>
                  <MatchCard match={m} team1={t1} team2={t2} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score Dialog */}
      <Dialog open={scoreOpen} onOpenChange={setScoreOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader><DialogTitle>Atualizar Placar</DialogTitle></DialogHeader>
          {editingMatch && (
            <ScoreEditor
              match={editingMatch}
              team1={teams?.find((t: Team) => t.id === editingMatch.team1Id)}
              team2={teams?.find((t: Team) => t.id === editingMatch.team2Id)}
              onSave={(updates) => {
                updateMatch.mutate({ id: editingMatch.id, ...updates });
                setScoreOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScoreEditor({ match, team1, team2, onSave }: { match: Match; team1?: Team; team2?: Team; onSave: (u: any) => void }) {
  const [s1s1, setS1s1] = useState(match.set1Team1 || 0);
  const [s1s2, setS1s2] = useState(match.set1Team2 || 0);
  const [s2s1, setS2s1] = useState(match.set2Team1 || 0);
  const [s2s2, setS2s2] = useState(match.set2Team2 || 0);
  const [s3s1, setS3s1] = useState(match.set3Team1 || 0);
  const [s3s2, setS3s2] = useState(match.set3Team2 || 0);
  const [status, setStatus] = useState(match.status);

  const t1SetsWon = (s1s1 > s1s2 ? 1 : 0) + (s2s1 > s2s2 ? 1 : 0) + (s3s1 > s3s2 ? 1 : 0);
  const t2SetsWon = (s1s2 > s1s1 ? 1 : 0) + (s2s2 > s2s1 ? 1 : 0) + (s3s2 > s3s1 ? 1 : 0);

  let winnerId = null;
  if (t1SetsWon >= 2) winnerId = match.team1Id;
  else if (t2SetsWon >= 2) winnerId = match.team2Id;

  const handleSave = () => {
    onSave({
      set1Team1: s1s1, set1Team2: s1s2,
      set2Team1: s2s1, set2Team2: s2s2,
      set3Team1: s3s1, set3Team2: s3s2,
      status,
      winnerId: status === "finalizado" ? winnerId : null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]" data-testid="select-match-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="p-2 text-left">Dupla</th>
              <th className="p-2 text-center">Set 1</th>
              <th className="p-2 text-center">Set 2</th>
              <th className="p-2 text-center">Set 3</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-2 font-semibold">{team1?.name || "Dupla 1"}</td>
              <td className="p-2"><Input type="number" min={0} max={99} className="w-16 text-center mx-auto" value={s1s1} onChange={e => setS1s1(Number(e.target.value))} data-testid="input-s1t1" /></td>
              <td className="p-2"><Input type="number" min={0} max={99} className="w-16 text-center mx-auto" value={s2s1} onChange={e => setS2s1(Number(e.target.value))} data-testid="input-s2t1" /></td>
              <td className="p-2"><Input type="number" min={0} max={99} className="w-16 text-center mx-auto" value={s3s1} onChange={e => setS3s1(Number(e.target.value))} data-testid="input-s3t1" /></td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-semibold">{team2?.name || "Dupla 2"}</td>
              <td className="p-2"><Input type="number" min={0} max={99} className="w-16 text-center mx-auto" value={s1s2} onChange={e => setS1s2(Number(e.target.value))} data-testid="input-s1t2" /></td>
              <td className="p-2"><Input type="number" min={0} max={99} className="w-16 text-center mx-auto" value={s2s2} onChange={e => setS2s2(Number(e.target.value))} data-testid="input-s2t2" /></td>
              <td className="p-2"><Input type="number" min={0} max={99} className="w-16 text-center mx-auto" value={s3s2} onChange={e => setS3s2(Number(e.target.value))} data-testid="input-s3t2" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {winnerId && status === "finalizado" && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md text-center font-semibold">
          Vencedor: {winnerId === match.team1Id ? team1?.name : team2?.name} ({t1SetsWon > t2SetsWon ? t1SetsWon : t2SetsWon}x{t1SetsWon > t2SetsWon ? t2SetsWon : t1SetsWon})
        </div>
      )}

      <Button onClick={handleSave} className="w-full" data-testid="button-save-score">
        Salvar Placar
      </Button>
    </div>
  );
}

function AthleteCodesTab({ tournamentId, athletes, open, setOpen }: any) {
  const [athleteName, setAthleteName] = useState("");
  const { toast } = useToast();

  const { data: codes, isLoading: loading, refetch: loadCodes } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "athlete-codes"],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}/athlete-codes`, { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!tournamentId,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("POST", "/api/athlete-codes", { athleteName, tournamentId });
      toast({ title: "Código gerado", description: "Código de acesso criado." });
      setOpen(false);
      setAthleteName("");
      loadCodes();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Códigos de Acesso para Atletas</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-code"><KeyRound className="w-4 h-4 mr-2" /> Gerar Código</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Gerar Código de Acesso</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Atleta</Label>
                <Input value={athleteName} onChange={e => setAthleteName(e.target.value)} placeholder="Nome do atleta" required data-testid="input-code-athlete-name" />
              </div>
              <Button type="submit" className="w-full" data-testid="button-submit-code">Gerar Código</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        Os atletas podem usar estes códigos de 4 dígitos para acessar informações do torneio sem precisar de login.
      </p>

      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(codes || []).map((c: any) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{c.athleteName}</div>
                  <div className="text-3xl font-bold tracking-[0.3em] text-primary">{c.code}</div>
                </div>
                <KeyRound className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
          {(!codes || codes.length === 0) && <p className="col-span-full text-center text-muted-foreground py-8">Nenhum código gerado.</p>}
        </div>
      )}
    </div>
  );
}
