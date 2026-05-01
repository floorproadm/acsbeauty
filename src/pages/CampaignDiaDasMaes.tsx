import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Check, Crown, Sparkles, Clock, Gift, Hourglass, Copy, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import hairService from "@/assets/hair-service.jpg";
import treatments from "@/assets/treatments-service.jpg";
import aneHero from "@/assets/ane-hero.jpg";
import teamHero from "@/assets/team-hero.jpg";

const WA_NUMBER = "17329153430";
const CAMPAIGN_SOURCE = "campaign-dia-das-maes";

const waLink = (msg: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

const waBusinessDeepLink = (msg: string) =>
  `whatsapp://send?phone=${WA_NUMBER}&text=${encodeURIComponent(msg)}`;

const isMobile = () =>
  typeof navigator !== "undefined" &&
  /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

const HERO_MSG = "Oi! Quero comprar um Gift Card de Dia das Mães 💝";
const FINAL_MSG = "Oi! Quero garantir o presente do Dia das Mães pelo WhatsApp 💝";

const tiers = [
  {
    value: 50,
    label: "Presente rápido",
    msg: "Oi! Quero comprar um Gift Card de $50 para Dia das Mães 💝",
    highlight: false,
  },
  {
    value: 100,
    label: "O mais escolhido",
    msg: "Oi! Quero comprar um Gift Card de $100 para Dia das Mães 💝",
    highlight: true,
  },
  {
    value: 150,
    label: "Experiência completa",
    msg: "Oi! Quero comprar um Gift Card de $150 para Dia das Mães 💝",
    highlight: false,
  },
];

const benefits = [
  { icon: Clock, text: "Entrega imediata (digital)" },
  { icon: Sparkles, text: "Pode usar em qualquer serviço" },
  { icon: Gift, text: "Sem data fixa para resgatar" },
  { icon: Check, text: "Presente que ela realmente vai usar" },
];

// Fire-and-forget tracking (never blocks the WhatsApp redirect)
function trackClick(params: {
  ctaType: string;
  whatsappMessage: string;
  selectedValue?: number;
  chosenOption?: "intent" | "whatsapp_normal" | "whatsapp_business" | "copy_message";
}) {
  try {
    void supabase.from("campaign_clicks").insert({
      campaign_source: CAMPAIGN_SOURCE,
      cta_type: params.chosenOption
        ? `${params.ctaType}:${params.chosenOption}`
        : params.ctaType,
      selected_value: params.selectedValue ?? null,
      whatsapp_message: params.whatsappMessage,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    });
  } catch {
    /* never block UX */
  }
}

interface WAProps {
  ctaType: string;
  message: string;
  value?: number;
  children: React.ReactNode;
  className?: string;
  onIntent: (payload: { ctaType: string; message: string; value?: number }) => void;
}

const WhatsAppButton = ({ ctaType, message, value, children, className = "", onIntent }: WAProps) => (
  <button
    type="button"
    onClick={() => {
      trackClick({ ctaType, whatsappMessage: message, selectedValue: value, chosenOption: "intent" });
      onIntent({ ctaType, message, value });
    }}
    className={`inline-flex items-center justify-center gap-3 rounded-full bg-[#25D366] px-8 py-5 text-base sm:text-lg font-medium tracking-wide text-white shadow-[0_8px_30px_-8px_rgba(37,211,102,0.6)] transition-all duration-300 hover:bg-[#20bd5a] hover:scale-[1.02] hover:shadow-[0_12px_40px_-8px_rgba(37,211,102,0.8)] active:scale-[0.98] ${className}`}
  >
    {children}
  </button>
);

// =============================================================
// CONFIG: data/hora final da campanha (timezone America/New_York).
// Altere apenas esta linha para estender ou encerrar a campanha.
// Formato ISO 8601 com offset (-04:00 EDT / -05:00 EST).
// =============================================================
const CAMPAIGN_END_DATE = "2026-05-10T23:59:59-04:00";
const CAMPAIGN_END_TS = new Date(CAMPAIGN_END_DATE).getTime();

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, expired: diff === 0 };
}

const TimeBox = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center min-w-[60px] sm:min-w-[72px]">
    <div className="bg-foreground/95 text-background rounded-lg px-3 py-2 sm:px-4 sm:py-3 font-editorial text-2xl sm:text-3xl tabular-nums shadow-card">
      {value.toString().padStart(2, "0")}
    </div>
    <span className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground mt-1.5">
      {label}
    </span>
  </div>
);

