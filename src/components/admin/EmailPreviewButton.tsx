import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PreviewTemplate = "birthday" | "prep" | "booking-reminder" | "reschedule";

interface Props {
  template: PreviewTemplate;
  label: string;
  triggerVariant?: "outline" | "ghost" | "default";
  triggerSize?: "sm" | "default";
  /** if provided, shows a "send test to me" input inside the dialog */
  allowTestSend?: boolean;
  /** default sample data overrides */
  sampleData?: Record<string, string>;
}

export function EmailPreviewButton({ template, label, triggerVariant = "outline", triggerSize = "sm", allowTestSend = true, sampleData }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ subject: string; html: string; from: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    setData(null);
    try {
      const { data: res, error } = await supabase.functions.invoke("email-preview", {
        body: { template, sampleData },
      });
      if (error) throw error;
      if (!res?.success) throw new Error(res?.error || "Falha ao gerar preview");
      setData({ subject: res.subject, html: res.html, from: res.from });
    } catch (e: any) {
      toast({ title: "Erro no preview", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sendTest = async () => {
    if (!testEmail || !data) return;
    setSending(true);
    try {
      // booking-reminder is the only template registered in send-transactional-email
      if (template === "booking-reminder") {
        const { error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "booking-reminder",
            recipientEmail: testEmail,
            templateData: sampleData || { clientName: "Maria Silva", serviceName: "Hidratação profunda", date: "Sexta, 06/06/2026", time: "14:30" },
          },
        });
        if (error) throw error;
      } else if (template === "birthday") {
        const { error } = await supabase.functions.invoke("send-birthday-emails", {
          body: { testEmail },
        });
        if (error) throw error;
      } else {
        // Generic gmail send via campaign-custom template
        const { error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "campaign-custom",
            recipientEmail: testEmail,
            templateData: { subject: `[TESTE] ${data.subject}`, html: data.html },
          },
        });
        if (error) throw error;
      }
      toast({ title: "Email de teste enviado", description: `Verifique ${testEmail}` });
    } catch (e: any) {
      toast({ title: "Falha no envio de teste", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        onClick={() => { setOpen(true); load(); }}
        title="Visualizar email"
      >
        <Eye className="h-4 w-4 mr-1.5" /> {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif">Preview do email</DialogTitle>
            <DialogDescription>
              {data ? (
                <span className="block space-y-1 mt-1 text-xs">
                  <span className="block"><strong>De:</strong> {data.from}</span>
                  <span className="block"><strong>Assunto:</strong> {data.subject}</span>
                </span>
              ) : "Carregando dados do estúdio e renderizando template..."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden rounded-md border bg-muted/30">
            {loading && (
              <div className="h-[60vh] flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Renderizando preview...
              </div>
            )}
            {data && !loading && (
              <iframe
                title="Email preview"
                srcDoc={data.html}
                sandbox=""
                className="w-full h-[60vh] bg-white"
              />
            )}
          </div>

          {allowTestSend && data && (
            <div className="border-t pt-3 space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Enviar teste para mim</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="seu-email@dominio.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button onClick={sendTest} disabled={!testEmail || sending} size="sm">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1.5" /> Enviar</>}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
