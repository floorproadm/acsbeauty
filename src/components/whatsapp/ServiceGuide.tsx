import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppMessage, type WhatsAppContext } from "@/lib/whatsapp";
import { WhatsAppCTA } from "./WhatsAppCTA";

export function ServiceGuide({ triggerClassName, triggerSize }: { triggerClassName?: string; triggerSize?: ButtonProps["size"] } = {}) {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [service, setService] = useState<{ id: string; name: string } | null>(null);
  const [intent, setIntent] = useState<WhatsAppContext["intent"]>("guidance");
  const { data: services = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["guide-services", category],
    enabled: open && !!category,
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id, name").eq("category_slug", category).eq("is_active", true).order("sort_order").order("name");
      if (error) throw error;
      return data || [];
    },
  });
  const context = { source: "guided" as const, category, serviceName: service?.name, serviceId: service?.id, intent };
  const title = step === 4 ? t("wa.guide.result") : t(`wa.guide.q${step}`);
  return <>
    <Button variant="outline" size={triggerSize} className={`h-auto min-h-11 whitespace-normal text-base ${triggerClassName || ""}`} onClick={() => { setStep(1); setCategory(""); setService(null); setIntent("guidance"); setOpen(true); }}>
      <MessageCircle />{t("wa.guide.open")}
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[85dvh] overflow-y-auto" closeLabel={t("wa.guide.close")}>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl pr-6">{title}</DialogTitle>
          <DialogDescription>{step === 4 ? t("wa.guide.description") : t("wa.guide.progress", { step })}</DialogDescription>
        </DialogHeader>
        {step < 4 && <div className="grid grid-cols-3 gap-2" aria-hidden="true">{[1, 2, 3].map(n => <div key={n} className={`h-1 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`} />)}</div>}
        <div className="flex flex-col gap-3 py-2">
          {step === 1 && ["cabelo", "sobrancelhas", "unhas"].map(slug => <Button key={slug} variant="outline" className="h-auto min-h-12 whitespace-normal text-base" onClick={() => { setCategory(slug); setService(null); setStep(2); }}>{t(`home.services.${slug === "cabelo" ? "hair" : slug === "sobrancelhas" ? "brows" : "nails"}`)}</Button>)}
          {step === 2 && <>
            {isLoading && <Loader2 className="animate-spin text-primary self-center" />}
            {isError && <><p className="text-destructive">{t("wa.guide.error")}</p><Button variant="outline" onClick={() => void refetch()}>{t("wa.guide.retry")}</Button></>}
            {services.map(item => <Button key={item.id} variant="outline" className="h-auto min-h-12 whitespace-normal text-base" onClick={() => { setService(item); setStep(3); }}>{item.name}</Button>)}
            <Button variant="secondary" className="h-auto min-h-12 whitespace-normal text-base" onClick={() => { setService(null); setStep(3); }}>{t("wa.guide.uncertain")}</Button>
          </>}
          {step === 3 && (["availability", "price", "guidance"] as const).map(value => <Button key={value} variant="outline" className="h-auto min-h-12 whitespace-normal text-base" onClick={() => { setIntent(value); setStep(4); }}>{t(`wa.guide.${value}`)}</Button>)}
          {step === 4 && <><p className="text-foreground leading-relaxed border-l-2 border-primary pl-4 py-2">{buildWhatsAppMessage({ ...context, language })}</p><WhatsAppCTA context={context} variant="hero" className="h-auto min-h-12 whitespace-normal"><MessageCircle />{t("wa.guided.cta")}</WhatsAppCTA></>}
        </div>
        {step > 1 && <Button variant="ghost" className="justify-self-start" onClick={() => setStep(step - 1)}><ArrowLeft />{t("global.back")}</Button>}
      </DialogContent>
    </Dialog>
  </>;
}