import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut, Menu, User, LayoutDashboard, KeyRound, Waves } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation, isAuthenticated } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <header className="sticky top-0 z-[100] w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-ocean-gradient p-2 rounded-md text-white shadow-md">
              <Waves className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-base tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                V<span className="text-primary">o</span>lei de Praia
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Torneios</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                size="sm"
                data-testid="button-nav-tournaments"
              >
                Torneios
              </Button>
            </Link>
            <Link href="/atleta">
              <Button
                variant={location === "/atleta" ? "secondary" : "ghost"}
                size="sm"
                data-testid="button-nav-athlete"
              >
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                Acesso Atleta
              </Button>
            </Link>

            <div className="w-px h-6 bg-border mx-2" />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/admin">
                  <Button variant={location.startsWith("/admin") ? "default" : "outline"} size="sm" data-testid="button-nav-admin">
                    <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                    Painel
                  </Button>
                </Link>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md" data-testid="text-user-name">
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
              <Link href="/login">
                <Button size="sm" data-testid="button-nav-login">Entrar</Button>
              </Link>
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
                  <Link href="/" className="text-lg font-semibold">Torneios</Link>
                  <Link href="/atleta" className="text-lg font-semibold">Acesso Atleta</Link>
                  {isAuthenticated ? (
                    <>
                      <Link href="/admin" className="text-lg font-semibold">Painel Admin</Link>
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

      <footer className="border-t bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Waves className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>Volei de Praia</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Gerenciamento de Torneios de Volei de Praia
          </p>
        </div>
      </footer>
    </div>
  );
}
