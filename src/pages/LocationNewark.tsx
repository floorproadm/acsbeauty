import { useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import studioParking from "@/assets/studio-parking.png.asset.json";

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function LocationNewark() {
  const { t } = useLanguage();

  const dayNames = Array.from({ length: 7 }, (_, i) => t(`location.day_${i}`));

  const { data: hours } = useQuery({
    queryKey: ["business-hours-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("business_hours")
        .select("*")
        .is("staff_id", null)
        .order("day_of_week");
      return data || [];
    },
  });

  // JSON-LD Schema
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BeautySalon",
      name: "ACS Beauty Studio",
      image: "https://acsbeauty.lovable.app/favicon.ico",
      address: {
        "@type": "PostalAddress",
        streetAddress: "41 Wilson Ave",
        addressLocality: "Newark",
        addressRegion: "NJ",
        postalCode: "07105",
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 40.7285,
        longitude: -74.1558,
      },
      telephone: "+17329153430",
      email: "acsbeautystudio@gmail.com",
      url: "https://acsbeauty.lovable.app",
      priceRange: "$$",
      openingHoursSpecification: hours
        ?.filter((h) => h.is_open)
        .map((h) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: dayNames[h.day_of_week],
          opens: h.open_time,
          closes: h.close_time,
        })),
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [hours, dayNames]);

  useEffect(() => {
    document.title = "ACS Beauty Studio — Newark, NJ | Brows, Hair & Nails";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero */}
        <section className="pt-28 md:pt-32 pb-12 md:pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-foreground">
                {t("location.title")}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("studio.description")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Info Grid */}
        <section className="pb-16 md:pb-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl">
              {/* Contact & Address */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-4">{t("location.address_title")}</h2>
                  <img
                    src={studioParking.url}
                    alt={t("location.title")}
                    className="block w-full h-auto mb-6"
                  />
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">41 Wilson Ave</p>
                      <p className="text-sm">Newark, NJ 07105</p>
                    </div>
                  </div>
                </div>

                {/* Hours */}
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t("location.hours_title")}
                  </h2>
                  {hours && hours.length > 0 ? (
                    <div className="space-y-2">
                      {hours.map((h) => (
                        <div key={h.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{dayNames[h.day_of_week]}</span>
                          <span className={h.is_open ? "text-foreground font-medium" : "text-muted-foreground/50"}>
                            {h.is_open ? `${formatTime(h.open_time)} – ${formatTime(h.close_time)}` : t("location.closed")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("location.hours_soon")}</p>
                  )}
                </div>
              </motion.div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
