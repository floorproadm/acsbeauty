import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Gift, Search, CheckCircle, Loader2, Trash2, Copy } from "lucide-react";
import { format } from "date-fns";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  paid: { label: "Pago", variant: "default" },
  delivered: { label: "Entregue", variant: "secondary" },
  redeemed: { label: "Resgatado", variant: "secondary" },
  expired: { label: "Expirado", variant: "destructive" },
};

type GiftCard = {
  id: string;
  code: string;
  amount: number;
  balance: number;
  status: string;
  buyer_name: string;
  buyer_email: string;
  recipient_name: string;
  recipient_email: string;
  occasion: string | null;
  personal_message: string | null;
  payment_method: string | null;
  created_at: string;
  delivered_at: string | null;
  expires_at: string | null;
  stripe_payment_intent_id: string | null;
};

export function GiftCardsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<GiftCard | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: giftCards, isLoading } = useQuery({
    queryKey: ["admin-gift-cards", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("gift_cards")
        .select("*")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as GiftCard[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gift_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
      setSelected(null);
      toast({ title: "Gift card excluído!" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "delivered") updates.delivered_at = new Date().toISOString();
      const { error } = await supabase.from("gift_cards").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
      setSelected((prev) => prev ? { ...prev, status: vars.status } : null);
      toast({ title: "Status atualizado!" });
    },
  });

  const filtered = giftCards?.filter((gc) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      gc.code?.toLowerCase().includes(s) ||
      gc.buyer_name?.toLowerCase().includes(s) ||
      gc.recipient_name?.toLowerCase().includes(s) ||
      gc.buyer_email?.toLowerCase().includes(s)
    );
  });

  const totalRevenue = giftCards
    ?.filter((gc) => ["paid", "delivered", "redeemed"].includes(gc.status))
    .reduce((sum, gc) => sum + Number(gc.amount), 0) || 0;

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] break-words">{value || "—"}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" /> Gift Cards
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {giftCards?.length || 0} gift cards · Receita: ${totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por código, nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="redeemed">Resgatado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : isMobile ? (
        /* Mobile card list */
        <div className="space-y-3">
          {filtered?.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum gift card encontrado</p>}
          {filtered?.map((gc) => {
            const st = STATUS_MAP[gc.status] || STATUS_MAP.pending;
            return (
              <button key={gc.id} onClick={() => setSelected(gc)} className="w-full text-left rounded-xl border border-border bg-card p-4 active:bg-accent transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted-foreground">{gc.code}</span>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{gc.recipient_name}</p>
                    <p className="text-xs text-muted-foreground">de {gc.buyer_name}</p>
                  </div>
                  <p className="text-lg font-semibold">${Number(gc.amount).toFixed(2)}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Desktop table */
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum gift card encontrado</TableCell></TableRow>
              )}
              {filtered?.map((gc) => {
                const st = STATUS_MAP[gc.status] || STATUS_MAP.pending;
                return (
                  <TableRow key={gc.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelected(gc)}>
                    <TableCell className="font-mono text-xs">{gc.code}</TableCell>
                    <TableCell className="font-medium">${Number(gc.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <p className="text-sm">{gc.buyer_name}</p>
                      <p className="text-xs text-muted-foreground">{gc.buyer_email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{gc.recipient_name}</p>
                      <p className="text-xs text-muted-foreground">{gc.recipient_email}</p>
                    </TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell className="text-xs capitalize">{gc.payment_method || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(gc.created_at), "dd/MM/yy HH:mm")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[85vh] rounded-t-2xl overflow-y-auto" : "sm:max-w-md overflow-y-auto"}>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" /> Gift Card
                </SheetTitle>
                <SheetDescription>
                  <button
                    className="font-mono text-sm flex items-center gap-1 hover:text-primary transition-colors"
                    onClick={() => { navigator.clipboard.writeText(selected.code); toast({ title: "Código copiado!" }); }}
                  >
                    {selected.code} <Copy className="w-3 h-3" />
                  </button>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Amount & Status */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-2xl font-bold">${Number(selected.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Saldo: ${Number(selected.balance).toFixed(2)}</p>
                  </div>
                  <Badge variant={(STATUS_MAP[selected.status] || STATUS_MAP.pending).variant} className="text-sm px-3 py-1">
                    {(STATUS_MAP[selected.status] || STATUS_MAP.pending).label}
                  </Badge>
                </div>

                {/* Status update */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Alterar status</label>
                  <Select value={selected.status} onValueChange={(val) => statusMutation.mutate({ id: selected.id, status: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="redeemed">Resgatado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Buyer */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Comprador</h4>
                  <DetailRow label="Nome" value={selected.buyer_name} />
                  <DetailRow label="Email" value={selected.buyer_email} />
                </div>

                {/* Recipient */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Destinatário</h4>
                  <DetailRow label="Nome" value={selected.recipient_name} />
                  <DetailRow label="Email" value={selected.recipient_email} />
                </div>

                {/* Details */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detalhes</h4>
                  <DetailRow label="Ocasião" value={selected.occasion} />
                  {selected.personal_message && <DetailRow label="Mensagem" value={selected.personal_message} />}
                  <DetailRow label="Pagamento" value={selected.payment_method} />
                  <DetailRow label="Criado em" value={format(new Date(selected.created_at), "dd/MM/yyyy HH:mm")} />
                  <DetailRow label="Entregue em" value={selected.delivered_at ? format(new Date(selected.delivered_at), "dd/MM/yyyy HH:mm") : null} />
                  <DetailRow label="Expira em" value={selected.expires_at ? format(new Date(selected.expires_at), "dd/MM/yyyy") : null} />
                </div>

                {/* Delete */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" size="lg">
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir Gift Card
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir gift card?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o gift card <span className="font-mono font-bold">{selected.code}</span>? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(selected.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
