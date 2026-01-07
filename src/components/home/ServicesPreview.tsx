import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Scissors, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function ServicesPreview() {
  const { t } = useLanguage();

  const services = [
    {
      icon: Scissors,
      titleKey: "service_hair",
      descKey: "service_hair_desc",
      ctaKey: "service_hair_cta",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
      href: "/services",
    },
    {
      icon: Eye,
      titleKey: "service_brows",
      descKey: "service_brows_desc",
      ctaKey: "service_brows_cta",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
      href: "/services",
    },
    {
      icon: Sparkles,
      titleKey: "service_nails",
      descKey: "service_nails_desc",
      ctaKey: "service_nails_cta",
      image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80",
      href: "/services",
    },
  ];

  return (
    <section className="py-24 bg-gradient-warm">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block text-sm font-medium tracking-wider text-rose-gold uppercase mb-4">
            {t("services_badge")}
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            {t("services_title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("services_description")}
          </p>
        </motion.div>

        {/* Services Grid - 3 Pillars */}
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-500"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={service.image}
                  alt={t(service.titleKey)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
                <div className="flex items-center gap-2 mb-3">
                  <service.icon className="w-5 h-5 text-rose-gold" />
                  <h3 className="font-serif text-2xl font-semibold">{t(service.titleKey)}</h3>
                </div>
                <p className="text-primary-foreground/80 text-sm leading-relaxed mb-4">
                  {t(service.descKey)}
                </p>
                <Link to={service.href}>
                  <Button variant="ghost" size="sm" className="text-rose-gold hover:text-rose-gold/80 hover:bg-transparent p-0 h-auto group/btn">
                    {t(service.ctaKey)}
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link to="/services">
            <Button variant="hero-outline" size="lg" className="group">
              {t("view_all_services")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
