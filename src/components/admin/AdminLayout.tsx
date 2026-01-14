import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  LogOut,
  LayoutDashboard,
  Calendar,
  Users,
  Sparkles,
  Tag,
  Megaphone,
  HelpCircle,
  UserCheck,
  Menu,
  ChevronLeft,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type AdminTab =
  | "dashboard"
  | "bookings"
  | "clients"
  | "leads"
  | "services"
  | "offers"
  | "campaigns"
  | "quizzes";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "bookings", label: "Agendamentos", icon: Calendar },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "leads", label: "Leads", icon: UserCheck },
  { id: "services", label: "Serviços", icon: Sparkles },
  { id: "offers", label: "Ofertas", icon: Tag },
  { id: "campaigns", label: "Campanhas", icon: Megaphone },
  { id: "quizzes", label: "Quizzes", icon: HelpCircle },
];

function AdminSidebar({
  activeTab,
  onTabChange,
  user,
  onSignOut,
}: {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  user: User | null;
  onSignOut: () => void;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-gold to-rose-gold/70 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight">
                ACS <span className="text-rose-gold">BEAUTY</span>
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1">
                Painel Administrativo
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator />

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {tabs.map((tab) => (
                <SidebarMenuItem key={tab.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(tab.id)}
                    isActive={activeTab === tab.id}
                    tooltip={tab.label}
                    className={cn(
                      "transition-all",
                      activeTab === tab.id &&
                        "bg-rose-light text-rose-gold hover:bg-rose-light hover:text-rose-gold"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto">
        <Separator className="mb-4" />
        {!isCollapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="outline"
          size={isCollapsed ? "icon" : "default"}
          onClick={onSignOut}
          className="w-full justify-start"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminHeader() {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 sticky top-0 z-40">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex-1" />
    </header>
  );
}

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: roleData, error } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin_owner",
      });

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          user={user}
          onSignOut={handleSignOut}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
