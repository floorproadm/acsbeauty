import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Banknote, CreditCard, MessageCircle, Phone, Footprints, Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { addMinutes, format } from "date-fns";

const PAYMENT_METHODS = [
  { value: "cash", label: "Dinheiro", icon: Banknote },
  { value: "zelle", label: "Zelle", icon: CreditCard },
  { value: "venmo", label: "Venmo", icon: CreditCard },
  { value: "card", label: "Cartão", icon: CreditCard },
  { value: "at_location", label: "Presencial", icon: Banknote },
];

const ORIGINS = [
  { value: "walk-in", label: "Walk-in", icon: Footprints },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "ligacao", label: "Ligação", icon: Phone },
];

interface ManualPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualPaymentSheet({ open, onOpenChange }: ManualPaymentSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [priceEdited, setPriceEdited] = useState(false);
  const [totalPrice, setTotalPrice] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [origin, setOrigin] = useState("");
  const [notes, setNotes] = useState("");

  const { data: services = [] } = useQuery({
    queryKey: ["active-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, duration_minutes")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["crm-clients-picker", clientSearch],
    enabled: clientPickerOpen,
    queryFn: async () => {
      let q = supabase
        .from("clients")
        .select("id, name, phone, email")
        .order("name")
        .limit(50);
      if (clientSearch.trim()) {
        const s = `%${clientSearch.trim()}%`;
        q = q.or(`name.ilike.${s},phone.ilike.${s}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleService = (id: string) => {
    setServiceIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!priceEdited) {
        const sum = next.reduce((acc, sid) => {
          const s = services.find((x) => x.id === sid);
          return acc + (Number(s?.price) || 0);
        }, 0);
        setTotalPrice(sum > 0 ? String(sum) : "");
      }
      return next;
    });
  };

  const selectClient = (c: { id: string; name: string; phone: string | null }) => {
    setClientId(c.id);
    setClientName(c.name);
    setClientPhone(c.phone ?? "");
    setClientPickerOpen(false);
  };

  const clearClient = () => {
    setClientId(null);
    setClientName("");
    setClientPhone("");
  };

  const resetForm = () => {
    setClientId(null);
    setClientName("");
    setClientPhone("");
    setClientSearch("");
    setServiceId("");
    setTotalPrice("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setTime(format(new Date(), "HH:mm"));
    setPaymentMethod("");
    setOrigin("");
    setNotes("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const svc = services.find((s) => s.id === serviceId);
      const startTime = new Date(`${date}T${time}`);
      const endTime = addMinutes(startTime, svc?.duration_minutes ?? 60);
      const originPrefix = origin ? `[${ORIGINS.find((o) => o.value === origin)?.label ?? origin}] ` : "";

      // Create client in CRM if none selected
      let finalClientId = clientId;
      if (!finalClientId && clientName.trim() && clientPhone.trim()) {
        const { data: newClient, error: cErr } = await supabase
          .from("clients")
          .insert({
            name: clientName.trim(),
            phone: clientPhone.trim(),
            acquisition_source: origin || "walk-in",
          })
          .select("id")
          .single();
        if (cErr) throw cErr;
        finalClientId = newClient.id;
      }

      const { error } = await supabase.from("bookings").insert({
        client_id: finalClientId,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_email: `manual_${Date.now()}@acsbeauty.app`,
        service_id: serviceId || null,
        total_price: parseFloat(totalPrice) || 0,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "completed",
        payment_method: paymentMethod,
        notes: `${originPrefix}${notes}`.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast({ title: "Pagamento registrado com sucesso!" });
      resetForm();
      onOpenChange(false);
    },
    onError: () => toast({ title: "Erro ao registrar", variant: "destructive" }),
  });

  const isValid = (clientId || (clientName.trim() && clientPhone.trim())) && paymentMethod && totalPrice;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="font-serif text-lg">Registrar Pagamento</SheetTitle>
          <SheetDescription className="text-xs">
            Walk-in, WhatsApp ou ligação
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* Client picker (CRM) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Cliente *</Label>
            <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-accent/40 transition-colors"
                >
                  <span className={cn("truncate", !clientName && "text-muted-foreground")}>
                    {clientName
                      ? `${clientName}${clientPhone ? ` · ${clientPhone}` : ""}`
                      : "Buscar cliente no CRM ou cadastrar novo"}
                  </span>
                  <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0 ml-2" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar por nome ou telefone..."
                    value={clientSearch}
                    onValueChange={setClientSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="py-3 text-center text-xs text-muted-foreground">
                        Nenhum cliente encontrado.
                        <p className="mt-1">Preencha nome e telefone abaixo para criar um novo.</p>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {clients.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.id}
                          onSelect={() => selectClient(c)}
                          className="flex items-center gap-2"
                        >
                          <Check
                            className={cn(
                              "w-4 h-4",
                              clientId === c.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{c.name}</p>
                            {c.phone && (
                              <p className="text-[11px] text-muted-foreground truncate">{c.phone}</p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                      {clientSearch.trim() && (
                        <CommandItem
                          value="__new__"
                          onSelect={() => {
                            setClientId(null);
                            setClientName(clientSearch.trim());
                            setClientPickerOpen(false);
                          }}
                          className="flex items-center gap-2 border-t border-border mt-1"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span className="text-sm">Criar "{clientSearch.trim()}"</span>
                        </CommandItem>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {clientId && (
              <button
                type="button"
                onClick={clearClient}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                Limpar seleção
              </button>
            )}
          </div>

          {/* Phone — só aparece se for cliente novo (sem registro no CRM) */}
          {!clientId && clientName && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Telefone *</Label>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="(000) 000-0000"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value.replace(/[^0-9+\-() ]/g, ""))}
              />
              <p className="text-[11px] text-muted-foreground">
                Cliente novo — telefone será salvo no CRM.
              </p>
            </div>
          )}

          {/* Service */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Serviço</Label>
            <Select value={serviceId} onValueChange={handleServiceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — ${s.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total price */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Valor ($) *</Label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Hora</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Origin pills */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Origem</Label>
            <div className="flex gap-2">
              {ORIGINS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOrigin(origin === o.value ? "" : o.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                    origin === o.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  )}
                >
                  <o.icon className="w-3.5 h-3.5" />
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment method pills */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Método de pagamento *</Label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                    paymentMethod === m.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  )}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Observação</Label>
            <Textarea
              placeholder="Alguma observação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Submit */}
          <button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            className={cn(
              "w-full py-3 rounded-xl text-sm font-semibold transition-colors",
              isValid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {mutation.isPending ? "Salvando..." : "Registrar pagamento"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
