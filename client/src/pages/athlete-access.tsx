import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Waves, ArrowRight, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AthleteAccessPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/athlete-access", { code });
      const data = await res.json();
      if (data.tournament) {
        navigate(`/torneio/${data.tournament.id}`);
      }
    } catch {
      setError("Codigo invalido. Verifique com o organizador do torneio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl" />
      <Card className="w-full max-w-md relative z-10 shadow-2xl">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-16 h-16 bg-sunset-gradient rounded-full flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-athlete-title">Acesso do Atleta</CardTitle>
          <p className="text-muted-foreground text-sm">
            Digite o codigo de 4 digitos do torneio para acompanhar jogos, resultados e classificacao em tempo real.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md font-medium" data-testid="text-athlete-error">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code" className="font-semibold">Codigo do Torneio</Label>
              <Input
                id="code"
                type="text"
                maxLength={4}
                placeholder="0000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="text-center text-3xl tracking-[0.5em] font-bold"
                required
                data-testid="input-athlete-code"
              />
            </div>
            <Button type="submit" className="w-full" disabled={code.length !== 4 || loading} data-testid="button-athlete-access">
              {loading ? "Verificando..." : "Acessar Torneio"}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              O codigo de acesso e fornecido pelo organizador do torneio.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
