import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bell,
  Search,
  CheckCheck,
  Trash2,
  Loader2,
  Calendar,
  MessageSquare,
  Gift,
  Filter,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
  meta: Record<string, unknown> | null;
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  booking_requested: { label: "Solicitado", icon: Calendar, color: "bg-amber-100 text-amber-700" },
  booking_confirmed: { label: "Confirmado", icon: Calendar, color: "bg-emerald-100 text-emerald-700" },
  booking_cancelled: { label: "Cancelado", icon: Calendar, color: "bg-red-100 text-red-700" },
  lead_received: { label: "Lead", icon: MessageSquare, color: "bg-blue-100 text-blue-700" },
  giftcard_purchased: { label: "Gift Card", icon: Gift, color: "bg-purple-100 text-purple-700" },
};

function typeInfo(type: string) {
  return (
    TYPE_META[type] ?? {
      label: type,
      icon: Bell,
      color: "bg-muted text-muted-foreground",
    }
  );
}

export function NotificationsTab() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      setItems((data as Notification[]) ?? []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-notifications-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((n) => {
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (readFilter === "unread" && n.read_at) return false;
      if (readFilter === "read" && !n.read_at) return false;
      if (q) {
        const hay = `${n.title} ${n.body ?? ""} ${JSON.stringify(n.meta ?? {})}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, typeFilter, readFilter, search]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const markRead = async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
  };

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (!ids.length) return;
    setItems((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    toast({ title: "Todas marcadas como lidas" });
  };

  const remove = async (id: string) => {
    const prev = items;
    setItems((p) => p.filter((n) => n.id !== id));
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const handleClick = (n: Notification) => {
    if (!n.read_at) markRead(n.id);
    if (n.link) navigate(n.link);
  };

  const types = useMemo(() => {
    const set = new Set(items.map((i) => i.type));
    return Array.from(set);
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold tracking-tight">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} no total · {unreadCount} não lida{unreadCount === 1 ? "" : "s"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
            <CheckCheck className="w-4 h-4" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, lead, agendamento…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {typeInfo(t).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={readFilter} onValueChange={setReadFilter}>
            <SelectTrigger className="sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="unread">Não lidas</SelectItem>
              <SelectItem value="read">Lidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Nenhuma notificação encontrada.
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <ul className="divide-y">
              {filtered.map((n) => {
                const info = typeInfo(n.type);
                const Icon = info.icon;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "px-4 py-3 hover:bg-muted/40 transition-colors flex gap-3 items-start",
                      !n.read_at && "bg-rose-light/20"
                    )}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                        info.color
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleClick(n)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{n.title}</p>
                        <Badge variant="outline" className="text-[10px] py-0 h-5">
                          {info.label}
                        </Badge>
                        {!n.read_at && (
                          <span className="w-2 h-2 rounded-full bg-rose-gold" />
                        )}
                      </div>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(n.created_at), "dd/MM/yyyy HH:mm")} ·{" "}
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(n.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
