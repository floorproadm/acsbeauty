import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

const PAGE_SIZE = 30;

export function NotificationsBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const unreadCount = items.filter((n) => !n.read_at).length;

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (!error && data) setItems(data as Notification[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev].slice(0, PAGE_SIZE));
          // Subtle toast
          toast({
            title: n.title,
            description: n.body ?? undefined,
          });
          // Optional: ding
          try {
            const audio = new Audio(
              "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
            );
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, toast]);

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
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
  };

  const handleClick = (n: Notification) => {
    if (!n.read_at) markRead(n.id);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="h-7 text-xs gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[420px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Nenhuma notificação ainda.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors flex gap-3",
                    !n.read_at && "bg-rose-light/30"
                  )}
                >
                  {!n.read_at && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-rose-gold flex-shrink-0" />
                  )}
                  <div className={cn("flex-1 min-w-0", n.read_at && "pl-5")}>
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {n.body}
                      </p>
                    )}
                    {(() => {
                      const d = n.created_at ? new Date(n.created_at) : null;
                      const valid = d && !isNaN(d.getTime());
                      return (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {valid
                            ? formatDistanceToNow(d!, { addSuffix: true, locale: ptBR })
                            : "agora"}
                        </p>
                      );
                    })()}
                  </div>
                  {!n.read_at && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(n.id);
                      }}
                      className="text-muted-foreground hover:text-foreground p-1"
                      aria-label="Marcar como lida"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
