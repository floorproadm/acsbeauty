import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  Mail,
  Globe,
  Instagram,
  Loader2,
  User,
  Clock,
  CheckCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Channel = "whatsapp" | "site" | "instagram" | "manual" | "email";
type Status = "open" | "pending" | "closed" | "snoozed";

interface Conversation {
  id: string;
  client_id: string | null;
  channel: Channel;
  external_id: string | null;
  status: Status;
  subject: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  tags: string[] | null;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  channel: string;
  body: string | null;
  template_name: string | null;
  delivery_status: string | null;
  ai_generated: boolean;
  created_at: string;
}

const channelIcon = (c: Channel) => {
  switch (c) {
    case "whatsapp":
      return <Phone className="w-3 h-3" />;
    case "site":
      return <Globe className="w-3 h-3" />;
    case "instagram":
      return <Instagram className="w-3 h-3" />;
    case "email":
      return <Mail className="w-3 h-3" />;
    default:
      return <MessageSquare className="w-3 h-3" />;
  }
};

const channelColor = (c: Channel) => {
  switch (c) {
    case "whatsapp":
      return "bg-green-500/10 text-green-700 border-green-500/30";
    case "site":
      return "bg-blue-500/10 text-blue-700 border-blue-500/30";
    case "instagram":
      return "bg-pink-500/10 text-pink-700 border-pink-500/30";
    case "email":
      return "bg-purple-500/10 text-purple-700 border-purple-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function ConversationsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | Channel>("all");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Conversations list ─────────────────────────────────────
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", filter],
    queryFn: async () => {
      let q = supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(100);
      if (filter === "unread") q = q.gt("unread_count", 0);
      else if (filter !== "all") q = q.eq("channel", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
  });

  // ── Selected conversation messages ─────────────────────────
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    enabled: !!selectedId,
  });

  const selectedConv = conversations.find((c) => c.id === selectedId);

  // ── Client details (sidebar) ───────────────────────────────
  const { data: client } = useQuery({
    queryKey: ["conv-client", selectedConv?.client_id],
    queryFn: async () => {
      if (!selectedConv?.client_id) return null;
      const { data } = await supabase
        .from("clients")
        .select("id, name, phone, email, tags, notes, last_visit_at")
        .eq("id", selectedConv.client_id)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedConv?.client_id,
  });

  const { data: clientBookings = [] } = useQuery({
    queryKey: ["conv-client-bookings", selectedConv?.client_id],
    queryFn: async () => {
      if (!selectedConv?.client_id) return [];
      const { data } = await supabase
        .from("bookings")
        .select("id, start_time, status, services(name)")
        .eq("client_id", selectedConv.client_id)
        .order("start_time", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!selectedConv?.client_id,
  });

  // ── Realtime subscription ──────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("inbox-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          if (newMsg.conversation_id === selectedId) {
            queryClient.invalidateQueries({ queryKey: ["messages", selectedId] });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedId]);

  // ── Auto-scroll to latest message ──────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Mark as read on select ─────────────────────────────────
  useEffect(() => {
    if (!selectedId) return;
    const conv = conversations.find((c) => c.id === selectedId);
    if (conv && conv.unread_count > 0) {
      supabase
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", selectedId)
        .then(() => queryClient.invalidateQueries({ queryKey: ["conversations"] }));
    }
  }, [selectedId, conversations, queryClient]);

  // ── Send message ───────────────────────────────────────────
  const handleSend = async () => {
    if (!reply.trim() || !selectedConv) return;
    setSending(true);
    try {
      if (selectedConv.channel === "whatsapp" && selectedConv.external_id) {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.functions.invoke("whatsapp-send", {
          body: {
            to: selectedConv.external_id,
            type: "text",
            body: reply,
            conversation_id: selectedConv.id,
            client_id: selectedConv.client_id,
            sender_id: user?.id,
          },
        });
        if (error) throw error;
      } else {
        // Manual / non-WA channel — just log a message
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("messages").insert({
          conversation_id: selectedConv.id,
          direction: "out",
          channel: selectedConv.channel,
          body: reply,
          sender_id: user?.id,
          delivery_status: "sent",
        });
        if (error) throw error;
      }
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["messages", selectedConv.id] });
    } catch (err: any) {
      toast({
        title: "Erro ao enviar",
        description: err?.message ?? "Falha desconhecida",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // ── Filtered list (search) ─────────────────────────────────
  const filteredConvs = conversations.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.subject?.toLowerCase().includes(s) ||
      c.external_id?.toLowerCase().includes(s) ||
      c.last_message_preview?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-card rounded-lg border border-border overflow-hidden">
      {/* ── LEFT: Conversation list ─────────────────────────── */}
      <aside className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-background/40">
        <div className="p-4 border-b border-border">
          <h2 className="font-serif text-xl mb-3">Conversas</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-none">
            {(["all", "unread", "whatsapp", "site", "instagram"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-all",
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {f === "all" ? "Todas" : f === "unread" ? "Não lidas" : f}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Nenhuma conversa ainda.
              <p className="text-xs mt-2">
                Conversas aparecerão aqui assim que clientes interagirem via WhatsApp ou site.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-muted/40 transition-colors flex gap-3 items-start",
                    selectedId === conv.id && "bg-muted/60"
                  )}
                >
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {(conv.subject ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">
                        {conv.subject ?? conv.external_id ?? "Sem nome"}
                      </p>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(conv.last_message_at), {
                            locale: ptBR,
                            addSuffix: false,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] py-0 px-1.5 h-4 gap-1", channelColor(conv.channel))}
                      >
                        {channelIcon(conv.channel)}
                        {conv.channel}
                      </Badge>
                      {conv.unread_count > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-[9px] h-4 px-1.5">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.last_message_preview ?? "Sem mensagens"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* ── CENTER: Chat ─────────────────────────────────────── */}
      <main className="hidden md:flex flex-1 flex-col bg-background/20">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground p-8">
            <div>
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecione uma conversa para começar</p>
            </div>
          </div>
        ) : (
          <>
            <header className="p-4 border-b border-border flex items-center gap-3 bg-card/40">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {(selectedConv.subject ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {selectedConv.subject ?? selectedConv.external_id}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {selectedConv.channel} · {selectedConv.status}
                </p>
              </div>
            </header>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-2xl mx-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.direction === "out" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                        msg.direction === "out"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      {msg.template_name && (
                        <p className="text-[10px] opacity-70 mb-1 uppercase tracking-wider">
                          📋 {msg.template_name}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.body ?? "[mídia]"}</p>
                      <div className="flex items-center gap-1 justify-end mt-1 text-[10px] opacity-70">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {msg.direction === "out" && msg.delivery_status && (
                          <>
                            {msg.delivery_status === "failed" ? (
                              <AlertCircle className="w-3 h-3 text-red-300" />
                            ) : (
                              <CheckCheck
                                className={cn(
                                  "w-3 h-3",
                                  msg.delivery_status === "read" && "text-blue-300"
                                )}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <footer className="p-3 border-t border-border bg-card/40">
              <div className="flex gap-2 max-w-2xl mx-auto">
                <Input
                  placeholder={
                    selectedConv.channel === "whatsapp"
                      ? "Resposta livre (apenas dentro de 24h após última msg do cliente)"
                      : "Digite sua resposta..."
                  }
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={sending}
                />
                <Button onClick={handleSend} disabled={!reply.trim() || sending} size="icon">
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </footer>
          </>
        )}
      </main>

      {/* ── RIGHT: Client details ────────────────────────────── */}
      {selectedConv && (
        <aside className="hidden xl:flex w-72 border-l border-border flex-col bg-background/40">
          <div className="p-4 border-b border-border">
            <h3 className="font-serif text-sm uppercase tracking-wider text-muted-foreground">
              Cliente
            </h3>
          </div>
          <ScrollArea className="flex-1 p-4 space-y-4">
            {client ? (
              <>
                <div className="text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-2">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {client.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{client.name}</p>
                  {client.phone && (
                    <p className="text-xs text-muted-foreground mt-1">{client.phone}</p>
                  )}
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Últimos agendamentos
                  </p>
                  {clientBookings.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum agendamento</p>
                  ) : (
                    <div className="space-y-2">
                      {clientBookings.map((b: any) => (
                        <div key={b.id} className="text-xs bg-muted/50 rounded p-2">
                          <p className="font-medium">{b.services?.name ?? "—"}</p>
                          <p className="text-muted-foreground">
                            {new Date(b.start_time).toLocaleDateString("pt-BR")} · {b.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {client.tags && client.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {client.tags.map((t: string) => (
                          <Badge key={t} variant="outline" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Cliente não vinculado</p>
                <p className="text-xs mt-2">
                  Esta conversa veio de um número desconhecido. Você pode vincular a um cliente do
                  CRM.
                </p>
              </div>
            )}
          </ScrollArea>
        </aside>
      )}
    </div>
  );
}
