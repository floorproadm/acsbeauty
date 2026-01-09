import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

type AuthMode = "login" | "forgot-password";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAndRedirect = async (userId: string) => {
      const { data: isAdmin } = await supabase
        .rpc('has_role', { _user_id: userId, _role: 'admin_owner' });
      
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Bem-vindo de volta!", description: "Login realizado com sucesso." });
      } else if (mode === "forgot-password") {
        const redirectUrl = `${window.location.origin}/auth`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });
        if (error) throw error;
        toast({ 
          title: "Email enviado!", 
          description: "Verifique sua caixa de entrada para redefinir sua senha." 
        });
        setMode("login");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Bem-vindo de Volta";
      case "forgot-password": return "Recuperar Senha";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "login": return "Entre para gerenciar seus agendamentos";
      case "forgot-password": return "Digite seu email para receber o link de recuperação";
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case "login": return "Entrar";
      case "forgot-password": return "Enviar Link";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <div className="flex items-center justify-center min-h-screen pt-24 px-6">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-elevated p-8">
            {mode === "forgot-password" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-rose-gold transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </button>
            )}

            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl font-bold mb-2">
                {getTitle()}
              </h1>
              <p className="text-muted-foreground">
                {getSubtitle()}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              {mode !== "forgot-password" && (
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
                      minLength={6}
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
              )}

              {mode === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode("forgot-password")}
                    className="text-sm text-muted-foreground hover:text-rose-gold transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {getButtonText()}
              </Button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
