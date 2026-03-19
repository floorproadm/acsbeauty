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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type PaymentFilter = "all" | "pending" | "paid" | "no_show";

const METHOD_LABELS: Record<string, string> = {
  local: "Local",
  cash: "Dinheiro",
  zelle: "Zelle",
  venmo: "Venmo",
  online: "Online",
  card: "Cartão",
  "at_location": "Presencial",
};

// Detecta método a partir das notes do booking (padrão do portal flow)
function extractPaymentMethod(notes: string | null): string | null {
  if (!notes) return null;
  if (notes.includes("At Location") || notes.includes("at_location")) return "at_location";
  if (notes.includes("By App") || notes.includes("by_app")) return "online";
  return null;
}

function isPaid(booking: any): boolean {
  if ((booking as any).payment_method) return true;
  if (booking.status === "completed" && extractPaymentMethod(booking.notes)) return true;
  return false;
}

export function PaymentsTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PaymentFilter>("all");
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
        .update({ payment_method: method })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast({ title: "Pagamento atualizado!" });
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  // Filtro + busca
  const filtered = bookings.filter((b) => {
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

  // Métricas — exclui requested (ainda não aprovado) do esperado
  const approvedBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "completed" || b.status === "no_show"
  );
  const totalExpected = approvedBookings
    .filter((b) => b.status !== "no_show")
    .reduce((acc, b) => acc + (b.total_price ?? 0), 0);
  const totalReceived = approvedBookings
    .filter((b) => isPaid(b))
    .reduce((acc, b) => acc + (b.total_price ?? 0), 0);
  const totalPending = totalExpected - totalReceived;
  const pendingCount = bookings.filter(
    (b) => b.status === "requested"
  ).length;

  const handleWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá ${name}! Passando para confirmar o pagamento do seu agendamento na ACS Beauty 😊`
    );
    window.open(`https://wa.me/1${clean}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-xl sm:text-2xl font-bold">Pagamentos</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Controle de recebimentos e pendências
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Esperado</span>
          </div>
          <p className="text-xl font-bold">${totalExpected.toFixed(0)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-muted-foreground">Recebido</span>
          </div>
          <p className="text-xl font-bold text-green-600">${totalReceived.toFixed(0)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-muted-foreground">Pendente</span>
          </div>
          <p className="text-xl font-bold text-amber-600">${totalPending.toFixed(0)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Aguardando</span>
          </div>
          <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">a aprovar</p>
        </div>
      </div>

      {/* Filtros */}
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
          {(
            [
              { value: "all", label: "Todos" },
              { value: "pending", label: "A receber" },
              { value: "paid", label: "Recebido" },
              { value: "no_show", label: "No-show" },
            ] as { value: PaymentFilter; label: string }[]
          ).map(({ value, label }) => (
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

      {/* Lista */}
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
              <div
                key={booking.id}
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
                  {/* Status icon */}
                  <div className="mt-0.5 shrink-0">
                    {isRequested ? (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    ) : paid ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : isNoShow ? (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500" />
                    )}
                  </div>

                  {/* Info */}
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

                    {/* Tags + ações */}
                    <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                      <div className="flex gap-1.5 flex-wrap">
                        {/* Status badge */}
                        {isRequested && (
                          <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300 bg-yellow-50">
                            Aguardando aprovação
                          </Badge>
                        )}
                        {isNoShow && (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            No-show
                          </Badge>
                        )}
                        {/* Método de pagamento */}
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

                      {/* Ações */}
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
                          <button
                            onClick={() =>
                              markPaidMutation.mutate({
                                id: booking.id,
                                method: paid ? null : "at_location",
                              })
                            }
                            disabled={markPaidMutation.isPending}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-medium transition",
                              paid
                                ? "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                : "bg-green-600 text-white hover:bg-green-700"
                            )}
                          >
                            {paid ? "Desmarcar" : "Marcar pago"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
