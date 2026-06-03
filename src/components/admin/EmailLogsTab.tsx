import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, RefreshCw, AlertCircle, CheckCircle2, Search } from "lucide-react";

type TypeFilter = "all" | "birthday" | "prep_reminder" | "client:booking_confirmed" | "client:booking_cancelled" | "client:booking_rescheduled" | "client:giftcard" | "internal";
type StatusFilter = "all" | "sent" | "failed";

const typeLabels: Record<string, { label: string; color: string }> = {
  birthday: { label: "🎂 Aniversário", color: "bg-pink-100 text-pink-800" },
  prep_reminder: { label: "💅 Lembrete 24h", color: "bg-amber-100 text-amber-800" },
  "client:booking_confirmed": { label: "✅ Confirmado", color: "bg-green-100 text-green-800" },
  "client:booking_cancelled": { label: "❌ Cancelado", color: "bg-red-100 text-red-800" },
  "client:booking_rescheduled": { label: "📅 Remarcado", color: "bg-blue-100 text-blue-800" },
  "client:giftcard": { label: "🎁 Gift Card", color: "bg-purple-100 text-purple-800" },
};

function getTypeLabel(t: string): { label: string; color: string } {
  if (typeLabels[t]) return typeLabels[t];
  if (t.startsWith("internal:")) return { label: `📋 ${t.replace("internal:", "")}`, color: "bg-gray-100 text-gray-700" };
  return { label: t, color: "bg-gray-100 text-gray-700" };
}

export function EmailLogsTab() {
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [from, setFrom] = useState<string>(format(sevenDaysAgo, "yyyy-MM-dd"));
  const [to, setTo] = useState<string>(format(today, "yyyy-MM-dd"));
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [includeInternal, setIncludeInternal] = useState(false);

  const { data: logs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["email-logs", from, to, typeFilter, statusFilter, search, includeInternal],
    queryFn: async () => {
      let q = supabase
        .from("email_logs")
        .select("*")
        .gte("sent_at", `${from}T00:00:00`)
        .lte("sent_at", `${to}T23:59:59`)
        .order("sent_at", { ascending: false })
        .limit(500);

      if (typeFilter !== "all") {
        if (typeFilter === "internal") q = q.like("email_type", "internal:%");
        else q = q.eq("email_type", typeFilter);
      } else if (!includeInternal) {
        q = q.not("email_type", "like", "internal:%");
      }
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (search.trim()) {
        const s = search.trim();
        q = q.or(`recipient_email.ilike.%${s}%,recipient_name.ilike.%${s}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const stats = {
    total: logs?.length || 0,
    sent: logs?.filter(l => l.status === "sent").length || 0,
    failed: logs?.filter(l => l.status === "failed").length || 0,
  };

  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    setFrom(format(start, "yyyy-MM-dd"));
    setTo(format(end, "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6" /> Logs de Email
          </h1>
          <p className="text-sm text-muted-foreground">
            Histórico de envios automatizados (aniversário, preparo, status, gift cards).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-serif">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-green-700">Enviados</CardTitle></CardHeader>
          <CardContent className="flex items-baseline gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-3xl font-serif text-green-700">{stats.sent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-red-700">Falhas</CardTitle></CardHeader>
          <CardContent className="flex items-baseline gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-3xl font-serif text-red-700">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreset(0)}>Hoje</Button>
            <Button variant="outline" size="sm" onClick={() => setPreset(7)}>7 dias</Button>
            <Button variant="outline" size="sm" onClick={() => setPreset(30)}>30 dias</Button>
            <Button variant="outline" size="sm" onClick={() => setPreset(90)}>90 dias</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="birthday">🎂 Aniversário</SelectItem>
                  <SelectItem value="prep_reminder">💅 Lembrete 24h</SelectItem>
                  <SelectItem value="client:booking_confirmed">✅ Confirmação</SelectItem>
                  <SelectItem value="client:booking_cancelled">❌ Cancelamento</SelectItem>
                  <SelectItem value="client:booking_rescheduled">📅 Remarcação</SelectItem>
                  <SelectItem value="client:giftcard">🎁 Gift Card</SelectItem>
                  <SelectItem value="internal">📋 Internos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="failed">Falhas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Cliente (email/nome)</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="email@..." />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={includeInternal} onChange={(e) => setIncludeInternal(e.target.checked)} />
            Incluir notificações internas (envios para o estúdio)
          </label>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Nenhum email encontrado no período/filtros selecionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Quando</TableHead>
                    <TableHead className="w-[160px]">Tipo</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => {
                    const t = getTypeLabel(log.email_type);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.sent_at), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={t.color}>{t.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{log.recipient_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{log.recipient_email}</div>
                        </TableCell>
                        <TableCell className="text-sm max-w-md truncate" title={log.subject || ""}>
                          {log.subject || "—"}
                          {log.error_message && (
                            <div className="text-xs text-red-600 mt-1">{log.error_message}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.status === "sent" ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enviado</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Falha</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {logs.length === 500 && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Mostrando os 500 envios mais recentes. Refine os filtros para ver mais.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
