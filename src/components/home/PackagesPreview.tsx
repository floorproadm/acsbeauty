import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const offers = [
  {
    name: "Beauty Start",
    description: "Uma experiência inicial pensada para você conhecer o cuidado e a excelência da ACS.",
    descriptionEn: "An introductory experience designed for you to discover the care and excellence of ACS.",
    featured: false,
  },
  {
    name: "Glow Signature",
    description: "Nosso cuidado mais procurado para quem busca resultado, acabamento impecável e autoestima elevada.",
    descriptionEn: "Our most sought-after care for those seeking results, flawless finishing, and elevated self-esteem.",
    featured: true,
  },
  {
    name: "Beauty Event",
    description: "Ideal para eventos, datas especiais ou momentos importantes. Beleza pensada nos mínimos detalhes.",
    descriptionEn: "Perfect for events, special dates, or important moments. Beauty crafted in every detail.",
    featured: false,
  },
];

export function PackagesPreview() {
  const { t, language } = useLanguage();

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium tracking-wider text-rose-gold uppercase mb-4">
            <Sparkles className="w-4 h-4" />
            {t("packages_badge")}
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            {t("packages_title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("packages_description")}
          </p>
        </motion.div>

        {/* Offers Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {offers.map((offer, index) => (
            <motion.div
              key={offer.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 transition-all duration-500 ${
                offer.featured
                  ? "bg-primary text-primary-foreground shadow-elevated scale-105"
                  : "bg-card shadow-card hover:shadow-elevated"
              }`}
            >
              {offer.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1 rounded-full bg-rose-gold text-foreground text-sm font-medium">
                  <Star className="w-4 h-4" />
                  {t("most_popular")}
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-serif text-2xl font-bold mb-3">{offer.name}</h3>
                <p className={`text-sm leading-relaxed ${offer.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {language === "pt" ? offer.description : offer.descriptionEn}
                </p>
              </div>

              <Link to="/packages" className="block mt-auto">
                <Button
                  variant={offer.featured ? "rose" : "hero"}
                  className="w-full"
                >
                  {t("book_this_offer")}
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
          className="text-center mt-12"
        >
          <Link to="/packages">
            <Button variant="hero-outline" size="lg" className="group">
              {t("view_all_offers")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
