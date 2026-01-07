import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Heart, Shield, MapPin, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function About() {
  const { t } = useLanguage();

  const pillars = [
    {
      icon: Sparkles,
      titleKey: "about_pillar_excellence_title",
      descKey: "about_pillar_excellence_desc",
    },
    {
      icon: Heart,
      titleKey: "about_pillar_care_title",
      descKey: "about_pillar_care_desc",
    },
    {
      icon: Shield,
      titleKey: "about_pillar_trust_title",
      descKey: "about_pillar_trust_desc",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-champagne/30 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-rose-gold/10 text-rose-gold text-sm font-medium rounded-full mb-6">
              {t("about_badge")}
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {t("about_hero_title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("about_hero_description")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 md:order-1"
            >
              <span className="text-rose-gold font-medium text-sm uppercase tracking-wider">
                {t("about_founder_badge")}
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">
                {t("about_founder_title")}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t("about_founder_text_1")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("about_founder_text_2")}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 md:order-2"
            >
              {/* Founder image placeholder */}
              <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-champagne/50 to-rose-gold/20 flex items-center justify-center border border-rose-gold/20">
                <span className="text-muted-foreground text-sm">
                  {t("about_founder_image_placeholder")}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-20 px-6 bg-champagne/20">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("about_pillars_title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("about_pillars_description")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-background rounded-2xl p-8 shadow-soft text-center"
              >
                <div className="w-16 h-16 rounded-full bg-rose-gold/10 flex items-center justify-center mx-auto mb-6">
                  <pillar.icon className="w-8 h-8 text-rose-gold" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">
                  {t(pillar.titleKey)}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(pillar.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 rounded-full bg-rose-gold/10 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-rose-gold" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("about_location_title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              {t("about_location_description")}
            </p>
            <p className="text-foreground font-medium">
              123 Beauty Lane, Suite 100<br />
              New York, NY 10001
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              {t("about_cta_title")}
            </h2>
            <p className="text-primary-foreground/70 max-w-xl mx-auto mb-8">
              {t("about_cta_description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services">
                <Button variant="hero" size="xl" className="gap-2">
                  <Calendar className="w-5 h-5" />
                  {t("book_now")}
                </Button>
              </Link>
              <Link to="/services">
                <Button
                  variant="outline"
                  size="xl"
                  className="border-rose-gold/50 text-rose-gold hover:bg-rose-gold/10"
                >
                  {t("view_offers")}
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
