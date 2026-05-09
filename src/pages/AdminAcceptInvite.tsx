import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

const roleLabels: Record<string, string> = {
  admin_owner: "Administrador",
  staff: "Staff",
  marketing: "Marketing",
};

export default function AdminAcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [validating, setValidating] = useState(true);
  const [invite, setInvite] = useState<{ email: string; role: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"signup" | "signin">("signup");

  useEffect(() => {
    if (!token) {
      setError("Token de convite ausente.");
      setValidating(false);
      return;
    }
    (async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("accept-admin-invite", {
          body: { token, action: "validate" },
        });
        if (fnErr) throw fnErr;
        if (!(data as any)?.valid) {
          setError((data as any)?.error ?? "Convite inválido");
        } else {
          setInvite({ email: (data as any).email, role: (data as any).role });
        }
      } catch (e: any) {
        setError(e.message ?? "Erro ao validar convite");
      } finally {
        setValidating(false);
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setSubmitting(true);
    try {
      let authResult;
      if (mode === "signup") {
        authResult = await supabase.auth.signUp({
          email: invite.email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
      } else {
        authResult = await supabase.auth.signInWithPassword({
          email: invite.email,
          password,
        });
      }

      if (authResult.error) {
        const msg = authResult.error.message.toLowerCase();
        // Se signup falhou por já existir, tenta signin automaticamente
        if (mode === "signup" && msg.includes("already")) {
          const signin = await supabase.auth.signInWithPassword({ email: invite.email, password });
          if (signin.error) throw signin.error;
        } else {
          throw authResult.error;
        }
      }

      // Confirma o convite (server side)
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Sessão não estabelecida. Verifique a senha.");

      const { data: confirmData, error: confirmErr } = await supabase.functions.invoke("accept-admin-invite", {
        body: { token, action: "confirm" },
      });
      if (confirmErr) throw confirmErr;
      if ((confirmData as any)?.error) throw new Error((confirmData as any).error);

      toast({ title: "Acesso liberado!", description: "Bem-vindo(a) ao painel ACS." });
      navigate("/admin");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center min-h-screen px-4 py-20">
        <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-2xl shadow-soft border border-border">
          {validating ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Validando convite…</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <h1 className="font-serif text-2xl font-bold">Convite inválido</h1>
              <p className="text-muted-foreground text-sm">{error}</p>
              <p className="text-muted-foreground text-xs">
                Entre em contato com o administrador para receber um novo convite.
              </p>
            </div>
          ) : invite ? (
            <>
              <div className="text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-rose-gold mx-auto" />
                <h1 className="font-serif text-2xl font-bold">Você foi convidado(a)</h1>
                <p className="text-sm text-muted-foreground">
                  Acesso ao painel ACS como <strong>{roleLabels[invite.role] ?? invite.role}</strong>
                </p>
                <p className="text-xs text-muted-foreground">{invite.email}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={invite.email} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {mode === "signup" ? "Crie sua senha" : "Sua senha"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {mode === "signup" ? "Criar conta e aceitar convite" : "Entrar e aceitar convite"}
                </Button>

                <button
                  type="button"
                  onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                  className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
                >
                  {mode === "signup" ? "Já tenho conta — fazer login" : "Criar nova conta"}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
