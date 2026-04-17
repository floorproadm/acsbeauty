import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Scissors, Eye, Palette } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

import hairServiceImg from "@/assets/hair-service.png";
import browsServiceImg from "@/assets/brows-service.jpg";
import nailsServiceImg from "@/assets/nails-service.jpg";

// Fallback images and icons by category_slug
const CATEGORY_META: Record<string, { icon: typeof Scissors; image: string }> = {
  cabelo: { icon: Scissors, image: hairServiceImg },
  sobrancelhas: { icon: Eye, image: browsServiceImg },
  unhas: { icon: Palette, image: nailsServiceImg },
};

export default function Services() {
  const { t, language } = useLanguage();

  // Fetch distinct categories from active services
  const { data: categories } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("category, category_slug")
        .eq("is_active", true)
        .order("category");
      if (error) throw error;

      // Deduplicate by category_slug
      const seen = new Set<string>();
      const unique: { category: string; category_slug: string }[] = [];
      for (const row of data || []) {
        if (row.category_slug && !seen.has(row.category_slug)) {
          seen.add(row.category_slug);
          unique.push({ category: row.category!, category_slug: row.category_slug });
        }
      }
      return unique;
    },
  });

  // Translation keys per category_slug
  const getCategoryLabel = (slug: string, category: string) => {
    const keyMap: Record<string, { namePt: string; nameEn: string; descPt: string; descEn: string }> = {
      cabelo: {
        namePt: "Cabelo",
        nameEn: "Hair",
        descPt: "Extensões de cabelos, highlights, progressiva, botox capilar, selagem, tratamentos capilares, corte, tintura e escova.",
        descEn: "Hair extensions, highlights, keratin treatment, hair botox, sealing, hair treatments, cut, color, and blowout.",
      },
      sobrancelhas: {
        namePt: "Sobrancelhas",
        nameEn: "Brows",
        descPt: "Design perfeito e técnicas avançadas para realçar seu olhar.",
        descEn: "Perfect design and advanced techniques to enhance your look.",
      },
      unhas: {
        namePt: "Unhas",
        nameEn: "Nails",
        descPt: "Nail art, alongamento e esmaltação em gel para mãos impecáveis.",
        descEn: "Nail art, extensions and gel polish for flawless hands.",
      },
      maquiagem: {
        namePt: "Maquiagem",
        nameEn: "Makeup",
        descPt: "Maquiagem profissional para eventos, noivas e produções especiais.",
        descEn: "Professional makeup for events, brides and special productions.",
      },
      tratamentos: {
        namePt: "Tratamentos",
        nameEn: "Treatments",
        descPt: "Tratamentos capilares personalizados para restaurar a saúde e o brilho do cabelo.",
        descEn: "Customized hair treatments to restore health and shine.",
      },
    };
    const meta = keyMap[slug];
    if (!meta) {
      return {
        name: category,
        description:
          language === "pt"
            ? "Conheça nossos serviços especializados."
            : "Discover our specialized services.",
      };
    }
    return {
      name: language === "pt" ? meta.namePt : meta.nameEn,
      description: language === "pt" ? meta.descPt : meta.descEn,
    };
  };

  return (
    <div className="min-h-[100svh] bg-background">
      <Header />
      <main className="pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 md:mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-accent/50 text-accent-foreground text-xs md:text-sm font-medium mb-4">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
              {t("services.badge")}
            </span>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              {t("services.title")}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              {t("services.description")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {(categories || []).map((cat, index) => {
              const meta = CATEGORY_META[cat.category_slug] || { icon: Sparkles, image: hairServiceImg };
              const Icon = meta.icon;
              const labels = getCategoryLabel(cat.category_slug, cat.category);

              return (
                <motion.div
                  key={cat.category_slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={meta.image}
                      alt={labels.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-rose-light flex items-center justify-center">
                        <Icon className="w-4 h-4 text-rose-gold" />
                      </div>
                      <h2 className="font-serif text-xl md:text-2xl font-bold">
                        {labels.name}
                      </h2>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {labels.description}
                    </p>
                    <Link to={`/servicos/${cat.category_slug}`}>
                      <Button variant="hero" size="default" className="w-full group/btn">
                        {t("global.learn_more")}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
