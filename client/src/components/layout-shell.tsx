import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trophy, LogOut, Menu, User, LayoutDashboard, Calendar, Volleyball } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isPublic = !location.startsWith("/admin");

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-ocean-gradient p-2 rounded-lg text-white group-hover:scale-105 transition-transform">
              <Volleyball className="h-6 w-6" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">
              Sand<span className="text-primary">Court</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/" && "text-primary")}>
              Tournaments
            </Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                {(user.role === "admin" || user.role === "organizer") && (
                  <Link href="/admin">
                    <Button variant={location.startsWith("/admin") ? "secondary" : "ghost"} size="sm">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-100 px-3 py-1.5 rounded-full">
                  <User className="h-4 w-4" />
                  {user.username}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => logoutMutation.mutate()} 
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-medium">Tournaments</Link>
                  {user ? (
                    <>
                      {(user.role === "admin" || user.role === "organizer") && (
                        <Link href="/admin" className="text-lg font-medium">Dashboard</Link>
                      )}
                      <Button onClick={() => logoutMutation.mutate()} variant="destructive" className="w-full justify-start">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="outline" className="w-full">Login</Button>
                      </Link>
                      <Link href="/register">
                        <Button className="w-full">Register</Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SandCourt Manager. Built for the beach.</p>
        </div>
      </footer>
    </div>
  );
}
