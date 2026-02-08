import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { Match } from "@shared/schema";

export function useTeams(categoryId: number) {
  return useQuery({
    queryKey: ["/api/categories", categoryId, "teams"],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${categoryId}/teams`);
      if (!res.ok) throw new Error("Falha ao buscar duplas");
      return await res.json();
    },
    enabled: !!categoryId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/teams", data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", data.categoryId, "teams"] });
      toast({ title: "Dupla cadastrada", description: `${data.name} registrada.` });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, categoryId }: { id: number; categoryId: number }) => {
      await apiRequest("DELETE", `/api/teams/${id}`);
      return categoryId;
    },
    onSuccess: (categoryId: number) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", categoryId, "teams"] });
      toast({ title: "Removida", description: "Dupla removida." });
    },
  });
}

export function useGenerateTeams() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ categoryId, quantity }: { categoryId: number; quantity: number }) => {
      const res = await apiRequest("POST", `/api/categories/${categoryId}/generate-teams`, { quantity });
      return await res.json();
    },
    onSuccess: (teams: any[]) => {
      if (teams.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/categories", teams[0].categoryId, "teams"] });
        toast({ title: "Duplas geradas", description: `${teams.length} duplas criadas automaticamente.` });
      }
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useMatches(categoryId: number) {
  return useQuery({
    queryKey: ["/api/categories", categoryId, "matches"],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${categoryId}/matches`);
      if (!res.ok) throw new Error("Falha ao buscar jogos");
      return await res.json();
    },
    enabled: !!categoryId,
  });
}

export function useDrawGroups() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ categoryId, numGroups }: { categoryId: number; numGroups: number }) => {
      const res = await apiRequest("POST", `/api/categories/${categoryId}/draw-groups`, { numGroups });
      return await res.json();
    },
    onSuccess: (teams: any[]) => {
      if (teams.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/categories", teams[0].categoryId, "teams"] });
        toast({ title: "Sorteio realizado", description: "Chaves definidas com sucesso!" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useGenerateMatches() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (categoryId: number) => {
      const res = await apiRequest("POST", `/api/categories/${categoryId}/generate-matches`);
      return await res.json();
    },
    onSuccess: (matches: any[]) => {
      if (matches.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/categories", matches[0].categoryId, "matches"] });
        queryClient.invalidateQueries({ queryKey: ["/api/categories", matches[0].categoryId, "teams"] });
        toast({ title: "Jogos gerados", description: `${matches.length} jogos criados por rodada.` });
      }
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useGenerateBracket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (categoryId: number) => {
      const res = await apiRequest("POST", `/api/categories/${categoryId}/generate-bracket`);
      return await res.json();
    },
    onSuccess: (matches: any[]) => {
      if (matches.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/categories", matches[0].categoryId, "matches"] });
        toast({ title: "Chave gerada", description: "Fase eliminatória criada." });
      }
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<Match>) => {
      const res = await apiRequest("PATCH", `/api/matches/${id}`, updates);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", data.categoryId, "matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", data.categoryId, "teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", data.categoryId, "standings"] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await apiRequest("PATCH", `/api/teams/${id}`, { name });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories", data.categoryId, "teams"] });
      toast({ title: "Nome atualizado", description: `Dupla renomeada para "${data.name}".` });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useStandings(categoryId: number) {
  return useQuery({
    queryKey: ["/api/categories", categoryId, "standings"],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${categoryId}/standings`);
      if (!res.ok) throw new Error("Falha ao buscar classificação");
      return await res.json();
    },
    enabled: !!categoryId,
  });
}

export function useLiveMatchUpdates(categoryId?: number) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "MATCH_UPDATE") {
          const match = message.payload;
          if (!categoryId || match.categoryId === categoryId) {
            queryClient.invalidateQueries({ queryKey: ["/api/categories", match.categoryId, "matches"] });
            queryClient.invalidateQueries({ queryKey: ["/api/categories", match.categoryId, "teams"] });
            queryClient.invalidateQueries({ queryKey: ["/api/categories", match.categoryId, "standings"] });
          }
        }
        if (message.type === "TEAM_UPDATE") {
          const team = message.payload;
          queryClient.invalidateQueries({ queryKey: ["/api/categories", team.categoryId, "teams"] });
        }
        if (message.type === "GROUP_PHASE_COMPLETE" || message.type === "CHAMPION_DECLARED") {
          const { categoryId: catId } = message.payload;
          queryClient.invalidateQueries({ queryKey: ["/api/categories", catId, "matches"] });
          queryClient.invalidateQueries({ queryKey: ["/api/categories", catId, "teams"] });
          queryClient.invalidateQueries({ queryKey: ["/api/categories", catId, "standings"] });
        }
      } catch {}
    };

    return () => ws.close();
  }, [queryClient, categoryId]);

  return isConnected;
}
