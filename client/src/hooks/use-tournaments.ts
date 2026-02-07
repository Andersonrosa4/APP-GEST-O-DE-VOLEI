import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useTournaments() {
  return useQuery({
    queryKey: ["/api/tournaments"],
    queryFn: async () => {
      const res = await fetch("/api/tournaments");
      if (!res.ok) throw new Error("Falha ao buscar torneios");
      return await res.json();
    },
  });
}

export function useTournament(id: number) {
  return useQuery({
    queryKey: ["/api/tournaments", id],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${id}`);
      if (!res.ok) throw new Error("Torneio não encontrado");
      return await res.json();
    },
    enabled: !!id,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/tournaments", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({ title: "Torneio criado", description: "Torneio criado com sucesso!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteTournament() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tournaments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({ title: "Removido", description: "Torneio removido com sucesso." });
    },
  });
}

export function useCategories(tournamentId: number) {
  return useQuery({
    queryKey: ["/api/tournaments", tournamentId, "categories"],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}/categories`);
      if (!res.ok) throw new Error("Falha ao buscar categorias");
      return await res.json();
    },
    enabled: !!tournamentId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", data.tournamentId, "categories"] });
      toast({ title: "Categoria criada", description: `${data.name} adicionada.` });
    },
  });
}

export function useTournamentFullData(tournamentId: number) {
  return useQuery({
    queryKey: ["/api/tournaments", tournamentId, "full-data"],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}/full-data`);
      if (!res.ok) throw new Error("Falha ao buscar dados do torneio");
      return await res.json();
    },
    enabled: !!tournamentId,
  });
}
