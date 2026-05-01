import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { MessageCircle, MapPin, Sparkles, User as UserIcon, Calendar as CalIcon, Clock, Crown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppStepProps {
  language: "pt" | "en";
  countdown: number; // seconds remaining
  formatCountdown: (s: number) => string;
  serviceName: string;
  staffName?: string | null;
  startTime: string; // ISO
  onConfirm: () => void; // triggers insert + window.open
  onChangeSlot: () => void;
  isLoading?: boolean;
}

/**
 * High-conversion WhatsApp redirect step.
 * Stack of psychological triggers: ownership + scarcity + social proof + loss aversion.
 */
export function WhatsAppStep({
  language,
  countdown,
  formatCountdown,
  serviceName,
  staffName,
  startTime,
  onConfirm,
  onChangeSlot,
  isLoading,
}: WhatsAppStepProps) {
  // Live "viewers" — random 2-5, decreases as countdown drops (creates "people leaving" sense)
  const [viewers, setViewers] = useState<number>(() => 2 + Math.floor(Math.random() * 4));
  useEffect(() => {
    const id = setInterval(() => {
      setViewers((v) => {
        const next = v + (Math.random() > 0.5 ? 1 : -1);
        return Math.max(1, Math.min(5, next));
      });
    }, 7000);
    return () => clearInterval(id);
  }, []);

  // Vibrate on mobile when entering urgency phase
  useEffect(() => {
    if (countdown === 60 && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.(50); } catch { /* noop */ }
    }
  }, [countdown]);

  const locale = language === "pt" ? ptBR : enUS;
  const dateLabel =
    language === "pt"
      ? format(parseISO(startTime), "EEEE, dd 'de' MMM", { locale })
      : format(parseISO(startTime), "EEEE, MMM dd", { locale });
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York",
  }).format(parseISO(startTime));

  // Urgency tier
  const tier = useMemo(() => {
    if (countdown > 180) return { color: "text-bronze-500", bg: "bg-rose-light", label: language === "pt" ? "Esse horário tá guardado pra você" : "Your time slot is reserved" };
    if (countdown > 90) return { color: "text-amber-600", bg: "bg-amber-50 animate-pulse", label: language === "pt" ? `⚠️ Faltam ${Math.ceil(countdown/60)}min — outras pessoas já tão de olho` : `⚠️ ${Math.ceil(countdown/60)}min left — others are watching` };
    if (countdown > 30) return { color: "text-orange-600", bg: "bg-orange-50", label: language === "pt" ? "🔥 Tá quase saindo da sua mão!" : "🔥 Almost slipping away!" };
    return { color: "text-red-600", bg: "bg-red-50 animate-pulse", label: language === "pt" ? "🚨 ÚLTIMOS SEGUNDOS — toca no botão verde!" : "🚨 LAST SECONDS — tap the green button!" };
  }, [countdown, language]);

  // Translations
  const t = {
    headline: language === "pt" ? "🔥 Esse horário já é praticamente seu..." : "🔥 This time slot is practically yours...",
    sub: language === "pt" ? "Só falta confirmar antes que alguém pegue." : "Just confirm before someone else grabs it.",
    timeLeft: language === "pt" ? "tempo para confirmar" : "time left to confirm",
    viewersText: language === "pt" ? `${viewers} pessoas vendo agora` : `${viewers} people viewing now`,
    socialProof: language === "pt" ? "Mais de 120 clientes confirmaram esse mês" : "120+ clients booked this month",
    cta: language === "pt" ? "GARANTIR MEU HORÁRIO AGORA" : "LOCK IN MY SPOT NOW",
    trust1: language === "pt" ? "Sem compromisso — só confirmar no WhatsApp" : "No commitment — just confirm on WhatsApp",
    trust2: language === "pt" ? "Sem cobrança agora — pague no dia" : "No charge now — pay on the day",
    trust3: language === "pt" ? "Remarca sem multa" : "Free to reschedule",
    location: language === "pt" ? "Newark, NJ" : "Newark, NJ",
    changeMind: language === "pt" ? "Mudei de ideia →" : "Changed my mind →",
    messageReady: language === "pt" ? "Mensagem já vai pronta — é só apertar enviar 💛" : "Message is ready — just tap send 💛",
  };

  return (
    <motion.div
      key="whatsapp"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-5"
    >
      {/* Headline */}
      <div className="text-center px-2">
        <h2 className="font-serif italic text-[26px] leading-snug text-foreground">
          {t.headline}
        </h2>
        <p className="text-muted-foreground mt-2 text-[15px]">{t.sub}</p>
      </div>

      {/* Countdown card */}
      <div className={`rounded-2xl p-5 text-center transition-colors ${tier.bg}`}>
        <div className="font-mono font-bold text-5xl text-foreground tracking-tight">
          {formatCountdown(countdown)}
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{t.timeLeft}</p>
        <div className={`flex items-center justify-center gap-1.5 mt-3 text-sm font-medium ${tier.color}`}>
          <Eye className="w-4 h-4" />
          <span>{t.viewersText}</span>
        </div>
        <p className={`text-xs mt-2 ${tier.color}`}>{tier.label}</p>
      </div>

      {/* "Ticket" card with booking summary */}
      <div className="bg-card rounded-2xl p-5 shadow-soft border-2 border-dashed border-bronze-300/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-gold via-bronze-400 to-rose-gold" />
        <div className="space-y-2.5 text-[15px]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-rose-gold shrink-0" />
            <span className="font-medium">{serviceName}</span>
          </div>
          {staffName && (
            <div className="flex items-center gap-2.5">
              <UserIcon className="w-4 h-4 text-rose-gold shrink-0" />
              <span>{language === "pt" ? "Com" : "With"} {staffName}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <CalIcon className="w-4 h-4 text-rose-gold shrink-0" />
            <span className="capitalize">{dateLabel} • {timeLabel}</span>
          </div>
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <MapPin className="w-4 h-4 text-rose-gold shrink-0" />
            <span className="text-sm">{t.location}</span>
          </div>
        </div>
      </div>

      {/* Social proof */}
      <div className="flex items-center justify-center gap-2 text-sm text-bronze-600 font-medium">
        <Crown className="w-4 h-4" />
        <span>{t.socialProof}</span>
      </div>

      {/* CTA */}
      <Button
        type="button"
        size="xl"
        disabled={isLoading || countdown <= 0}
        onClick={onConfirm}
        className={`w-full h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-base tracking-wide shadow-lg shadow-[#25D366]/30 transition-all hover:scale-[1.02] ${countdown < 90 ? "animate-pulse" : ""}`}
      >
        <MessageCircle className="w-5 h-5 mr-2" fill="currentColor" />
        {t.cta}
      </Button>

      <p className="text-center text-xs text-muted-foreground">{t.messageReady}</p>

      {/* Trust badges */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="text-emerald-600 font-bold">✓</span>
          <span>{t.trust1}</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="text-emerald-600 font-bold">✓</span>
          <span>{t.trust2}</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="text-emerald-600 font-bold">✓</span>
          <span>{t.trust3}</span>
        </div>
      </div>

      {/* Discreet exit link */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onChangeSlot}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          {t.changeMind}
        </button>
      </div>
    </motion.div>
  );
}
