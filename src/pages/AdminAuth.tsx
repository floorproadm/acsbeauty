import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAndRedirect = async (userId: string) => {
      const { data: isAdmin } = await supabase
        .rpc("has_role", { _user_id: userId, _role: "admin_owner" });

      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setTimeout(() => {
          checkAndRedirect(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      toast({ title: "Bem-vindo(a)!", description: "Login realizado com sucesso." });
    } catch (error: any) {
      const message = String(error?.message || "").toLowerCase();
      const isInvalidCredentials = message.includes("invalid login credentials");

      toast({
        title: "Erro",
        description: isInvalidCredentials
          ? "Conta admin não encontrada ou senha incorreta. Se for primeiro acesso, use 'Criar conta admin'."
          : (error?.message || "Não foi possível fazer login."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdminAccount = async () => {
    if (!email || !password) {
      toast({
        title: "Dados obrigatórios",
        description: "Preencha e-mail e senha para criar a conta admin.",
        variant: "destructive",
      });
      return;
    }

    setCreatingAccount(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) {
        const msg = String(signUpError.message || "").toLowerCase();

        if (msg.includes("user already registered")) {
          toast({
            title: "Conta já existe",
            description: "Esta conta admin já existe. Faça login com sua senha.",
            variant: "destructive",
          });
          return;
        }

        throw signUpError;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

      if (loginError) {
        toast({
          title: "Conta criada",
          description: "Conta criada. Se necessário, confirme o e-mail e depois faça login.",
        });
        return;
      }

      toast({ title: "Conta criada!", description: "Acesso admin liberado com sucesso." });
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta admin",
        description: error?.message || "Não foi possível criar a conta.",
        variant: "destructive",
      });
    } finally {
      setCreatingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-2xl shadow-soft border border-border">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold">Acesso Administrativo</h1>
            <p className="text-muted-foreground text-sm mt-1">Área restrita — apenas administradores</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={loading || creatingAccount}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Entrar
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCreateAdminAccount}
                disabled={loading || creatingAccount}
              >
                {creatingAccount && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar conta admin (primeiro acesso)
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

