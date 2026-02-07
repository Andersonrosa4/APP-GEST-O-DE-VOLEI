import { useTournaments } from "@/hooks/use-tournaments";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutShell } from "@/components/layout-shell";
import { MapPin, Calendar, ArrowRight, Loader2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const { data: tournaments, isLoading } = useTournaments();

  return (
    <LayoutShell>
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-ocean-gradient opacity-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        
        <div className="container relative z-10 px-4 text-center">
          <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30 border-none px-4 py-1.5 text-sm uppercase tracking-wider backdrop-blur-sm">
            Manage your tournaments like a pro
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-slate-900 mb-6 drop-shadow-sm">
            Dominate the <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Sand</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            The ultimate platform for beach volleyball tournaments. Real-time scores, schedules, and rankings.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/tournaments">
              <Button size="lg" className="h-12 px-8 rounded-full text-lg shadow-xl shadow-primary/20 bg-primary hover:bg-blue-600 transition-all hover:scale-105">
                Find Tournaments
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-lg border-2 hover:bg-slate-50">
                Organizer Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tournaments List */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-slate-900">Active Tournaments</h2>
              <p className="text-slate-500 mt-2">Join the action happening now.</p>
            </div>
            <Link href="/tournaments">
              <Button variant="link" className="text-primary">View All <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tournaments?.map((tournament) => (
                <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                  <div className="group bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <Badge variant={tournament.status === 'open' ? 'default' : 'secondary'} className={
                        tournament.status === 'open' ? 'bg-green-500 hover:bg-green-600' : ''
                      }>
                        {tournament.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                      {tournament.name}
                    </h3>
                    
                    <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-1">
                      {tournament.description || "No description provided."}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-slate-500 border-t pt-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(tournament.startDate), "MMM d")}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {tournament.location}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              
              {tournaments?.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed">
                  <p className="text-muted-foreground">No active tournaments found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </LayoutShell>
  );
}
