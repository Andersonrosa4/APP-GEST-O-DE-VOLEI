import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import AthleteAccessPage from "@/pages/athlete-access";
import AdminPage from "@/pages/admin";
import TournamentDetailsPage from "@/pages/tournament-details";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/atleta" component={AthleteAccessPage} />
      <Route path="/torneio/:id" component={TournamentDetailsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/torneio/:id" component={AdminPage} />
      <Route path="/admin/organizadores" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
