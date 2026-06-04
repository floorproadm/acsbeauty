import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, Save, RotateCcw, Loader2, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type TemplateKey = "birthday" | "prep" | "booking-reminder" | "reschedule";

interface TemplateMeta {
  key: TemplateKey;
  label: string;
  description: string;
  variables: string[];
  sample: Record<string, string>;
}

const TEMPLATES: TemplateMeta[] = [
  {
    key: "birthday",
    label: "Aniversário",
    description: "Enviado no aniversário do cliente com oferta especial",
    variables: ["name"],
    sample: { name: "Maria Silva" },
  },
  {
    key: "prep",
    label: "Preparo 24h",
    description: "Lembrete com instruções enviado 24h antes do atendimento",
    variables: ["name", "service", "whenStr"],
    sample: { name: "Maria Silva", service: "Hidratação profunda", whenStr: "Sexta, 06/06/2026 14:30" },
  },
  {
    key: "booking-reminder",
    label: "Lembrete de Agendamento",
    description: "Lembrete simples enviado no dia anterior",
    variables: ["name", "service", "date", "time"],
    sample: { name: "Maria Silva", service: "Hidratação profunda", date: "Sexta, 06/06/2026", time: "14:30" },
  },
  {
    key: "reschedule",
    label: "Remarcação",
    description: "Confirmação quando um agendamento é remarcado",
    variables: ["name", "service", "date", "time"],
    sample: { name: "Maria Silva", service: "Hidratação profunda", date: "Segunda, 09/06/2026", time: "10:00" },
  },
];

type Overrides = Record<string, { subject?: string; html?: string }>;

function interpolate(str: string, data: Record<string, string>): string {
  return (str || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => data[k] ?? `{{${k}}}`);
}

