import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import studioParking from "@/assets/studio-parking.png.asset.json";

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
            <div className="max-w-3xl">
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

                <img
                  src={studioParking.url}
                  alt={t("studio.title")}
                  className="block w-full h-auto"
                />

                <div className="pt-4 border-t border-border">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">41 Wilson Ave</p>
                      <p className="text-sm">Newark, NJ 07105</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
