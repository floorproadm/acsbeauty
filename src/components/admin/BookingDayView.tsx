import { useState, useMemo, useEffect, useRef } from "react";
import { format, addDays, subDays, startOfDay, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled" | "no_show";

const statusColors: Record<BookingStatus, string> = {
  requested: "bg-amber-100/90 border-amber-400 text-amber-900",
  confirmed: "bg-emerald-100/90 border-emerald-500 text-emerald-900",
  completed: "bg-blue-100/90 border-blue-500 text-blue-900",
  cancelled: "bg-red-100/90 border-red-400 text-red-900 opacity-60 line-through",
  no_show: "bg-gray-100/90 border-gray-400 text-gray-700 opacity-70",
};

interface BookingDayViewProps {
  bookings: any[];
  onBookingClick: (booking: any) => void;
  selectedDate: Date;
  onDateChange: (d: Date) => void;
}

const START_HOUR = 8;
const END_HOUR = 21;
const HOUR_HEIGHT = 64; // px per hour
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

export function BookingDayView({ bookings, onBookingClick, selectedDate, onDateChange }: BookingDayViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // auto-scroll to "now" on first render when viewing today
  useEffect(() => {
    if (!isToday(selectedDate) || !containerRef.current) return;
    const offset = ((now.getHours() - START_HOUR) * HOUR_HEIGHT) - 100;
    containerRef.current.scrollTop = Math.max(0, offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const dayBookings = useMemo(() => {
    return (bookings || [])
      .filter((b) => isSameDay(new Date(b.start_time), selectedDate))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [bookings, selectedDate]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) arr.push(h);
    return arr;
  }, []);

  const positionFor = (start: Date, end: Date) => {
    const startMin = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
    const endMin = (end.getHours() - START_HOUR) * 60 + end.getMinutes();
    const top = (startMin / 60) * HOUR_HEIGHT;
    const height = Math.max(28, ((endMin - startMin) / 60) * HOUR_HEIGHT - 2);
    return { top, height };
  };

  const nowOffset = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const min = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
    if (min < 0 || min > (END_HOUR - START_HOUR) * 60) return null;
    return (min / 60) * HOUR_HEIGHT;
  }, [now, selectedDate]);

  const StatusIcon = ({ status }: { status: BookingStatus }) => {
    switch (status) {
      case "confirmed": return <CheckCircle className="w-3 h-3 shrink-0" />;
      case "cancelled": return <XCircle className="w-3 h-3 shrink-0" />;
      case "no_show": return <UserX className="w-3 h-3 shrink-0" />;
      default: return <Clock className="w-3 h-3 shrink-0" />;
    }
  };

  return (
    <div className="space-y-3">
      {/* Day navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => onDateChange(subDays(selectedDate, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <h3 className="font-serif text-lg font-semibold capitalize">
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h3>
          {!isToday(selectedDate) && (
            <Button variant="link" size="sm" className="h-6 px-1 text-xs" onClick={() => onDateChange(new Date())}>
              Voltar para hoje
            </Button>
          )}
          {isToday(selectedDate) && (
            <p className="text-xs text-muted-foreground">Hoje · {dayBookings.length} agendamento{dayBookings.length === 1 ? "" : "s"}</p>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={() => onDateChange(addDays(selectedDate, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Timeline */}
      <div
        ref={containerRef}
        className="border border-border rounded-lg bg-card overflow-y-auto max-h-[70vh]"
      >
        <div className="relative" style={{ height: TOTAL_HEIGHT }}>
          {/* Hour grid */}
          {hours.map((h, i) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-border/60 flex"
              style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              <div className="w-14 shrink-0 text-[11px] text-muted-foreground -mt-2 pl-2 pt-0">
                {String(h).padStart(2, "0")}:00
              </div>
              <div className="flex-1 border-l border-border/60" />
            </div>
          ))}

          {/* "Now" line */}
          {nowOffset !== null && (
            <div
              className="absolute left-14 right-0 z-20 pointer-events-none"
              style={{ top: nowOffset }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1" />
                <div className="flex-1 h-px bg-rose-500" />
                <span className="text-[10px] font-semibold text-rose-500 bg-background px-1 rounded">
                  {format(now, "HH:mm")}
                </span>
              </div>
            </div>
          )}

          {/* Bookings */}
          <div className="absolute inset-0 left-14 right-1 pl-1">
            {dayBookings.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sem agendamentos neste dia</p>
              </div>
            )}
            {dayBookings.map((booking) => {
              const start = new Date(booking.start_time);
              const end = new Date(booking.end_time);
              const { top, height } = positionFor(start, end);
              return (
                <button
                  key={booking.id}
                  onClick={() => onBookingClick(booking)}
                  className={cn(
                    "absolute left-1 right-2 rounded-md border-l-4 px-2 py-1 text-left shadow-soft hover:shadow-card transition-shadow overflow-hidden",
                    statusColors[booking.status as BookingStatus] || statusColors.requested
                  )}
                  style={{ top, height }}
                >
                  <div className="flex items-center gap-1 text-[11px] font-semibold leading-tight">
                    <StatusIcon status={booking.status as BookingStatus} />
                    <span>{format(start, "HH:mm")}–{format(end, "HH:mm")}</span>
                  </div>
                  <p className="text-xs font-semibold leading-tight truncate">{booking.client_name}</p>
                  {booking.services?.name && height > 44 && (
                    <p className="text-[10px] opacity-80 truncate leading-tight">{booking.services.name}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
