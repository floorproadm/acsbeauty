import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function CTASection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 md:py-24 bg-primary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-champagne/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 md:w-80 h-48 md:h-80 bg-champagne/15 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 md:mb-6">
            {t("home.cta.title_1")}{" "}
            <span className="text-champagne">{t("home.cta.title_2")}</span>
          </h2>
          <p className="text-white/80 text-base md:text-lg lg:text-xl mb-8 md:mb-10 leading-relaxed">
            {t("home.cta.description")}
          </p>
          <div className="flex flex-col gap-3 md:gap-4 sm:flex-row justify-center">
            <Link to="/portal" className="w-full sm:w-auto">
              <Button size="xl" className="bg-white text-primary font-medium hover:bg-white/90 shadow-elevated group w-full sm:w-auto">
                <Calendar className="w-5 h-5" />
                {t("home.cta.book_now")}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/services" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white bg-white/15 hover:bg-white/25 w-full sm:w-auto"
              >
                {t("home.cta.view_services")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
