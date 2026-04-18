import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Search, Filter, CheckCircle, XCircle, Clock, UserX, RefreshCw, Loader2, Plus, MessageSquare, List, LayoutGrid, AlertCircle, Sparkles, Users, DollarSign, Sun } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, addDays, parseISO, startOfWeek, endOfWeek, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookingDetailModal } from "./BookingDetailModal";
import { NewBookingModal } from "./NewBookingModal";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCalendarView } from "./BookingCalendarView";
import { BookingDayView } from "./BookingDayView";

type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled" | "no_show";

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ElementType }> = {
  requested: { label: "Aguardando", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-700", icon: CheckCircle },
  completed: { label: "Concluído", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle },
  no_show: { label: "Não compareceu", color: "bg-gray-100 text-gray-700", icon: UserX },
};

export function BookingsTab() {
  const [viewMode, setViewMode] = useState<"list" | "day" | "week" | "month">("list");
  const [dateFilter, setDateFilter] = useState<string>("week");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [dayViewDate, setDayViewDate] = useState<Date>(new Date());
  const [rescheduleBooking, setRescheduleBooking] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<any>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getDateRange = () => {
    const now = new Date();
    if (viewMode === "day") {
      return { start: startOfDay(dayViewDate), end: endOfDay(dayViewDate) };
    }
    if (viewMode === "week") {
      const ws = startOfWeek(now, { weekStartsOn: 1 });
      return { start: subDays(ws, 7), end: addDays(ws, 21) };
    }
    if (viewMode === "month") {
      return { start: subDays(startOfDay(now), 35), end: addDays(now, 45) };
    }
    switch (dateFilter) {
      case "today": return { start: startOfDay(now), end: endOfDay(now) };
      case "tomorrow": return { start: startOfDay(addDays(now, 1)), end: endOfDay(addDays(now, 1)) };
      case "week": return { start: startOfDay(now), end: endOfDay(addDays(now, 7)) };
      case "past": return { start: startOfDay(subDays(now, 30)), end: endOfDay(subDays(now, 1)) };
      default: return { start: startOfDay(subDays(now, 30)), end: endOfDay(addDays(now, 30)) };
    }
  };

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings", dateFilter, statusFilter, viewMode, dayViewDate.toDateString(), staffFilter],
    queryFn: async () => {
      const { start, end } = getDateRange();
      let query = supabase
        .from("bookings")
        .select("*, services(name, duration_minutes), packages(name), service_skus(name, price)")
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .order("start_time", { ascending: true });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (staffFilter !== "all") query = query.eq("staff_id", staffFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Staff for filter dropdown
  const { data: staffList } = useQuery({
    queryKey: ["admin-staff-profiles-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("user_id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // KPIs query — independent of filters, focused on operations TODAY/WEEK
  const { data: kpis } = useQuery({
    queryKey: ["admin-bookings-kpis"],
    queryFn: async () => {
      const now = new Date();
      const startTodayIso = startOfDay(now).toISOString();
      const endTodayIso = endOfDay(now).toISOString();
      const startWeekIso = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const endWeekIso = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const sixtyAhead = addDays(now, 60).toISOString();

      const [pending, today, week] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true })
          .eq("status", "requested").gte("start_time", now.toISOString()).lte("start_time", sixtyAhead),
        supabase.from("bookings").select("total_price, status")
          .gte("start_time", startTodayIso).lte("start_time", endTodayIso)
          .in("status", ["confirmed", "completed", "requested"]),
        supabase.from("bookings").select("total_price, status")
          .gte("start_time", startWeekIso).lte("start_time", endWeekIso)
          .in("status", ["confirmed", "completed"]),
      ]);

      const todayCount = today.data?.length || 0;
      const weekCount = week.data?.length || 0;
      const weekRevenue = (week.data || []).reduce((sum, b: any) => sum + (Number(b.total_price) || 0), 0);

      return {
        pending: pending.count || 0,
        today: todayCount,
        week: weekCount,
        weekRevenue,
      };
    },
    refetchInterval: 60_000,
  });

  // New-client detection: load distinct emails of all bookings ever for clients in current view
  const { data: clientHistorySet } = useQuery({
    queryKey: ["admin-bookings-client-history", bookings?.map((b: any) => b.client_email).join(",")],
    queryFn: async () => {
      const emails = Array.from(new Set((bookings || []).map((b: any) => b.client_email).filter(Boolean)));
      if (emails.length === 0) return new Set<string>();
      const { data, error } = await supabase
        .from("bookings")
        .select("client_email, start_time")
        .in("client_email", emails)
        .order("start_time", { ascending: true });
      if (error) throw error;
      // For each email, find earliest booking; if it matches a current booking, it's a "new client"
      const earliest = new Map<string, string>();
      (data || []).forEach((row: any) => {
        if (!earliest.has(row.client_email)) earliest.set(row.client_email, row.start_time);
      });
      // Set of "new client" booking ids: bookings whose start_time equals earliest for that email
      const newSet = new Set<string>();
      (bookings || []).forEach((b: any) => {
        const first = earliest.get(b.client_email);
        if (first && first === b.start_time) newSet.add(b.id);
      });
      return newSet;
    },
    enabled: !!bookings && bookings.length > 0,
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await supabase.functions.invoke("calendar-cancel-booking", {
        body: { booking_id: bookingId },
      });
      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-kpis"] });
      toast({ title: "Agendamento cancelado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
    },
  });

  const rescheduleBookingMutation = useMutation({
    mutationFn: async ({ bookingId, newStart, newEnd }: { bookingId: string; newStart: string; newEnd: string }) => {
      const response = await supabase.functions.invoke("calendar-reschedule-booking", {
        body: { booking_id: bookingId, new_start_time: newStart, new_end_time: newEnd },
      });
      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast({ title: "Agendamento remarcado!" });
      setRescheduleBooking(null);
      setRescheduleDate(undefined);
      setSelectedRescheduleSlot(null);
    },
    onError: (error) => {
      toast({ title: "Erro ao remarcar", description: error.message, variant: "destructive" });
    },
  });

  const approveBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await supabase.functions.invoke("calendar-approve-booking", {
        body: { booking_id: bookingId },
      });
      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sidebar-pending"] });
      toast({ title: "Agendamento confirmado e adicionado ao calendário!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao confirmar", description: error.message, variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sidebar-pending"] });
      toast({ title: "Status atualizado!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const handleRescheduleDateSelect = async (date: Date | undefined) => {
    setRescheduleDate(date);
    setSelectedRescheduleSlot(null);
    if (!date || !rescheduleBooking) return;

    setIsLoadingSlots(true);
    try {
      const duration = rescheduleBooking.services?.duration_minutes || 60;
      const response = await supabase.functions.invoke("calendar-availability", {
        body: { date: format(date, "yyyy-MM-dd"), service_duration_minutes: duration },
      });
      setRescheduleSlots(response.data?.available_slots || []);
    } catch (e) {
      toast({ title: "Erro ao carregar horários", variant: "destructive" });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleBooking || !selectedRescheduleSlot) return;
    rescheduleBookingMutation.mutate({
      bookingId: rescheduleBooking.id,
      newStart: selectedRescheduleSlot.start,
      newEnd: selectedRescheduleSlot.end,
    });
  };

  const handleWhatsApp = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = phone.replace(/\D/g, "");
    window.open(`https://wa.me/1${clean}`, "_blank");
  };

  const filteredBookings = bookings?.filter(
    (b) =>
      b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.client_phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pending in current view (for banner)
  const pendingInView = useMemo(
    () => (filteredBookings || []).filter((b: any) => b.status === "requested").length,
    [filteredBookings]
  );

  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-xl sm:text-2xl font-bold">Agendamentos</h1>
          <Button size="sm" onClick={() => setIsNewBookingOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Agendamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <button
            onClick={() => { setViewMode("list"); setStatusFilter("requested"); setDateFilter("all"); }}
            className={cn(
              "text-left bg-card border rounded-lg p-3 hover:border-amber-400 transition-colors",
              (kpis?.pending ?? 0) > 0 ? "border-amber-300 bg-amber-50/40" : "border-border"
            )}
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              <AlertCircle className="w-3 h-3" /> Aguardando
            </div>
            <p className="text-2xl font-bold mt-1">{kpis?.pending ?? "—"}</p>
          </button>
          <button
            onClick={() => { setViewMode("day"); setDayViewDate(new Date()); }}
            className="text-left bg-card border border-border rounded-lg p-3 hover:border-rose-gold transition-colors"
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              <Sun className="w-3 h-3" /> Hoje
            </div>
            <p className="text-2xl font-bold mt-1">{kpis?.today ?? "—"}</p>
          </button>
          <button
            onClick={() => { setViewMode("week"); }}
            className="text-left bg-card border border-border rounded-lg p-3 hover:border-rose-gold transition-colors"
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              <Users className="w-3 h-3" /> Esta semana
            </div>
            <p className="text-2xl font-bold mt-1">{kpis?.week ?? "—"}</p>
          </button>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              <DollarSign className="w-3 h-3" /> Receita semana
            </div>
            <p className="text-2xl font-bold mt-1">${(kpis?.weekRevenue ?? 0).toFixed(0)}</p>
          </div>
        </div>

        {/* Pending banner */}
        {(kpis?.pending ?? 0) > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1 text-sm">
              <span className="font-semibold text-amber-900">
                {kpis?.pending} agendamento{kpis?.pending === 1 ? "" : "s"} aguardando aprovação
              </span>
              <p className="text-xs text-amber-700">Confirme rapidamente para garantir o slot no calendário.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-400 text-amber-900 hover:bg-amber-100"
              onClick={() => { setViewMode("list"); setStatusFilter("requested"); setDateFilter("all"); }}
            >
              Ver agora
            </Button>
          </div>
        )}

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList className="h-9 w-full sm:w-auto">
            <TabsTrigger value="list" className="gap-1 px-2.5 text-xs flex-1 sm:flex-initial"><List className="w-3.5 h-3.5" />Lista</TabsTrigger>
            <TabsTrigger value="day" className="gap-1 px-2.5 text-xs flex-1 sm:flex-initial"><Sun className="w-3.5 h-3.5" />Dia</TabsTrigger>
            <TabsTrigger value="week" className="gap-1 px-2.5 text-xs flex-1 sm:flex-initial"><LayoutGrid className="w-3.5 h-3.5" />Semana</TabsTrigger>
            <TabsTrigger value="month" className="gap-1 px-2.5 text-xs flex-1 sm:flex-initial"><CalendarIcon className="w-3.5 h-3.5" />Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      {viewMode === "list" && (
        <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="flex-1 sm:w-[140px]"><CalendarIcon className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="tomorrow">Amanhã</SelectItem>
                <SelectItem value="week">Próx. 7 dias</SelectItem>
                <SelectItem value="past">Últimos 30 dias</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 sm:w-[150px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="requested">Aguardando</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
                <SelectItem value="no_show">Não compareceu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="flex-1 sm:w-[170px]"><Users className="w-4 h-4 mr-2" /><SelectValue placeholder="Profissional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos profissionais</SelectItem>
                {staffList?.map((s: any) => (
                  <SelectItem key={s.user_id} value={s.user_id}>{s.name || "Sem nome"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Staff filter for calendar/day views */}
      {viewMode !== "list" && (
        <div className="flex justify-end">
          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="w-full sm:w-[200px]"><Users className="w-4 h-4 mr-2" /><SelectValue placeholder="Profissional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos profissionais</SelectItem>
              {staffList?.map((s: any) => (
                <SelectItem key={s.user_id} value={s.user_id}>{s.name || "Sem nome"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Day view */}
      {viewMode === "day" && (
        <BookingDayView
          bookings={bookings || []}
          onBookingClick={(booking) => { setSelectedBooking(booking); setIsModalOpen(true); }}
          selectedDate={dayViewDate}
          onDateChange={setDayViewDate}
        />
      )}

      {/* Calendar views */}
      {(viewMode === "week" || viewMode === "month") && (
        <BookingCalendarView
          bookings={bookings || []}
          onBookingClick={(booking) => { setSelectedBooking(booking); setIsModalOpen(true); }}
          mode={viewMode}
        />
      )}

      {/* List view */}
      {viewMode === "list" && (
        <>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredBookings?.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings?.map((booking) => {
                const status = statusConfig[booking.status as BookingStatus];
                const StatusIcon = status?.icon || Clock;
                const isNewClient = clientHistorySet?.has(booking.id);
                return (
                  <div key={booking.id} className={`bg-card rounded-xl border border-border p-4 shadow-soft border-l-4 ${
                    booking.status === "confirmed" ? "border-l-emerald-500" :
                    booking.status === "completed" ? "border-l-blue-500" :
                    booking.status === "cancelled" ? "border-l-red-500" :
                    booking.status === "no_show" ? "border-l-gray-400" :
                    "border-l-amber-500"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 cursor-pointer flex-1 min-w-0" onClick={() => { setSelectedBooking(booking); setIsModalOpen(true); }}>
                        <div className="text-center min-w-[60px] bg-muted rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">{format(new Date(booking.start_time), "dd MMM", { locale: ptBR })}</p>
                          <p className="text-lg font-bold">{format(new Date(booking.start_time), "HH:mm")}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold truncate">{booking.client_name}</p>
                            {isNewClient && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-rose-gold/15 text-rose-gold px-1.5 py-0.5 rounded">
                                <Sparkles className="w-3 h-3" /> Novo
                              </span>
                            )}
                          </div>
                          {booking.client_phone ? (
                            <a
                              href={`tel:${booking.client_phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-muted-foreground hover:text-rose-gold transition-colors"
                            >
                              {booking.client_phone}
                            </a>
                          ) : (
                            <p className="text-sm text-muted-foreground truncate">{booking.client_email}</p>
                          )}
                          {(booking as any).service_skus?.name ? (
                            <p className="text-xs text-rose-gold mt-1">{booking.services?.name} — {(booking as any).service_skus.name}</p>
                          ) : booking.services?.name ? (
                            <p className="text-xs text-rose-gold mt-1">{booking.services.name}</p>
                          ) : null}
                          {booking.total_price != null && Number(booking.total_price) > 0 && (
                            <p className="text-xs text-muted-foreground">${Number(booking.total_price).toFixed(0)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status?.color}`}>
                          <StatusIcon className="w-3 h-3" />{status?.label}
                        </span>
                        {booking.client_phone && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={(e) => handleWhatsApp(booking.client_phone!, e)} title="WhatsApp">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                        {booking.status === "requested" && (
                          <>
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); approveBookingMutation.mutate(booking.id); }} className="gap-1 text-xs" disabled={approveBookingMutation.isPending}>
                              {approveBookingMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}Confirmar
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive text-xs" onClick={(e) => { e.stopPropagation(); cancelBookingMutation.mutate(booking.id); }} disabled={cancelBookingMutation.isPending}>
                              {cancelBookingMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                            </Button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <>
                            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); setRescheduleBooking(booking); }}>
                              <RefreshCw className="w-3 h-3" />Remarcar
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: booking.id, status: "completed" }); }}>
                              Concluir
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs text-muted-foreground" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: booking.id, status: "no_show" }); }} title="Não compareceu">
                              <UserX className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); cancelBookingMutation.mutate(booking.id); }} disabled={cancelBookingMutation.isPending} title="Cancelar">
                              {cancelBookingMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <BookingDetailModal
        booking={selectedBooking}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={(id) => approveBookingMutation.mutate(id)}
        onCancel={(id) => cancelBookingMutation.mutate(id)}
        onComplete={(id) => updateStatus.mutate({ id, status: "completed" })}
        onNoShow={(id) => updateStatus.mutate({ id, status: "no_show" })}
        onReschedule={(booking) => setRescheduleBooking(booking)}
      />
      <NewBookingModal open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen} />

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleBooking} onOpenChange={(open) => !open && setRescheduleBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remarcar Agendamento</DialogTitle>
            <DialogDescription>Selecione uma nova data e horário para o agendamento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Calendar mode="single" selected={rescheduleDate} onSelect={handleRescheduleDateSelect} disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 1} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
            {isLoadingSlots && <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}
            {rescheduleSlots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {rescheduleSlots.map((slot) => (
                  <Button key={slot.start} variant={selectedRescheduleSlot?.start === slot.start ? "default" : "outline"} size="sm" onClick={() => setSelectedRescheduleSlot(slot)}>
                    {format(parseISO(slot.start), "HH:mm")}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleBooking(null)}>Cancelar</Button>
            <Button onClick={handleConfirmReschedule} disabled={!selectedRescheduleSlot || rescheduleBookingMutation.isPending}>
              {rescheduleBookingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
