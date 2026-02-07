import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTeam, type Match } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

// === Teams ===
export function useTeams(categoryId: number) {
  return useQuery({
    queryKey: [api.teams.list.path, categoryId],
    queryFn: async () => {
      const url = buildUrl(api.teams.list.path, { categoryId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return api.teams.list.responses[200].parse(await res.json());
    },
    enabled: !!categoryId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTeam) => {
      const res = await fetch(api.teams.create.path, {
        method: api.teams.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create team");
      return api.teams.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.teams.list.path, data.categoryId] });
      toast({ title: "Team Registered", description: "Good luck!" });
    },
  });
}

export function useApproveTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.teams.approve.path, { id });
      const res = await fetch(url, { method: api.teams.approve.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to approve team");
      return api.teams.approve.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.teams.list.path, data.categoryId] });
      toast({ title: "Team Approved", description: "Team is now in the tournament." });
    },
  });
}

// === Matches ===
export function useMatches(categoryId: number) {
  return useQuery({
    queryKey: [api.matches.list.path, categoryId],
    queryFn: async () => {
      const url = buildUrl(api.matches.list.path, { categoryId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch matches");
      return api.matches.list.responses[200].parse(await res.json());
    },
    enabled: !!categoryId,
  });
}

export function useGenerateMatches() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categoryId: number) => {
      const url = buildUrl(api.matches.generate.path, { categoryId });
      const res = await fetch(url, { method: api.matches.generate.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to generate matches");
      return api.matches.generate.responses[201].parse(await res.json());
    },
    onSuccess: (matches) => {
      if (matches.length > 0) {
        queryClient.invalidateQueries({ queryKey: [api.matches.list.path, matches[0].categoryId] });
        toast({ title: "Bracket Generated", description: `${matches.length} matches scheduled.` });
      }
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<Match>) => {
      const url = buildUrl(api.matches.update.path, { id });
      const res = await fetch(url, {
        method: api.matches.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update match");
      return api.matches.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.matches.list.path, data.categoryId] });
      // Optimistic updates are handled by the query cache via setQueryData if we wanted to be fancy,
      // but invalidation is safer for now.
    },
  });
}

// === WebSocket for Live Scores ===
// (Simple implementation assuming ws at protocol://host/ws)
export function useLiveMatchUpdates(categoryId?: number) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws`);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "MATCH_UPDATE") {
          const updatedMatch = message.payload;
          
          // Only update if it pertains to our view or if we want global updates
          if (!categoryId || updatedMatch.categoryId === categoryId) {
             queryClient.setQueryData(
              [api.matches.list.path, updatedMatch.categoryId],
              (oldData: Match[] | undefined) => {
                if (!oldData) return [updatedMatch];
                return oldData.map((m) => (m.id === updatedMatch.id ? updatedMatch : m));
              }
            );
          }
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [queryClient, categoryId]);

  return isConnected;
}
