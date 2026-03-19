import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  Phone,
  Banknote,
  CreditCard,
  XCircle,
  Download,
} from "lucide-react";
import { format, subWeeks, subMonths, subDays, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { PaymentExportSheet } from "./PaymentExportSheet";
import { ManualPaymentSheet } from "./ManualPaymentSheet";
import { Plus } from "lucide-react";

type PaymentFilter = "all" | "pending" | "paid" | "no_show";
type PeriodFilter = "week" | "month" | "quarter" | "year" | "all";

const METHOD_LABELS: Record<string, string> = {
  local: "Local",
  cash: "Dinheiro",
  zelle: "Zelle",
  venmo: "Venmo",
  online: "Online",
  card: "Cartão",
  at_location: "Presencial",
};

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  week: "Esta Semana",
  month: "Este Mês",
  quarter: "Trimestre",
  year: "Este Ano",
  all: "Todos",
};

const PAYMENT_METHODS = [
  { value: "at_location", label: "Presencial", icon: Banknote },
  { value: "cash", label: "Dinheiro", icon: Banknote },
  { value: "zelle", label: "Zelle", icon: CreditCard },
  { value: "venmo", label: "Venmo", icon: CreditCard },
  { value: "card", label: "Cartão", icon: CreditCard },
];

function extractPaymentMethod(notes: string | null): string | null {
  if (!notes) return null;
  if (notes.includes("At Location") || notes.includes("at_location")) return "at_location";
  if (notes.includes("By App") || notes.includes("by_app")) return "online";
  return null;
}

function isPaid(booking: any): boolean {
  if (booking.payment_method) return true;
  if (booking.status === "completed" && extractPaymentMethod(booking.notes)) return true;
  return false;
}

function getPeriodStart(period: PeriodFilter): Date | null {
  const now = new Date();
  switch (period) {
    case "week": return startOfWeek(now, { weekStartsOn: 1 });
    case "month": return startOfMonth(now);
    case "quarter": return startOfQuarter(now);
    case "year": return startOfYear(now);
    case "all": return null;
  }
}

