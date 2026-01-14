import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/nails-service.jpg";

export default function Unhas() {
  const { t } = useLanguage();

  const services = [
    t("servicos.unhas.service_1"),
    t("servicos.unhas.service_2"),
    t("servicos.unhas.service_3"),
    t("servicos.unhas.service_4"),
    t("servicos.unhas.service_5"),
  ];

  const idealFor = [
    t("servicos.unhas.ideal_1"),
    t("servicos.unhas.ideal_2"),
    t("servicos.unhas.ideal_3"),
    t("servicos.unhas.ideal_4"),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src={heroImage} 
              alt="Serviços de unhas ACS Beauty"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
          </div>
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("global.back")}
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-rose-gold/20 backdrop-blur-sm">
                  <Sparkles className="w-6 h-6 text-rose-gold" />
                </div>
                <span className="text-sm font-medium tracking-wider text-rose-gold uppercase">
                  {t("servicos.unhas.badge")}
                </span>
              </div>
              
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
                {t("servicos.unhas.title")}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                {t("servicos.unhas.subtitle")}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/book">
                  <Button variant="hero" size="lg" className="group w-full sm:w-auto">
                    {t("global.book_now")}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto backdrop-blur-sm bg-background/50">
                    {t("servicos.view_related_offers")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* About This Service */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6 text-foreground">
                {t("servicos.unhas.about_title")}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("servicos.unhas.about_text")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 text-foreground">
                {t("servicos.what_we_offer")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((service, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-soft"
                  >
                    <div className="p-1.5 rounded-full bg-rose-gold/10">
                      <Check className="w-4 h-4 text-rose-gold" />
                    </div>
                    <span className="text-foreground">{service}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Who Is This For */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 text-foreground">
                {t("servicos.who_is_for")}
              </h2>
              <div className="space-y-4">
                {idealFor.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-start gap-3 p-4 border border-border rounded-lg"
                  >
                    <div className="p-1.5 rounded-full bg-champagne/20 mt-0.5">
                      <Check className="w-4 h-4 text-espresso" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-gradient-warm">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4 text-foreground">
                {t("servicos.cta_title")}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t("servicos.cta_description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/book">
                  <Button variant="hero" size="lg" className="group w-full sm:w-auto">
                    {t("global.book_now")}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    {t("servicos.view_related_offers")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
