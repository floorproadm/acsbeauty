import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, Clock, AlertCircle, CheckCircle2, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminTab } from "./AdminLayout";
import { BirthdayWidget } from "./BirthdayWidget";

interface DashboardTabProps {
  onNavigate: (tab: AdminTab) => void;
}

export function DashboardTab({ onNavigate }: DashboardTabProps) {
  const today = new Date();
  const todayStart = startOfDay(today).toISOString();
  const todayEnd = endOfDay(today).toISOString();

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


  // Pending bookings (requested status)
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

  // WhatsApp clicks - today
  const { data: whatsappToday, isLoading: loadingWhatsappToday } = useQuery({
    queryKey: ["admin-whatsapp-today"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("whatsapp_clicks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart)
        .lte("created_at", todayEnd);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // WhatsApp clicks - last 7 days
  const sevenDaysAgo = subDays(today, 7).toISOString();
  const { data: whatsapp7Days, isLoading: loadingWhatsapp7Days } = useQuery({
    queryKey: ["admin-whatsapp-7days"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("whatsapp_clicks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const confirmedToday = todayBookings?.filter(b => b.status === "confirmed").length || 0;
  const completedToday = todayBookings?.filter(b => b.status === "completed").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-soft">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-gold/10 rounded-lg">
              <Calendar className="w-5 h-5 text-rose-gold" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hoje</p>
              {loadingBookings ? (
                <Skeleton className="h-7 w-8" />
              ) : (
                <p className="text-2xl font-bold">{todayBookings?.length || 0}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-soft">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confirmados</p>
              {loadingBookings ? (
                <Skeleton className="h-7 w-8" />
              ) : (
                <p className="text-2xl font-bold">{confirmedToday}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-soft">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clientes</p>
              {loadingClients ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{clientsCount}</p>
              )}
            </div>
          </div>
        </div>

        <div 
          className="bg-card rounded-xl p-4 border border-border shadow-soft cursor-pointer hover:border-green-300 transition-colors"
          onClick={() => onNavigate("crm")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">WhatsApp Hoje</p>
              {loadingWhatsappToday ? (
                <Skeleton className="h-7 w-8" />
              ) : (
                <p className="text-2xl font-bold">{whatsappToday}</p>
              )}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Últimos 7 dias:{" "}
              {loadingWhatsapp7Days ? (
                <Skeleton className="inline-block h-4 w-6" />
              ) : (
                <span className="font-semibold text-foreground">{whatsapp7Days}</span>
              )}
            </p>
          </div>
        </div>

      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-card rounded-xl border border-border shadow-soft">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-gold" />
              Agenda de Hoje
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("bookings")}>
              Ver tudo
            </Button>
          </div>
          <div className="p-4">
            {loadingBookings ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : todayBookings?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nenhum agendamento para hoje
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {todayBookings?.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <p className="text-sm font-bold">
                          {format(new Date(booking.start_time), "HH:mm")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{booking.client_name}</p>
                        <p className="text-xs text-muted-foreground">{booking.client_phone || booking.client_email}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === "confirmed" ? "bg-green-100 text-green-700" :
                      booking.status === "completed" ? "bg-blue-100 text-blue-700" :
                      booking.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {booking.status === "confirmed" ? "Confirmado" :
                       booking.status === "completed" ? "Concluído" :
                       booking.status === "cancelled" ? "Cancelado" :
                       booking.status === "no_show" ? "Não compareceu" :
                       "Aguardando"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-card rounded-xl border border-border shadow-soft">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Aguardando Confirmação
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("bookings")}>
              Ver tudo
            </Button>
          </div>
          <div className="p-4">
            {loadingPending ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : pendingBookings?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nenhum agendamento pendente
              </p>
            ) : (
              <div className="space-y-3">
                {pendingBookings?.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{booking.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.start_time), "dd/MM 'às' HH:mm")}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      Confirmar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Birthday Widget */}
      <BirthdayWidget onNavigateToClients={() => onNavigate("crm")} />

    </div>
  );
}