export function PaymentsTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [exportOpen, setExportOpen] = useState(false);
  const [popoverOpenId, setPopoverOpenId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(name)")
        .in("status", ["requested", "confirmed", "completed", "no_show"])
        .order("start_time", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, method }: { id: string; method: string | null }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ payment_method: method } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast({ title: "Pagamento atualizado!" });
      setPopoverOpenId(null);
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  // Period filter
  const periodStart = getPeriodStart(period);
  const periodFiltered = bookings.filter((b) => {
    if (!periodStart) return true;
    return new Date(b.start_time) >= periodStart;
  });

  // Status + search filter
  const filtered = periodFiltered.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.client_name?.toLowerCase().includes(q) ||
      b.client_phone?.includes(q) ||
      (b as any).services?.name?.toLowerCase().includes(q);

    const paid = isPaid(b);
    const matchFilter =
      filter === "all" ||
      (filter === "paid" && paid) ||
      (filter === "pending" && !paid && b.status !== "no_show") ||
      (filter === "no_show" && b.status === "no_show");

    return matchSearch && matchFilter;
  });

  // Metrics from period-filtered data
  const approvedBookings = periodFiltered.filter(
    (b) => b.status === "confirmed" || b.status === "completed" || b.status === "no_show"
  );
  const totalExpected = approvedBookings
    .filter((b) => b.status !== "no_show")
    .reduce((acc, b) => acc + (b.total_price ?? 0), 0);
  const totalReceived = approvedBookings
    .filter((b) => isPaid(b))
    .reduce((acc, b) => acc + (b.total_price ?? 0), 0);
  const totalPending = totalExpected - totalReceived;
  const pendingCount = periodFiltered.filter((b) => b.status === "requested").length;

  const handleWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá ${name}! Passando para confirmar o pagamento do seu agendamento na ACS Beauty 😊`
    );
    window.open(`https://wa.me/1${clean}?text=${msg}`, "_blank");
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const },
    }),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold">Pagamentos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Controle de recebimentos e pendências
          </p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 transition"
          title="Exportar relatório"
        >
          <Download className="w-4.5 h-4.5 text-foreground" />
        </button>
      </div>

      {/* Period pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              period === p
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, label: "Esperado", value: `$${totalExpected.toFixed(0)}`, iconClass: "text-muted-foreground", valueClass: "" },
          { icon: CheckCircle2, label: "Recebido", value: `$${totalReceived.toFixed(0)}`, iconClass: "text-green-500", valueClass: "text-green-600" },
          { icon: Clock, label: "Pendente", value: `$${totalPending.toFixed(0)}`, iconClass: "text-amber-500", valueClass: "text-amber-600" },
          { icon: Clock, label: "Aguardando", value: String(pendingCount), iconClass: "text-yellow-500", valueClass: "text-yellow-600", sub: "a aprovar" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <card.icon className={cn("w-3.5 h-3.5", card.iconClass)} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className={cn("text-xl font-bold", card.valueClass)}>{card.value}</p>
            {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente ou serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            { value: "all", label: "Todos" },
            { value: "pending", label: "A receber" },
            { value: "paid", label: "Recebido" },
            { value: "no_show", label: "No-show" },
          ] as { value: PaymentFilter; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors",
                filter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((booking) => {
            const paid = isPaid(booking);
            const isNoShow = booking.status === "no_show";
            const isRequested = booking.status === "requested";
            const startTime = new Date(booking.start_time);
            const detectedMethod = extractPaymentMethod(booking.notes);
            const displayMethod = booking.payment_method || detectedMethod;

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "bg-card border rounded-xl p-4 transition-colors",
                  isRequested
                    ? "border-yellow-200 bg-yellow-50/20"
                    : isNoShow
                    ? "border-border opacity-60"
                    : paid
                    ? "border-green-200 bg-green-50/20"
                    : "border-amber-200 bg-amber-50/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isRequested ? (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    ) : paid ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : isNoShow ? (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {booking.client_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(booking as any).services?.name ?? "Serviço"} ·{" "}
                          {format(startTime, "dd MMM", { locale: ptBR })} às{" "}
                          {format(startTime, "HH:mm")}
                        </p>
                      </div>
                      <p className="font-bold text-base text-foreground shrink-0">
                        {booking.total_price != null
                          ? `$${booking.total_price.toFixed(2)}`
                          : "—"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                      <div className="flex gap-1.5 flex-wrap">
                        {isRequested && (
                          <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300 bg-yellow-50">
                            Aguardando aprovação
                          </Badge>
                        )}
                        {isNoShow && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            No-show
                          </Badge>
                        )}
                        {displayMethod && (
                          <Badge variant="outline" className={cn(
                            "text-xs gap-1",
                            paid ? "text-green-700 border-green-300 bg-green-50" : ""
                          )}>
                            {displayMethod === "online" || displayMethod === "card" ? (
                              <CreditCard className="w-3 h-3" />
                            ) : (
                              <Banknote className="w-3 h-3" />
                            )}
                            {METHOD_LABELS[displayMethod] ?? displayMethod}
                          </Badge>
                        )}
                      </div>

                      {!isNoShow && !isRequested && (
                        <div className="flex gap-1.5">
                          {!paid && booking.client_phone && (
                            <button
                              onClick={() => handleWhatsApp(booking.client_phone!, booking.client_name)}
                              className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 transition"
                              title="Cobrar via WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5 text-green-700" />
                            </button>
                          )}
                          {paid ? (
                            <button
                              onClick={() =>
                                markPaidMutation.mutate({ id: booking.id, method: null })
                              }
                              disabled={markPaidMutation.isPending}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium transition bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            >
                              Desmarcar
                            </button>
                          ) : (
                            <Popover
                              open={popoverOpenId === booking.id}
                              onOpenChange={(open) => setPopoverOpenId(open ? booking.id : null)}
                            >
                              <PopoverTrigger asChild>
                                <button className="px-2.5 py-1 rounded-lg text-xs font-medium transition bg-green-600 text-white hover:bg-green-700">
                                  Marcar pago
                                </button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-44 p-1.5">
                                <div className="space-y-0.5">
                                  {PAYMENT_METHODS.map((m) => (
                                    <button
                                      key={m.value}
                                      onClick={() =>
                                        markPaidMutation.mutate({
                                          id: booking.id,
                                          method: m.value,
                                        })
                                      }
                                      disabled={markPaidMutation.isPending}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition text-left"
                                    >
                                      <m.icon className="w-3.5 h-3.5 text-muted-foreground" />
                                      {m.label}
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Export Sheet */}
      <PaymentExportSheet
        open={exportOpen}
        onOpenChange={setExportOpen}
        bookings={periodFiltered}
        periodLabel={PERIOD_LABELS[period]}
        totalExpected={totalExpected}
        totalReceived={totalReceived}
        totalPending={totalPending}
      />
    </div>
  );
}
