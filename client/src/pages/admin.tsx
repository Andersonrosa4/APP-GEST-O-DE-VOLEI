import { useAuth } from "@/hooks/use-auth";
import { Link, Route, Switch, useRoute, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutShell } from "@/components/layout-shell";
import {
  Loader2, Plus, Trash2, Calendar, MapPin, Trophy, UserPlus, Swords, BarChart3, KeyRound, ArrowLeft, Shuffle, Grid3X3, Wand2, Waves, Pencil, Check, X
} from "lucide-react";
import { useTournaments, useCreateTournament, useDeleteTournament, useCategories, useCreateCategory } from "@/hooks/use-tournaments";
import { useTeams, useCreateTeam, useDeleteTeam, useMatches, useDrawGroups, useGenerateMatches, useGenerateBracket, useBracketPreview, useUpdateMatch, useUpdateTeam, useStandings, useLiveMatchUpdates, useGenerateTeams } from "@/hooks/use-matches";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MatchCard } from "@/components/match-card";
import { BracketTree, ChampionBanner } from "@/components/bracket-tree";
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
          <h1 className="text-3xl font-bold" data-testid="text-admin-title">Painel Administrativo</h1>
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
          {(orgList as any[])?.map((org: any) => (
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
          {(orgList as any[])?.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum organizador cadastrado.</p>}
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [catOpen, setCatOpen] = useState(false);
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
            <h1 className="text-2xl font-bold" data-testid="text-tournament-title">{currentTournament.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{currentTournament.location}</span>
              <Badge variant="outline">{statusLabels[currentTournament.status]}</Badge>
              {currentTournament.code && (
                <Badge variant="secondary" className="font-mono tracking-wider" data-testid="badge-tournament-code">
                  <KeyRound className="w-3 h-3 mr-1" />
                  {currentTournament.code}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="categorias">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="categorias" data-testid="tab-categories">Categorias</TabsTrigger>
          <TabsTrigger value="duplas" data-testid="tab-teams">Duplas & Chaves</TabsTrigger>
          <TabsTrigger value="jogos" data-testid="tab-matches">Jogos & Placar</TabsTrigger>
          <TabsTrigger value="sequencia" data-testid="tab-sequence">Sequencia de Jogos</TabsTrigger>
          <TabsTrigger value="codigos" data-testid="tab-codes">Codigos de Acesso</TabsTrigger>
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

        <TabsContent value="duplas">
          <TeamsAndGroupsTab
            tournamentId={tournamentId}
            categories={categories}
            selectedCategoryId={activeCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </TabsContent>

        <TabsContent value="jogos">
          <MatchesTab
            tournamentId={tournamentId}
            categories={categories}
            selectedCategoryId={activeCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </TabsContent>

        <TabsContent value="sequencia">
          <SequenceTab
            tournamentId={tournamentId}
            categories={categories}
            selectedCategoryId={activeCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </TabsContent>

        <TabsContent value="codigos">
          <AthleteCodesTab
            tournamentId={tournamentId}
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

function TeamsAndGroupsTab({ tournamentId, categories, selectedCategoryId, onSelectCategory }: any) {
  if (!categories || categories.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Crie uma categoria primeiro.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Duplas & Chaves</h2>
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
        <CategoryTeamsAndGroups categoryId={selectedCategoryId} tournamentId={tournamentId} />
      )}
    </div>
  );
}

function EditableTeamName({ team, categoryId }: { team: Team; categoryId: number }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const updateTeam = useUpdateTeam();

  const handleSave = () => {
    if (name.trim() && name.trim() !== team.name) {
      updateTeam.mutate({ id: team.id, name: name.trim() });
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setName(team.name);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          className="h-8 text-sm"
          autoFocus
          onKeyDown={e => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          data-testid={`input-edit-team-${team.id}`}
        />
        <Button variant="ghost" size="icon" onClick={handleSave} data-testid={`button-save-team-${team.id}`}>
          <Check className="w-4 h-4 text-green-600" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <X className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <span
      className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
      onClick={() => setEditing(true)}
      data-testid={`text-team-name-${team.id}`}
    >
      {team.name}
      <Pencil className="w-3 h-3 text-muted-foreground" />
    </span>
  );
}

function CategoryTeamsAndGroups({ categoryId, tournamentId }: { categoryId: number; tournamentId: number }) {
  const { data: teams, isLoading } = useTeams(categoryId);
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const drawGroups = useDrawGroups();
  const generateTeams = useGenerateTeams();
  const [teamOpen, setTeamOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [numGroups, setNumGroups] = useState("2");
  const [autoQty, setAutoQty] = useState("4");

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    await createTeam.mutateAsync({
      categoryId,
      tournamentId,
      name: teamName.trim(),
      player1Name: teamName.trim(),
      player2Name: "",
    });
    setTeamOpen(false);
    setTeamName("");
  };

  const handleDraw = async () => {
    await drawGroups.mutateAsync({ categoryId, numGroups: Number(numGroups) });
    setDrawOpen(false);
  };

  const handleAutoGenerate = async () => {
    await generateTeams.mutateAsync({ categoryId, quantity: Number(autoQty) });
  };

  const groupedTeams: Record<string, Team[]> = {};
  const ungroupedTeams: Team[] = [];
  if (teams) {
    for (const t of teams as Team[]) {
      if (t.groupName) {
        if (!groupedTeams[t.groupName]) groupedTeams[t.groupName] = [];
        groupedTeams[t.groupName].push(t);
      } else {
        ungroupedTeams.push(t);
      }
    }
  }

  const sortedGroupNames = Object.keys(groupedTeams).sort();
  const hasGroups = sortedGroupNames.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base font-bold">Gerar Duplas Automaticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5 flex-1 min-w-[120px]">
              <Label className="text-sm font-semibold">Quantidade de duplas</Label>
              <Input
                type="number"
                min={1}
                max={64}
                value={autoQty}
                onChange={e => setAutoQty(e.target.value)}
                data-testid="input-auto-qty"
              />
            </div>
            <Button
              onClick={handleAutoGenerate}
              disabled={generateTeams.isPending}
              data-testid="button-auto-generate"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {generateTeams.isPending ? "Gerando..." : "Gerar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Cria duplas numeradas automaticamente.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base font-bold">Duplas Cadastradas ({teams?.length || 0})</CardTitle>
          <div className="flex gap-2">
            <Dialog open={drawOpen} onOpenChange={setDrawOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={(teams?.length || 0) < 2} data-testid="button-draw-groups">
                  <Shuffle className="w-4 h-4 mr-2" /> Sorteio de Chaves
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Sorteio de Chaves</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Distribua as {teams?.length || 0} duplas em chaves automaticamente.
                  </p>
                  <div className="space-y-2">
                    <Label className="font-semibold">Numero de Chaves</Label>
                    <Select value={numGroups} onValueChange={setNumGroups}>
                      <SelectTrigger data-testid="select-num-groups"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: Math.min(8, Math.floor((teams?.length || 2) / 2)) }, (_, i) => i + 2).map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} Chaves</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleDraw} className="w-full" disabled={drawGroups.isPending} data-testid="button-confirm-draw">
                    {drawGroups.isPending ? "Sorteando..." : "Realizar Sorteio"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-team"><Plus className="w-4 h-4 mr-2" /> Nova Dupla</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cadastrar Dupla</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Nome da Dupla</Label>
                    <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Ex: Joao/Maria" required data-testid="input-team-name" />
                  </div>
                  <Button type="submit" className="w-full" disabled={createTeam.isPending} data-testid="button-submit-team">
                    {createTeam.isPending ? "Cadastrando..." : "Cadastrar Dupla"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (
            <>
              {hasGroups && (
                <div className="space-y-5">
                  {sortedGroupNames.map(gName => (
                    <div key={gName}>
                      <h4 className="font-bold text-sm text-primary mb-2 flex items-center gap-2">
                        <Grid3X3 className="w-4 h-4" /> {gName}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {groupedTeams[gName].map((t: Team) => (
                          <div key={t.id} className="flex items-center justify-between gap-2 p-3 border rounded-md bg-card" data-testid={`team-card-${t.id}`}>
                            <EditableTeamName team={t} categoryId={categoryId} />
                            <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0" onClick={() => deleteTeam.mutate({ id: t.id, categoryId })} data-testid={`button-delete-team-${t.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {ungroupedTeams.length > 0 && (
                <div className={hasGroups ? "mt-5 pt-5 border-t" : ""}>
                  {hasGroups && <h4 className="font-bold text-sm text-muted-foreground mb-2">Sem Chave</h4>}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {ungroupedTeams.map((t: Team) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 p-3 border rounded-md bg-card" data-testid={`team-card-${t.id}`}>
                        <EditableTeamName team={t} categoryId={categoryId} />
                        <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0" onClick={() => deleteTeam.mutate({ id: t.id, categoryId })} data-testid={`button-delete-team-${t.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(teams?.length || 0) === 0 && (
                <div className="text-center py-8">
                  <Waves className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma dupla cadastrada.</p>
                  <p className="text-xs text-muted-foreground mt-1">Use "Gerar Duplas Automaticas" acima ou cadastre manualmente.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MatchesTab({ tournamentId, categories, selectedCategoryId, onSelectCategory }: any) {
  if (!categories || categories.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Crie uma categoria primeiro.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Jogos & Placar</h2>
        <div className="w-[200px]">
          <Select value={selectedCategoryId?.toString()} onValueChange={(v) => onSelectCategory(Number(v))}>
            <SelectTrigger data-testid="select-match-category"><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
            <SelectContent>
              {categories?.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCategoryId && (
        <CategoryMatchesManager categoryId={selectedCategoryId} />
      )}
    </div>
  );
}

function CategoryMatchesManager({ categoryId }: { categoryId: number }) {
  const { data: teams, isLoading: loadingTeams } = useTeams(categoryId);
  const { data: matches, isLoading: loadingMatches } = useMatches(categoryId);
  const { data: standings } = useStandings(categoryId);
  const generateMatches = useGenerateMatches();
  const generateBracket = useGenerateBracket();
  const bracketPreview = useBracketPreview();
  const updateMatch = useUpdateMatch();
  useLiveMatchUpdates(categoryId);

  const [scoreOpen, setScoreOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [viewMode, setViewMode] = useState<"sequencia" | "rodadas">("sequencia");
  const [bracketDialogOpen, setBracketDialogOpen] = useState(false);
  const [qualifyPerGroup, setQualifyPerGroup] = useState(2);
  const [qualifyByIndex, setQualifyByIndex] = useState(0);

  const groupMatches = matches?.filter((m: Match) => m.stage === "grupo") || [];
  const bracketMatches = matches?.filter((m: Match) => m.stage !== "grupo") || [];

  const allGroupFinished = groupMatches.length > 0 && groupMatches.every((m: Match) => m.status === "finalizado");

  const roundMap: Record<number, Match[]> = {};
  for (const m of groupMatches) {
    const r = m.roundNumber || 1;
    if (!roundMap[r]) roundMap[r] = [];
    roundMap[r].push(m);
  }
  const roundNumbers = Object.keys(roundMap).map(Number).sort((a, b) => a - b);

  const allSorted = [...(matches || [])].sort((a: Match, b: Match) => (a.matchNumber || 999) - (b.matchNumber || 999) || a.id - b.id);

  return (
    <div className="space-y-6">
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
          onClick={() => {
            setQualifyPerGroup(2);
            setQualifyByIndex(0);
            bracketPreview.reset();
            setBracketDialogOpen(true);
          }}
          disabled={generateBracket.isPending || !allGroupFinished}
          data-testid="button-generate-bracket"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          {generateBracket.isPending ? "Gerando..." : "Gerar Fase Eliminatória"}
        </Button>
      </div>

      {standings && Object.keys(standings).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Classificação por Chave</CardTitle></CardHeader>
          <CardContent>
            {Object.entries(standings).map(([groupName, groupTeams]: [string, any]) => (
              <div key={groupName} className="mb-4">
                <h4 className="font-semibold text-sm text-primary mb-2">{groupName}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Dupla</th>
                        <th className="p-2 text-center">V</th>
                        <th className="p-2 text-center">D</th>
                        <th className="p-2 text-center">Saldo Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupTeams.map((t: Team, idx: number) => (
                        <tr key={t.id} className={`border-t ${idx < 2 ? "bg-green-50/50 dark:bg-green-950/20" : ""}`}>
                          <td className="p-2 text-muted-foreground font-bold">{idx + 1}</td>
                          <td className="p-2 font-medium">{t.name}</td>
                          <td className="p-2 text-center text-green-600 font-semibold">{t.groupWins || 0}</td>
                          <td className="p-2 text-center text-red-500">{t.groupLosses || 0}</td>
                          <td className="p-2 text-center">{(t.pointsScored || 0) - (t.pointsConceded || 0)}</td>
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

      {(matches || []).length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "sequencia" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("sequencia")}
            data-testid="button-view-sequence"
          >
            Sequencia
          </Button>
          <Button
            variant={viewMode === "rodadas" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("rodadas")}
            data-testid="button-view-rounds"
          >
            Por Rodada
          </Button>
        </div>
      )}

      {viewMode === "sequencia" && allSorted.length > 0 && (
        <div className="space-y-2">
          {allSorted.map((m: Match) => {
            const t1 = teams?.find((t: Team) => t.id === m.team1Id);
            const t2 = teams?.find((t: Team) => t.id === m.team2Id);
            const isFinished = m.status === "finalizado";
            const isLive = m.status === "em_andamento";
            const isBracket = m.stage !== "grupo";
            const stageLabel: Record<string, string> = { quartas: "QF", semifinal: "SF", final: "Final", terceiro: "3o" };
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-md border bg-card cursor-pointer ${isLive ? "ring-2 ring-red-400 border-red-200" : ""} ${isFinished ? "opacity-70" : ""}`}
                onClick={() => { setEditingMatch(m); setScoreOpen(true); }}
                data-testid={`row-admin-seq-${m.id}`}
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0 ${isBracket ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"}`}>
                  {m.matchNumber || "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{t1?.name || "A definir"}</span>
                    <span className="text-muted-foreground text-xs">vs</span>
                    <span className="font-semibold text-sm truncate">{t2?.name || "A definir"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    {m.groupName && <span className="text-primary font-medium">{m.groupName}</span>}
                    {isBracket && <span className="text-amber-600 font-medium">{stageLabel[m.stage] || m.stage}</span>}
                    <span>Q{m.courtNumber}</span>
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
      )}

      {viewMode === "rodadas" && roundNumbers.length > 0 && (
        <div className="space-y-6">
          <h3 className="font-bold text-lg">Fase de Grupos</h3>
          {roundNumbers.map(roundNum => (
            <div key={roundNum}>
              <h4 className="font-semibold mb-3 text-primary" data-testid={`text-round-${roundNum}`}>Rodada {roundNum}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roundMap[roundNum].map((m: Match) => {
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
          ))}
        </div>
      )}

      {viewMode === "rodadas" && bracketMatches.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-3">Fase Eliminatória</h3>
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

      {bracketMatches.length > 0 && (
        <BracketTree
          matches={matches || []}
          teams={teams || []}
          onMatchClick={(m) => { setEditingMatch(m); setScoreOpen(true); }}
        />
      )}

      <Dialog open={bracketDialogOpen} onOpenChange={setBracketDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Configurar Fase Eliminatória</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Classificados por chave</Label>
                <Select value={qualifyPerGroup.toString()} onValueChange={(v) => { setQualifyPerGroup(Number(v)); bracketPreview.reset(); }}>
                  <SelectTrigger data-testid="select-qualify-per-group"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 por chave</SelectItem>
                    <SelectItem value="2">2 por chave</SelectItem>
                    <SelectItem value="3">3 por chave</SelectItem>
                    <SelectItem value="4">4 por chave</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Melhores colocados de cada chave avancam direto</p>
              </div>
              <div className="space-y-2">
                <Label>Classificados por indice</Label>
                <Select value={qualifyByIndex.toString()} onValueChange={(v) => { setQualifyByIndex(Number(v)); bracketPreview.reset(); }}>
                  <SelectTrigger data-testid="select-qualify-by-index"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nenhum</SelectItem>
                    <SelectItem value="1">1 melhor restante</SelectItem>
                    <SelectItem value="2">2 melhores restantes</SelectItem>
                    <SelectItem value="3">3 melhores restantes</SelectItem>
                    <SelectItem value="4">4 melhores restantes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Melhores nao-classificados entre todas as chaves (vitorias, saldo sets, saldo pontos)</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => bracketPreview.mutate({ categoryId, qualifyPerGroup, qualifyByIndex })}
              disabled={bracketPreview.isPending}
              data-testid="button-preview-bracket"
            >
              {bracketPreview.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
              Visualizar Classificados
            </Button>

            {bracketPreview.data && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="secondary">{bracketPreview.data.qualified.length} classificados</Badge>
                    <Badge variant="outline">{bracketPreview.data.numGroups} chaves</Badge>
                    <Badge variant="outline">{bracketPreview.data.totalTeams} duplas total</Badge>
                  </div>

                  <div className="space-y-2">
                    {bracketPreview.data.qualified
                      .filter((q: any) => q.qualifiedBy === "group")
                      .sort((a: any, b: any) => a.group.localeCompare(b.group) || a.position - b.position)
                      .map((q: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm" data-testid={`text-qualified-group-${i}`}>
                          <Badge variant="default" className="text-xs">{q.group}</Badge>
                          <span className="text-muted-foreground">#{q.position}</span>
                          <span className="font-medium">{q.teamName}</span>
                          <span className="text-muted-foreground text-xs">({q.wins}V, SD:{q.setDiff > 0 ? "+" : ""}{q.setDiff}, SP:{q.pointDiff > 0 ? "+" : ""}{q.pointDiff})</span>
                        </div>
                      ))}

                    {bracketPreview.data.qualified.filter((q: any) => q.qualifiedBy === "index").length > 0 && (
                      <>
                        <div className="border-t pt-2 mt-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Classificados por Indice (melhores restantes)</p>
                        </div>
                        {bracketPreview.data.qualified
                          .filter((q: any) => q.qualifiedBy === "index")
                          .map((q: any, i: number) => (
                            <div key={`idx-${i}`} className="flex items-center gap-2 text-sm" data-testid={`text-qualified-index-${i}`}>
                              <Badge variant="outline" className="text-xs">{q.group}</Badge>
                              <span className="text-muted-foreground">#{q.position}</span>
                              <span className="font-medium">{q.teamName}</span>
                              <span className="text-muted-foreground text-xs">({q.wins}V, SD:{q.setDiff > 0 ? "+" : ""}{q.setDiff}, SP:{q.pointDiff > 0 ? "+" : ""}{q.pointDiff})</span>
                            </div>
                          ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full"
              onClick={() => {
                generateBracket.mutate({ categoryId, qualifyPerGroup, qualifyByIndex });
                setBracketDialogOpen(false);
              }}
              disabled={generateBracket.isPending}
              data-testid="button-confirm-bracket"
            >
              <Trophy className="w-4 h-4 mr-2" />
              {generateBracket.isPending ? "Gerando..." : "Confirmar e Gerar Chave"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

  const set1Filled = s1s1 > 0 && s1s2 > 0;
  const set2Filled = s2s1 > 0 && s2s2 > 0;
  const set3Filled = s3s1 > 0 && s3s2 > 0;
  const set1Partial = (s1s1 > 0) !== (s1s2 > 0);
  const set2Partial = (s2s1 > 0) !== (s2s2 > 0);
  const set3Partial = (s3s1 > 0) !== (s3s2 > 0);
  const hasPartial = set1Partial || set2Partial || set3Partial;
  const hasGap = (!set1Filled && set2Filled) || (!set2Filled && set3Filled && !set1Filled) || (set1Filled && !set2Filled && set3Filled);

  const t1SetsWon = (set1Filled && s1s1 > s1s2 ? 1 : 0) + (set2Filled && s2s1 > s2s2 ? 1 : 0) + (set3Filled && s3s1 > s3s2 ? 1 : 0);
  const t2SetsWon = (set1Filled && s1s2 > s1s1 ? 1 : 0) + (set2Filled && s2s2 > s2s1 ? 1 : 0) + (set3Filled && s3s2 > s3s1 ? 1 : 0);

  const filledCount = (set1Filled ? 1 : 0) + (set2Filled ? 1 : 0) + (set3Filled ? 1 : 0);
  const hasAnyScores = filledCount > 0 || set1Partial || set2Partial || set3Partial;
  const isTied = filledCount > 0 && t1SetsWon === t2SetsWon;

  let winnerId = null;
  if (filledCount > 0 && !isTied && !hasPartial && !hasGap) {
    winnerId = t1SetsWon > t2SetsWon ? match.team1Id : match.team2Id;
  }

  const autoFinalize = winnerId !== null;

  const handleSave = () => {
    const finalStatus = autoFinalize ? "finalizado" : (hasAnyScores ? "finalizado" : "agendado");
    onSave({
      set1Team1: s1s1, set1Team2: s1s2,
      set2Team1: s2s1, set2Team2: s2s2,
      set3Team1: s3s1, set3Team2: s3s2,
      status: finalStatus,
      winnerId: autoFinalize ? winnerId : null,
    });
  };

  const setIndicator = (a: number, b: number) => {
    if (a === 0 && b === 0) return "";
    return a > b ? "text-green-600 font-bold" : "text-red-500";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-3 bg-muted/50 rounded-md">
          <div className="font-bold text-sm truncate" data-testid="text-score-team1">{team1?.name || "A definir"}</div>
          <div className="text-2xl font-bold mt-1 text-primary">{t1SetsWon}</div>
        </div>
        <div className="p-3 bg-muted/50 rounded-md">
          <div className="font-bold text-sm truncate" data-testid="text-score-team2">{team2?.name || "A definir"}</div>
          <div className="text-2xl font-bold mt-1 text-primary">{t2SetsWon}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3 items-center">
          <div className="text-center">
            <Label className="text-xs text-muted-foreground">Set 1</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" min={0} max={99} className={`w-14 text-center ${setIndicator(s1s1, s1s2)}`} value={s1s1} onChange={e => setS1s1(Number(e.target.value))} data-testid="input-s1t1" />
              <span className="text-muted-foreground text-xs">x</span>
              <Input type="number" min={0} max={99} className={`w-14 text-center ${setIndicator(s1s2, s1s1)}`} value={s1s2} onChange={e => setS1s2(Number(e.target.value))} data-testid="input-s1t2" />
            </div>
          </div>
          <div className="text-center">
            <Label className="text-xs text-muted-foreground">Set 2</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" min={0} max={99} className={`w-14 text-center ${setIndicator(s2s1, s2s2)}`} value={s2s1} onChange={e => setS2s1(Number(e.target.value))} data-testid="input-s2t1" />
              <span className="text-muted-foreground text-xs">x</span>
              <Input type="number" min={0} max={99} className={`w-14 text-center ${setIndicator(s2s2, s2s1)}`} value={s2s2} onChange={e => setS2s2(Number(e.target.value))} data-testid="input-s2t2" />
            </div>
          </div>
          <div className="text-center">
            <Label className="text-xs text-muted-foreground">Set 3 (opc.)</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input type="number" min={0} max={99} className={`w-14 text-center ${setIndicator(s3s1, s3s2)}`} value={s3s1} onChange={e => setS3s1(Number(e.target.value))} data-testid="input-s3t1" />
              <span className="text-muted-foreground text-xs">x</span>
              <Input type="number" min={0} max={99} className={`w-14 text-center ${setIndicator(s3s2, s3s1)}`} value={s3s2} onChange={e => setS3s2(Number(e.target.value))} data-testid="input-s3t2" />
            </div>
          </div>
        </div>
      </div>

      {winnerId && (
        <div className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm p-3 rounded-md text-center font-semibold" data-testid="text-winner-display">
          <Trophy className="w-4 h-4 inline mr-1" />
          Vencedor: {winnerId === match.team1Id ? team1?.name : team2?.name} ({t1SetsWon > t2SetsWon ? t1SetsWon : t2SetsWon}x{t1SetsWon > t2SetsWon ? t2SetsWon : t1SetsWon})
        </div>
      )}

      {!winnerId && hasAnyScores && (hasPartial || hasGap || isTied) && (
        <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm p-3 rounded-md text-center font-medium">
          {hasPartial ? "Preencha o placar de ambas as duplas em cada set." :
           hasGap ? "Preencha os sets em ordem sequencial." :
           "Empate em sets! Preencha mais um set para definir o vencedor."}
        </div>
      )}

      <Button onClick={handleSave} className="w-full" disabled={hasAnyScores && !autoFinalize} data-testid="button-save-score">
        {autoFinalize ? "Salvar e Finalizar" : "Salvar Placar"}
      </Button>
    </div>
  );
}

function AthleteCodesTab({ tournamentId, open, setOpen }: any) {
  const [athleteName, setAthleteName] = useState("");
  const { toast } = useToast();

  const { data: codes, isLoading: loading, refetch: loadCodes } = useQuery({
    queryKey: ["/api/tournaments", tournamentId, "athlete-codes"],
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
          {((codes as any[]) || []).map((c: any) => (
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
          {(!codes || (codes as any[]).length === 0) && <p className="col-span-full text-center text-muted-foreground py-8">Nenhum codigo gerado.</p>}
        </div>
      )}
    </div>
  );
}

function SequenceTab({ tournamentId, categories, selectedCategoryId, onSelectCategory }: any) {
  if (!categories || categories.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Crie uma categoria primeiro.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Sequencia de Jogos</h2>
        <div className="w-[200px]">
          <Select value={selectedCategoryId?.toString()} onValueChange={(v) => onSelectCategory(Number(v))}>
            <SelectTrigger data-testid="select-sequence-category"><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
            <SelectContent>
              {categories?.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCategoryId && (
        <CategorySequenceView categoryId={selectedCategoryId} />
      )}
    </div>
  );
}

function CategorySequenceView({ categoryId }: { categoryId: number }) {
  const { data: teams, isLoading: loadingTeams } = useTeams(categoryId);
  const { data: matches, isLoading: loadingMatches } = useMatches(categoryId);
  const updateMatch = useUpdateMatch();
  useLiveMatchUpdates(categoryId);

  const [scoreOpen, setScoreOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  if (loadingTeams || loadingMatches) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const allSorted = [...(matches || [])].sort((a: Match, b: Match) => (a.matchNumber || 999) - (b.matchNumber || 999) || a.id - b.id);
  const groupSorted = allSorted.filter((m: Match) => m.stage === "grupo");
  const bracketSorted = allSorted.filter((m: Match) => m.stage !== "grupo");

  const nextMatch = allSorted.find((m: Match) => m.status === "agendado");
  const liveMatches = allSorted.filter((m: Match) => m.status === "em_andamento");

  const stageLabel: Record<string, string> = { quartas: "QF", semifinal: "SF", final: "Final", terceiro: "3o" };

  return (
    <div className="space-y-6">
      {liveMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h3 className="font-bold text-lg">Ao Vivo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {liveMatches.map((m: Match) => {
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

      {nextMatch && !liveMatches.length && (
        <Card className="border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">Proximo Jogo</span>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-md border bg-card cursor-pointer hover-elevate"
              onClick={() => { setEditingMatch(nextMatch); setScoreOpen(true); }}
            >
              <div className={`w-10 h-10 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0 ${nextMatch.stage !== "grupo" ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"}`}>
                {nextMatch.matchNumber || "—"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{teams?.find((t: Team) => t.id === nextMatch.team1Id)?.name || "A definir"}</span>
                  <span className="text-muted-foreground text-xs">vs</span>
                  <span className="font-semibold text-sm">{teams?.find((t: Team) => t.id === nextMatch.team2Id)?.name || "A definir"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  {nextMatch.groupName && <span className="text-primary font-medium">{nextMatch.groupName}</span>}
                  {nextMatch.stage !== "grupo" && <span className="text-amber-600 font-medium">{stageLabel[nextMatch.stage] || nextMatch.stage}</span>}
                  <span>Quadra {nextMatch.courtNumber}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">Agendado</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {allSorted.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-base mb-3">Todos os Jogos</h3>
          {allSorted.map((m: Match) => {
            const t1 = teams?.find((t: Team) => t.id === m.team1Id);
            const t2 = teams?.find((t: Team) => t.id === m.team2Id);
            const isFinished = m.status === "finalizado";
            const isLive = m.status === "em_andamento";
            const isBracket = m.stage !== "grupo";
            const isNext = m.id === nextMatch?.id;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md border bg-card cursor-pointer",
                  isLive && "ring-2 ring-red-400 border-red-200",
                  isFinished && "opacity-70",
                  isNext && !isLive && "border-primary/50 bg-primary/5",
                )}
                onClick={() => { setEditingMatch(m); setScoreOpen(true); }}
                data-testid={`row-seq-${m.id}`}
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0 ${isBracket ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"}`}>
                  {m.matchNumber || "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{t1?.name || "A definir"}</span>
                    <span className="text-muted-foreground text-xs">vs</span>
                    <span className="font-semibold text-sm truncate">{t2?.name || "A definir"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    {m.groupName && <span className="text-primary font-medium">{m.groupName}</span>}
                    {isBracket && <span className="text-amber-600 font-medium">{stageLabel[m.stage] || m.stage}</span>}
                    <span>Q{m.courtNumber}</span>
                    {m.roundNumber && <span>R{m.roundNumber}</span>}
                    {m.stage && <span>{m.stage === "grupo" ? "Fase de Grupos" : stageLabel[m.stage] || m.stage}</span>}
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
                    <Badge variant="outline" className="text-xs">{isNext ? "Proximo" : "Agendado"}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {bracketSorted.length > 0 && (
        <BracketTree
          matches={matches || []}
          teams={teams || []}
          onMatchClick={(m) => { setEditingMatch(m); setScoreOpen(true); }}
        />
      )}

      {allSorted.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Swords className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p>Nenhum jogo gerado ainda.</p>
            <p className="text-xs mt-1">Vá para a aba "Jogos & Placar" para gerar as partidas.</p>
          </CardContent>
        </Card>
      )}

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
