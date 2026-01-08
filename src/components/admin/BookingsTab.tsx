import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Search, Filter, CheckCircle, XCircle, Clock, UserX } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled" | "no_show";

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ElementType }> = {
  requested: { label: "Aguardando", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-700", icon: CheckCircle },
  completed: { label: "Concluído", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle },
  no_show: { label: "Não compareceu", color: "bg-gray-100 text-gray-700", icon: UserX },
};

export function BookingsTab() {
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "tomorrow":
        return { start: startOfDay(addDays(now, 1)), end: endOfDay(addDays(now, 1)) };
      case "week":
        return { start: startOfDay(now), end: endOfDay(addDays(now, 7)) };
      case "past":
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(subDays(now, 1)) };
      default:
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(addDays(now, 30)) };
    }
  };

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings", dateFilter, statusFilter],
    queryFn: async () => {
      const { start, end } = getDateRange();
      let query = supabase
        .from("bookings")
        .select("*, services(name), packages(name)")
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .order("start_time", { ascending: true });
      
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-today-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-bookings"] });
      toast({ title: "Status atualizado!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const filteredBookings = bookings?.filter(
    (b) =>
      b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.client_phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold">Agendamentos</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="tomorrow">Amanhã</SelectItem>
            <SelectItem value="week">Próx. 7 dias</SelectItem>
            <SelectItem value="past">Últimos 30 dias</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="requested">Aguardando</SelectItem>
            <SelectItem value="confirmed">Confirmados</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
            <SelectItem value="no_show">Não compareceu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredBookings?.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings?.map((booking) => {
            const status = statusConfig[booking.status as BookingStatus];
            const StatusIcon = status?.icon || Clock;
            
            return (
              <div
                key={booking.id}
                className="bg-card rounded-xl border border-border p-4 shadow-soft"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-[60px] bg-muted rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.start_time), "dd MMM", { locale: ptBR })}
                      </p>
                      <p className="text-lg font-bold">
                        {format(new Date(booking.start_time), "HH:mm")}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">{booking.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.client_phone || booking.client_email}
                      </p>
                      {booking.services?.name && (
                        <p className="text-xs text-rose-gold mt-1">{booking.services.name}</p>
                      )}
                      {booking.packages?.name && (
                        <p className="text-xs text-purple-600 mt-1">{booking.packages.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status?.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status?.label}
                    </span>
                    
                    {booking.status === "requested" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => updateStatus.mutate({ id: booking.id, status: "confirmed" })}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => updateStatus.mutate({ id: booking.id, status: "cancelled" })}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    {booking.status === "confirmed" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ id: booking.id, status: "completed" })}
                        >
                          Concluir
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground"
                          onClick={() => updateStatus.mutate({ id: booking.id, status: "no_show" })}
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {booking.notes && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    📝 {booking.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
