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
    setServiceIds([]);
    setPriceEdited(false);
    setTotalPrice("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setTime(format(new Date(), "HH:mm"));
    setPaymentMethod("");
    setOrigin("");
    setNotes("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const selected = services.filter((s) => serviceIds.includes(s.id));
      const totalDuration = selected.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0) || 60;
      const startTime = new Date(`${date}T${time}`);
      const endTime = addMinutes(startTime, totalDuration);
      const originPrefix = origin ? `[${ORIGINS.find((o) => o.value === origin)?.label ?? origin}] ` : "";
      const servicesNote = selected.length > 1
        ? `Serviços: ${selected.map((s) => s.name).join(", ")}. `
        : "";

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
        service_id: selected[0]?.id ?? null,
        total_price: parseFloat(totalPrice) || 0,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "completed",
        payment_method: paymentMethod,
        notes: `${originPrefix}${servicesNote}${notes}`.trim() || null,
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
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl p-5">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="font-serif text-base font-normal">Novo pagamento</SheetTitle>
          <SheetDescription className="sr-only">Registrar pagamento manual</SheetDescription>
        </SheetHeader>

        <div className="space-y-3 pb-4">
          {/* Cliente */}
          <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-left hover:bg-accent/40 transition-colors"
              >
                <span className={cn("truncate", !clientName && "text-muted-foreground")}>
                  {clientName
                    ? `${clientName}${clientPhone ? ` · ${clientPhone}` : ""}`
                    : "Cliente"}
                </span>
                {clientId ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); clearClient(); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); clearClient(); } }}
                    className="text-[11px] text-muted-foreground hover:text-foreground ml-2"
                  >
                    limpar
                  </span>
                ) : (
                  <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0 ml-2" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Buscar nome ou telefone..."
                  value={clientSearch}
                  onValueChange={setClientSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    <div className="py-3 text-center text-xs text-muted-foreground">
                      Nenhum cliente.
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
                        <Check className={cn("w-4 h-4", clientId === c.id ? "opacity-100" : "opacity-0")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{c.name}</p>
                          {c.phone && <p className="text-[11px] text-muted-foreground truncate">{c.phone}</p>}
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

          {/* Telefone — só para cliente novo */}
          {!clientId && clientName && (
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="Telefone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value.replace(/[^0-9+\-() ]/g, ""))}
            />
          )}

          {/* Serviços */}
          <div className="flex flex-wrap gap-1.5">
            {services.map((s) => {
              const active = serviceIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-full text-xs transition-colors border",
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
                  )}
                >
                  {s.name}
                </button>
              );
            })}
          </div>

          {/* Valor + Data + Hora */}
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="$ 0.00"
              value={totalPrice}
              onChange={(e) => { setTotalPrice(e.target.value); setPriceEdited(true); }}
            />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          {/* Pagamento */}
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setPaymentMethod(m.value)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-colors border",
                  paymentMethod === m.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
                )}
              >
                <m.icon className="w-3 h-3" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Mais opções (origem + nota) */}
          <details className="group">
            <summary className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer select-none list-none">
              + origem & nota
            </summary>
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {ORIGINS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setOrigin(origin === o.value ? "" : o.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-colors border",
                      origin === o.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
                    )}
                  >
                    <o.icon className="w-3 h-3" />
                    {o.label}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Observação"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
              />
            </div>
          </details>

          <button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            className={cn(
              "w-full py-2.5 rounded-lg text-sm font-medium transition-colors",
              isValid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {mutation.isPending ? "Salvando..." : "Registrar"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
