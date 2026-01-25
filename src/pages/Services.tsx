import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Scissors, Eye, Palette } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

import hairServiceImg from "@/assets/hair-service.png";
import browsServiceImg from "@/assets/brows-service.jpg";
import nailsServiceImg from "@/assets/nails-service.jpg";

const services = [
  {
    id: "cabelo",
    namePt: "Cabelo & Cílios",
    nameEn: "Hair & Lashes",
    descriptionPt: "Transforme seu visual com nossos tratamentos capilares e extensões de cílios.",
    descriptionEn: "Transform your look with our hair treatments and lash extensions.",
    icon: Scissors,
    image: hairServiceImg,
    href: "/servicos/cabelo",
  },
  {
    id: "sobrancelhas",
    namePt: "Sobrancelhas",
    nameEn: "Brows",
    descriptionPt: "Design perfeito e técnicas avançadas para realçar seu olhar.",
    descriptionEn: "Perfect design and advanced techniques to enhance your look.",
    icon: Eye,
    image: browsServiceImg,
    href: "/servicos/sobrancelhas",
  },
  {
    id: "unhas",
    namePt: "Unhas",
    nameEn: "Nails",
    descriptionPt: "Nail art, alongamento e esmaltação em gel para mãos impecáveis.",
    descriptionEn: "Nail art, extensions and gel polish for flawless hands.",
    icon: Palette,
    image: nailsServiceImg,
    href: "/servicos/unhas",
  },
];

export default function Services() {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-[100svh] bg-background">
      <Header />
      <main className="pt-20 md:pt-24 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 md:mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-accent/50 text-accent-foreground text-xs md:text-sm font-medium mb-4">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
              {t("services.badge")}
            </span>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              {t("services.title")}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              {t("services.description")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={service.image}
                      alt={language === "pt" ? service.namePt : service.nameEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-rose-light flex items-center justify-center">
                        <Icon className="w-4 h-4 text-rose-gold" />
                      </div>
                      <h2 className="font-serif text-xl md:text-2xl font-bold">
                        {language === "pt" ? service.namePt : service.nameEn}
                      </h2>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {language === "pt" ? service.descriptionPt : service.descriptionEn}
                    </p>
                    <Link to={service.href}>
                      <Button variant="hero" size="default" className="w-full group/btn">
                        {t("global.learn_more")}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
