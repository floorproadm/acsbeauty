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
    { icon: Mail, titleKey: "contact.email_title", value: "hello@acsbeauty.com", href: "mailto:hello@acsbeauty.com" },
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
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-champagne/30 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 bg-rose-gold/10 text-rose-gold text-sm font-medium rounded-full mb-6">{t("contact.badge")}</span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">{t("contact.hero_title")}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("contact.hero_description")}</p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6">
            {contactCards.map((card, index) => (
              <motion.div key={card.titleKey} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                <a href={card.href} className="block bg-champagne/20 rounded-2xl p-8 text-center hover:shadow-soft transition-shadow duration-300">
                  <div className="w-14 h-14 rounded-full bg-rose-gold/10 flex items-center justify-center mx-auto mb-4"><card.icon className="w-6 h-6 text-rose-gold" /></div>
                  <h3 className="font-medium text-foreground mb-2">{t(card.titleKey)}</h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-line">{card.value}</p>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hours Section */}
      <section className="py-20 px-6 bg-champagne/20">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-14 h-14 rounded-full bg-rose-gold/10 flex items-center justify-center mx-auto mb-6"><Clock className="w-6 h-6 text-rose-gold" /></div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-8">{t("contact.hours_title")}</h2>
            <div className="space-y-4">
              {hours.map((item) => (
                <div key={item.dayKey} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                  <span className="text-foreground font-medium">{t(item.dayKey)}</span>
                  <span className="text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="aspect-[16/9] md:aspect-[21/9] rounded-2xl bg-champagne/30 border border-rose-gold/20 flex items-center justify-center">
              <div className="text-center"><MapPin className="w-12 h-12 text-rose-gold/50 mx-auto mb-4" /><p className="text-muted-foreground text-sm">{t("contact.map_placeholder")}</p></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{t("contact.cta_title")}</h2>
            <p className="text-primary-foreground/70 max-w-xl mx-auto mb-8">{t("contact.cta_description")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services"><Button variant="hero" size="xl" className="gap-2"><Calendar className="w-5 h-5" />{t("global.book_now")}</Button></Link>
              <Link to="/services"><Button variant="outline" size="xl" className="border-rose-gold/50 text-rose-gold hover:bg-rose-gold/10">{t("global.view_all_offers")}</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
