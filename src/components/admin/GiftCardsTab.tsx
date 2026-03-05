import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Gift, Search, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  paid: { label: "Pago", variant: "default" },
  delivered: { label: "Entregue", variant: "secondary" },
  redeemed: { label: "Resgatado", variant: "secondary" },
  expired: { label: "Expirado", variant: "destructive" },
};

export function GiftCardsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: giftCards, isLoading } = useQuery({
    queryKey: ["admin-gift-cards", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("gift_cards")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("gift_cards")
        .update({ status: "paid" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
      toast({ title: "Pagamento confirmado!" });
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
    ?.filter((gc) => gc.status === "paid" || gc.status === "delivered" || gc.status === "redeemed")
    .reduce((sum, gc) => sum + Number(gc.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Gift Cards
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
          <Input
            placeholder="Buscar por código, nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="redeemed">Resgatado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
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
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum gift card encontrado
                  </TableCell>
                </TableRow>
              )}
              {filtered?.map((gc) => {
                const st = STATUS_MAP[gc.status] || STATUS_MAP.pending;
                return (
                  <TableRow key={gc.id}>
                    <TableCell className="font-mono text-xs">{gc.code}</TableCell>
                    <TableCell className="font-medium">${Number(gc.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{gc.buyer_name}</p>
                        <p className="text-xs text-muted-foreground">{gc.buyer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{gc.recipient_name}</p>
                        <p className="text-xs text-muted-foreground">{gc.recipient_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs capitalize">{gc.payment_method || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(gc.created_at), "dd/MM/yy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {gc.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => confirmMutation.mutate(gc.id)}
                          disabled={confirmMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Confirmar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