export default function CampaignDiaDasMaes() {
  const { days, hours, minutes, seconds, expired } = useCountdown(CAMPAIGN_END_TS);

  useEffect(() => {
    document.title = "Gift Card Dia das Mães | ACS Beauty Studio";
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      "Presente do Dia das Mães em menos de 2 minutos. Gift Card ACS Beauty entregue digitalmente pelo WhatsApp."
    );
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-hero">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${aneHero})`,
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

        <div className="relative container mx-auto px-5 pt-16 pb-12 sm:pt-24 sm:pb-20 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-background/80 backdrop-blur px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold-dark mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Edição Dia das Mães
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-editorial text-3xl sm:text-5xl leading-[1.1] text-foreground mb-5"
          >
            Ainda não comprou o presente do Dia das Mães?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground mb-3"
          >
            Resolve isso em menos de 2 minutos 👇
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="inline-flex items-center gap-2 rounded-full bg-destructive/10 border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive mb-8"
          >
            ⚠️ Entrega garantida até o Dia das Mães
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <WhatsAppButton
              href={waLink(HERO_MSG)}
              ctaType="hero"
              message={HERO_MSG}
              className="w-full sm:w-auto"
            >
              <MessageCircle className="w-5 h-5" />
              Comprar pelo WhatsApp agora
            </WhatsAppButton>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-4 text-xs text-muted-foreground"
          >
            Resposta em minutos · Pagamento seguro
          </motion.p>
        </div>
      </section>

      {/* COUNTDOWN / URGENCY */}
      <section className="py-10 sm:py-14 bg-gradient-to-b from-background to-card/50">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-5 max-w-2xl text-center"
        >
          {expired ? (
            <p className="font-editorial text-xl sm:text-2xl text-foreground">
              Campanha encerrada — fale no WhatsApp para consultar disponibilidade
            </p>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 text-gold-dark text-sm font-medium uppercase tracking-[0.2em] mb-4">
                <Hourglass className="w-4 h-4" />
                Tempo restante
              </div>
              <p className="font-editorial text-xl sm:text-2xl text-foreground mb-6">
                ⏳ Campanha especial de Dia das Mães termina em breve
              </p>
              <div className="flex justify-center items-end gap-2 sm:gap-4">
                <TimeBox value={days} label="dias" />
                <span className="font-editorial text-2xl sm:text-3xl text-muted-foreground pb-7">:</span>
                <TimeBox value={hours} label="horas" />
                <span className="font-editorial text-2xl sm:text-3xl text-muted-foreground pb-7">:</span>
                <TimeBox value={minutes} label="min" />
                <span className="font-editorial text-2xl sm:text-3xl text-muted-foreground pb-7">:</span>
                <TimeBox value={seconds} label="seg" />
              </div>
            </>
          )}
        </motion.div>
      </section>

      {/* TIERS */}
      <section className="py-14 sm:py-20 bg-card">
        <div className="container mx-auto px-5 max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-gold mb-3">
              Escolha o valor
            </p>
            <h2 className="font-editorial text-2xl sm:text-4xl text-foreground">
              Qual presente combina com ela?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-2xl p-6 sm:p-8 flex flex-col text-center transition-all ${
                  tier.highlight
                    ? "bg-gradient-to-br from-gold-light/10 via-background to-gold/5 border-2 border-gold shadow-gold scale-[1.02] md:scale-105"
                    : "bg-background border border-border shadow-soft"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-gradient-gold px-4 py-1 text-[11px] uppercase tracking-[0.15em] text-white font-medium shadow-gold">
                    <Crown className="w-3 h-3" />
                    Mais escolhido
                  </div>
                )}

                <div className="font-editorial text-5xl sm:text-6xl text-foreground mb-2">
                  ${tier.value}
                </div>
                <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground mb-6">
                  {tier.label}
                </p>

                <WhatsAppButton
                  href={waLink(tier.msg)}
                  ctaType={`tier_${tier.value}`}
                  message={tier.msg}
                  value={tier.value}
                  className="w-full mt-auto"
                >
                  <MessageCircle className="w-4 h-4" />
                  Quero esse valor
                </WhatsAppButton>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="container mx-auto px-5 max-w-2xl text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-gold/10 via-gold-light/10 to-gold/10 border border-gold/20 px-6 py-3">
            <Crown className="w-5 h-5 text-gold" />
            <p className="text-sm sm:text-base text-foreground font-medium">
              Mais de <span className="text-gold-dark font-semibold">120 clientes</span> já compraram esse mês
            </p>
          </div>
        </motion.div>
      </section>

      {/* VISUAL GALLERY */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-5 max-w-5xl">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[hairService, treatments, teamHero].map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="aspect-[3/4] overflow-hidden rounded-xl shadow-card"
              >
                <img
                  src={src}
                  alt="Resultado ACS Beauty Studio"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-5 italic">
            Resultados reais de quem confia na ACS
          </p>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-14 sm:py-20 bg-card">
        <div className="container mx-auto px-5 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="font-editorial text-2xl sm:text-4xl text-foreground">
              Por que esse presente funciona
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-center gap-4 rounded-xl bg-background border border-border p-4 sm:p-5"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm sm:text-base text-foreground">{b.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-gold opacity-5" />
        <div className="relative container mx-auto px-5 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-editorial text-3xl sm:text-5xl leading-tight text-foreground mb-4">
              Não deixa pra última hora.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-3">
              Em menos de 2 minutos o presente está garantido.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive mb-8">
              ⚠️ Entrega garantida até o Dia das Mães
            </div>

            <div>
              <WhatsAppButton
                href={waLink(FINAL_MSG)}
                ctaType="final"
                message={FINAL_MSG}
                className="w-full sm:w-auto"
              >
                <MessageCircle className="w-5 h-5" />
                Comprar pelo WhatsApp agora
              </WhatsAppButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MINIMAL FOOTER */}
      <footer className="py-8 text-center border-t border-border">
        <p className="text-xs text-muted-foreground">
          ACS Beauty Studio · 375 Chestnut St, Newark NJ · (732) 915-3430
        </p>
      </footer>

      {/* STICKY MOBILE CTA */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 p-3 bg-background/95 backdrop-blur border-t border-border md:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <WhatsAppButton
          href={waLink(HERO_MSG)}
          ctaType="sticky_mobile"
          message={HERO_MSG}
          className="w-full !py-4 !text-base"
        >
          <MessageCircle className="w-5 h-5" />
          Comprar pelo WhatsApp
        </WhatsAppButton>
      </div>
      <div className="h-20 md:hidden" aria-hidden />
    </main>
  );
}
