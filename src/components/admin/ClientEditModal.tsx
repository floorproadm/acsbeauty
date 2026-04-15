import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, Save, Loader2, CalendarIcon, MessageCircle, CheckCircle2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ClientEditModalProps {
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    birthday?: string | null;
    notes?: string | null;
    acquisition_source?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  mode?: "edit" | "create";
}

export function ClientEditModal({ client, open, onOpenChange, onDeleted, mode = "edit" }: ClientEditModalProps) {
  const isCreateMode = mode === "create";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: null as Date | null,
    notes: "",
    acquisition_source: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdName, setCreatedName] = useState("");
  const [createdPhone, setCreatedPhone] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (client && !isCreateMode) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        birthday: client.birthday ? parseISO(client.birthday) : null,
        notes: (client as any).notes || "",
        acquisition_source: (client as any).acquisition_source || "",
      });
    }
  }, [client, isCreateMode]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setShowSuccess(false);
      if (isCreateMode) {
        setFormData({ name: "", email: "", phone: "", birthday: null, notes: "", acquisition_source: "" });
      }
    }
  }, [open, isCreateMode]);

  const updateClient = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!client) return;
      const { error } = await supabase
        .from("clients")
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          birthday: data.birthday ? format(data.birthday, "yyyy-MM-dd") : null,
          notes: data.notes || null,
          acquisition_source: data.acquisition_source || null,
        })
        .eq("id", client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-detail"] });
      toast({ title: "Cliente atualizado!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const createClient = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      const { error } = await supabase
        .from("clients")
        .insert({ name: data.name, phone: data.phone || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      setCreatedName(formData.name);
      setCreatedPhone(formData.phone);
      setShowSuccess(true);
    },
    onError: () => {
      toast({ title: "Erro ao criar cliente", variant: "destructive" });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async () => {
      if (!client) return;
      const { error: bookingsError } = await supabase
        .from("bookings")
        .delete()
        .eq("client_id", client.id);
      if (bookingsError) throw bookingsError;
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast({ title: "Cliente excluído com sucesso!" });
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Erro ao excluir",
        description: "Apenas admins podem excluir clientes.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    if (isCreateMode) {
      if (!formData.phone.trim()) {
        toast({ title: "Telefone é obrigatório", variant: "destructive" });
        return;
      }
      createClient.mutate({ name: formData.name, phone: formData.phone });
    } else {
      updateClient.mutate(formData);
    }
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = createdPhone.replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.startsWith("1") ? cleanPhone : `1${cleanPhone}`;
    const message = `Olá ${createdName}! 👋 Seu cadastro na ACS Beauty foi iniciado. Complete seu perfil para agendar online e acumular ACS Points: ${window.location.origin}/onboarding`;
    const waUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleClose = () => {
    setShowSuccess(false);
    setFormData({ name: "", email: "", phone: "", birthday: null, notes: "", acquisition_source: "" });
    onOpenChange(false);
  };

  // For edit mode, require client
  if (!isCreateMode && !client) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Cliente criado!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                <strong>{createdName}</strong> foi adicionado(a) com sucesso.
                Envie um convite via WhatsApp para que complete o cadastro.
              </p>
              {createdPhone && (
                <Button
                  onClick={handleSendWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar convite via WhatsApp
                </Button>
              )}
              <Button variant="outline" onClick={handleClose} className="w-full">
                <X className="w-4 h-4 mr-2" />
                Fechar
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{isCreateMode ? "Novo Cliente" : "Editar Cliente"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone {isCreateMode ? "*" : ""}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(XXX) XXX-XXXX"
                />
              </div>

              {!isCreateMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Aniversário</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.birthday && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.birthday
                            ? format(formData.birthday, "dd/MM/yyyy", { locale: ptBR })
                            : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.birthday || undefined}
                          onSelect={(date) =>
                            setFormData({ ...formData, birthday: date || null })
                          }
                          locale={ptBR}
                          className="pointer-events-auto"
                          captionLayout="dropdown-buttons"
                          fromYear={1940}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}

              {!isCreateMode && (
                <>
                  <div className="space-y-2">
                    <Label>Fonte de Aquisição</Label>
                    <Select
                      value={formData.acquisition_source || ""}
                      onValueChange={(val) => setFormData({ ...formData, acquisition_source: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Como conheceu?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="indicacao">Indicação</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="walk_in">Walk-in</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas Internas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ex: alérgica a henna, prefere horário da manhã..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isCreateMode ? createClient.isPending : updateClient.isPending}
                >
                  {(isCreateMode ? createClient.isPending : updateClient.isPending) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isCreateMode ? "Criar Cliente" : "Salvar"}
                </Button>
              </div>

              {/* Delete Section - only in edit mode */}
              {!isCreateMode && (
                <div className="pt-4 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Cliente
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir? Esta ação não pode ser desfeita e irá
                          remover todos os agendamentos associados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteClient.mutate()}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {deleteClient.isPending ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
