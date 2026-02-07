import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trophy, LogOut, Menu, User, LayoutDashboard, KeyRound } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation, isAuthenticated } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-ocean-gradient p-1.5 rounded-md text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              Beach<span className="text-primary">Manager</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link href="/" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/" && "text-primary")}>
              Torneios
            </Link>
            <Link href="/atleta" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/atleta" && "text-primary")}>
              Acesso Atleta
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/admin">
                  <Button variant={location.startsWith("/admin") ? "default" : "outline"} size="sm" data-testid="button-nav-admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Painel
                  </Button>
                </Link>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-slate-100 px-3 py-1 rounded-full" data-testid="text-user-name">
                  <User className="h-3.5 w-3.5" />
                  {user?.name}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logoutMutation.mutate()}
                  title="Sair"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button size="sm" data-testid="button-nav-login">Entrar</Button>
                </Link>
              </div>
            )}
          </nav>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-medium">Torneios</Link>
                  <Link href="/atleta" className="text-lg font-medium">Acesso Atleta</Link>
                  {isAuthenticated ? (
                    <>
                      <Link href="/admin" className="text-lg font-medium">Painel Admin</Link>
                      <Button onClick={() => logoutMutation.mutate()} variant="destructive" className="w-full justify-start">
                        <LogOut className="mr-2 h-4 w-4" /> Sair
                      </Button>
                    </>
                  ) : (
                    <Link href="/login">
                      <Button className="w-full">Entrar</Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Beach Manager - Gerenciamento de Torneios de Vôlei de Praia</p>
        </div>
      </footer>
    </div>
  );
}
