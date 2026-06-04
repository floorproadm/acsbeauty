import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useStudioSettings } from "@/hooks/useStudioSettings";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Save,
  Building2,
  CalendarCog,
  Mail,
  Plug,
  ShieldCheck,
  Database,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
} from "lucide-react";
import { AllowedEmailsTab } from "./AllowedEmailsTab";
import { AdminInvitesTab } from "./AdminInvitesTab";

const DAYS = [
  { key: "sunday", label: "Domingo" },
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
];

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-rose-gold" />
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ============ STUDIO INFO ============
function StudioInfoSection() {
  const { data, isLoading, update } = useStudioSettings<any>("studio_info");
  const { toast } = useToast();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return <Loader2 className="w-5 h-5 animate-spin" />;
  }

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  const setHour = (day: string, k: string, v: any) =>
    setForm({
      ...form,
      hours: { ...form.hours, [day]: { ...form.hours[day], [k]: v } },
    });

  const handleSave = async () => {
    try {
      await update.mutateAsync(form);
      toast({ title: "Informações salvas" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <SectionCard icon={Building2} title="Informações do Estúdio" description="Dados visíveis ao cliente e usados nas comunicações.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do estúdio</Label>
          <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Endereço completo</Label>
          <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>WhatsApp</Label>
          <Input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email principal</Label>
          <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Input value={form.timezone ?? ""} onChange={(e) => set("timezone", e.target.value)} />
        </div>
      </div>

      <div className="pt-4">
        <Label className="text-base">Horário de funcionamento</Label>
        <div className="mt-2 space-y-2">
          {DAYS.map((d) => {
            const h = form.hours?.[d.key] ?? { open: false, start: "09:00", end: "18:00" };
            return (
              <div key={d.key} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3 flex items-center gap-2">
                  <Checkbox checked={!!h.open} onCheckedChange={(v) => setHour(d.key, "open", !!v)} />
                  <span className="text-sm">{d.label}</span>
                </div>
                <Input
                  type="time"
                  className="col-span-4"
                  value={h.start}
                  disabled={!h.open}
                  onChange={(e) => setHour(d.key, "start", e.target.value)}
                />
                <span className="col-span-1 text-center text-muted-foreground text-xs">até</span>
                <Input
                  type="time"
                  className="col-span-4"
                  value={h.end}
                  disabled={!h.open}
                  onChange={(e) => setHour(d.key, "end", e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>
    </SectionCard>
  );
}

// ============ BOOKING RULES ============
function BookingRulesSection() {
  const { data, isLoading, update } = useStudioSettings<any>("booking_rules");
  const { toast } = useToast();
  const [form, setForm] = useState<any>(null);
  const [blockedText, setBlockedText] = useState("");

  useEffect(() => {
    if (data) {
      setForm(data);
      setBlockedText((data.blocked_dates ?? []).join("\n"));
    }
  }, [data]);

  if (isLoading || !form) return <Loader2 className="w-5 h-5 animate-spin" />;

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const handleSave = async () => {
    try {
      const blocked = blockedText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      await update.mutateAsync({ ...form, blocked_dates: blocked });
      toast({ title: "Regras de agendamento salvas" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <SectionCard icon={CalendarCog} title="Regras de Agendamento" description="Limites e janelas de operação do booking.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Antecedência mínima (horas)</Label>
          <Input type="number" value={form.min_lead_hours ?? 0} onChange={(e) => set("min_lead_hours", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Antecedência máxima (dias)</Label>
          <Input type="number" value={form.max_advance_days ?? 60} onChange={(e) => set("max_advance_days", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Duração do lock (booking_hold) — minutos</Label>
          <Input type="number" value={form.hold_duration_minutes ?? 5} onChange={(e) => set("hold_duration_minutes", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Buffer entre serviços (minutos)</Label>
          <Input type="number" value={form.buffer_minutes ?? 10} onChange={(e) => set("buffer_minutes", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Max bookings simultâneos por profissional</Label>
          <Input type="number" value={form.max_concurrent_per_pro ?? 1} onChange={(e) => set("max_concurrent_per_pro", Number(e.target.value))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Dias bloqueados (uma data ISO por linha — YYYY-MM-DD)</Label>
        <Textarea rows={5} value={blockedText} onChange={(e) => setBlockedText(e.target.value)} placeholder="2026-12-25" />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>
    </SectionCard>
  );
}

// ============ EMAIL CONFIG ============
export function EmailConfigSection() {
  const { data, isLoading, update } = useStudioSettings<any>("email_config");
  const { toast } = useToast();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) return <Loader2 className="w-5 h-5 animate-spin" />;

  const setEnabled = (k: string, v: boolean) =>
    setForm({ ...form, enabled: { ...form.enabled, [k]: v } });
  const setSegment = (k: string, v: number) =>
    setForm({ ...form, segments: { ...form.segments, [k]: v } });
  const setSubject = (k: string, v: string) =>
    setForm({ ...form, subjects: { ...form.subjects, [k]: v } });

  const handleSave = async () => {
    try {
      await update.mutateAsync(form);
      toast({ title: "Configurações de email salvas" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const TYPES: Array<[string, string]> = [
    ["booking_confirmed", "Confirmação ao cliente"],
    ["booking_cancelled", "Cancelamento ao cliente"],
    ["reminder_24h", "Lembrete 24h"],
    ["giftcard_recipient", "Gift Card ao destinatário"],
    ["reengagement", "Reengajamento"],
  ];

  return (
    <SectionCard icon={Mail} title="Configurações de Email" description="Controle quais emails são disparados e seus assuntos.">
      <div className="space-y-3">
        <Label className="text-base">Tipos de email</Label>
        {TYPES.map(([k, label]) => (
          <div key={k} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{label}</span>
              <Switch checked={!!form.enabled?.[k]} onCheckedChange={(v) => setEnabled(k, v)} />
            </div>
            <Textarea
              rows={2}
              value={form.subjects?.[k] ?? ""}
              onChange={(e) => setSubject(k, e.target.value)}
              placeholder="Assunto do email"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
        <div className="space-y-2">
          <Label>Cooldown reengajamento (dias)</Label>
          <Input type="number" value={form.reengagement_cooldown_days ?? 90} onChange={(e) => setForm({ ...form, reengagement_cooldown_days: Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Occasional (dias)</Label>
          <Input type="number" value={form.segments?.occasional_days ?? 60} onChange={(e) => setSegment("occasional_days", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Absent (dias)</Label>
          <Input type="number" value={form.segments?.absent_days ?? 90} onChange={(e) => setSegment("absent_days", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Inactive (dias)</Label>
          <Input type="number" value={form.segments?.inactive_days ?? 180} onChange={(e) => setSegment("inactive_days", Number(e.target.value))} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>
    </SectionCard>
  );
}

// ============ INTEGRATIONS STATUS ============
function IntegrationsSection() {
  const { data: info } = useStudioSettings<any>("studio_info");
  const fromEmail = info?.email ?? "—";

  const items = [
    {
      name: "Gmail Connector",
      status: true,
      detail: `FROM: ${fromEmail}`,
    },
    {
      name: "Google Calendar",
      status: true,
      detail: "Service Account configurada via secret",
    },
    {
      name: "WhatsApp",
      status: !!info?.whatsapp,
      detail: info?.whatsapp ? `Número: ${info.whatsapp}` : "Sem número configurado",
    },
  ];

  return (
    <SectionCard icon={Plug} title="Status das Integrações" description="Resumo das conexões externas (somente leitura).">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((i) => (
          <Card key={i.name} className="border">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{i.name}</span>
                {i.status ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <Badge variant={i.status ? "default" : "destructive"} className="text-[10px]">
                {i.status ? "Ativo" : "Inativo"}
              </Badge>
              <p className="text-xs text-muted-foreground break-words">{i.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionCard>
  );
}

// ============ ACCESS CONTROL ============
function AccessSection() {
  const [openA, setOpenA] = useState(false);
  const [openI, setOpenI] = useState(false);
  return (
    <SectionCard icon={ShieldCheck} title="Controle de Acesso" description="Emails autorizados e convites administrativos.">
      <Collapsible open={openA} onOpenChange={setOpenA}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
          <span className="font-medium text-sm">Emails autorizados</span>
          <ChevronDown className={`w-4 h-4 transition ${openA ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <AllowedEmailsTab />
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openI} onOpenChange={setOpenI}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
          <span className="font-medium text-sm">Convites administrativos</span>
          <ChevronDown className={`w-4 h-4 transition ${openI ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <AdminInvitesTab />
        </CollapsibleContent>
      </Collapsible>
    </SectionCard>
  );
}

// ============ MASTER DATA ============
function MasterDataSection() {
  const { data, isLoading, update } = useStudioSettings<any>("master_data");
  const { toast } = useToast();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) return <Loader2 className="w-5 h-5 animate-spin" />;

  const cats: Array<{ name: string; color: string }> = form.service_categories ?? [];
  const amounts: number[] = form.giftcard_amounts ?? [];

  const setCat = (i: number, k: string, v: string) => {
    const n = [...cats];
    n[i] = { ...n[i], [k]: v };
    setForm({ ...form, service_categories: n });
  };
  const addCat = () => setForm({ ...form, service_categories: [...cats, { name: "", color: "#8b7355" }] });
  const rmCat = (i: number) => setForm({ ...form, service_categories: cats.filter((_, idx) => idx !== i) });

  const setAmount = (i: number, v: number) => {
    const n = [...amounts];
    n[i] = v;
    setForm({ ...form, giftcard_amounts: n });
  };
  const addAmount = () => setForm({ ...form, giftcard_amounts: [...amounts, 0] });
  const rmAmount = (i: number) => setForm({ ...form, giftcard_amounts: amounts.filter((_, idx) => idx !== i) });

  const setText = (k: string, v: string) =>
    setForm({ ...form, site_texts: { ...form.site_texts, [k]: v } });

  const handleSave = async () => {
    try {
      await update.mutateAsync(form);
      toast({ title: "Base de dados de referência salva" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <SectionCard icon={Database} title="Base de Dados de Referência" description="Dados mestres editáveis usados no site.">
      <div>
        <Label className="text-base">Categorias de serviço</Label>
        <div className="mt-2 space-y-2">
          {cats.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={c.name} onChange={(e) => setCat(i, "name", e.target.value)} placeholder="Nome" className="flex-1" />
              <Input type="color" value={c.color} onChange={(e) => setCat(i, "color", e.target.value)} className="w-16 p-1 h-10" />
              <Button variant="ghost" size="icon" onClick={() => rmCat(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addCat}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar categoria
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-base">Valores de Gift Card (USD)</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {amounts.map((a, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input type="number" value={a} onChange={(e) => setAmount(i, Number(e.target.value))} className="w-24" />
              <Button variant="ghost" size="icon" onClick={() => rmAmount(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addAmount}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar valor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tagline (PT)</Label>
          <Input value={form.site_texts?.tagline_pt ?? ""} onChange={(e) => setText("tagline_pt", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Tagline (EN)</Label>
          <Input value={form.site_texts?.tagline_en ?? ""} onChange={(e) => setText("tagline_en", e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Meta description (PT)</Label>
          <Textarea rows={2} value={form.site_texts?.meta_description_pt ?? ""} onChange={(e) => setText("meta_description_pt", e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Meta description (EN)</Label>
          <Textarea rows={2} value={form.site_texts?.meta_description_en ?? ""} onChange={(e) => setText("meta_description_en", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>
    </SectionCard>
  );
}

export function SettingsTab() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-serif font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Painel central de configurações do ACS Beauty OS.</p>
      </div>
      <StudioInfoSection />
      <BookingRulesSection />
      <EmailConfigSection />
      <IntegrationsSection />
      <AccessSection />
      <MasterDataSection />
    </div>
  );
}
