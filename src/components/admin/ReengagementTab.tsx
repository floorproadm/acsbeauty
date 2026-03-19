import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  CheckCircle,
  CalendarPlus,
  Search,
  Clock,
  AlertTriangle,
  XCircle,
  Users,
  Eye,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Segment = "all" | "ocasional" | "ausente" | "inativo";

interface ClientWithBooking {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  last_visit_at: string | null;
  tags: string[] | null;
  lastServiceName: string | null;
  daysSinceVisit: number;
  segment: "ocasional" | "ausente" | "inativo";
}

function getSegment(days: number): "ocasional" | "ausente" | "inativo" {
  if (days <= 60) return "ocasional";
  if (days <= 90) return "ausente";
  return "inativo";
}

const segmentConfig = {
  ocasional: {
    label: "Ocasional",
    subtitle: "31–60 dias",
    icon: Clock,
    color: "bg-amber-100 text-amber-800 border-amber-200",
    cardBorder: "border-l-amber-400",
    badgeBg: "bg-amber-50 text-amber-700",
  },
  ausente: {
    label: "Ausente",
    subtitle: "61–90 dias",
    icon: AlertTriangle,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    cardBorder: "border-l-orange-400",
    badgeBg: "bg-orange-50 text-orange-700",
  },
  inativo: {
    label: "Inativo",
    subtitle: "90+ dias",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    cardBorder: "border-l-red-400",
    badgeBg: "bg-red-50 text-red-700",
  },
};

export function ReengagementTab() {
  const [activeSegment, setActiveSegment] = useState<Segment>("all");
  const [search, setSearch] = useState("");
  const [showContacted, setShowContacted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients with last_visit_at
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ["reengagement-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone, email, instagram, last_visit_at, tags")
        .not("last_visit_at", "is", null)
        .order("last_visit_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch latest completed/confirmed booking per client for service name
  const { data: lastBookings } = useQuery({
    queryKey: ["reengagement-last-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("client_id, service_id, services:service_id(name), start_time")
        .in("status", ["confirmed", "completed"])
        .not("client_id", "is", null)
        .order("start_time", { ascending: false });
      if (error) throw error;
      // Group by client_id, keep only the latest
      const map = new Map<string, string>();
      for (const b of data || []) {
        if (b.client_id && !map.has(b.client_id)) {
          const svc = b.services as any;
          map.set(b.client_id, svc?.name || "—");
        }
      }
      return map;
    },
  });

  const enrichedClients = useMemo<ClientWithBooking[]>(() => {
    if (!clients) return [];
    const now = new Date();
    return clients
      .map((c) => {
        const days = differenceInDays(now, new Date(c.last_visit_at!));
        return {
          ...c,
          daysSinceVisit: days,
          segment: getSegment(days),
          lastServiceName: lastBookings?.get(c.id) || null,
        };
      })
      .filter((c) => c.daysSinceVisit > 30); // Only 31+ days
  }, [clients, lastBookings]);

  const filtered = useMemo(() => {
    let list = enrichedClients;

    // Filter contacted vs active
    if (showContacted) {
      list = list.filter((c) =>
        c.tags?.some((t) => t.startsWith("reengajamento-contatado"))
      );
    } else {
      list = list.filter(
        (c) => !c.tags?.some((t) => t.startsWith("reengajamento-contatado"))
      );
    }

    // Segment filter
    if (activeSegment !== "all") {
      list = list.filter((c) => c.segment === activeSegment);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => b.daysSinceVisit - a.daysSinceVisit);
  }, [enrichedClients, activeSegment, search, showContacted]);

  // Counts for metric cards (only non-contacted)
  const counts = useMemo(() => {
    const active = enrichedClients.filter(
      (c) => !c.tags?.some((t) => t.startsWith("reengajamento-contatado"))
    );
    return {
      ocasional: active.filter((c) => c.segment === "ocasional").length,
      ausente: active.filter((c) => c.segment === "ausente").length,
      inativo: active.filter((c) => c.segment === "inativo").length,
    };
  }, [enrichedClients]);

  const markContacted = useMutation({
    mutationFn: async (client: ClientWithBooking) => {
      const tag = `reengajamento-contatado:${format(new Date(), "yyyy-MM-dd")}`;
      const currentTags = client.tags || [];
      // Remove old reengagement tags, add new
      const newTags = [
        ...currentTags.filter((t) => !t.startsWith("reengajamento-contatado")),
        tag,
      ];
      const { error } = await supabase
        .from("clients")
        .update({ tags: newTags })
        .eq("id", client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reengagement-clients"] });
      toast({ title: "Cliente marcado como contatado ✓" });
    },
    onError: () => {
      toast({ title: "Erro ao marcar cliente", variant: "destructive" });
    },
  });

  const openWhatsApp = (client: ClientWithBooking) => {
    const phone = client.phone?.replace(/\D/g, "");
    if (!phone) {
      toast({ title: "Cliente sem telefone cadastrado", variant: "destructive" });
      return;
    }
    const firstName = client.name.split(" ")[0];
    const msg = encodeURIComponent(
      `Oi ${firstName}, tudo bem? Sentimos sua falta aqui na ACS Beauty! 💛 Que tal agendar seu próximo horário? Temos novidades esperando por você!`
    );
    window.open(`https://wa.me/1${phone}?text=${msg}`, "_blank");
  };

  if (loadingClients) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        {(["ocasional", "ausente", "inativo"] as const).map((seg) => {
          const cfg = segmentConfig[seg];
          const Icon = cfg.icon;
          return (
            <button
              key={seg}
              onClick={() =>
                setActiveSegment(activeSegment === seg ? "all" : seg)
              }
              className={`rounded-lg border p-3 text-left transition-all ${
                activeSegment === seg
                  ? "ring-2 ring-primary/50 border-primary"
                  : "hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {cfg.label}
                </span>
              </div>
              <p className="text-2xl font-bold">{counts[seg]}</p>
              <p className="text-[10px] text-muted-foreground">{cfg.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showContacted ? "default" : "outline"}
          size="sm"
          onClick={() => setShowContacted(!showContacted)}
          className="gap-2 whitespace-nowrap"
        >
          <Eye className="w-4 h-4" />
          {showContacted ? "Pendentes" : "Contatados"}
        </Button>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>
          {filtered.length} cliente{filtered.length !== 1 && "s"}{" "}
          {showContacted ? "contatados" : "aguardando contato"}
        </span>
      </div>

      {/* Client List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {showContacted
              ? "Nenhum cliente contatado ainda."
              : "Nenhum cliente precisa de reengajamento no momento! 🎉"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => {
            const cfg = segmentConfig[client.segment];
            return (
              <Card
                key={client.id}
                className={`border-l-4 ${cfg.cardBorder}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium truncate">{client.name}</h4>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${cfg.badgeBg} border-0`}
                        >
                          {cfg.label} · {client.daysSinceVisit}d
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-1 text-xs text-muted-foreground">
                        {client.phone && <span>{client.phone}</span>}
                        {client.lastServiceName && (
                          <>
                            {client.phone && (
                              <span className="hidden sm:inline">·</span>
                            )}
                            <span>Último: {client.lastServiceName}</span>
                          </>
                        )}
                        {client.last_visit_at && (
                          <>
                            <span className="hidden sm:inline">·</span>
                            <span>
                              {format(
                                new Date(client.last_visit_at),
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openWhatsApp(client)}
                        className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </Button>
                      {!showContacted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markContacted.mutate(client)}
                          disabled={markContacted.isPending}
                          className="gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Contatado</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
