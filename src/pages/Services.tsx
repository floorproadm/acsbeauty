import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Services() {
  const { t } = useLanguage();

  const { data: offers, isLoading } = useQuery({
    queryKey: ["public-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("active", true)
        .in("type", ["entry_offer", "consultation_offer"]);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-[100svh] bg-background">
      <Header />
      <main className="pt-20 md:pt-24 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 md:mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-accent/50 text-accent-foreground text-xs md:text-sm font-medium mb-4">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
              {t("services_page_badge")}
            </span>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              {t("services_page_title")}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              {t("services_page_description")}
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-56 md:h-64 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
              {offers?.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-5 md:p-6 shadow-soft hover:shadow-card transition-shadow"
                >
                  <div className="inline-block px-3 py-1 rounded-full bg-rose-light text-rose-gold text-xs font-medium mb-3 md:mb-4">
                    {offer.type === "entry_offer" ? t("new_client_special") : t("free_consultation")}
                  </div>
                  <h2 className="font-serif text-xl md:text-2xl font-bold mb-2">{offer.headline || offer.name}</h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{offer.body}</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xl md:text-2xl font-bold text-rose-gold">{offer.price_display}</span>
                    <Link to={`/o/${offer.id}`}>
                      <Button variant="hero" size="default" className="group">
                        {t("learn_more")}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-10 md:mt-12"
          >
            <Link to="/packages">
              <Button variant="hero-outline" size="lg" className="group w-full sm:w-auto">
                {t("view_our_packages")}
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
