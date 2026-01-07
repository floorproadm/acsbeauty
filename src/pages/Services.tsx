import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function Services() {
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
              Start Your Journey
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Our Special Offers
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Begin your skincare journey with our introductory offers designed for new clients.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {offers?.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow"
                >
                  <div className="inline-block px-3 py-1 rounded-full bg-rose-light text-rose-gold text-xs font-medium mb-4">
                    {offer.type === "entry_offer" ? "New Client Special" : "Free Consultation"}
                  </div>
                  <h2 className="font-serif text-2xl font-bold mb-2">{offer.headline || offer.name}</h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{offer.body}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-rose-gold">{offer.price_display}</span>
                    <Link to={`/o/${offer.id}`}>
                      <Button variant="hero" size="sm" className="group">
                        Learn More
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
            className="text-center mt-12"
          >
            <Link to="/packages">
              <Button variant="hero-outline" size="lg" className="group">
                View Our Packages
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
