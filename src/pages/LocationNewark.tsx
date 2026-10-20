import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Navigation } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import studioParking from "@/assets/studio-parking.png.asset.json";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const GPS_OPTIONS = [
  { name: "Google Maps", url: "https://www.google.com/maps/dir/?api=1&destination=41+Wilson+Ave+Newark+NJ" },
  { name: "Apple Maps", url: "https://maps.apple.com/?daddr=41+Wilson+Ave,+Newark,+NJ&dirflg=d" },
  { name: "Waze", url: "https://waze.com/ul?q=41+Wilson+Ave,+Newark,+NJ&navigate=yes" },
];

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function LocationNewark() {
  const { t } = useLanguage();
  const [gpsOpen, setGpsOpen] = useState(false);

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
                  <button
                    type="button"
                    onClick={() => setGpsOpen(true)}
                    className="flex items-start gap-3 text-muted-foreground text-left hover:opacity-80 transition-opacity"
                  >
                    <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground underline-offset-4 hover:underline">41 Wilson Ave</p>
                      <p className="text-sm">Newark, NJ 07105</p>
                    </div>
                  </button>
                  <Dialog open={gpsOpen} onOpenChange={setGpsOpen}>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="text-center font-serif">{t("contact.navigate_title")}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 pt-2">
                        {GPS_OPTIONS.map((opt) => (
                          <a
                            key={opt.name}
                            href={opt.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setGpsOpen(false)}
                            className="flex items-center gap-4 p-4 rounded-xl bg-champagne/20 hover:bg-champagne/40 transition-colors duration-200 border border-border/50"
                          >
                            <div className="w-10 h-10 rounded-full bg-rose-gold/10 flex items-center justify-center shrink-0">
                              <Navigation className="w-5 h-5 text-rose-gold" />
                            </div>
                            <span className="font-medium text-foreground">{opt.name}</span>
                          </a>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
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
