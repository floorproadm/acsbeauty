import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Package, CreditCard, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function PackageLanding() {
  const { id } = useParams<{ id: string }>();

  const { data: pkg, isLoading, error } = useQuery({
    queryKey: ["package", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*, package_services(*, services(*))")
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

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-3xl font-bold mb-4">Package Not Found</h1>
            <p className="text-muted-foreground mb-8">This package may no longer be available.</p>
            <Link to="/packages">
              <Button variant="hero">View All Packages</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const savings = pkg.original_price ? pkg.original_price - pkg.total_price : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link to="/packages" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Packages
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-light text-rose-gold text-sm font-medium mb-4">
              <Package className="w-4 h-4" />
              {pkg.is_featured ? "Most Popular" : "Treatment Package"}
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              {pkg.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-foreground">${pkg.total_price}</span>
              {pkg.original_price && pkg.original_price > pkg.total_price && (
                <>
                  <span className="text-xl text-muted-foreground line-through">${pkg.original_price}</span>
                  <span className="text-sm text-rose-gold font-medium">Save ${savings}</span>
                </>
              )}
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {pkg.description}
            </p>

            <div className="bg-card rounded-xl p-6 mb-8">
              <h3 className="font-medium mb-4">Package Includes</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-rose-gold" />
                  <span>{pkg.sessions_qty} treatment sessions</span>
                </li>
                {pkg.package_services?.map((ps: any) => (
                  <li key={ps.id} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-rose-gold" />
                    <span>{ps.quantity}x {ps.services?.name}</span>
                  </li>
                ))}
                {pkg.expires_days && (
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-rose-gold" />
                    <span>Valid for {pkg.expires_days} days</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              <Button variant="hero" size="xl" className="w-full" disabled>
                <CreditCard className="w-5 h-5" />
                Buy Package (Coming Soon)
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Stripe integration coming soon
              </p>
              <Link to={`/book?package_id=${pkg.id}`}>
                <Button variant="hero-outline" size="lg" className="w-full">
                  <Calendar className="w-5 h-5" />
                  Book Using Existing Package
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
