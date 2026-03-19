import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger } from
"@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
"@/components/ui/popover";
import { Trash2, Save, Loader2, CalendarIcon } from "lucide-react";
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
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function ClientEditModal({ client, open, onOpenChange, onDeleted }: ClientEditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    
    birthday: null as Date | null
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        
        birthday: client.birthday ? parseISO(client.birthday) : null
      });
    }
  }, [client]);

  const updateClient = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!client) return;
      const { error } = await supabase.
      from("clients").
      update({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        
        birthday: data.birthday ? format(data.birthday, "yyyy-MM-dd") : null
      }).
      eq("id", client.id);

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
    }
  });

  const deleteClient = useMutation({
    mutationFn: async () => {
      if (!client) return;

      // First delete associated bookings
      const { error: bookingsError } = await supabase.
      from("bookings").
      delete().
      eq("client_id", client.id);

      if (bookingsError) throw bookingsError;

      // Then delete the client
      const { error } = await supabase.
      from("clients").
      delete().
      eq("id", client.id);

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
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    updateClient.mutate(formData);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do cliente" />
            
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com" />
            
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(XX) XXXXX-XXXX" />
            
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="@usuario" />
            
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
                  )}>
                  
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.birthday ?
                  format(formData.birthday, "dd/MM/yyyy", { locale: ptBR }) :
                  "Selecionar data"}
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
                  toYear={new Date().getFullYear()} />
                
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={updateClient.isPending}>
              {updateClient.isPending ?
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> :

              <Save className="w-4 h-4 mr-2" />
              }
              Salvar
            </Button>
          </div>

          {/* Delete Section */}
          <div className="pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Cliente
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir ? 
                    Esta ação não pode ser desfeita e irá remover todos os agendamentos associados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteClient.mutate()}
                    className="bg-red-600 hover:bg-red-700">
                    
                    {deleteClient.isPending ? "Excluindo..." : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </DialogContent>
    </Dialog>);

}