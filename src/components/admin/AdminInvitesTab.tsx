import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, MailPlus, Send, ShieldCheck } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

const roleLabels: Record<AppRole, string> = {
  admin_owner: "Admin",
  staff: "Staff",
  marketing: "Marketing",
};

const statusBadge: Record<InviteStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  expired: "bg-zinc-200 text-zinc-600",
  revoked: "bg-rose-100 text-rose-700",
};

const statusLabel: Record<InviteStatus, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  expired: "Expirado",
  revoked: "Revogado",
};

export function AdminInvitesTab() {
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("staff");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: invites, isLoading } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_invites" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      const { data, error } = await supabase.functions.invoke("invite-admin", {
        body: { email, role },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      setNewEmail("");
      toast({ title: "Convite enviado", description: "O convidado receberá um email com o link." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const manageMutation = useMutation({
    mutationFn: async ({ inviteId, action }: { inviteId: string; action: "revoke" | "resend" }) => {
      const { data, error } = await supabase.functions.invoke("manage-admin-invite", {
        body: { invite_id: inviteId, action },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      toast({
        title: vars.action === "revoke" ? "Convite revogado" : "Convite reenviado",
      });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    inviteMutation.mutate({ email: newEmail, role: newRole });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-rose-gold" />
        <div>
          <h2 className="text-lg font-semibold">Convites de Admin</h2>
          <p className="text-sm text-muted-foreground">
            Convide novos administradores via e-mail. O acesso é liberado após o convidado aceitar e criar a senha.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap items-center">
        <Input
          type="email"
          placeholder="convidado@email.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="max-w-sm"
          required
        />
        <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin_owner">Admin</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={inviteMutation.isPending} size="sm">
          {inviteMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <MailPlus className="w-4 h-4" />}
          Enviar convite
        </Button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviado</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum convite enviado ainda.
                  </TableCell>
                </TableRow>
              )}
              {invites?.map((inv) => {
                const status = inv.status as InviteStatus;
                const isPending = status === "pending";
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                        {roleLabels[inv.role as AppRole]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge[status])}>
                        {statusLabel[status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(inv.created_at), "dd MMM", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {isPending
                        ? formatDistanceToNow(new Date(inv.expires_at), { locale: ptBR, addSuffix: true })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {(isPending || status === "expired") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reenviar"
                            onClick={() => manageMutation.mutate({ inviteId: inv.id, action: "resend" })}
                            disabled={manageMutation.isPending}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        {isPending && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Revogar">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revogar convite?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O link enviado para <strong>{inv.email}</strong> deixará de funcionar imediatamente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => manageMutation.mutate({ inviteId: inv.id, action: "revoke" })}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Revogar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
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
