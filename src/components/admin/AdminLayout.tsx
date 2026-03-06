import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
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
  ClipboardList,
  Layers,
  ShieldCheck,
  Gift,
  UsersRound,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
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

type AppRole = Database["public"]["Enums"]["app_role"];

export type AdminTab =
  | "dashboard"
  | "bookings"
  | "crm"
  | "services"
  | "skus"
  | "offers"
  | "quizzes"
  | "tasks"
  | "gift-cards"
  | "team"
  | "access";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  userRole?: AppRole | null;
}

const allTabs: { id: AdminTab; label: string; icon: React.ElementType; roles: AppRole[] }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin_owner"] },
  { id: "bookings", label: "Agendamentos", icon: Calendar, roles: ["admin_owner", "staff"] },
  { id: "crm", label: "CRM", icon: Users, roles: ["admin_owner", "staff"] },
  { id: "tasks", label: "Tarefas", icon: ClipboardList, roles: ["admin_owner", "staff"] },
  { id: "services", label: "Serviços", icon: Sparkles, roles: ["admin_owner"] },
  { id: "skus", label: "Opções", icon: Layers, roles: ["admin_owner"] },
  { id: "quizzes", label: "Quizzes", icon: HelpCircle, roles: ["admin_owner"] },
  { id: "gift-cards", label: "Gift Cards", icon: Gift, roles: ["admin_owner"] },
  { id: "team", label: "Equipe", icon: UsersRound, roles: ["admin_owner"] },
  { id: "access", label: "Acessos", icon: ShieldCheck, roles: ["admin_owner"] },
];

function AdminSidebar({
  activeTab,
  onTabChange,
  user,
  onSignOut,
  userRole,
}: {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  user: User | null;
  onSignOut: () => void;
  userRole: AppRole | null;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const tabs = allTabs.filter((t) => !userRole || t.roles.includes(userRole));

  // Fetch pending bookings count
  const { data: pendingCount } = useQuery({
    queryKey: ["admin-sidebar-pending"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "requested");
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  // Fetch open tasks count
  const { data: tasksCount } = useQuery({
    queryKey: ["admin-sidebar-tasks"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("status", ["todo", "in_progress"]);
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const getBadge = (tabId: AdminTab) => {
    if (tabId === "bookings" && pendingCount && pendingCount > 0) {
      return { count: pendingCount, pulse: true };
    }
    if (tabId === "tasks" && tasksCount && tasksCount > 0) {
      return { count: tasksCount, pulse: false };
    }
    return null;
  };

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
              {tabs.map((tab) => {
                const badge = getBadge(tab.id);
                return (
                  <SidebarMenuItem key={tab.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(tab.id)}
                      isActive={activeTab === tab.id}
                      tooltip={tab.label}
                      className={cn(
                        "transition-all relative",
                        activeTab === tab.id &&
                          "bg-rose-light text-rose-gold hover:bg-rose-light hover:text-rose-gold"
                      )}
                    >
                      <div className="relative">
                        <tab.icon className="w-4 h-4" />
                        {badge?.pulse && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <span className="flex-1">{tab.label}</span>
                      {badge && !isCollapsed && (
                        <span
                          className={cn(
                            "ml-auto text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full",
                            badge.pulse
                              ? "bg-red-500 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {badge.count > 99 ? "99+" : badge.count}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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

export function AdminLayout({ children, activeTab, onTabChange, userRole }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [detectedRole, setDetectedRole] = useState<AppRole | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const effectiveRole = userRole ?? detectedRole;

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

      // Check for any valid role (admin, staff, or marketing)
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .limit(1)
        .single();

      if (!roleRow) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta área.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setDetectedRole(roleRow.role as AppRole);
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
          userRole={effectiveRole}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-3 sm:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
