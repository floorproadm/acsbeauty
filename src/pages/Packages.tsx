import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Packages() {
  const { t } = useLanguage();

  const { data: packages, isLoading } = useQuery({
    queryKey: ["public-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("active", true);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-accent-foreground text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              {t("packages_page_badge")}
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              {t("packages_page_title")}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("packages_page_description")}
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {packages?.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow ${
                    pkg.is_featured ? "ring-2 ring-rose-gold" : ""
                  }`}
                >
                  {pkg.is_featured && (
                    <div className="inline-block px-3 py-1 rounded-full bg-rose-gold text-primary-foreground text-xs font-medium mb-4">
                      {t("most_popular")}
                    </div>
                  )}
                  <h2 className="font-serif text-2xl font-bold mb-2">{pkg.name}</h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{pkg.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-foreground">${pkg.total_price}</span>
                    {pkg.original_price && pkg.original_price > pkg.total_price && (
                      <span className="ml-2 text-muted-foreground line-through">${pkg.original_price}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Check className="w-4 h-4 text-rose-gold" />
                    <span>{pkg.sessions_qty} {t("sessions_included")}</span>
                  </div>

                  <Link to={`/p/${pkg.id}`}>
                    <Button variant="hero" className="w-full group">
                      {t("view_package")}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link to="/services">
              <Button variant="hero-outline" size="lg" className="group">
                {t("view_offers")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
