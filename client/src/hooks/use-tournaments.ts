import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTournament, type InsertCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// === Tournaments ===
export function useTournaments() {
  return useQuery({
    queryKey: [api.tournaments.list.path],
    queryFn: async () => {
      const res = await fetch(api.tournaments.list.path);
      if (!res.ok) throw new Error("Failed to fetch tournaments");
      return api.tournaments.list.responses[200].parse(await res.json());
    },
  });
}

export function useTournament(id: number) {
  return useQuery({
    queryKey: [api.tournaments.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.tournaments.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch tournament");
      return api.tournaments.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTournament) => {
      const res = await fetch(api.tournaments.create.path, {
        method: api.tournaments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create tournament");
      }
      return api.tournaments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tournaments.list.path] });
      toast({ title: "Tournament Created", description: "New tournament is ready for setup." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteTournament() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tournaments.delete.path, { id });
      const res = await fetch(url, { method: api.tournaments.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete tournament");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tournaments.list.path] });
      toast({ title: "Deleted", description: "Tournament has been removed." });
    },
  });
}

// === Categories ===
export function useCategories(tournamentId: number) {
  return useQuery({
    queryKey: [api.categories.list.path, tournamentId],
    queryFn: async () => {
      const url = buildUrl(api.categories.list.path, { id: tournamentId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
    enabled: !!tournamentId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCategory) => {
      const res = await fetch(api.categories.create.path, {
        method: api.categories.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create category");
      return api.categories.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate the specific tournament's category list
      queryClient.invalidateQueries({ 
        queryKey: [api.categories.list.path, data.tournamentId] 
      });
      toast({ title: "Category Added", description: `${data.name} created successfully.` });
    },
  });
}
