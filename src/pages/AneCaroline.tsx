import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Instagram, MessageCircle, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import founderImg from "@/assets/founder.jpg";
import { useState } from "react";

const WHATSAPP_NUMBER = "19734944854";
const INSTAGRAM = "anecaroline.hair";

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
      className="w-full text-left border-b border-border/50 py-4 group"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-medium text-sm leading-snug">{q}</p>
        {open ? (
          <Minus className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
        ) : (
          <Plus className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
        )}
      </div>
      {open && (
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed pr-8">
          {a}
        </p>
      )}
    </button>
  );
}

export default function AneCaroline() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Oi%20Ane!%20Vi%20seu%20perfil%20e%20gostaria%20de%20agendar.`;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero - Dark section with photo */}
      <section className="relative bg-primary overflow-hidden">
        <div className="relative flex flex-col items-center pt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full max-w-md mx-auto aspect-[3/4] overflow-hidden"
          >
            <img
              src={founderImg}
              alt="Ane Caroline - Hair Stylist"
              className="w-full h-full object-cover object-top"
              loading="eager"
              fetchPriority="high"
            />
            {/* Gradient overlay for text */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />

            {/* Name overlay */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="font-editorial italic text-4xl md:text-5xl text-primary-foreground mb-1"
              >
                Ane Caroline
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="text-primary-foreground/80 text-sm tracking-[0.2em] uppercase"
              >
                Hair Stylist
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social links bar */}
      <section className="bg-background py-4">
        <div className="flex justify-center gap-4">
          <a
            href={`https://instagram.com/${INSTAGRAM}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border hover:border-primary/50 transition-colors text-sm"
          >
            <Instagram className="w-4 h-4" />
            @{INSTAGRAM}
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm"
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
          <h2 className="font-editorial text-3xl mb-6">
            Sobre <span className="italic text-primary">mim</span>
          </h2>
          <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
            <p>Minha história com os cabelos começou cedo.</p>
            <p>
              Ainda criança, já cortava o cabelo das minhas irmãs, sem técnica,
              mas com muito cuidado.
            </p>
            <p>
              Com o tempo, esse gesto se transformou em profissão.
            </p>
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
      <section className="bg-primary text-primary-foreground px-6 py-12">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-editorial text-3xl mb-6">
              Minha <span className="italic">missão</span>
            </h2>
            <div className="space-y-4 text-primary-foreground/80 text-sm leading-relaxed">
              <p>
                Minha missão é cuidar de cada pessoa que passa pela minha
                cadeira com atenção, sensibilidade e excelência.
              </p>
              <p>
                Acredito que o cabelo vai muito além da estética. Ele expressa
                identidade, autoestima e confiança.
              </p>
              <p>
                Por isso, meu compromisso é oferecer mais do que um serviço.
              </p>
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
          <h2 className="font-editorial text-3xl mb-2 text-center">
            Como posso
          </h2>
          <h2 className="font-editorial italic text-3xl mb-1 text-center text-primary">
            te ajudar
          </h2>
          <h2 className="font-editorial text-3xl mb-8 text-center">
            na sua jornada:
          </h2>

          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service}
                className="flex items-center gap-3 py-3 border-b border-border/50"
              >
                <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm">{service}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                className="w-full max-w-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Entrar em contato
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Second photo + FAQ - Dark section */}
      <section className="bg-primary text-primary-foreground">
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
            <h2 className="font-editorial text-3xl mb-8">
              Dúvidas <span className="italic">comuns</span>
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
      <section className="px-6 py-12 max-w-lg mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Link to="/book">
            <Button
              variant="outline"
              size="lg"
              className="w-full max-w-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Agendar agora
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          <p className="text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} ACS Beauty · Feito com carinho em Newark, NJ
          </p>
        </motion.div>
      </section>
    </div>
  );
}
