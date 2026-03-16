import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Instagram, MessageCircle, Plus, Minus } from "lucide-react";
import aneHeroImg from "@/assets/ane-hero.jpg";
import founderImg from "@/assets/founder.jpg";
import { useState } from "react";

const WHATSAPP_NUMBER = "19734944854";
const INSTAGRAM = "anecaroline.hair";

// Page-specific palette matching Canva reference
const colors = {
  dark: "#3d3d38",       // warm charcoal/olive for dark sections
  darkText: "#f5f0eb",   // cream white text on dark
  darkMuted: "#c5c0b8",  // muted text on dark
  light: "#f5f0eb",      // warm cream background
  lightText: "#2a2a26",  // dark text on light
  lightMuted: "#7a7772", // muted text on light
  accent: "#8b7355",     // warm brown for italic accents
  border: "#e0d8cf",     // border on light
  borderDark: "#5a5a54", // border on dark
};

const services = [
  "Highlights",
  "Hair Extensions",
  "Brazilian Keratin",
  "Corte Feminino",
  "Coloração",
];

const faqs = [
  {
    q: "Como funciona o agendamento?",
    a: "Você pode agendar diretamente pelo site ou pelo WhatsApp. Respondemos em até 2 horas.",
  },
  {
    q: "Qual o valor dos serviços?",
    a: "Os valores variam de acordo com o comprimento do cabelo e a técnica escolhida. Entre em contato para um orçamento personalizado.",
  },
  {
    q: "Preciso levar algo no dia?",
    a: "Não precisa levar nada! Apenas venha com o cabelo lavado e sem produtos. O restante fica por nossa conta.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left py-4 group"
      style={{ borderBottom: `1px solid ${colors.borderDark}` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-sm leading-snug" style={{ color: colors.darkText }}>
            {q}
          </p>
        </div>
        {open ? (
          <Plus className="w-4 h-4 shrink-0 mt-0.5 rotate-45 transition-transform" style={{ color: colors.darkMuted }} />
        ) : (
          <Plus className="w-4 h-4 shrink-0 mt-0.5 transition-transform" style={{ color: colors.darkMuted }} />
        )}
      </div>
      {open && (
        <p className="text-sm mt-2 leading-relaxed pr-8" style={{ color: colors.darkMuted }}>
          {a}
        </p>
      )}
    </button>
  );
}

export default function AneCaroline() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Oi%20Ane!%20Vi%20seu%20perfil%20e%20gostaria%20de%20agendar.`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.light, color: colors.lightText }}>
      {/* Hero - Dark section with photo */}
      <section className="relative overflow-hidden" style={{ backgroundColor: colors.dark }}>
        <div className="relative flex flex-col items-center pt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full max-w-md mx-auto aspect-[3/4] overflow-hidden"
          >
            <img
              src={aneHeroImg}
              alt="Ane Caroline - Hair Stylist"
              className="w-full h-full object-cover object-top"
              loading="eager"
              fetchPriority="high"
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${colors.dark} 0%, ${colors.dark}99 25%, transparent 60%)`,
              }}
            />

            {/* Name overlay */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="font-editorial italic text-4xl md:text-5xl mb-1"
                style={{ color: colors.darkText }}
              >
                Ane Caroline
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="text-sm tracking-[0.2em] uppercase"
                style={{ color: colors.darkMuted }}
              >
                Hair Stylist
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social links bar */}
      <section className="py-5" style={{ backgroundColor: colors.light }}>
        <div className="flex justify-center gap-3">
          <a
            href={`https://instagram.com/${INSTAGRAM}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-70"
            style={{ border: `1px solid ${colors.border}`, color: colors.lightText }}
          >
            <Instagram className="w-4 h-4" />
            @{INSTAGRAM}
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: colors.dark, color: colors.darkText }}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </section>

      {/* Sobre mim */}
      <section className="px-6 py-12 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-editorial text-3xl mb-6" style={{ color: colors.lightText }}>
            Sobre <span className="italic" style={{ color: colors.accent }}>mim</span>
          </h2>
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: colors.lightMuted }}>
            <p>Minha história com os cabelos começou cedo.</p>
            <p>
              Ainda criança, já cortava o cabelo das minhas irmãs, sem técnica,
              mas com muito cuidado.
            </p>
            <p>Com o tempo, esse gesto se transformou em profissão.</p>
            <p>
              Desde 2016 venho construindo minha trajetória na área, formando uma
              clientela fiel e aprimorando constantemente minha técnica.
            </p>
            <p>
              Hoje, na ACS Beauty sigo fazendo o que sempre me guiou: cuidar de
              pessoas através do meu trabalho.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Minha missão - Dark section */}
      <section className="px-6 py-12" style={{ backgroundColor: colors.dark }}>
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-editorial text-3xl mb-6" style={{ color: colors.darkText }}>
              Minha <span className="italic" style={{ color: colors.accent }}>missão</span>
            </h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: colors.darkMuted }}>
              <p>
                Minha missão é cuidar de cada pessoa que passa pela minha
                cadeira com atenção, sensibilidade e excelência.
              </p>
              <p>
                Acredito que o cabelo vai muito além da estética. Ele expressa
                identidade, autoestima e confiança.
              </p>
              <p>Por isso, meu compromisso é oferecer mais do que um serviço.</p>
              <p>
                Quero proporcionar uma experiência onde cada cliente se sinta
                valorizada, segura e ainda mais confiante com quem é.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="px-6 py-12 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-editorial text-3xl text-center leading-snug mb-8" style={{ color: colors.lightText }}>
            Como posso<br />
            <span className="italic" style={{ color: colors.accent }}>te ajudar</span> na sua<br />
            jornada:
          </h2>

          <div className="space-y-0">
            {services.map((service) => (
              <div
                key={service}
                className="flex items-center gap-3 py-3.5"
                style={{ borderBottom: `1px solid ${colors.border}` }}
              >
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />
                <span className="text-sm" style={{ color: colors.lightText }}>{service}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <button
                className="w-full max-w-xs px-8 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: colors.dark,
                  color: colors.darkText,
                }}
              >
                Entrar em contato
              </button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Second photo + FAQ - Dark section */}
      <section style={{ backgroundColor: colors.dark }}>
        {/* Photo */}
        <div className="relative w-full max-w-lg mx-auto aspect-[4/3] overflow-hidden">
          <img
            src={founderImg}
            alt="Ane Caroline"
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
        </div>

        {/* FAQ */}
        <div className="px-6 py-12 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-editorial text-3xl mb-8" style={{ color: colors.darkText }}>
              Dúvidas <span className="italic" style={{ color: colors.accent }}>comuns</span>
            </h2>

            <div className="space-y-0">
              {faqs.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-12 max-w-lg mx-auto text-center" style={{ backgroundColor: colors.light }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Link to="/book">
            <button
              className="w-full max-w-xs px-8 py-3 rounded-full text-sm font-medium transition-colors hover:opacity-90"
              style={{
                border: `1.5px solid ${colors.dark}`,
                color: colors.lightText,
                backgroundColor: "transparent",
              }}
            >
              Entrar em contato
            </button>
          </Link>

          <p className="text-xs mt-6" style={{ color: colors.lightMuted }}>
            © {new Date().getFullYear()} ACS Beauty · Feito com carinho em Newark, NJ
          </p>
        </motion.div>
      </section>
    </div>
  );
}
