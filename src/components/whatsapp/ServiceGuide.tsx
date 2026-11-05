import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Loader2, Scissors, Eye, Hand, ChevronRight, type LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppMessage, type WhatsAppContext } from "@/lib/whatsapp";
import { WhatsAppCTA } from "./WhatsAppCTA";

const CATEGORIES: { slug: string; icon: LucideIcon; labelKey: string }[] = [
  { slug: "cabelo", icon: Scissors, labelKey: "home.services.hair" },
  { slug: "sobrancelhas", icon: Eye, labelKey: "home.services.brows" },
  { slug: "unhas", icon: Hand, labelKey: "home.services.nails" },
];

function OptionCard({ icon: Icon, title, description, onClick }: { icon?: LucideIcon; title: string; description?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-xl border border-nude bg-card px-4 py-4 text-left transition-colors hover:border-gold/50 hover:bg-champagne/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {Icon && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-champagne text-gold-dark transition-colors group-hover:bg-nude">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium text-foreground">{title}</span>
        {description && <span className="text-sm text-muted-foreground">{description}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-gold-dark/50 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export function ServiceGuide({ triggerClassName, triggerSize, triggerVariant, triggerLabel, triggerContent }: { triggerClassName?: string; triggerSize?: ButtonProps["size"]; triggerVariant?: ButtonProps["variant"]; triggerLabel?: string; triggerContent?: React.ReactNode } = {}) {
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
  const subtitle = step === 4 ? t("wa.guide.description") : t(`wa.guide.q${step}.sub`);
  return <>
    <Button variant={triggerVariant || "outline"} size={triggerSize} className={`h-auto min-h-11 whitespace-normal text-base ${triggerClassName || ""}`} onClick={() => { setStep(1); setCategory(""); setService(null); setIntent("guidance"); setOpen(true); }}>
      {triggerContent || <><MessageCircle />{triggerLabel || t("wa.guide.open")}</>}
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[560px] max-h-[85dvh] overflow-y-auto rounded-2xl border-nude bg-ivory p-6 sm:p-8" closeLabel={t("wa.guide.close")}>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-xs font-medium tracking-[0.3em] text-gold-dark" aria-hidden="true">{step > 3 ? 3 : step} / 3</span>
          <DialogTitle className="font-serif text-2xl text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{subtitle}</DialogDescription>
        </div>
        {step < 4 && <div className="grid grid-cols-3 gap-2" aria-hidden="true">{[1, 2, 3].map(n => <div key={n} className={`h-0.5 rounded-full ${n <= step ? "bg-gold-dark" : "bg-nude"}`} />)}</div>}
        <div className="flex flex-col gap-3 py-1">
          {step === 1 && CATEGORIES.map(({ slug, icon, labelKey }) => <OptionCard key={slug} icon={icon} title={t(labelKey)} description={t(`wa.guide.${slug}.desc`)} onClick={() => { setCategory(slug); setService(null); setStep(2); }} />)}
          {step === 2 && <>
            {isLoading && <Loader2 className="animate-spin text-gold-dark self-center" />}
            {isError && <><p className="text-destructive text-center">{t("wa.guide.error")}</p><Button variant="outline" onClick={() => void refetch()}>{t("wa.guide.retry")}</Button></>}
            {services.map(item => <OptionCard key={item.id} title={item.name} onClick={() => { setService(item); setStep(3); }} />)}
            <OptionCard title={t("wa.guide.uncertain")} onClick={() => { setService(null); setStep(3); }} />
          </>}
          {step === 3 && (["availability", "price", "guidance"] as const).map(value => <OptionCard key={value} title={t(`wa.guide.${value}`)} onClick={() => { setIntent(value); setStep(4); }} />)}
          {step === 4 && <>
            <p className="rounded-xl border border-nude bg-champagne/50 px-4 py-3 text-sm leading-relaxed text-foreground">{buildWhatsAppMessage({ ...context, language })}</p>
            <WhatsAppCTA context={context} variant="hero" className="h-auto min-h-12 whitespace-normal"><MessageCircle />{t("wa.guided.cta")}</WhatsAppCTA>
          </>}
        </div>
        {step > 1 && <Button variant="ghost" className="justify-self-start text-muted-foreground" onClick={() => setStep(step - 1)}><ArrowLeft />{t("global.back")}</Button>}
      </DialogContent>
    </Dialog>
  </>;
}
