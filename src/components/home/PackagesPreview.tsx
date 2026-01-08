import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const offers = [
  {
    name: "Beauty Start",
    descriptionPt: "Uma experiência inicial pensada para você conhecer o cuidado e a excelência da ACS.",
    descriptionEn: "An introductory experience designed for you to discover the care and excellence of ACS.",
    featured: false,
  },
  {
    name: "Glow Signature",
    descriptionPt: "Nosso cuidado mais procurado para quem busca resultado, acabamento impecável e autoestima elevada.",
    descriptionEn: "Our most sought-after care for those seeking results, flawless finishing, and elevated self-esteem.",
    featured: true,
  },
  {
    name: "Beauty Event",
    descriptionPt: "Ideal para eventos, datas especiais ou momentos importantes. Beleza pensada nos mínimos detalhes.",
    descriptionEn: "Perfect for events, special dates, or important moments. Beauty crafted in every detail.",
    featured: false,
  },
];

export function PackagesPreview() {
  const { t, language } = useLanguage();

  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium tracking-wider text-rose-gold uppercase mb-4">
            <Sparkles className="w-4 h-4" />
            {t("home.packages.badge")}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
            {t("home.packages.title")}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            {t("home.packages.description")}
          </p>
        </motion.div>

        {/* Offers Grid - Mobile optimized */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {offers.map((offer, index) => (
            <motion.div
              key={offer.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-6 md:p-8 transition-all duration-500 ${
                offer.featured
                  ? "bg-primary text-primary-foreground shadow-elevated md:scale-105"
                  : "bg-card shadow-card"
              }`}
            >
              {offer.featured && (
                <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 md:px-4 py-1 rounded-full bg-rose-gold text-foreground text-xs font-medium whitespace-nowrap">
                  <Star className="w-3 h-3 md:w-4 md:h-4" />
                  {t("global.most_popular")}
                </div>
              )}

              <div className="mb-5 md:mb-6">
                <h3 className="font-serif text-xl md:text-2xl font-bold mb-2 md:mb-3">{offer.name}</h3>
                <p className={`text-sm leading-relaxed ${offer.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {language === "pt" ? offer.descriptionPt : offer.descriptionEn}
                </p>
              </div>

              <Link to="/packages" className="block mt-auto">
                <Button
                  variant={offer.featured ? "rose" : "hero"}
                  className="w-full"
                  size="lg"
                >
                  {t("home.packages.book_offer")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-10 md:mt-12"
        >
          <Link to="/packages">
            <Button variant="hero-outline" size="lg" className="group w-full sm:w-auto">
              {t("home.packages.view_all")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
