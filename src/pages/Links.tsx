import { useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, Scissors, Gift, MessageCircle, Instagram, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import founderImg from "@/assets/founder.jpg";

function useOGMeta() {
  useEffect(() => {
    const prev = {
      title: document.title,
      metas: new Map<string, string>(),
    };

    const tags: Record<string, string> = {
      "og:title": "Ane Caroline · Hair Stylist | ACS Beauty",
      "og:description": "Hair Stylist em Newark, NJ. Agende seu horário, conheça nossos serviços e pacotes exclusivos.",
      "og:type": "profile",
      "og:locale": "pt_BR",
      "og:site_name": "ACS Beauty",
      "og:url": "https://acsbeauty.lovable.app/links",
      "twitter:card": "summary",
      "twitter:title": "Ane Caroline · Hair Stylist | ACS Beauty",
      "twitter:description": "Hair Stylist em Newark, NJ. Agende seu horário, conheça nossos serviços e pacotes exclusivos.",
    };

    document.title = "Ane Caroline · Hair Stylist | ACS Beauty";

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

    // Set description
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
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá Ane! Vi seu perfil e gostaria de saber mais!")}`;

const c = {
  bg: "#e8e3dd",
  dark: "#3d3d38",
  cream: "#f5f0eb",
  mutedDark: "#b8b3ab",
  textDark: "#2a2a26",
  mutedLight: "#8a8580",
  accent: "#8b7355",
  border: "#d5cec5",
  borderDark: "#55554f",
};

const linkItems = [
  { label: "Sobre Ane", icon: Scissors, to: "/ane-caroline", external: false },
  { label: "Nossos Serviços", icon: Scissors, to: "/services", external: false },
  { label: "Gift Cards", icon: Gift, to: "/gift-cards", external: false },
  { label: "WhatsApp", icon: MessageCircle, to: whatsappUrl, external: true },
  { label: "Instagram", icon: Instagram, to: "https://www.instagram.com/acsbeautynj", external: true },
];

function LinkButton({ label, icon: Icon, to, external }: typeof linkItems[number]) {
  const inner = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center h-[52px] px-[18px] rounded-xl cursor-pointer"
      style={{ backgroundColor: c.cream, border: `1px solid ${c.border}` }}
    >
      <Icon className="w-[15px] h-[15px] shrink-0" style={{ color: c.accent }} />
      <span
        className="flex-1 text-[13px] font-medium tracking-[0.05em] ml-3"
        style={{ color: c.textDark }}
      >
        {label}
      </span>
      <ChevronRight className="w-[15px] h-[15px] shrink-0" style={{ color: c.mutedLight }} />
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

export default function Links() {
  useOGMeta();

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: c.bg }}>
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
              src={founderImg}
              alt="Ane Caroline"
              className="w-[88px] h-[88px] rounded-full object-cover object-top"
              style={{ border: `2px solid ${c.border}` }}
            />
            <h1
              className="font-editorial italic text-[28px] leading-tight mt-4"
              style={{ color: c.textDark }}
            >
              Ane Caroline
            </h1>
            <p
              className="uppercase tracking-[0.2em] text-[11px] mt-1"
              style={{ color: c.mutedLight }}
            >
              Hair Stylist · Newark, NJ
            </p>
          </motion.div>
        </div>

        {/* CTA PRINCIPAL */}
        <Link to="/book">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center h-[52px] rounded-full mb-[10px] px-5"
            style={{ backgroundColor: c.dark }}
          >
            <Calendar className="w-[15px] h-[15px] shrink-0" style={{ color: c.accent }} />
            <span
              className="flex-1 text-center text-[13px] font-medium uppercase tracking-[0.15em]"
              style={{ color: c.cream }}
            >
              Agendar agora
            </span>
            <ChevronRight className="w-[15px] h-[15px] shrink-0" style={{ color: c.accent }} />
          </motion.div>
        </Link>

        {/* LISTA DE LINKS */}
        <div className="flex flex-col gap-2">
          {linkItems.map((item) => (
            <LinkButton key={item.label} {...item} />
          ))}
        </div>

        {/* FOOTER */}
        <div className="py-8 text-center">
          <p className="text-[11px]" style={{ color: c.mutedLight }}>
            © {new Date().getFullYear()} ACS Beauty · Newark, NJ
          </p>
        </div>
      </div>
    </div>
  );
}
