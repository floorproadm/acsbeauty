import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, Clock, AlertCircle, CheckCircle2, Loader2, ListTodo, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminTab } from "./AdminLayout";
import { BirthdayWidget } from "./BirthdayWidget";
import { StaffPerformanceWidget } from "./StaffPerformanceWidget";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface DashboardTabProps {
  onNavigate: (tab: AdminTab) => void;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142, 76%, 36%)",
  "hsl(217, 91%, 60%)",
  "hsl(280, 67%, 53%)",
];

export function DashboardTab({ onNavigate }: DashboardTabProps) {
  const today = new Date();
  const todayStart = startOfDay(today).toISOString();
  const todayEnd = endOfDay(today).toISOString();
  const monthStart = startOfMonth(today).toISOString();
  const monthEnd = endOfMonth(today).toISOString();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Current user name
  const { data: userName } = useQuery({
    queryKey: ["admin-user-name"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("staff_profiles")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.name || user.email?.split("@")[0] || "Admin";
    },
  });

  // Today's bookings
  const { data: todayBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["admin-today-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .gte("start_time", todayStart)
        .lte("start_time", todayEnd)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Total clients
  const { data: clientsCount, isLoading: loadingClients } = useQuery({
    queryKey: ["admin-clients-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Pending bookings
  const { data: pendingBookings, isLoading: loadingPending } = useQuery({
    queryKey: ["admin-pending-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "requested")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Pending tasks
  const { data: pendingTasksCount, isLoading: loadingTasks } = useQuery({
    queryKey: ["admin-pending-tasks-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("status", ["todo", "in_progress"]);
      if (error) throw error;
      return count || 0;
    },
  });

  // Monthly revenue data
  const { data: monthlyStats, isLoading: loadingMonthly } = useQuery({
    queryKey: ["admin-monthly-stats", monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, total_price, status, service_id, services(name)")
        .gte("start_time", monthStart)
        .lte("start_time", monthEnd)
        .in("status", ["confirmed", "completed"]);
      if (error) throw error;

      const totalRevenue = (data || []).reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
      const totalBookings = data?.length || 0;

      // Top services by booking count
      const serviceCounts: Record<string, { name: string; count: number }> = {};
      for (const b of data || []) {
        const svcName = (b.services as any)?.name || "Consulta";
        if (!serviceCounts[svcName]) serviceCounts[svcName] = { name: svcName, count: 0 };
        serviceCounts[svcName].count++;
      }
      const topServices = Object.values(serviceCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return { totalRevenue, totalBookings, topServices };
    },
  });

  // Confirm booking mutation
  const confirmBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await supabase.functions.invoke("calendar-confirm-booking", {
        body: { booking_id: bookingId },
      });
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Erro desconhecido");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-today-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sidebar-pending"] });
      toast({ title: "Agendamento confirmado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao confirmar", description: error.message, variant: "destructive" });
    },
  });

  const confirmedToday = todayBookings?.filter(b => b.status === "confirmed").length || 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, duration: 0.3, ease: "easeOut" as const },
    }),
  };

  return (
    <div className="space-y-6">
      {/* Header with Greeting */}
      <div>
        <h1 className="font-serif text-xl sm:text-2xl font-bold">
          {getGreeting()}{userName ? `, ${userName}` : ""} ✨
        </h1>
        <p className="text-muted-foreground text-sm">
          {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Calendar, iconBg: "bg-rose-gold/10", iconColor: "text-rose-gold",
            label: "Hoje", value: todayBookings?.length || 0, loading: loadingBookings,
            onClick: () => onNavigate("bookings"),
          },
          {
            icon: CheckCircle2, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600",
            label: "Confirmados", value: confirmedToday, loading: loadingBookings,
            onClick: () => onNavigate("bookings"),
          },
          {
            icon: Users, iconBg: "bg-blue-500/10", iconColor: "text-blue-600",
            label: "Clientes", value: clientsCount, loading: loadingClients,
            onClick: () => onNavigate("crm"),
          },
          {
            icon: ListTodo, iconBg: "bg-purple-500/10", iconColor: "text-purple-600",
            label: "Tarefas Pendentes", value: pendingTasksCount, loading: loadingTasks,
            onClick: () => onNavigate("tasks"),
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            onClick={card.onClick}
            className={`bg-card rounded-xl p-4 border border-border shadow-soft ${card.onClick ? "cursor-pointer hover:border-primary/30 transition-colors" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 ${card.iconBg} rounded-lg`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                {card.loading ? (
                  <Skeleton className="h-7 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{card.value}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="bg-card rounded-xl p-4 border border-border shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita do Mês</p>
              {loadingMonthly ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-2xl font-bold">${(monthlyStats?.totalRevenue || 0).toFixed(0)}</p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="bg-card rounded-xl p-4 border border-border shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-gold/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-rose-gold" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bookings do Mês</p>
              {loadingMonthly ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{monthlyStats?.totalBookings || 0}</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Services Chart */}
      {monthlyStats?.topServices && monthlyStats.topServices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-soft"
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-gold" />
              Top Serviços — {format(today, "MMMM", { locale: ptBR })}
            </h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyStats.topServices} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} bookings`, "Total"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {monthlyStats.topServices.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-soft"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-gold" />
              Agenda de Hoje
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("bookings")}>Ver tudo</Button>
          </div>
          <div className="p-4">
            {loadingBookings ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : todayBookings?.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Nenhum agendamento para hoje</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {todayBookings?.map((booking) => {
                  const statusBorder =
                    booking.status === "confirmed" ? "border-l-emerald-500" :
                    booking.status === "completed" ? "border-l-blue-500" :
                    booking.status === "cancelled" ? "border-l-red-500" :
                    "border-l-amber-500";
                  return (
                    <div key={booking.id} className={`flex items-center justify-between p-3 bg-muted/50 rounded-lg border-l-4 ${statusBorder}`}>
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[50px]">
                          <p className="text-sm font-bold">{format(new Date(booking.start_time), "HH:mm")}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{booking.client_name}</p>
                          <p className="text-xs text-muted-foreground">{booking.client_phone || booking.client_email}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                        booking.status === "completed" ? "bg-blue-100 text-blue-700" :
                        booking.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {booking.status === "confirmed" ? "Confirmado" :
                         booking.status === "completed" ? "Concluído" :
                         booking.status === "cancelled" ? "Cancelado" :
                         booking.status === "no_show" ? "Não compareceu" :
                         "Aguardando"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Pending Approvals */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-soft"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Aguardando Confirmação
              {pendingBookings && pendingBookings.length > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingBookings.length}
                </span>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("bookings")}>Ver tudo</Button>
          </div>
          <div className="p-4">
            {loadingPending ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : pendingBookings?.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Tudo confirmado! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBookings?.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg border-l-4 border-l-amber-500">
                    <div>
                      <p className="font-medium text-sm">{booking.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.start_time), "dd/MM 'às' HH:mm")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => confirmBookingMutation.mutate(booking.id)}
                      disabled={confirmBookingMutation.isPending}
                      className="text-xs gap-1"
                    >
                      {confirmBookingMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      Confirmar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Staff Performance */}
      <StaffPerformanceWidget />

      {/* Birthday Widget */}
      <BirthdayWidget onNavigateToClients={() => onNavigate("crm")} />
    </div>
  );
}
