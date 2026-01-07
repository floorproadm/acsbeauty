import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Users, Calendar, Package, Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Check if user has admin_owner role
      const { data: roleData, error } = await supabase
        .rpc('has_role', { _user_id: session.user.id, _role: 'admin_owner' });

      if (error || !roleData) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta área.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAuthorized(true);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    checkAuth();

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-rose-gold" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-serif text-2xl font-bold tracking-tight">
                ACS <span className="text-rose-gold">BEAUTY</span>
              </span>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="container mx-auto px-6 py-8">
        <h1 className="font-serif text-3xl font-bold mb-8">Painel Administrativo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quick Stats Cards */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-gold/10 rounded-lg">
                <Calendar className="w-6 h-6 text-rose-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agendamentos</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-gold/10 rounded-lg">
                <Users className="w-6 h-6 text-rose-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-gold/10 rounded-lg">
                <Package className="w-6 h-6 text-rose-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serviços</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-gold/10 rounded-lg">
                <Settings className="w-6 h-6 text-rose-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Configurações</p>
                <p className="text-2xl font-bold">→</p>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for future admin sections */}
        <div className="mt-8 bg-card rounded-xl p-8 border border-border shadow-soft">
          <h2 className="font-serif text-xl font-semibold mb-4">Bem-vindo ao Painel</h2>
          <p className="text-muted-foreground">
            Aqui você poderá gerenciar agendamentos, clientes, serviços e ofertas especiais.
          </p>
        </div>
      </main>
    </div>
  );
}
