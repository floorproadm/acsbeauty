import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, Calendar, Navigation, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STUDIO_ADDRESS = "375 Chestnut St, 3rd Floor, Suite 3B, Newark, NJ";
const STUDIO_COORDS = { lat: 40.7357, lng: -74.1724 };

const GPS_OPTIONS = [
  {
    name: "Google Maps",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Google_Maps_icon_%282020%29.svg/120px-Google_Maps_icon_%282020%29.svg.png",
    url: `https://www.google.com/maps/dir/?api=1&destination=${STUDIO_COORDS.lat},${STUDIO_COORDS.lng}`,
  },
  {
    name: "Apple Maps",
    icon: null,
    url: `https://maps.apple.com/?daddr=${STUDIO_COORDS.lat},${STUDIO_COORDS.lng}&dirflg=d`,
  },
  {
    name: "Waze",
    icon: null,
    url: `https://waze.com/ul?ll=${STUDIO_COORDS.lat},${STUDIO_COORDS.lng}&navigate=yes`,
  },
];

const WHATSAPP_BASE = "https://wa.me/";

function buildWhatsAppUrl(phone: string, name: string, isPt: boolean) {
  const digits = phone.replace(/\D/g, "");
  const msg = isPt
    ? `Olá ${name}! Vi seu perfil na ACS Beauty e gostaria de agendar um horário.`
    : `Hi ${name}! I saw your profile at ACS Beauty and would like to book an appointment.`;
  return `${WHATSAPP_BASE}${digits}?text=${encodeURIComponent(msg)}`;
}

function displayName(name: string) {
  if (name.toLowerCase().startsWith("ane caroline")) return "Ane";
  return name;
}

// WhatsApp SVG icon component
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Contact() {
  const { t, language } = useLanguage();
  const isPt = language === "pt";
  const [gpsDialogOpen, setGpsDialogOpen] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ["team-members-contact"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, role, phone, page_url, sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const contactCards = [
    { icon: Phone, titleKey: "contact.phone_title", value: "(732) 915-3430", href: "tel:+17329153430" },
    { icon: Mail, titleKey: "contact.email_title", value: "acsbeautystudio@gmail.com", href: "mailto:acsbeautystudio@gmail.com" },
  ];

  const hours = [
    { dayKey: "contact.hours_tue_sat", time: "9:00 AM – 6:00 PM" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 px-5 md:px-6 bg-gradient-to-b from-champagne/30 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-3 md:px-4 py-1.5 bg-rose-gold/10 text-rose-gold text-xs md:text-sm font-medium rounded-full mb-4 md:mb-6">{t("contact.badge")}</span>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight">{t("contact.hero_title")}</h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">{t("contact.hero_description")}</p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info + Team Section */}
      <section className="py-12 md:py-20 px-5 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-8">
            {/* Contact Cards (phone + email) */}
            <div className="grid sm:grid-cols-2 gap-4">
              {contactCards.map((card, index) => (
                <motion.div key={card.titleKey} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                  <a href={card.href} className="flex flex-col items-center text-center gap-3 bg-champagne/20 rounded-xl p-6 hover:shadow-soft transition-shadow duration-300 h-full">
                    <div className="w-14 h-14 rounded-full bg-rose-gold/10 flex items-center justify-center flex-shrink-0">
                      <card.icon className="w-6 h-6 text-rose-gold" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">{t(card.titleKey)}</h3>
                      <p className="text-muted-foreground text-sm">{card.value}</p>
                    </div>
                  </a>
                </motion.div>
              ))}
            </div>

            {/* Address Card with GPS picker */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
              <button
                onClick={() => setGpsDialogOpen(true)}
                className="w-full flex flex-col items-center text-center gap-3 bg-champagne/20 rounded-xl p-6 hover:shadow-soft transition-shadow duration-300 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-rose-gold/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-rose-gold" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">{t("contact.address_title")}</h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-line">375 Chestnut St, 3rd Floor{"\n"}Suite 3B, Newark, NJ</p>
                  <p className="text-rose-gold text-xs mt-2 flex items-center justify-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {t("contact.find_us")}
                  </p>
                </div>
              </button>
            </motion.div>

            {/* Team Section */}
            {members.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}>
                <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground text-center mb-2">{t("contact.team_title")}</h2>
                <p className="text-muted-foreground text-sm text-center mb-6">{t("contact.team_subtitle")}</p>

                <div className="space-y-3">
                  {members.map((member, index) => {
                    const name = displayName(member.name);
                    const whatsappUrl = member.phone ? buildWhatsAppUrl(member.phone, name, isPt) : null;

                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.08 }}
                        className="flex items-center gap-3"
                      >
                        {/* Name card — links to profile */}
                        {member.page_url ? (
                          <Link
                            to={member.page_url}
                            className="flex-1 min-w-0 p-4 rounded-2xl bg-champagne/20 border border-border/50 hover:shadow-soft transition-all duration-200 active:scale-[0.98]"
                          >
                            <h3 className="text-[15px] font-semibold text-foreground truncate">{name}</h3>
                            <p className="text-[13px] text-muted-foreground truncate">{member.role}</p>
                          </Link>
                        ) : (
                          <div className="flex-1 min-w-0 p-4 rounded-2xl bg-champagne/20 border border-border/50">
                            <h3 className="text-[15px] font-semibold text-foreground truncate">{name}</h3>
                            <p className="text-[13px] text-muted-foreground truncate">{member.role}</p>
                          </div>
                        )}

                        {/* WhatsApp icon — outside the card */}
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center hover:bg-[#25D366]/20 active:scale-95 transition-all duration-200"
                            aria-label={`WhatsApp ${name}`}
                          >
                            <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                          </a>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Hours */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} className="bg-champagne/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-gold/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-rose-gold" />
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground">{t("contact.hours_title")}</h3>
              </div>
              <div className="space-y-2">
                {hours.map((item) => (
                  <div key={item.dayKey} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                    <span className="text-foreground text-sm">{t(item.dayKey)}</span>
                    <span className="text-muted-foreground text-sm">{item.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Embedded Google Map */}
      <section className="py-12 md:py-20 px-5 md:px-6 bg-champagne/10">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="aspect-[4/3] md:aspect-[21/9] rounded-xl md:rounded-2xl overflow-hidden border border-rose-gold/20">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.8!2d${STUDIO_COORDS.lng}!3d${STUDIO_COORDS.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25370b3e8a2e7%3A0x1!2s375+Chestnut+St%2C+Newark%2C+NJ!5e0!3m2!1sen!2sus!4v1`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="ACS Beauty Studio Location"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-5 md:px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="font-serif text-2xl md:text-4xl font-bold mb-3 md:mb-4">{t("contact.cta_title")}</h2>
            <p className="text-primary-foreground/70 max-w-xl mx-auto mb-6 md:mb-8 text-sm md:text-base">{t("contact.cta_description")}</p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link to="/services" className="w-full sm:w-auto"><Button variant="hero" size="lg" className="gap-2 w-full"><Calendar className="w-4 h-4 md:w-5 md:h-5" />{t("global.book_now")}</Button></Link>
              <Link to="/services" className="w-full sm:w-auto"><Button variant="outline" size="lg" className="border-rose-gold/50 text-rose-gold hover:bg-rose-gold/10 w-full">{t("global.view_all_offers")}</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* GPS Navigation Picker Dialog */}
      <Dialog open={gpsDialogOpen} onOpenChange={setGpsDialogOpen}>
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
                onClick={() => setGpsDialogOpen(false)}
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

      <Footer />
    </div>
  );
}
