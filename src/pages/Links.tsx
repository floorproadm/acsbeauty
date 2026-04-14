import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Clock, X, ChevronRight, Scissors, Gift, MessageCircle, User } from "lucide-react";
import { Link } from "react-router-dom";
import acsLogo from "@/assets/acs-logo.png";
import aneHero from "@/assets/ane-hero.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

function useOGMeta() {
  useEffect(() => {
    const prev = {
      title: document.title,
      metas: new Map<string, string>(),
    };

    const tags: Record<string, string> = {
      "og:title": "ACS Beauty · Hair & Beauty Studio",
      "og:description": "Beauty Studio em Newark, NJ. Agende seu horário, conheça nossos serviços e pacotes exclusivos.",
      "og:type": "profile",
      "og:locale": "pt_BR",
      "og:site_name": "ACS Beauty",
      "og:url": "https://acsbeauty.lovable.app/hub",
      "twitter:card": "summary",
      "twitter:title": "ACS Beauty · Hair & Beauty Studio",
      "twitter:description": "Beauty Studio em Newark, NJ. Agende seu horário, conheça nossos serviços e pacotes exclusivos.",
    };

    document.title = "ACS Beauty · Hair & Beauty Studio";

    Object.entries(tags).forEach(([key, value]) => {
      const attr = key.startsWith("og:") ? "property" : "name";
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (el) {
        prev.metas.set(key, el.getAttribute("content") || "");
        el.setAttribute("content", value);
      } else {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        el.setAttribute("content", value);
        document.head.appendChild(el);
        prev.metas.set(key, "__created__");
      }
    });

    const descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = descEl?.getAttribute("content") || "";
    if (descEl) descEl.setAttribute("content", tags["og:description"]);

    return () => {
      document.title = prev.title;
      if (descEl) descEl.setAttribute("content", prevDesc);
      prev.metas.forEach((original, key) => {
        const attr = key.startsWith("og:") ? "property" : "name";
        const el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
        if (!el) return;
        if (original === "__created__") el.remove();
        else el.setAttribute("content", original);
      });
    };
  }, []);
}

const WHATSAPP_NUMBER = "17329153430";
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Vi o perfil da ACS Beauty e gostaria de saber mais!")}`;

const ADDRESS = "375 Chestnut St, 3rd Floor, Suite 3B, Newark, NJ";
const MAPS_LINKS = {
  google: `https://www.google.com/maps/dir/?api=1&destination=375+Chestnut+St+Newark+NJ`,
  apple: `https://maps.apple.com/?daddr=375+Chestnut+St,+Newark,+NJ&dirflg=d`,
  waze: `https://waze.com/ul?q=375+Chestnut+St,+Newark,+NJ&navigate=yes`,
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } } };
const item = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" as const } },
};

const linkItems = (isPt: boolean) => [
  { label: isPt ? "Agendar Agora" : "Book Now", to: "/portal", icon: Calendar, primary: true, external: false },
  { label: isPt ? "Nossos Serviços" : "Our Services", to: "/services", icon: Scissors, external: false },
  { label: isPt ? "Sobre a Ane" : "About Ane", to: "/ane-caroline", icon: User, external: false },
  { label: "Gift Cards", to: "/gift-cards", icon: Gift, external: false },
  { label: "WhatsApp", to: whatsappUrl, icon: MessageCircle, external: true },
];

function GPSChooser({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        exit={{ y: 200 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-[480px] bg-card rounded-t-2xl p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold tracking-wide text-foreground">Abrir com</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {([
            { label: "Google Maps", url: MAPS_LINKS.google },
            { label: "Apple Maps", url: MAPS_LINKS.apple },
            { label: "Waze", url: MAPS_LINKS.waze },
          ] as const).map((gps) => (
            <a
              key={gps.label}
              href={gps.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center h-[48px] px-5 rounded-xl bg-muted/50 border border-border text-[13px] font-medium tracking-[0.05em] text-foreground hover:bg-muted transition-colors"
            >
              <span className="flex-1">{gps.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Links() {
  useOGMeta();
  const [showGPS, setShowGPS] = useState(false);
  const { language } = useLanguage();
  const isPt = language === "pt";
  const links = linkItems(isPt);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center">
      {/* Language toggle */}
      <div className="fixed top-4 right-4 z-40">
        <LanguageToggle />
      </div>

      {/* Hero — large image with gradient fade */}
      <section className="relative w-full max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative aspect-[3/4] overflow-hidden"
        >
          <img
            src={aneHero}
            alt="ACS Beauty Studio"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 15%" }}
          />
          {/* Bottom gradient blend */}
          <div
            className="absolute inset-x-0 bottom-0 h-[60%]"
            style={{
              background:
                "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 30%, hsl(var(--background) / 0.4) 60%, transparent 100%)",
            }}
          />
        </motion.div>

        {/* Name overlay */}
        <div className="absolute bottom-8 left-0 right-0 text-center z-10">
          <motion.img
            src={acsLogo}
            alt="ACS Beauty"
            className="h-20 mx-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="text-primary text-sm font-medium mt-2"
          >
            {isPt ? "Hair & Beauty Studio · Newark, NJ" : "Hair & Beauty Studio · Newark, NJ"}
          </motion.p>
        </div>
      </section>

      {/* Links */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm flex flex-col gap-3 px-4 -mt-2"
      >
        {links.map((link) => {
          const Icon = link.icon;
          const isPrimary = link.primary;

          const cls = `group flex items-center gap-3 w-full rounded-full px-5 py-3.5 font-medium text-sm transition-all duration-300 ${
            isPrimary
              ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.45)] hover:scale-[1.02]"
              : "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 hover:scale-[1.02]"
          }`;

          const inner = (
            <motion.div variants={item} className={cls}>
              <Icon size={16} strokeWidth={2} className={isPrimary ? "text-primary-foreground" : "text-primary"} />
              <span className="flex-1">{link.label}</span>
            </motion.div>
          );

          if (link.external) {
            return (
              <a key={link.label} href={link.to} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            );
          }
          return (
            <Link key={link.label} to={link.to}>
              {inner}
            </Link>
          );
        })}
      </motion.div>

      {/* Location */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="w-full max-w-sm px-4 mt-4"
      >
        <button
          onClick={() => setShowGPS(true)}
          className="flex items-center gap-3 w-full rounded-full px-5 py-3.5 border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02]"
        >
          <MapPin size={16} strokeWidth={2} className="text-primary shrink-0" />
          <span className="flex-1 text-sm font-medium text-left truncate">375 Chestnut St, 3rd Floor · Newark, NJ</span>
          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </button>
      </motion.div>

      {/* Hours */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="flex items-center gap-2 mt-4"
      >
        <Clock size={14} className="text-primary" />
        <span className="text-xs font-medium tracking-wide text-muted-foreground">
          {isPt ? "Ter–Sáb · 9:00 AM – 6:00 PM" : "Tue–Sat · 9:00 AM – 6:00 PM"}
        </span>
      </motion.div>

      {/* Social */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="flex items-center gap-4 mt-6"
      >
        <a
          href="https://www.instagram.com/acsbeautystudio"
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-300"
          aria-label="Instagram"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-8 mb-8 text-muted-foreground text-[10px] uppercase tracking-[0.3em]"
      >
        © {new Date().getFullYear()} ACS Beauty · Newark, NJ
      </motion.p>

      <AnimatePresence>
        {showGPS && <GPSChooser onClose={() => setShowGPS(false)} />}
      </AnimatePresence>
    </div>
  );
}
