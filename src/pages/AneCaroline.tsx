import { motion } from "framer-motion";
import { ChevronRight, Instagram, MessageCircle, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import aneHeroImg from "@/assets/ane-hero.jpg";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

const WHATSAPP_NUMBER = "17329153430";

// Exact Canva reference palette
const c = {
  bg: "#e8e3dd",
  dark: "#3d3d38",
  cream: "#f5f0eb",
  mutedDark: "#b8b3ab",
  textDark: "#2a2a26",
  mutedLight: "#8a8580",
  accent: "#8b7355",
  border: "#d5cec5",
  borderDark: "#55554f"
};

const services = ["Highlights", "Hair Extensions", "Brazilian Keratin"];

function FAQItem({ q, a }: {q: string; a: string;}) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left py-4"
      style={{ borderBottom: `1px solid ${c.borderDark}` }}>
      
      <div className="flex items-start justify-between gap-4">
        <p className="text-[13px] font-medium leading-snug" style={{ color: c.cream }}>
          {q}
        </p>
        <Plus
          className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          style={{ color: c.mutedDark }} />
        
      </div>
      {open &&
      <p className="text-[13px] mt-2 leading-relaxed pr-8" style={{ color: c.mutedDark }}>
          {a}
        </p>
      }
    </button>);
}

export default function AneCaroline() {
  const { t, language } = useLanguage();

  const whatsappGeneral = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t("ane.wa.general_msg"))}`;

  const faqs = [
    { q: t("ane.faq.q1"), a: t("ane.faq.a1") },
    { q: t("ane.faq.q2"), a: t("ane.faq.a2") },
    { q: t("ane.faq.q3"), a: t("ane.faq.a3") },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: c.bg }}>
      {/* ============ LANGUAGE TOGGLE ============ */}
      <div className="absolute top-4 right-4 z-10">
        <div
          className="rounded-full px-3 py-1.5 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(61,61,56,0.5)" }}
        >
          <LanguageToggle />
        </div>
      </div>

      {/* ============ HERO ============ */}
      <section className="relative" style={{ backgroundColor: c.bg }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-full max-w-lg mx-auto">
          
          <div className="relative aspect-[3/4] overflow-hidden">
            <img
              src={aneHeroImg}
              alt="Ane Caroline - Hair Stylist"
              className="w-full h-full object-cover object-top"
              loading="eager"
              fetchPriority="high" />
            
            <div
              className="absolute inset-x-0 bottom-0 h-[60%]"
              style={{
                background: `linear-gradient(to top, rgba(61,61,56,0.95) 0%, rgba(61,61,56,0.7) 40%, rgba(61,61,56,0.3) 70%, transparent 100%)`
              }} />
            
          </div>

          <div className="absolute bottom-10 left-0 right-0 text-center z-10">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="font-editorial italic text-[42px] leading-none"
              style={{ color: '#ffffff' }}>
              
              {t("ane.hero.title")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="text-xs tracking-[0.25em] uppercase mt-2"
              style={{ color: '#d5cec5' }}>
              
              {t("ane.hero.subtitle")}
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* ============ SOBRE MIM ============ */}
      <section className="px-8 pt-6 pb-12 max-w-lg mx-auto" style={{ backgroundColor: c.bg }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}>
          
          <h2 className="font-editorial text-[31px] mb-5" style={{ color: c.textDark }}>
            {t("ane.about.title")} <span className="italic" style={{ color: c.accent }}>{t("ane.about.title_highlight")}</span>
          </h2>
          <div className="space-y-3 text-[15px] leading-[1.7]" style={{ color: c.mutedLight }}>
            <p>{t("ane.about.p1")}</p>
            <p>{t("ane.about.p2")}</p>
            <p>{t("ane.about.p3")}</p>
            <p>{t("ane.about.p4")}</p>
            <p>{t("ane.about.p5")}</p>
          </div>
        </motion.div>
      </section>

      {/* ============ MINHA MISSÃO (dark, no photo) ============ */}
      <section style={{ backgroundColor: c.dark }}>
        <div className="px-8 py-12 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}>
            
            <h2 className="font-editorial text-[31px] mb-5" style={{ color: c.cream }}>
              {t("ane.mission.title")} <span className="italic" style={{ color: c.accent }}>{t("ane.mission.title_highlight")}</span>
            </h2>
            <div className="space-y-3 text-[15px] leading-[1.7]" style={{ color: c.mutedDark }}>
              <p>{t("ane.mission.p1")}</p>
              <p>{t("ane.mission.p2")}</p>
              <p>{t("ane.mission.p3")}</p>
              <p>{t("ane.mission.p4")}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ SERVIÇOS + CTA ============ */}
      <section className="px-8 py-12 max-w-lg mx-auto" style={{ backgroundColor: c.bg }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}>
          
          <h2
            className="font-editorial text-[31px] text-center leading-snug mb-8"
            style={{ color: c.textDark }}>
            
            {t("ane.services.title_1")}
            <br />
            <span className="italic" style={{ color: c.accent }}>
              {t("ane.services.title_2")}
            </span>{" "}
            {t("ane.services.title_3")}
            <br />
            {t("ane.services.title_4")}
          </h2>

          <div className="mb-4">
            {services.map((service) => {
              const msg = encodeURIComponent(t("ane.wa.service_msg", { service }));
              const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
              return (
                <a
                  key={service}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-3.5 cursor-pointer transition-opacity hover:opacity-70"
                  style={{ borderBottom: `1px solid ${c.border}` }}>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: c.accent }} />
                  <span className="text-[16px] flex-1" style={{ color: c.textDark }}>
                    {service}
                  </span>
                  <MessageCircle className="w-4 h-4 shrink-0" style={{ color: c.mutedLight }} />
                </a>
              );
            })}
          </div>

          <Link
            to="/services"
            className="block text-center text-[13px] mb-6 transition-opacity hover:opacity-70"
            style={{ color: c.accent }}>
            {t("ane.services.view_all")}
          </Link>

          <a href={whatsappGeneral} target="_blank" rel="noopener noreferrer" className="block">
            <button
              className="w-full py-3.5 rounded-full text-[13px] font-medium tracking-wide uppercase transition-opacity hover:opacity-90"
              style={{ backgroundColor: c.dark, color: c.cream }}>
              
              {t("ane.cta.contact")}
            </button>
          </a>
        </motion.div>
      </section>

      {/* ============ SECOND PHOTO (dark) ============ */}
      <section style={{ backgroundColor: c.dark }}>
        <div className="relative w-full max-w-lg mx-auto">
        </div>
      </section>

      {/* ============ SOCIAL ICONS ============ */}
      <section className="pb-4 max-w-lg mx-auto" style={{ backgroundColor: c.bg }}>
        <div className="flex justify-center gap-5">
          <a
            href="https://www.instagram.com/acsbeautynj"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ border: `1px solid ${c.border}` }}>
            
            <Instagram className="w-4 h-4" style={{ color: c.textDark }} />
          </a>
          <a
            href={whatsappGeneral}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ border: `1px solid ${c.border}` }}>
            
            <MessageCircle className="w-4 h-4" style={{ color: c.textDark }} />
          </a>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <section className="pb-8 pt-4 max-w-lg mx-auto text-center" style={{ backgroundColor: c.bg }}>
        <p className="text-[11px]" style={{ color: c.mutedLight }}>
          © {new Date().getFullYear()} Ane Caroline | {t("ane.footer.rights")}
        </p>
      </section>
    </div>);
}
