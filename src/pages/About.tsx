import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Heart, Shield, MapPin, Calendar, Navigation } from "lucide-react";
import { Header } from "@/components/layout/Header";
import founderImage from "@/assets/founder.jpg";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Brand icons as inline SVGs
const GoogleMapsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4285F4"/>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84L12 6l5.59 7.84C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7z" fill="#34A853"/>
    <path d="M6.41 13.84C7.52 15.6 9.18 17.67 12 22c2.82-4.33 4.48-6.4 5.59-8.16L12 6 6.41 13.84z" fill="#FBBC04"/>
    <path d="M12 6v16c-2.82-4.33-4.48-6.4-5.59-8.16L12 6z" fill="#EA4335"/>
    <circle cx="12" cy="9" r="2.5" fill="white"/>
  </svg>
);

const AppleMapsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <rect width="24" height="24" rx="5" fill="#000"/>
    <path d="M12 5.5c-2.5 0-4.5 2-4.5 4.5 0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" fill="#FF3B30"/>
    <circle cx="12" cy="10" r="1.5" fill="white"/>
  </svg>
);

const WazeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 2.5.92 4.78 2.44 6.53L3 22l3.47-1.44C8.22 21.47 10.03 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="#33CCFF"/>
    <circle cx="8.5" cy="10" r="1.5" fill="#000"/>
    <circle cx="15.5" cy="10" r="1.5" fill="#000"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function About() {
  const { t } = useLanguage();

  const address = "375 Chestnut St, 3rd Floor, Suite 3B, Newark, NJ";
  const encodedAddress = encodeURIComponent(address);

  const mapLinks = [
    { name: "Google Maps", url: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, icon: GoogleMapsIcon },
    { name: "Apple Maps", url: `https://maps.apple.com/?q=${encodedAddress}`, icon: AppleMapsIcon },
    { name: "Waze", url: `https://waze.com/ul?q=${encodedAddress}`, icon: WazeIcon },
  ];

  const pillars = [
    { icon: Sparkles, titleKey: "about.pillar_excellence_title", descKey: "about.pillar_excellence_desc" },
    { icon: Heart, titleKey: "about.pillar_care_title", descKey: "about.pillar_care_desc" },
    { icon: Shield, titleKey: "about.pillar_trust_title", descKey: "about.pillar_trust_desc" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-4 px-6 bg-gradient-to-b from-champagne/30 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <motion.span className="inline-block px-4 py-1.5 bg-rose-gold/10 text-rose-gold text-sm font-medium rounded-full mb-4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}>
              {t("about.badge")}
            </motion.span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 leading-tight">{t("about.hero_title")}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("about.hero_description")}</p>
          </motion.div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="pt-6 pb-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="order-2 md:order-1">
              <motion.span className="text-rose-gold font-medium text-sm uppercase tracking-wider" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>{t("about.founder_badge")}</motion.span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">{t("about.founder_title")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{t("about.founder_text_1")}</p>
              <p className="text-muted-foreground leading-relaxed">{t("about.founder_text_2")}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30, scale: 0.95 }} whileInView={{ opacity: 1, x: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="order-1 md:order-2">
              <motion.img src={founderImage} alt={t("about.founder_title")} className="aspect-[4/5] w-full rounded-2xl object-cover object-top border border-rose-gold/20 shadow-soft" whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-20 px-6 bg-champagne/20">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">{t("about.pillars_title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("about.pillars_description")}</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {pillars.map((pillar, index) => (
              <motion.div key={pillar.titleKey} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="bg-background rounded-2xl p-8 shadow-soft text-center">
                <div className="w-16 h-16 rounded-full bg-rose-gold/10 flex items-center justify-center mx-auto mb-6"><pillar.icon className="w-8 h-8 text-rose-gold" /></div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">{t(pillar.titleKey)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(pillar.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <motion.div className="w-16 h-16 rounded-full bg-rose-gold/10 flex items-center justify-center mx-auto mb-6" whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.3 }}><MapPin className="w-8 h-8 text-rose-gold" /></motion.div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">{t("about.location_title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">{t("about.location_description")}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button className="inline-flex items-center gap-2 text-foreground font-medium hover:text-rose-gold transition-colors cursor-pointer group" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Navigation className="w-4 h-4 text-rose-gold group-hover:animate-pulse" />
                  <span className="border-b border-dashed border-rose-gold/50">375 Chestnut St, 3rd Floor<br />Suite 3B, Newark, NJ</span>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                {mapLinks.map((link) => (<DropdownMenuItem key={link.name} asChild><a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><link.icon /><span>{link.name}</span></a></DropdownMenuItem>))}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{t("about.cta_title")}</h2>
            <p className="text-primary-foreground/70 max-w-xl mx-auto mb-8">{t("about.cta_description")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services"><Button variant="hero" size="xl" className="gap-2"><Calendar className="w-5 h-5" />{t("global.book_now")}</Button></Link>
              <Link to="/services"><Button variant="outline" size="xl" className="border-rose-gold/50 text-rose-gold hover:bg-rose-gold/10">{t("global.view_offers")}</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
