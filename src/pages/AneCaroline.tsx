import { motion } from "framer-motion";
import { ChevronRight, Instagram, MessageCircle, Plus } from "lucide-react";
import aneHeroImg from "@/assets/ane-hero.jpg";
import founderImg from "@/assets/founder.jpg";
import { useState } from "react";

const WHATSAPP_NUMBER = "19734944854";
const INSTAGRAM = "anecaroline.hair";

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

const faqs = [
{
  q: "Como funciona o agendamento?",
  a: "Você pode agendar diretamente pelo site ou pelo WhatsApp. Respondemos em até 2 horas."
},
{
  q: "Qual o valor dos serviços?",
  a: "Os valores variam de acordo com o comprimento do cabelo e a técnica escolhida. Entre em contato para um orçamento personalizado."
},
{
  q: "Preciso levar algo no dia?",
  a: "Não precisa levar nada! Apenas venha com o cabelo lavado e sem produtos. O restante fica por nossa conta."
}];


function FAQItem({ q, a }: {q: string;a: string;}) {
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
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Oi%20Ane!%20Vi%20seu%20perfil%20e%20gostaria%20de%20agendar.`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: c.bg }}>
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
              
              Ane Caroline
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="text-xs tracking-[0.25em] uppercase mt-2"
              style={{ color: '#d5cec5' }}>
              
              Hair Stylist
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
          
          <h2 className="font-editorial text-[28px] mb-5" style={{ color: c.textDark }}>
            Sobre <span className="italic" style={{ color: c.accent }}>mim</span>
          </h2>
          <div className="space-y-3 text-[15px] leading-[1.7]" style={{ color: c.mutedLight }}>
            <p>Minha história com os cabelos começou cedo.</p>
            <p>
              Ainda criança, já cortava o cabelo das minhas irmãs, sem técnica, mas com muito
              cuidado.
            </p>
            <p>Com o tempo, esse gesto se transformou em profissão.</p>
            <p>
              Desde 2016 venho construindo minha trajetória na área, formando uma clientela fiel e
              aprimorando constantemente minha técnica.
            </p>
            <p>
              Hoje, na ACS Beauty sigo fazendo o que sempre me guiou: cuidar de pessoas através do
              meu trabalho.
            </p>
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
            
            <h2 className="font-editorial text-[28px] mb-5" style={{ color: c.cream }}>
              Minha <span className="italic" style={{ color: c.accent }}>missão</span>
            </h2>
            <div className="space-y-3 text-[15px] leading-[1.7]" style={{ color: c.mutedDark }}>
              <p>
                Minha missão é cuidar de cada pessoa que passa pela minha cadeira com atenção,
                sensibilidade e excelência.
              </p>
              <p>
                Acredito que o cabelo vai muito além da estética. Ele expressa identidade, autoestima
                e confiança.
              </p>
              <p>Por isso, meu compromisso é oferecer mais do que um serviço.</p>
              <p>
                Quero proporcionar uma experiência onde cada cliente se sinta valorizada, segura e
                ainda mais confiante com quem é.
              </p>
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
            className="font-editorial text-[28px] text-center leading-snug mb-8"
            style={{ color: c.textDark }}>
            
            Como posso
            <br />
            <span className="italic" style={{ color: c.accent }}>
              te ajudar
            </span>{" "}
            na sua
            <br />
            jornada:
          </h2>

          <div className="mb-8">
            {services.map((service) =>
            <div
              key={service}
              className="flex items-center gap-3 py-3.5"
              style={{ borderBottom: `1px solid ${c.border}` }}>
              
                <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: c.accent }} />
                <span className="text-[13px]" style={{ color: c.textDark }}>
                  {service}
                </span>
              </div>
            )}
          </div>

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
            <button
              className="w-full py-3.5 rounded-full text-[13px] font-medium tracking-wide uppercase transition-opacity hover:opacity-90"
              style={{ backgroundColor: c.dark, color: c.cream }}>
              
              Entrar em contato
            </button>
          </a>
        </motion.div>
      </section>

      {/* ============ SECOND PHOTO (dark) ============ */}
      <section style={{ backgroundColor: c.dark }}>
        <div className="relative w-full max-w-lg mx-auto">
          






          
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      



















      

      {/* ============ SOCIAL ICONS ============ */}
      <section className="pb-4 max-w-lg mx-auto" style={{ backgroundColor: c.bg }}>
        <div className="flex justify-center gap-5">
          <a
            href={`https://instagram.com/${INSTAGRAM}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ border: `1px solid ${c.border}` }}>
            
            <Instagram className="w-4 h-4" style={{ color: c.textDark }} />
          </a>
          <a
            href={whatsappUrl}
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
          © {new Date().getFullYear()} Ane Caroline | Todos os direitos reservados
        </p>
      </section>
    </div>);

}