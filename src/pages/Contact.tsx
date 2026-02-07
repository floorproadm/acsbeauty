import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();

  const contactCards = [
    { icon: Phone, titleKey: "contact.phone_title", value: "(732) 915-3430", href: "tel:+17329153430" },
    { icon: Mail, titleKey: "contact.email_title", value: "acsbeautystudio@gmail.com", href: "mailto:acsbeautystudio@gmail.com" },
    { icon: MapPin, titleKey: "contact.address_title", value: "375 Chestnut St, 3rd Floor\nSuite 3B, Newark, NJ", href: "https://www.google.com/maps/search/?api=1&query=375+Chestnut+St+Newark+NJ" },
  ];

  const hours = [
    { dayKey: "contact.hours_mon_fri", time: "9:00 AM - 7:00 PM" },
    { dayKey: "contact.hours_saturday", time: "10:00 AM - 6:00 PM" },
    { dayKey: "contact.hours_sunday", time: "11:00 AM - 5:00 PM" },
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

      {/* Contact Info Section */}
      <section className="py-12 md:py-20 px-5 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-6">
            {/* Contact Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              {contactCards.map((card, index) => (
                <motion.div key={card.titleKey} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                  <a href={card.href} className="flex flex-col items-center text-center gap-3 bg-champagne/20 rounded-xl p-6 hover:shadow-soft transition-shadow duration-300 h-full">
                    <div className="w-14 h-14 rounded-full bg-rose-gold/10 flex items-center justify-center flex-shrink-0">
                      <card.icon className="w-6 h-6 text-rose-gold" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">{t(card.titleKey)}</h3>
                      <p className="text-muted-foreground text-sm whitespace-pre-line">{card.value}</p>
                    </div>
                  </a>
                </motion.div>
              ))}
            </div>

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

      {/* Map Placeholder */}
      <section className="py-12 md:py-20 px-5 md:px-6 bg-champagne/10">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="aspect-[4/3] md:aspect-[21/9] rounded-xl md:rounded-2xl bg-champagne/30 border border-rose-gold/20 flex items-center justify-center">
              <div className="text-center"><MapPin className="w-10 h-10 md:w-12 md:h-12 text-rose-gold/50 mx-auto mb-3 md:mb-4" /><p className="text-muted-foreground text-xs md:text-sm">{t("contact.map_placeholder")}</p></div>
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

      <Footer />
    </div>
  );
}