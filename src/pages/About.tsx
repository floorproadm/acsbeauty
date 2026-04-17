import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Heart, Shield, Calendar, ArrowRight, Users } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function About() {
  const { t } = useLanguage();

  const pillars = [
    { icon: Sparkles, titleKey: "about.pillar_excellence_title", descKey: "about.pillar_excellence_desc" },
    { icon: Heart, titleKey: "about.pillar_care_title", descKey: "about.pillar_care_desc" },
    { icon: Shield, titleKey: "about.pillar_trust_title", descKey: "about.pillar_trust_desc" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-8 md:pb-12 px-5 md:px-6 bg-gradient-to-b from-champagne/30 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <motion.span
              className="inline-block px-3 md:px-4 py-1.5 bg-rose-gold/10 text-rose-gold text-xs md:text-sm font-medium rounded-full mb-3 md:mb-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {t("about.badge")}
            </motion.span>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 leading-tight">
              {t("about.hero_title")}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("about.hero_description")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-12 md:py-20 px-5 md:px-6">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="font-serif text-2xl md:text-4xl font-bold text-foreground mb-6 md:mb-8">
              {t("about.story_title")}{" "}
              <span className="text-rose-gold italic">{t("about.story_title_highlight")}</span>
            </h2>
            <div className="space-y-4 md:space-y-5 text-muted-foreground leading-relaxed text-base md:text-lg">
              <p>{t("about.story_p1")}</p>
              <p>{t("about.story_p2")}</p>
              <p>{t("about.story_p3")}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-12 md:py-20 px-5 md:px-6 bg-champagne/20">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="font-serif text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
              {t("about.pillars_title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              {t("about.pillars_description")}
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-8">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-background rounded-xl md:rounded-2xl p-6 md:p-8 shadow-soft text-center"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-rose-gold/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <pillar.icon className="w-6 h-6 md:w-8 md:h-8 text-rose-gold" />
                </div>
                <h3 className="font-serif text-lg md:text-xl font-semibold text-foreground mb-2 md:mb-3">
                  {t(pillar.titleKey)}
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                  {t(pillar.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bridge Section — Founder + Team */}
      <section className="py-12 md:py-20 px-5 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="font-serif text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
              {t("about.bridge_title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              {t("about.bridge_description")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link
                to="/ane-caroline"
                className="group block bg-card border border-border rounded-2xl p-6 md:p-8 hover:shadow-card hover:border-rose-gold/40 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-gold/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-rose-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg md:text-xl font-semibold text-foreground mb-1">
                      {t("about.bridge_founder")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">Ane Caroline</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-gold group-hover:gap-2.5 transition-all">
                      <span>→</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-5 group-hover:ml-0 transition-all" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link
                to="/team"
                className="group block bg-card border border-border rounded-2xl p-6 md:p-8 hover:shadow-card hover:border-rose-gold/40 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-gold/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-rose-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg md:text-xl font-semibold text-foreground mb-1">
                      {t("about.bridge_team")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">ACS Beauty</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-gold group-hover:gap-2.5 transition-all">
                      <span>→</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-5 group-hover:ml-0 transition-all" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-20 px-5 md:px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-2xl md:text-4xl font-bold mb-3 md:mb-4">{t("about.cta_title")}</h2>
            <p className="text-primary-foreground/70 max-w-xl mx-auto mb-6 md:mb-8 text-sm md:text-base">
              {t("about.cta_description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link to="/services" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="gap-2 w-full">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                  {t("global.book_now")}
                </Button>
              </Link>
              <Link to="/services" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="border-rose-gold/50 text-rose-gold hover:bg-rose-gold/10 w-full">
                  {t("global.view_offers")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
