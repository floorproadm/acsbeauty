import { useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Clock, DollarSign, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ServiceDetail() {
  const { categoria, slug, locationSlug } = useParams<{
    categoria: string;
    slug: string;
    locationSlug?: string;
  }>();
  const { t } = useLanguage();

  // Fetch the service by slug
  const { data: service, isLoading, error } = useQuery({
    queryKey: ["service-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch geo-location data if locationSlug is present
  const { data: locationData } = useQuery({
    queryKey: ["service-location", service?.id, locationSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_locations")
        .select("*")
        .eq("service_id", service!.id)
        .eq("location_slug", locationSlug!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!service?.id && !!locationSlug,
  });

  // Fetch variations for this service
  const { data: variations } = useQuery({
    queryKey: ["service-variations", service?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_variations")
        .select("*")
        .eq("service_id", service!.id)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!service?.id,
  });

  // Fetch SKUs for this service
  const { data: skus } = useQuery({
    queryKey: ["service-skus", service?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_skus")
        .select("*")
        .eq("service_id", service!.id)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!service?.id,
  });

  // SEO: Update document title and canonical
  useEffect(() => {
    if (!service) return;

    if (locationData?.meta_title) {
      document.title = locationData.meta_title;
    } else {
      document.title = `${service.name} — ACS Beauty Studio`;
    }

    // Meta description
    const existingMeta = document.querySelector('meta[name="description"]');
    const desc = locationData?.meta_description || service.description || "";
    if (existingMeta) {
      existingMeta.setAttribute("content", desc);
    } else if (desc) {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = desc;
      document.head.appendChild(meta);
    }

    // Canonical link for geo pages
    if (locationSlug && categoria && slug) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = `https://acsbeauty.lovable.app/servicos/${categoria}/${slug}`;
      return () => {
        link?.remove();
      };
    }
  }, [service, locationData, locationSlug, categoria, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-gold" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return <Navigate to="/404" replace />;
  }

  // Group SKUs by variation
  const variationMap = new Map(variations?.map((v) => [v.id, v]) || []);
  const skusByVariation = new Map<string | null, typeof skus>();
  for (const sku of skus || []) {
    const key = sku.variation_id;
    if (!skusByVariation.has(key)) skusByVariation.set(key, []);
    skusByVariation.get(key)!.push(sku);
  }

  const hasVariations = variations && variations.length > 0;
  const minPrice = skus && skus.length > 0
    ? Math.min(...skus.filter((s) => s.price != null).map((s) => Number(s.price)))
    : Number(service.price);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero */}
        <section className="pt-28 md:pt-32 pb-12 md:pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <Link
              to={`/servicos/${categoria}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("global.back")}
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <Badge variant="secondary" className="mb-4 gap-1">
                <Tag className="w-3 h-3" />
                {service.category}
                {locationData && (
                  <span className="ml-1">• {locationData.location_name}</span>
                )}
              </Badge>

              <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-foreground">
                {locationData?.meta_title
                  ? locationData.meta_title.split("—")[0]?.trim() || service.name
                  : service.name}
              </h1>

              {(locationData?.body_text || service.description) && (
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {locationData?.body_text || service.description}
                </p>
              )}

              <div className="flex items-center gap-6 text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-rose-gold" />
                  <span>a partir de <strong className="text-foreground">${minPrice.toFixed(0)}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-gold" />
                  <span>{service.duration_minutes} min</span>
                </div>
              </div>

              <Link to={`/book?service=${service.id}`}>
                <Button variant="hero" size="lg" className="group">
                  {t("global.book_now")}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* SKUs / Pricing */}
        {skus && skus.length > 0 && (
          <section className="py-16 md:py-20 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6">
              <div className="max-w-3xl mx-auto">
                <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 text-foreground">
                  Opções Disponíveis
                </h2>

                {hasVariations ? (
                  <div className="space-y-8">
                    {variations?.map((variation) => {
                      const variationSkus = skusByVariation.get(variation.id) || [];
                      if (variationSkus.length === 0) return null;
                      return (
                        <div key={variation.id}>
                          <h3 className="font-serif text-lg font-semibold mb-4 text-foreground">
                            {variation.name}
                          </h3>
                          <div className="grid gap-3">
                            {variationSkus.map((sku, idx) => (
                              <SkuCard key={sku.id} sku={sku} index={idx} serviceId={service.id} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {skusByVariation.has(null) && (
                      <div className="grid gap-3">
                        {skusByVariation.get(null)!.map((sku, idx) => (
                          <SkuCard key={sku.id} sku={sku} index={idx} serviceId={service.id} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {skus.map((sku, idx) => (
                      <SkuCard key={sku.id} sku={sku} index={idx} serviceId={service.id} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 md:py-20 bg-gradient-warm">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4 text-foreground">
                {t("servicos.cta_title")}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t("servicos.cta_description")}
              </p>
              <Link to={`/book?service=${service.id}`}>
                <Button variant="hero" size="lg" className="group">
                  {t("global.book_now")}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SkuCard({ sku, index, serviceId }: { sku: any; index: number; serviceId: string }) {
  const { t } = useLanguage();
  const hasPromo = sku.promo_price != null && sku.promo_price < sku.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="hover:shadow-card transition-shadow">
        <CardContent className="flex items-center justify-between p-4 md:p-5">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground">{sku.name}</h4>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {sku.duration_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {hasPromo ? (
                  <>
                    <span className="line-through text-muted-foreground/50">${Number(sku.price).toFixed(0)}</span>
                    <span className="text-rose-gold font-semibold">${Number(sku.promo_price).toFixed(0)}</span>
                  </>
                ) : (
                  <span>${Number(sku.price).toFixed(0)}</span>
                )}
              </span>
            </div>
          </div>
          <Link to={`/book?service=${serviceId}`}>
            <Button variant="outline" size="sm" className="shrink-0 gap-1">
              {t("global.book_now")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
