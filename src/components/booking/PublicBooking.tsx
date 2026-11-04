import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import Book from "@/pages/Book";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppCTA } from "@/components/whatsapp/WhatsAppCTA";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PUBLIC_BOOKING_ENABLED } from "@/lib/whatsapp";

export default function PublicBooking() {
  return PUBLIC_BOOKING_ENABLED ? <Book /> : <BookingTransition />;
}

function BookingTransition() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const serviceParam = params.get("service_id") || params.get("service") || params.get("services")?.split(",")[0]?.trim();
  const skuParam = params.get("sku_id") || params.get("sku");
  const { data: context, isFetching } = useQuery({
    queryKey: ["legacy-booking-context", serviceParam, skuParam],
    enabled: !!(serviceParam || skuParam),
    retry: false,
    queryFn: async () => {
      const isId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      let service: { id: string; name: string; category_slug: string | null } | null = null;
      if (serviceParam) {
        const { data } = await supabase.from("services").select("id, name, category_slug").eq(isId(serviceParam) ? "id" : "slug", serviceParam).eq("is_active", true).maybeSingle();
        service = data;
      }
      let sku: { id: string; name: string; service_id: string } | null = null;
      if (skuParam) {
        let query = supabase.from("service_skus").select("id, name, service_id").eq(isId(skuParam) ? "id" : "slug", skuParam).eq("is_active", true);
        if (service) query = query.eq("service_id", service.id);
        const { data } = await query.maybeSingle();
        sku = data;
        if (sku && !service && !serviceParam) {
          const { data } = await supabase.from("services").select("id, name, category_slug").eq("id", sku.service_id).eq("is_active", true).maybeSingle();
          service = data;
        }
      }
      return { serviceName: service?.name, serviceId: service?.id, category: service?.category_slug || undefined, skuName: sku?.name, skuId: sku?.id };
    },
  });
  return <div className="min-h-screen flex flex-col bg-background"><Header /><main className="flex-1 container mx-auto px-5 pt-40 pb-20"><div className="max-w-xl mx-auto text-center"><h1 className="font-serif text-3xl md:text-4xl mb-6">{t("wa.transition.title")}</h1><p className="text-muted-foreground text-lg mb-8">{t("wa.transition.description")}</p><WhatsAppCTA context={{ source: "legacy_booking", ...context }} variant="hero" size="lg" className="h-auto min-h-12 whitespace-normal" disabled={isFetching}><MessageCircle />{t("wa.continue")}</WhatsAppCTA></div></main><Footer /></div>;
}