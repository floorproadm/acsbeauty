import { motion } from "framer-motion";
import { Star, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRef } from "react";

const GOOGLE_REVIEW_URL = "https://g.page/r/acsbeautystudio/review";

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const testimonials = [
  {
    name: "Amanda R.",
    initial: "A",
    color: "bg-rose-500",
    timeAgo: { en: "2 months ago", pt: "2 meses atrás" },
    content: {
      en: "Ane is absolutely amazing! My hair has never looked this good. She really listens to what you want and delivers beyond expectations. The studio is beautiful and welcoming. 100% recommend!",
      pt: "A Ane é incrível! Meu cabelo nunca ficou tão bonito. Ela realmente escuta o que você quer e entrega além das expectativas. O estúdio é lindo e acolhedor. Recomendo 100%!",
    },
    rating: 5,
  },
  {
    name: "Mariana S.",
    initial: "M",
    color: "bg-amber-600",
    timeAgo: { en: "1 month ago", pt: "1 mês atrás" },
    content: {
      en: "Best eyebrow experience I've ever had! Ane took her time to shape them perfectly. The attention to detail is unreal. I finally have the brows I always wanted. Will never go anywhere else!",
      pt: "Melhor experiência de sobrancelha que já tive! A Ane dedicou tempo para modelar perfeitamente. A atenção aos detalhes é surreal. Finalmente tenho as sobrancelhas que sempre quis!",
    },
    rating: 5,
  },
  {
    name: "Jessica L.",
    initial: "J",
    color: "bg-emerald-600",
    timeAgo: { en: "3 weeks ago", pt: "3 semanas atrás" },
    content: {
      en: "I've been coming to ACS Beauty for my nails and every single time they come out perfect. The quality of work and the cozy atmosphere make it my favorite spot. Ane and her team are the best!",
      pt: "Venho ao ACS Beauty para minhas unhas e toda vez saem perfeitas. A qualidade do trabalho e o ambiente acolhedor fazem desse meu lugar favorito. A Ane e sua equipe são as melhores!",
    },
    rating: 5,
  },
];

export function Testimonials() {
  const { t, language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-16 md:py-24 bg-[#111110]">
      <div className="container mx-auto px-5 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-10 md:mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <GoogleLogo />
            <span className="text-xs font-medium tracking-wider text-white/60 uppercase">
              {t("home.testimonials.badge")}
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t("home.testimonials.title")}
          </h2>
          <p className="text-white/50 text-base md:text-lg">
            {t("home.testimonials.description")}
          </p>
        </motion.div>

        {/* Cards — horizontal scroll on mobile, grid on desktop */}
        <div
          ref={scrollRef}
          className="flex md:grid md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 md:pb-0 -mx-5 px-5 md:mx-auto md:px-0"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="min-w-[85vw] md:min-w-0 snap-center bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 flex flex-col"
            >
              {/* Top row: avatar + name | Google logo */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${testimonial.color} flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {testimonial.initial}
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold leading-tight">
                      {testimonial.name}
                    </h4>
                    <p className="text-white/40 text-xs">
                      {testimonial.timeAgo[language]}
                    </p>
                  </div>
                </div>
                <GoogleLogo />
              </div>

              {/* Stars + Verified */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  {t("home.testimonials.verified")}
                </span>
              </div>

              {/* Review text */}
              <p className="text-white/60 text-sm leading-relaxed mb-4 flex-1">
                "{testimonial.content[language]}"
              </p>

              {/* Read more */}
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold text-xs font-semibold hover:underline inline-flex items-center gap-1"
              >
                {t("home.testimonials.read_more")}
                <ExternalLink className="w-3 h-3" />
              </a>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8 md:mt-12"
        >
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-white/70 text-sm hover:bg-white/5 hover:text-white transition-all duration-300"
          >
            <GoogleLogo />
            {t("home.testimonials.leave_review")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
