import { useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function LocationNewark() {
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
        streetAddress: "375 Chestnut St, 3rd Floor, Suite 3B",
        addressLocality: "Newark",
        addressRegion: "NJ",
        postalCode: "07105",
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 40.7300,
        longitude: -74.1700,
      },
      telephone: "+17329153430",
      email: "acsbeautystudio@gmail.com",
      url: "https://acsbeauty.lovable.app",
      priceRange: "$$",
      openingHoursSpecification: hours
        ?.filter((h) => h.is_open)
        .map((h) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: DAY_NAMES[h.day_of_week],
          opens: h.open_time,
          closes: h.close_time,
        })),
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [hours]);

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
                ACS Beauty Studio — Newark
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Seu destino de beleza no coração de Newark, NJ. Especialistas em sobrancelhas, cabelo e unhas.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Info Grid */}
        <section className="pb-16 md:pb-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl">
              {/* Contact & Address */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Endereço</h2>
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">375 Chestnut St</p>
                      <p className="text-sm">3rd Floor, Suite 3B</p>
                      <p className="text-sm">Newark, NJ 07105</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Contato</h2>
                  <div className="space-y-3">
                    <a href="tel:+17329153430" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-4 h-4" />
                      (732) 915-3430
                    </a>
                    <a href="mailto:acsbeautystudio@gmail.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="w-4 h-4" />
                      acsbeautystudio@gmail.com
                    </a>
                  </div>
                </div>

                {/* Hours */}
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Horários
                  </h2>
                  {hours && hours.length > 0 ? (
                    <div className="space-y-2">
                      {hours.map((h) => (
                        <div key={h.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{DAY_NAMES[h.day_of_week]}</span>
                          <span className={h.is_open ? "text-foreground font-medium" : "text-muted-foreground/50"}>
                            {h.is_open ? `${formatTime(h.open_time)} – ${formatTime(h.close_time)}` : "Fechado"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Horários em breve.</p>
                  )}
                </div>
              </motion.div>

              {/* Map */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl overflow-hidden shadow-card"
              >
                <iframe
                  title="ACS Beauty Studio Newark Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.5!2d-74.17!3d40.73!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQzJzQ4LjAiTiA3NMKwMTAnMTIuMCJX!5e0!3m2!1sen!2sus!4v1"
                  width="100%"
                  height="500"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
