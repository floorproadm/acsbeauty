import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, MapPin, Clock, X } from "lucide-react";
import { Link } from "react-router-dom";
import acsLogo from "@/assets/acs-logo.png";
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
      "og:url": "https://acsbeauty.lovable.app/links",
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
  google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`,
  apple: `https://maps.apple.com/?q=${encodeURIComponent(ADDRESS)}`,
  waze: `https://waze.com/ul?q=${encodeURIComponent(ADDRESS)}`,
};

const linkItems = (isPt: boolean) => [
  { label: isPt ? "Sobre a Ane" : "About Ane", to: "/ane-caroline", external: false },
  { label: isPt ? "Nossos Serviços" : "Our Services", to: "/services", external: false },
  { label: "Gift Cards", to: "/gift-cards", external: false },
  { label: "WhatsApp", to: whatsappUrl, external: true },
];

function LinkButton({ label, to, external }: typeof linkItems[number]) {
  const inner = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center h-[52px] px-5 rounded-xl cursor-pointer bg-card border border-border"
    >
      <span className="flex-1 text-[13px] font-medium tracking-[0.05em] text-foreground">
        {label}
      </span>
      <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
    </motion.div>
  );

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <Link to={to}>{inner}</Link>;
}

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
          ] as const).map((item) => (
            <a
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center h-[48px] px-5 rounded-xl bg-muted/50 border border-border text-[13px] font-medium tracking-[0.05em] text-foreground hover:bg-muted transition-colors"
            >
              <span className="flex-1">{item.label}</span>
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

  return (
    <div className="min-h-screen flex justify-center bg-background">
      <div className="w-full max-w-[480px] px-6">
        {/* HERO */}
        <div className="pt-12 pb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <img
              src={acsLogo}
              alt="ACS Beauty"
              className="w-[100px] h-auto object-contain"
            />
            <h1 className="font-editorial italic text-[28px] leading-tight mt-4 text-foreground">
              ACS Beauty
            </h1>
            <p className="uppercase tracking-[0.2em] text-[11px] mt-1 text-muted-foreground">
              Beauty Studio · Newark, NJ
            </p>
          </motion.div>
        </div>

        {/* CTA PRINCIPAL */}
        <Link to="/book">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center h-[52px] rounded-full mb-3 px-5 bg-primary"
          >
            <Calendar className="w-4 h-4 shrink-0 text-primary-foreground/70" />
            <span className="flex-1 text-center text-[13px] font-medium uppercase tracking-[0.15em] text-primary-foreground">
              Agendar agora
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 text-primary-foreground/70" />
          </motion.div>
        </Link>

        {/* LISTA DE LINKS */}
        <div className="flex flex-col gap-2">
          {linkItems.map((item) => (
            <LinkButton key={item.label} {...item} />
          ))}
        </div>

        {/* LOCALIZAÇÃO */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-3 flex items-center h-[52px] px-5 rounded-xl cursor-pointer bg-card border border-border"
          onClick={() => setShowGPS(true)}
        >
          <MapPin className="w-4 h-4 shrink-0 text-primary" />
          <span className="flex-1 text-[12px] font-medium tracking-[0.03em] text-foreground ml-3 truncate">
            375 Chestnut St, 3rd Floor · Newark, NJ
          </span>
          <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
        </motion.div>

        {/* HORÁRIO */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-medium tracking-[0.03em] text-muted-foreground">
            Ter–Sáb · 9:00 AM – 6:00 PM
          </span>
        </div>

        {/* FOOTER */}
        <div className="py-8 text-center">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} ACS Beauty · Newark, NJ
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showGPS && <GPSChooser onClose={() => setShowGPS(false)} />}
      </AnimatePresence>
    </div>
  );
}
