import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewBookingModal({ open, onOpenChange }: NewBookingModalProps) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceId, setServiceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ["admin-services-for-booking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, duration_minutes, price")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const selectedService = services?.find((s) => s.id === serviceId);

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (!date || !selectedService) return;

    setIsLoadingSlots(true);
    try {
      const response = await supabase.functions.invoke("calendar-availability", {
        body: { date: format(date, "yyyy-MM-dd"), service_duration_minutes: selectedService.duration_minutes },
      });
      setSlots(response.data?.available_slots || []);
    } catch {
      toast({ title: "Erro ao carregar horários", variant: "destructive" });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot || !clientName || !clientEmail) throw new Error("Preencha todos os campos obrigatórios");

      const response = await supabase.functions.invoke("calendar-confirm-booking", {
        body: {
          client_name: clientName.trim(),
          client_email: clientEmail.trim(),
          client_phone: clientPhone.trim() || null,
          service_id: serviceId || null,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
          notes: notes.trim() || null,
          total_price: selectedService?.price || null,
          skip_hold: true,
        },
      });
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Erro desconhecido");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-today-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sidebar-pending"] });
      toast({ title: "Agendamento criado com sucesso!" });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ title: "Erro ao criar agendamento", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setServiceId("");
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setNotes("");
    setSlots([]);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>Preencha os dados para criar um agendamento manualmente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="clientName">Nome do cliente *</Label>
              <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientEmail">Email *</Label>
              <Input id="clientEmail" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientPhone">Telefone</Label>
              <Input id="clientPhone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>

          {/* Service */}
          <div className="space-y-1.5">
            <Label>Serviço</Label>
            <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setSelectedDate(undefined); setSelectedSlot(null); setSlots([]); }}>
              <SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
              <SelectContent>
                {services?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes}min - R${s.price?.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          {serviceId && (
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 1}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Time Slots */}
          {isLoadingSlots && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {selectedDate && !isLoadingSlots && slots.length > 0 && (
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <Button
                    key={slot.start}
                    variant={selectedSlot?.start === slot.start ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {format(parseISO(slot.start), "HH:mm")}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {selectedDate && !isLoadingSlots && slots.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">Nenhum horário disponível nesta data.</p>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações sobre o agendamento..." rows={2} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => createBookingMutation.mutate()}
            disabled={!clientName || !clientEmail || !selectedSlot || createBookingMutation.isPending}
          >
            {createBookingMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Criar Agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}