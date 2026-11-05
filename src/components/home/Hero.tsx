import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, HeartHandshake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ServiceGuide } from "@/components/whatsapp/ServiceGuide";
import founderImg from "@/assets/founder.jpg";

export function Hero() {
  const { t, language } = useLanguage();

  return (
    <section className="relative min-h-[85svh] lg:min-h-0 flex items-center bg-gradient-nude overflow-hidden">
      {/* Decorative elements - Gold accents */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-0 w-64 md:w-96 h-64 md:h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-48 md:w-80 h-48 md:h-80 bg-nude-dark/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 pt-28 md:pt-24 pb-8 md:pb-12 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Content */}
          <div className="max-w-xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sans text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-light tracking-[0.02em] leading-snug mb-4 md:mb-6"
            >
              {t("home.hero.title_1")}{" "}
              <span className="text-gradient-gold">{t("home.hero.title_2")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6 md:mb-8"
            >
              {t("home.hero.description")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 md:gap-4"
            >
              <Link to="/about" className="w-full sm:w-auto">
                <Button
                  variant="hero-outline"
                  size="lg"
                  className="w-full sm:w-72 min-h-[52px] px-8 text-base justify-center"
                >
                  <HeartHandshake className="w-5 h-5 shrink-0" />
                  {t("home.hero.cta_story")}
                </Button>
              </Link>
              {/* Primary CTA - Opens the service guide */}
              <ServiceGuide
                triggerVariant="hero"
                triggerSize="lg"
                triggerClassName={`group w-full sm:w-72 min-h-[52px] px-8 justify-center whitespace-nowrap ${
                  language === "pt" ? "text-[15px] sm:text-base" : "text-base"
                }`}
                triggerContent={
                  <>
                    <Calendar className="w-5 h-5 shrink-0" />
                    {t("home.hero.cta_guide")}
                  </>
                }
              />
              <p className="mt-2.5 text-center text-[13px] font-normal text-[#84786E]">
                {t("home.hero.guide_microcopy")}
              </p>
            </motion.div>
          </div>

          {/* Image - Hidden on mobile, optimized for desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-elevated">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-transparent to-gold-dark/20" />
              <img
                src={founderImg}
                alt="ACS Beauty - Fundadora"
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="absolute -left-8 bottom-12 bg-card p-4 md:p-6 rounded-xl shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent flex items-center justify-center">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm md:text-base text-foreground">{t("home.hero.premium_care")}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{t("home.hero.personalized_treatments")}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
