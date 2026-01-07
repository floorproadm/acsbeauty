import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function OfferLanding() {
  const { id } = useParams<{ id: string }>();

  const { data: offer, isLoading, error } = useQuery({
    queryKey: ["offer", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, services(*)")
        .eq("id", id)
        .eq("active", true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-24 w-full mb-8" />
            <Skeleton className="h-12 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-3xl font-bold mb-4">Offer Not Found</h1>
            <p className="text-muted-foreground mb-8">This offer may have expired or is no longer available.</p>
            <Link to="/services">
              <Button variant="hero">View All Offers</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const service = offer.services;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link to="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Offers
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-light text-rose-gold text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              {offer.type === "entry_offer" ? "New Client Special" : "Free Consultation"}
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              {offer.headline || offer.name}
            </h1>

            <div className="text-4xl font-bold text-rose-gold mb-6">
              {offer.price_display}
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {offer.body}
            </p>

            {service && (
              <div className="bg-card rounded-xl p-6 mb-8">
                <h3 className="font-medium mb-3">Treatment Details</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {service.duration_minutes} minutes
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Book anytime
                  </div>
                </div>
              </div>
            )}

            <Link to={`/book?offer_id=${offer.id}`}>
              <Button variant="hero" size="xl" className="w-full">
                <Calendar className="w-5 h-5" />
                Book Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
