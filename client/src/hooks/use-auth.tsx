import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: (Omit<User, "password">) | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
  isAuthenticated: boolean;
  loginMutation: ReturnType<typeof useLoginMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function useLoginMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Falha no login");
      }
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({ title: "Bem-vindo!", description: `Conectado como ${user.name}` });
    },
    onError: (error: Error) => {
      toast({ title: "Erro no login", description: error.message, variant: "destructive" });
    },
  });
}

function useLogoutMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({ title: "Desconectado", description: "Até logo!" });
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Falha ao buscar usuário");
      return await res.json();
    },
  });

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAdmin: user?.role === "admin",
        isOrganizer: user?.role === "organizer",
        isAuthenticated: !!user,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
