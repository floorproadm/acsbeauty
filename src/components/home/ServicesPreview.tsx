import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Scissors, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import browsImage from "@/assets/brows-service.jpg";
import hairImage from "@/assets/hair-service.png";
import nailsImage from "@/assets/nails-service.jpg";

export function ServicesPreview() {
  const { t } = useLanguage();

  const services = [
    {
      icon: Scissors,
      titleKey: "home.services.hair",
      descKey: "home.services.hair_desc",
      image: hairImage,
      imagePosition: "center",
    },
    {
      icon: Eye,
      titleKey: "home.services.brows",
      descKey: "home.services.brows_desc",
      image: browsImage,
      imagePosition: "center 30%",
    },
    {
      icon: Sparkles,
      titleKey: "home.services.nails",
      descKey: "home.services.nails_desc",
      image: nailsImage,
      imagePosition: "center",
    },
  ];

  return (
    <section className="py-20 md:py-24 bg-gradient-warm">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12 md:mb-16"
        >
          <span className="inline-block text-sm font-medium tracking-wider text-rose-gold uppercase mb-4">
            {t("home.services.badge")}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
            {t("home.services.title")}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            {t("home.services.description")}
          </p>
        </motion.div>

        {/* Services Grid - 3 Pillars (info only, no links to catalog) */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-card rounded-2xl overflow-hidden shadow-soft"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={service.image}
                  alt={t(service.titleKey)}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: service.imagePosition }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-primary-foreground">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <service.icon className="w-5 h-5 text-rose-gold" />
                  <h3 className="font-serif text-xl md:text-2xl font-semibold">{t(service.titleKey)}</h3>
                </div>
                <p className="text-primary-foreground/80 text-sm leading-relaxed">
                  {t(service.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA - Direct to offers only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-10 md:mt-12"
        >
          <Link to="/services">
            <Button variant="hero" size="lg" className="group w-full sm:w-auto">
              {t("home.services.view_offers")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
