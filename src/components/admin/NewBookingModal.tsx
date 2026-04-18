import { useState, useEffect, useMemo } from "react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, Search, UserCheck, UserPlus, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// US phone format: (XXX) XXX-XXXX
const formatUSPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export function NewBookingModal({ open, onOpenChange }: NewBookingModalProps) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  const [staffId, setStaffId] = useState<string>("none");
  const [serviceId, setServiceId] = useState<string>("");
  const [skuId, setSkuId] = useState<string>("");
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [initialStatus, setInitialStatus] = useState<"confirmed" | "requested">("confirmed");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Staff list
  const { data: staffList } = useQuery({
    queryKey: ["admin-staff-for-booking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("user_id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Unified flat catalog: services + their SKUs (with variation labels) for a single searchable list
  const { data: catalog } = useQuery({
    queryKey: ["admin-booking-catalog"],
    queryFn: async () => {
      const [servicesRes, skusRes, variationsRes] = await Promise.all([
        supabase.from("services").select("id, name, category, duration_minutes, price").eq("is_active", true).order("category", { ascending: true }).order("name", { ascending: true }),
        supabase.from("service_skus").select("id, name, duration_minutes, price, promo_price, variation_id, service_id").eq("is_active", true).order("sort_order"),
        supabase.from("service_variations").select("id, name, service_id").eq("is_active", true),
      ]);
      if (servicesRes.error) throw servicesRes.error;
      if (skusRes.error) throw skusRes.error;
      if (variationsRes.error) throw variationsRes.error;

      const servicesData = servicesRes.data || [];
      const skusData = skusRes.data || [];
      const variationsData = variationsRes.data || [];
      const variationMap = new Map(variationsData.map((v) => [v.id, v.name]));

      type Entry = {
        key: string;
        serviceId: string;
        skuId: string | null;
        category: string;
        serviceName: string;
        variationName: string | null;
        skuName: string | null;
        duration: number;
        price: number | null;
        searchText: string;
      };
      const entries: Entry[] = [];
      const skusByService = new Map<string, typeof skusData>();
      skusData.forEach((s) => {
        const arr = skusByService.get(s.service_id) || [];
        arr.push(s);
        skusByService.set(s.service_id, arr);
      });

      servicesData.forEach((svc) => {
        const category = svc.category || "Outros";
        const svcSkus = skusByService.get(svc.id) || [];
        if (svcSkus.length === 0) {
          entries.push({
            key: `service-${svc.id}`,
            serviceId: svc.id,
            skuId: null,
            category,
            serviceName: svc.name,
            variationName: null,
            skuName: null,
            duration: svc.duration_minutes,
            price: svc.price != null ? Number(svc.price) : null,
            searchText: `${category} ${svc.name}`.toLowerCase(),
          });
        } else {
          svcSkus.forEach((sk) => {
            const variationName = sk.variation_id ? variationMap.get(sk.variation_id) || null : null;
            const price = sk.promo_price != null && Number(sk.promo_price) < Number(sk.price)
              ? Number(sk.promo_price)
              : (sk.price != null ? Number(sk.price) : null);
            entries.push({
              key: `sku-${sk.id}`,
              serviceId: svc.id,
              skuId: sk.id,
              category,
              serviceName: svc.name,
              variationName,
              skuName: sk.name,
              duration: sk.duration_minutes,
              price,
              searchText: `${category} ${svc.name} ${variationName || ""} ${sk.name}`.toLowerCase(),
            });
          });
        }
      });

      return entries;
    },
  });

  const selectedEntry = useMemo(
    () => catalog?.find((e) => (skuId ? e.skuId === skuId : e.serviceId === serviceId && e.skuId === null)),
    [catalog, serviceId, skuId]
  );

  // Client autocomplete
  const { data: clientResults } = useQuery({
    queryKey: ["admin-client-search", clientSearch],
    enabled: clientSearchOpen && clientSearch.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone, email")
        .or(`name.ilike.%${clientSearch}%,phone.ilike.%${clientSearch}%`)
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  // Detect if phone matches an existing client (returning vs new)
  const { data: matchedClient } = useQuery({
    queryKey: ["admin-client-by-phone", clientPhone],
    enabled: !clientId && clientPhone.replace(/\D/g, "").length === 10,
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .eq("phone", clientPhone)
        .maybeSingle();
      return data;
    },
  });

  // Effective duration & price come from selected catalog entry
  const effectiveDuration = selectedEntry?.duration ?? 0;
  const effectivePrice = selectedEntry?.price ?? null;
  const hasSelection = !!selectedEntry;

  // Reset slot when staff or service changes
  useEffect(() => {
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setSlots([]);
  }, [staffId, serviceId, skuId]);

  const handleClientSelect = (c: { id: string; name: string; phone: string | null; email: string | null }) => {
    setClientId(c.id);
    setClientName(c.name);
    setClientPhone(c.phone || "");
    setClientEmail(c.email || "");
    setClientSearchOpen(false);
    setClientSearch("");
  };

  const handleClearClient = () => {
    setClientId(null);
    setClientName("");
    setClientPhone("");
    setClientEmail("");
  };

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (!date || !effectiveDuration) return;

    setIsLoadingSlots(true);
    try {
      const response = await supabase.functions.invoke("calendar-availability", {
        body: {
          date: format(date, "yyyy-MM-dd"),
          service_duration_minutes: effectiveDuration,
          staff_id: staffId !== "none" ? staffId : undefined,
        },
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
      if (!selectedSlot || !clientName) throw new Error("Preencha cliente e horário");

      const response = await supabase.functions.invoke("calendar-confirm-booking", {
        body: {
          client_name: clientName.trim(),
          client_email: clientEmail.trim() || undefined,
          client_phone: clientPhone.trim() || undefined,
          service_id: serviceId || null,
          sku_id: skuId || null,
          staff_id: staffId !== "none" ? staffId : null,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
          notes: notes.trim() || null,
          total_price: effectivePrice,
          status: initialStatus,
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
    setClientId(null);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setStaffId("none");
    setServiceId("");
    setSkuId("");
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setNotes("");
    setSlots([]);
    setInitialStatus("confirmed");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const phoneIsComplete = clientPhone.replace(/\D/g, "").length === 10;
  const showNewClientBadge = phoneIsComplete && !clientId && matchedClient === null;
  const showReturningBadge = (clientId !== null) || (phoneIsComplete && matchedClient);

  const canSubmit = clientName.trim() &&
    selectedSlot &&
    hasSelection &&
    !createBookingMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>Preencha os dados para criar um agendamento manualmente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client search */}
          <div className="space-y-1.5">
            <Label>Buscar cliente existente</Label>
            <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-muted-foreground" type="button">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar por nome ou telefone…
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Digite nome ou telefone…"
                    value={clientSearch}
                    onValueChange={setClientSearch}
                  />
                  <CommandList>
                    {clientSearch.length < 2 && (
                      <div className="py-6 text-center text-xs text-muted-foreground">Digite ao menos 2 caracteres</div>
                    )}
                    {clientSearch.length >= 2 && (
                      <>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {clientResults?.map((c) => (
                            <CommandItem key={c.id} value={c.id} onSelect={() => handleClientSelect(c)}>
                              <div className="flex flex-col">
                                <span className="font-medium">{c.name}</span>
                                <span className="text-xs text-muted-foreground">{c.phone || c.email || "—"}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="clientName">Nome do cliente *</Label>
                <div className="flex items-center gap-2">
                  {showReturningBadge && (
                    <Badge variant="secondary" className="gap-1"><UserCheck className="w-3 h-3" /> Recorrente</Badge>
                  )}
                  {showNewClientBadge && (
                    <Badge variant="outline" className="gap-1 border-primary/40 text-primary"><UserPlus className="w-3 h-3" /> Novo cliente</Badge>
                  )}
                  {clientId && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleClearClient}>Limpar</Button>
                  )}
                </div>
              </div>
              <Input id="clientName" value={clientName} onChange={(e) => { setClientName(e.target.value); if (clientId) setClientId(null); }} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientPhone">Telefone</Label>
              <Input
                id="clientPhone"
                value={clientPhone}
                onChange={(e) => { setClientPhone(formatUSPhone(e.target.value)); if (clientId) setClientId(null); }}
                placeholder="(555) 123-4567"
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientEmail">Email <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              <Input id="clientEmail" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
          </div>

          {/* Professional */}
          <div className="space-y-1.5">
            <Label>Profissional</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue placeholder="Sem profissional específico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem profissional específico</SelectItem>
                {staffList?.map((s) => (
                  <SelectItem key={s.user_id} value={s.user_id}>{s.name || "—"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unified Service / Technique / Option search */}
          <div className="space-y-1.5">
            <Label>Serviço *</Label>
            <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                  type="button"
                >
                  {selectedEntry ? (
                    <span className="flex items-center gap-2 truncate text-left">
                      <span className="truncate">
                        {selectedEntry.serviceName}
                        {selectedEntry.variationName && <span className="text-muted-foreground"> · {selectedEntry.variationName}</span>}
                        {selectedEntry.skuName && <span className="text-muted-foreground"> · {selectedEntry.skuName}</span>}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {selectedEntry.duration}min{selectedEntry.price != null && ` · $${selectedEntry.price.toFixed(2)}`}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Buscar serviço, técnica ou opção…</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command
                  filter={(value, search) => {
                    const entry = catalog?.find((e) => e.key === value);
                    if (!entry) return 0;
                    return entry.searchText.includes(search.toLowerCase()) ? 1 : 0;
                  }}
                >
                  <CommandInput placeholder="Digite para filtrar…" />
                  <CommandList className="max-h-[320px]">
                    <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                    {catalog && Object.entries(
                      catalog.reduce<Record<string, typeof catalog>>((acc, e) => {
                        (acc[e.category] ||= []).push(e);
                        return acc;
                      }, {})
                    ).map(([categoryName, items]) => (
                      <CommandGroup key={categoryName} heading={categoryName}>
                        {items.map((entry) => {
                          const isSelected = selectedEntry?.key === entry.key;
                          const detail = [entry.variationName, entry.skuName].filter(Boolean).join(" · ");
                          return (
                            <CommandItem
                              key={entry.key}
                              value={entry.key}
                              onSelect={() => {
                                setServiceId(entry.serviceId);
                                setSkuId(entry.skuId || "");
                                setServiceSearchOpen(false);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Check className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                              <div className="flex-1 min-w-0">
                                <div className="truncate font-medium">{entry.serviceName}</div>
                                {detail && <div className="truncate text-xs text-muted-foreground">{detail}</div>}
                              </div>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {entry.duration}min{entry.price != null && ` · $${entry.price.toFixed(2)}`}
                              </span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>


          {/* Initial Status */}
          <div className="space-y-1.5">
            <Label>Status inicial</Label>
            <Select value={initialStatus} onValueChange={(v) => setInitialStatus(v as "confirmed" | "requested")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="requested">Aguardando aprovação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          {serviceId && effectiveDuration > 0 && (
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
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || date.getDay() === 0 || date.getDay() === 1}
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
              <Label>Horário {staffId !== "none" && <span className="text-xs text-muted-foreground">(agenda do profissional)</span>}</Label>
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

          {/* Summary */}
          {effectivePrice != null && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Total estimado</span>
              <span className="font-semibold">${Number(effectivePrice).toFixed(2)}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => createBookingMutation.mutate()}
            disabled={!canSubmit}
          >
            {createBookingMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Criar Agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