export function EmailTemplatesEditor() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeKey, setActiveKey] = useState<TemplateKey>("birthday");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftHtml, setDraftHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const active = TEMPLATES.find((t) => t.key === activeKey)!;

  // load overrides
  const overridesQuery = useQuery({
    queryKey: ["studio_settings", "email_templates_overrides"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("studio_settings")
        .select("value")
        .eq("key", "email_templates_overrides")
        .maybeSingle();
      if (error) throw error;
      return ((data as any)?.value ?? {}) as Overrides;
    },
  });

  // load defaults from preview function so user starts from current rendered defaults
  const defaultsQuery = useQuery({
    queryKey: ["email-preview-defaults", activeKey],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("email-preview", {
        body: { template: activeKey, sampleData: active.sample },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao carregar default");
      return { subject: data.subject as string, html: data.html as string, from: data.from as string };
    },
  });

  // reset draft when template or data changes
  useEffect(() => {
    const ov = overridesQuery.data?.[activeKey];
    if (ov?.subject !== undefined || ov?.html !== undefined) {
      setDraftSubject(ov.subject ?? defaultsQuery.data?.subject ?? "");
      setDraftHtml(ov.html ?? defaultsQuery.data?.html ?? "");
    } else if (defaultsQuery.data) {
      setDraftSubject(defaultsQuery.data.subject);
      setDraftHtml(defaultsQuery.data.html);
    }
  }, [activeKey, overridesQuery.data, defaultsQuery.data]);

  const hasOverride = useMemo(() => {
    const ov = overridesQuery.data?.[activeKey];
    return !!(ov && (ov.subject !== undefined || ov.html !== undefined));
  }, [overridesQuery.data, activeKey]);

  const isDirty = useMemo(() => {
    if (!defaultsQuery.data) return false;
    const ov = overridesQuery.data?.[activeKey];
    const currentSubject = ov?.subject ?? defaultsQuery.data.subject;
    const currentHtml = ov?.html ?? defaultsQuery.data.html;
    return draftSubject !== currentSubject || draftHtml !== currentHtml;
  }, [draftSubject, draftHtml, defaultsQuery.data, overridesQuery.data, activeKey]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const current = overridesQuery.data || {};
      const next: Overrides = {
        ...current,
        [activeKey]: { subject: draftSubject, html: draftHtml },
      };
      const { error } = await (supabase as any)
        .from("studio_settings")
        .upsert(
          { key: "email_templates_overrides", value: next, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studio_settings", "email_templates_overrides"] });
      toast({ title: "Template salvo", description: "Alterações aplicadas — sem necessidade de redeploy." });
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const resetMut = useMutation({
    mutationFn: async () => {
      const current = { ...(overridesQuery.data || {}) };
      delete current[activeKey];
      const { error } = await (supabase as any)
        .from("studio_settings")
        .upsert(
          { key: "email_templates_overrides", value: current, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studio_settings", "email_templates_overrides"] });
      toast({ title: "Restaurado para o padrão" });
    },
  });

  const insertVar = (v: string) => {
    const token = `{{${v}}}`;
    setDraftHtml((h) => `${h}${h && !h.endsWith(" ") ? " " : ""}${token}`);
  };

  const previewHtml = useMemo(() => interpolate(draftHtml, active.sample), [draftHtml, active]);
  const previewSubject = useMemo(() => interpolate(draftSubject, active.sample), [draftSubject, active]);

  const sendTest = async () => {
    if (!testEmail) return;
    setSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "campaign-custom",
          recipientEmail: testEmail,
          templateData: { subject: `[TESTE] ${previewSubject}`, html: previewHtml },
        },
      });
      if (error) throw error;
      toast({ title: "Email de teste enviado", description: testEmail });
    } catch (e: any) {
      toast({ title: "Falha no envio", description: e.message, variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-2.5">
          <FileText className="h-4 w-4 text-bronze" />
          <div>
            <h2 className="font-serif text-lg leading-none">Templates de Email</h2>
            <p className="text-[11px] text-muted-foreground mt-1">Edite o texto e os CTAs — sem precisar de redeploy</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)} disabled={!draftHtml}>
            <Eye className="h-4 w-4 mr-1.5" /> Preview
          </Button>
          <Button size="sm" onClick={() => saveMut.mutate()} disabled={!isDirty || saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1.5" /> Salvar</>}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-[220px_1fr]">
        {/* Sidebar list */}
        <nav className="border-r bg-muted/10 p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto">
          {TEMPLATES.map((t) => {
            const ov = overridesQuery.data?.[t.key];
            const customized = !!(ov && (ov.subject !== undefined || ov.html !== undefined));
            return (
              <button
                key={t.key}
                onClick={() => setActiveKey(t.key)}
                className={cn(
                  "text-left whitespace-nowrap md:whitespace-normal rounded-md px-3 py-2 text-sm transition-colors",
                  "hover:bg-muted",
                  activeKey === t.key ? "bg-foreground/10 font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <span>{t.label}</span>
                  {customized && <Sparkles className="h-3 w-3 text-bronze" aria-label="Customizado" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Editor */}
        <div className="p-4 md:p-5 space-y-4">
          <div>
            <h3 className="font-serif text-xl">{active.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{active.description}</p>
          </div>

          {/* Variable chips */}
          <div className="flex flex-wrap gap-1.5">
            {active.variables.map((v) => (
              <Badge
                key={v}
                variant="secondary"
                className="cursor-pointer font-mono text-[11px]"
                onClick={() => insertVar(v)}
                title="Clique para inserir no corpo"
              >
                {`{{${v}}}`}
              </Badge>
            ))}
          </div>

          {defaultsQuery.isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando template...
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Assunto</Label>
                <Input value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} className="font-mono text-sm" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Corpo (HTML)</Label>
                <Textarea
                  value={draftHtml}
                  onChange={(e) => setDraftHtml(e.target.value)}
                  rows={18}
                  className="font-mono text-xs leading-relaxed"
                  spellCheck={false}
                />
                <p className="text-[10px] text-muted-foreground">
                  Suporta HTML completo. Use as variáveis acima entre <code className="font-mono">{`{{ }}`}</code>.
                </p>
              </div>

              {/* Mobile actions */}
              <div className="flex flex-wrap items-center gap-2 sm:hidden pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)} disabled={!draftHtml}>
                  <Eye className="h-4 w-4 mr-1.5" /> Preview
                </Button>
                <Button size="sm" onClick={() => saveMut.mutate()} disabled={!isDirty || saveMut.isPending}>
                  {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1.5" /> Salvar</>}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-[11px] text-muted-foreground">
                  {hasOverride ? (
                    <span className="text-bronze">● Customizado — sobrescreve o padrão do código</span>
                  ) : (
                    <span>Usando template padrão</span>
                  )}
                </div>
                {hasOverride && (
                  <Button variant="ghost" size="sm" onClick={() => resetMut.mutate()} disabled={resetMut.isPending}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restaurar padrão
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif">Preview: {active.label}</DialogTitle>
          </DialogHeader>
          <div className="text-xs space-y-1 border rounded-md p-3 bg-muted/30">
            <div><strong>De:</strong> {defaultsQuery.data?.from ?? "—"}</div>
            <div><strong>Assunto:</strong> {previewSubject}</div>
          </div>
          <div className="flex-1 overflow-hidden rounded-md border">
            <iframe title="preview" srcDoc={previewHtml} sandbox="" className="w-full h-[55vh] bg-white" />
          </div>
          <div className="border-t pt-3 space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Enviar teste</Label>
            <div className="flex gap-2">
              <Input type="email" placeholder="seu-email@dominio.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
              <Button size="sm" onClick={sendTest} disabled={!testEmail || sendingTest}>
                {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
