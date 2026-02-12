import { useState, useMemo, useRef, useCallback } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addWeeks, subWeeks, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled" | "no_show";

const statusColors: Record<BookingStatus, string> = {
  requested: "bg-amber-100 text-amber-800 border-amber-300",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  completed: "bg-blue-100 text-blue-800 border-blue-300",
  cancelled: "bg-red-100 text-red-800 border-red-300 line-through opacity-60",
  no_show: "bg-gray-100 text-gray-600 border-gray-300 opacity-60",
};

interface BookingCalendarViewProps {
  bookings: any[];
  onBookingClick: (booking: any) => void;
  mode: "week" | "month";
}

export function BookingCalendarView({ bookings, onBookingClick, mode }: BookingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Swipe gesture
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const dir = dx < 0 ? 1 : -1;
      setCurrentDate((d) =>
        mode === "week"
          ? dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1)
          : dir > 0 ? addMonths(d, 1) : subMonths(d, 1)
      );
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [mode]);

  const days = useMemo(() => {
    if (mode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const monthStart = startOfWeek(start, { weekStartsOn: 1 });
    const monthEnd = endOfWeek(end, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentDate, mode]);

  const bookingsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    bookings?.forEach((b) => {
      const key = format(new Date(b.start_time), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    // Sort each day's bookings by time
    Object.values(map).forEach((arr) => arr.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
    return map;
  }, [bookings]);

  const navigate = (dir: number) => {
    if (mode === "week") {
      setCurrentDate((d) => (dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1)));
    } else {
      setCurrentDate((d) => (dir > 0 ? addMonths(d, 1) : subMonths(d, 1)));
    }
  };

  const headerLabel = mode === "week"
    ? `${format(days[0], "dd MMM", { locale: ptBR })} – ${format(days[days.length - 1], "dd MMM yyyy", { locale: ptBR })}`
    : format(currentDate, "MMMM yyyy", { locale: ptBR });

  const StatusIcon = ({ status }: { status: BookingStatus }) => {
    switch (status) {
      case "confirmed": return <CheckCircle className="w-3 h-3 shrink-0" />;
      case "cancelled": return <XCircle className="w-3 h-3 shrink-0" />;
      case "no_show": return <UserX className="w-3 h-3 shrink-0" />;
      default: return <Clock className="w-3 h-3 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-serif text-lg font-semibold capitalize">{headerLabel}</h3>
        <Button variant="outline" size="icon" onClick={() => navigate(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week view - vertical on mobile, grid on desktop */}
      {mode === "week" ? (
        <>
          {/* Desktop: horizontal grid */}
          <div className="hidden md:block">
            <div className="grid gap-1 grid-cols-7">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid gap-1 grid-cols-7">
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayBookings = bookingsByDay[key] || [];
                return (
                  <div
                    key={key}
                    className={cn(
                      "border border-border rounded-lg p-1 min-h-[200px] transition-colors",
                      isToday(day) && "bg-accent/10 border-accent"
                    )}
                  >
                    <div className={cn(
                      "text-xs font-medium mb-1 text-center rounded-full w-6 h-6 flex items-center justify-center mx-auto",
                      isToday(day) && "bg-accent text-accent-foreground"
                    )}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 10).map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => onBookingClick(booking)}
                          className={cn(
                            "w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 truncate",
                            statusColors[booking.status as BookingStatus] || statusColors.requested
                          )}
                        >
                          <StatusIcon status={booking.status as BookingStatus} />
                          <span className="font-medium">{format(new Date(booking.start_time), "HH:mm")}</span>
                          <span className="truncate">{booking.client_name}</span>
                        </button>
                      ))}
                      {dayBookings.length > 10 && (
                        <p className="text-[10px] text-muted-foreground text-center">+{dayBookings.length - 10}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile: vertical list */}
          <div className="md:hidden space-y-2" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayBookings = bookingsByDay[key] || [];
              return (
                <div
                  key={key}
                  className={cn(
                    "border border-border rounded-lg p-3 transition-colors",
                    isToday(day) && "bg-accent/10 border-accent"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "text-sm font-medium rounded-full w-8 h-8 flex items-center justify-center shrink-0",
                      isToday(day) && "bg-accent text-accent-foreground"
                    )}>
                      {format(day, "d")}
                    </div>
                    <span className="text-sm font-medium capitalize">
                      {format(day, "EEEE", { locale: ptBR })}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>
                  {dayBookings.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-10">Sem agendamentos</p>
                  ) : (
                    <div className="space-y-1 pl-10">
                      {dayBookings.map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => onBookingClick(booking)}
                          className={cn(
                            "w-full text-left text-xs px-2 py-1.5 rounded border cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2",
                            statusColors[booking.status as BookingStatus] || statusColors.requested
                          )}
                        >
                          <StatusIcon status={booking.status as BookingStatus} />
                          <span className="font-medium">{format(new Date(booking.start_time), "HH:mm")}</span>
                          <span className="truncate">{booking.client_name}</span>
                          {booking.services?.name && (
                            <span className="ml-auto text-[10px] opacity-70 truncate max-w-[80px]">{booking.services.name}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Month view - always grid */
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="min-w-[500px]">
            <div className="grid gap-1 grid-cols-7">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid gap-1 grid-cols-7">
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayBookings = bookingsByDay[key] || [];
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                return (
                  <div
                    key={key}
                    className={cn(
                      "border border-border rounded-lg p-1 min-h-[80px] sm:min-h-[100px] transition-colors",
                      isToday(day) && "bg-accent/10 border-accent",
                      !isCurrentMonth && "opacity-40"
                    )}
                  >
                    <div className={cn(
                      "text-xs font-medium mb-1 text-center rounded-full w-6 h-6 flex items-center justify-center mx-auto",
                      isToday(day) && "bg-accent text-accent-foreground"
                    )}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => onBookingClick(booking)}
                          className={cn(
                            "w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 truncate",
                            statusColors[booking.status as BookingStatus] || statusColors.requested
                          )}
                        >
                          <StatusIcon status={booking.status as BookingStatus} />
                          <span className="font-medium">{format(new Date(booking.start_time), "HH:mm")}</span>
                        </button>
                      ))}
                      {dayBookings.length > 3 && (
                        <p className="text-[10px] text-muted-foreground text-center">+{dayBookings.length - 3}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-2 border-t border-border">
        {[
          { status: "requested", label: "Aguardando" },
          { status: "confirmed", label: "Confirmado" },
          { status: "completed", label: "Concluído" },
          { status: "cancelled", label: "Cancelado" },
          { status: "no_show", label: "Não compareceu" },
        ].map(({ status, label }) => (
          <span key={status} className="flex items-center gap-1">
            <span className={cn("w-2.5 h-2.5 rounded-sm border", statusColors[status as BookingStatus])} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
