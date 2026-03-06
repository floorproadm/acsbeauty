import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Studio() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero */}
        <section className="pt-28 md:pt-32 pb-12 md:pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-foreground">
                {t("studio.title")}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("studio.description")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="pb-16 md:pb-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl">
              {/* Image placeholder */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="aspect-[4/5] rounded-2xl bg-muted/50 overflow-hidden"
              >
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                  <span className="text-sm font-light tracking-wider uppercase">{t("studio.photo_placeholder")}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                  {t("studio.comfort_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("studio.comfort_text_1")}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {t("studio.comfort_text_2")}
                </p>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">375 Chestnut St</p>
                      <p className="text-sm">3rd Floor, Suite 3B</p>
                      <p className="text-sm">Newark, NJ 07105</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="pb-16 md:pb-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-5xl rounded-2xl overflow-hidden shadow-card">
              <iframe
                title="ACS Beauty Studio Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.5!2d-74.17!3d40.73!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQzJzQ4LjAiTiA3NMKwMTAnMTIuMCJX!5e0!3m2!1sen!2sus!4v1"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
