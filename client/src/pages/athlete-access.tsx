import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AthleteAccessPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await apiRequest("POST", "/api/athlete-access", { code });
      const data = await res.json();
      if (data.tournament) {
        navigate(`/torneio/${data.tournament.id}`);
      }
    } catch {
      setError("Código inválido. Verifique com o organizador.");
    }
  };

  return (
    <div className="min-h-screen bg-ocean-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="text-2xl">Acesso do Atleta</CardTitle>
          <p className="text-muted-foreground text-sm">
            Digite o código de 4 dígitos fornecido pelo organizador
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md" data-testid="text-athlete-error">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">Código de Acesso</Label>
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
            <Button type="submit" className="w-full" disabled={code.length !== 4} data-testid="button-athlete-access">
              Acessar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
