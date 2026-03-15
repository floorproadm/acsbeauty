import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Search, Filter, CheckCircle, XCircle, Clock, UserX, RefreshCw, Loader2, Plus, Phone, MessageSquare, List, LayoutGrid } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, addDays, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookingDetailModal } from "./BookingDetailModal";
import { NewBookingModal } from "./NewBookingModal";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCalendarView } from "./BookingCalendarView";

type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled" | "no_show";

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ElementType }> = {
  requested: { label: "Aguardando", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-700", icon: CheckCircle },
  completed: { label: "Concluído", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle },
  no_show: { label: "Não compareceu", color: "bg-gray-100 text-gray-700", icon: UserX },
};

export function BookingsTab() {
  const [viewMode, setViewMode] = useState<"list" | "week" | "month">("list");
  const [dateFilter, setDateFilter] = useState<string>("week");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<any>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getDateRange = () => {
    const now = new Date();
    // Calendar views need broader data
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
    queryKey: ["admin-bookings", dateFilter, statusFilter, viewMode],
    queryFn: async () => {
      const { start, end } = getDateRange();
      let query = supabase
        .from("bookings")
        .select("*, services(name, duration_minutes), packages(name), service_skus(name, price)")
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .order("start_time", { ascending: true });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-xl sm:text-2xl font-bold">Agendamentos</h1>
          <Button size="sm" onClick={() => setIsNewBookingOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Agendamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList className="h-9 w-full sm:w-auto">
            <TabsTrigger value="list" className="gap-1 px-2.5 text-xs flex-1 sm:flex-initial"><List className="w-3.5 h-3.5" />Lista</TabsTrigger>
            <TabsTrigger value="week" className="gap-1 px-2.5 text-xs flex-1 sm:flex-initial"><LayoutGrid className="w-3.5 h-3.5" />Semana</TabsTrigger>
            <TabsTrigger value="month" className="gap-1 px-2.5 text-xs flex-1 sm:flex-initial"><CalendarIcon className="w-3.5 h-3.5" />Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters - only show in list mode */}
      {viewMode === "list" && (
        <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>
      )}

      {/* Calendar view */}
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
                return (
                  <div key={booking.id} className={`bg-card rounded-xl border border-border p-4 shadow-soft border-l-4 ${
                    booking.status === "confirmed" ? "border-l-emerald-500" :
                    booking.status === "completed" ? "border-l-blue-500" :
                    booking.status === "cancelled" ? "border-l-red-500" :
                    booking.status === "no_show" ? "border-l-gray-400" :
                    "border-l-amber-500"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 cursor-pointer" onClick={() => { setSelectedBooking(booking); setIsModalOpen(true); }}>
                        <div className="text-center min-w-[60px] bg-muted rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">{format(new Date(booking.start_time), "dd MMM", { locale: ptBR })}</p>
                          <p className="text-lg font-bold">{format(new Date(booking.start_time), "HH:mm")}</p>
                        </div>
                        <div>
                          <p className="font-semibold">{booking.client_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.client_phone || booking.client_email}</p>
                          {booking.services?.name && <p className="text-xs text-rose-gold mt-1">{booking.services.name}</p>}
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
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: booking.id, status: "confirmed" }); }} className="gap-1 text-xs">
                              <CheckCircle className="w-3 h-3" />Confirmar
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
        onConfirm={(id) => updateStatus.mutate({ id, status: "confirmed" })}
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
