import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Loader2, Scissors, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

import hairImage from "@/assets/hair-service.png";
import browsImage from "@/assets/brows-service.jpg";
import nailsImage from "@/assets/nails-service.jpg";

// Category display metadata by category_slug
const CATEGORY_CONFIG: Record<string, {
  icon: typeof Scissors;
  fallbackImage: string;
  badgeKey: string;
  titleKey: string;
  subtitleKey: string;
  aboutTitleKey: string;
  aboutTextKey: string;
}> = {
  cabelo: {
    icon: Scissors,
    fallbackImage: hairImage,
    badgeKey: "servicos.cabelo.badge",
    titleKey: "servicos.cabelo.title",
    subtitleKey: "servicos.cabelo.subtitle",
    aboutTitleKey: "servicos.cabelo.about_title",
    aboutTextKey: "servicos.cabelo.about_text",
  },
  sobrancelhas: {
    icon: Eye,
    fallbackImage: browsImage,
    badgeKey: "servicos.sobrancelhas.badge",
    titleKey: "servicos.sobrancelhas.title",
    subtitleKey: "servicos.sobrancelhas.subtitle",
    aboutTitleKey: "servicos.sobrancelhas.about_title",
    aboutTextKey: "servicos.sobrancelhas.about_text",
  },
  unhas: {
    icon: Sparkles,
    fallbackImage: nailsImage,
    badgeKey: "servicos.unhas.badge",
    titleKey: "servicos.unhas.title",
    subtitleKey: "servicos.unhas.subtitle",
    aboutTitleKey: "servicos.unhas.about_title",
    aboutTextKey: "servicos.unhas.about_text",
  },
};

export default function CategoryPage() {
  const { categoria } = useParams<{ categoria: string }>();
  const { t } = useLanguage();
  const categorySlug = categoria?.toLowerCase() || "";
  const config = CATEGORY_CONFIG[categorySlug];

  // Fetch services by category_slug
  const { data: services, isLoading } = useQuery({
    queryKey: ["category-services", categorySlug],
    queryFn: async () => {
      if (!categorySlug) return [];
      const { data, error } = await supabase
        .from("services")
        .select("id, name, slug, description, price, hero_image_url")
        .eq("category_slug", categorySlug)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!categorySlug,
  });

  // Fetch min SKU price for each service
  const serviceIds = services?.map((s) => s.id) || [];
  const { data: skuPrices } = useQuery({
    queryKey: ["category-sku-prices", serviceIds],
    queryFn: async () => {
      if (serviceIds.length === 0) return {};
      const { data, error } = await supabase
        .from("service_skus")
        .select("service_id, price")
        .in("service_id", serviceIds)
        .eq("is_active", true)
        .order("price", { ascending: true });
      if (error) throw error;
      const priceMap: Record<string, number> = {};
      for (const sku of data || []) {
        if (sku.price != null && (!priceMap[sku.service_id] || sku.price < priceMap[sku.service_id])) {
          priceMap[sku.service_id] = sku.price;
        }
      }
      return priceMap;
    },
    enabled: serviceIds.length > 0,
  });


  const Icon = config.icon;
  const heroImage = config.fallbackImage;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-20 pb-12 md:pt-0 md:pb-0 md:min-h-[80vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src={heroImage} alt={t(config.titleKey)} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/60 md:bg-gradient-to-r md:from-background/90 md:via-background/70 md:to-background/40" />
          </div>

          <div className="container mx-auto px-5 md:px-6 relative z-10 py-6 md:py-0">
            <Link to="/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-8">
              <ArrowLeft className="w-4 h-4" />
              {t("global.back")}
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="p-2 md:p-3 rounded-full bg-rose-gold/20 backdrop-blur-sm">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-rose-gold" />
                </div>
                <span className="text-xs md:text-sm font-medium tracking-wider text-rose-gold uppercase">{t(config.badgeKey)}</span>
              </div>
              <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-foreground leading-tight">{t(config.titleKey)}</h1>
              <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 leading-relaxed">{t(config.subtitleKey)}</p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link to="/portal" className="w-full sm:w-auto">
                  <Button variant="hero" size="lg" className="group w-full">
                    {t("global.book_now")}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* About */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6 text-foreground">{t(config.aboutTitleKey)}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">{t(config.aboutTextKey)}</p>
            </motion.div>
          </div>
        </section>

        {/* Services List */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 text-foreground">{t("servicos.what_we_offer")}</h2>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-rose-gold" />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {services?.map((service, index) => {
                    const minPrice = skuPrices?.[service.id] ?? service.price;
                    return (
                      <motion.div key={service.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.05 }}>
                        <Link to={`/servicos/${categorySlug}/${service.slug}`} className="flex items-center gap-3 p-3 bg-card rounded-lg shadow-soft hover:shadow-card transition-all group">
                          <div className="p-1.5 rounded-full bg-rose-gold/10 shrink-0">
                            <Check className="w-4 h-4 text-rose-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-foreground font-medium group-hover:text-rose-gold transition-colors">{service.name}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-gold transition-colors shrink-0" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </section>


        {/* CTA */}
        <section className="py-16 md:py-20 bg-gradient-warm">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-2xl mx-auto text-center">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4 text-foreground">{t("servicos.cta_title")}</h2>
              <p className="text-muted-foreground mb-8">{t("servicos.cta_description")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/portal">
                  <Button variant="hero" size="lg" className="group w-full sm:w-auto">
                    {t("global.book_now")}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
