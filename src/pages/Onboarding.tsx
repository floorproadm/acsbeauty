import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import acsLogo from "@/assets/acs-logo.png";
import founderImg from "@/assets/founder.jpg";

const STORAGE_KEY = "acs_onboarding_done";

const slides = [
  {
    icon: "✦",
    title: "Bem-vinda à ACS Beauty",
    titleEn: "Welcome to ACS Beauty",
    description: "Estúdio de beleza em Newark, NJ. Cabelo, sobrancelhas e unhas com técnica, constância e cuidado real.",
    descriptionEn: "Beauty studio in Newark, NJ. Hair, brows & nails with technique, consistency, and genuine care.",
  },
  {
    icon: "📅",
    title: "Agendamento simples",
    titleEn: "Simple booking",
    description: "Escolha o serviço, selecione a data e o horário. Tudo em poucos toques.",
    descriptionEn: "Choose your service, select date and time. All in a few taps.",
  },
  {
    icon: "⭐",
    title: "ACS Points",
    titleEn: "ACS Points",
    description: "Acumule pontos a cada visita e troque por serviços exclusivos. Quanto mais você cuida de si, mais benefícios você tem.",
    descriptionEn: "Earn points with every visit and redeem them for exclusive services. The more you care for yourself, the more benefits you get.",
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const navigate = useNavigate();
  const isPt = lang === "pt";
  const slide = slides[current];
  const isLast = current === slides.length - 1;

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (done) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        navigate(session ? "/" : "/auth");
      });
    }
  }, [navigate]);

  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    navigate("/auth");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background overflow-hidden">
      {/* Esquerda — foto (desktop only) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <img src={founderImg} alt="Ane Caroline" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/70" />
        <div className="absolute top-6 left-6">
          <img src={acsLogo} alt="ACS Beauty" className="h-12 w-auto" />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`badge-${current}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-6 right-6 w-14 h-14 rounded-2xl bg-primary/90 flex items-center justify-center text-2xl shadow-lg"
          >
            {slide.icon}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Direita — conteúdo */}
      <div className="flex-1 flex flex-col min-h-screen md:min-h-0">
        {/* Topo: lang toggle + skip */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-1 text-sm font-medium">
            {(["pt", "en"] as const).map((l, i) => (
              <>
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-1.5 py-0.5 transition-colors ${lang === l ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                >
                  {l.toUpperCase()}
                </button>
                {i === 0 && <span className="text-muted-foreground/25">|</span>}
              </>
            ))}
          </div>
          <button onClick={finish} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {isPt ? "Pular" : "Skip"}
          </button>
        </div>

        {/* Conteúdo central */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 text-center">
          <div className="md:hidden mb-6">
            <img src={acsLogo} alt="ACS Beauty" className="h-14 w-auto mx-auto" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`icon-${current}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl mb-6"
            >
              {slide.icon}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${current}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35 }}
            >
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4 leading-snug">
                {isPt ? slide.title : slide.titleEn}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-sm mx-auto">
                {isPt ? slide.description : slide.descriptionEn}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom: dots + botão */}
        <div className="px-8 pb-10">
          <div className="flex items-center justify-center gap-2 mb-5">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}>
                <div className={`rounded-full transition-all duration-300 ${i === current ? "w-6 h-2.5 bg-primary" : "w-2.5 h-2.5 bg-muted-foreground/20"}`} />
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground/40 mb-4">
            {current + 1} / {slides.length}
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => isLast ? finish() : setCurrent((c) => c + 1)}
            className="w-full h-14 rounded-full bg-primary text-primary-foreground font-medium text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-md"
          >
            {isLast ? (isPt ? "Começar" : "Get started") : (isPt ? "Próximo" : "Next")}
            <span className="text-base">›</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
