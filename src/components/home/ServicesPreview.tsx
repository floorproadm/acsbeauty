import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Eye, Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Static imports as fallbacks
import hairServiceImg from "@/assets/hair-service.png";
import browsServiceImg from "@/assets/brows-service.jpg";
import nailsServiceImg from "@/assets/nails-service.jpg";

interface GalleryImage {
  id: string;
  category: string;
  title: string | null;
  image_url: string;
  display_order: number;
}

const CATEGORIES = [
  { key: "cabelo", icon: Scissors, titleKey: "home.services.hair", descKey: "home.services.hair_desc", fallback: hairServiceImg },
  { key: "sobrancelhas", icon: Eye, titleKey: "home.services.brows", descKey: "home.services.brows_desc", fallback: browsServiceImg },
  { key: "unhas", icon: Sparkles, titleKey: "home.services.nails", descKey: "home.services.nails_desc", fallback: nailsServiceImg },
];

export function ServicesPreview() {
  const { t } = useLanguage();
  const [lightbox, setLightbox] = useState<{ images: GalleryImage[]; index: number } | null>(null);

  const { data: galleryImages = [] } = useQuery({
    queryKey: ["gallery-images-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  const imagesByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    images: galleryImages.filter((img) => img.category === cat.key),
  }));

  function openLightbox(categoryKey: string, startIndex = 0) {
    const images = galleryImages.filter((img) => img.category === categoryKey);
    if (images.length === 0) return;
    setLightbox({ images, index: startIndex });
  }

  function navigateLightbox(dir: 1 | -1) {
    if (!lightbox) return;
    const newIndex = (lightbox.index + dir + lightbox.images.length) % lightbox.images.length;
    setLightbox({ ...lightbox, index: newIndex });
  }

  return (
    <>
      <section className="py-20 md:py-24 bg-gradient-warm">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-12 md:mb-16"
          >
            <span className="inline-block text-sm font-medium tracking-wider text-rose-gold uppercase mb-4">
              {t("home.services.badge")}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              {t("home.services.title")}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              {t("home.services.description")}
            </p>
          </motion.div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {imagesByCategory.map((cat, index) => {
              const coverImage = cat.images.length > 0 ? cat.images[0].image_url : cat.fallback;
              const photoCount = cat.images.length;

              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-card rounded-2xl overflow-hidden shadow-soft cursor-pointer"
                  onClick={() => openLightbox(cat.key)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={coverImage}
                      alt={t(cat.titleKey)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-primary-foreground">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <cat.icon className="w-5 h-5 text-rose-gold" />
                      <h3 className="font-serif text-xl md:text-2xl font-semibold">{t(cat.titleKey)}</h3>
                    </div>
                    <p className="text-primary-foreground/80 text-sm leading-relaxed">
                      {t(cat.descKey)}
                    </p>
                    {photoCount > 1 && (
                      <div className="mt-3 flex items-center gap-1 text-rose-gold text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver {photoCount} fotos
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
              onClick={() => setLightbox(null)}
            >
              <X className="w-8 h-8" />
            </button>

            {lightbox.images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10"
                  onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                >
                  <ChevronLeft className="w-10 h-10" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10"
                  onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                >
                  <ChevronRight className="w-10 h-10" />
                </button>
              </>
            )}

            <motion.div
              key={lightbox.images[lightbox.index].id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl max-h-[85vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightbox.images[lightbox.index].image_url}
                alt={lightbox.images[lightbox.index].title || ""}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              {lightbox.images[lightbox.index].title && (
                <p className="text-white/80 text-center mt-3 text-sm">
                  {lightbox.images[lightbox.index].title}
                </p>
              )}
              <p className="text-white/50 text-center mt-1 text-xs">
                {lightbox.index + 1} / {lightbox.images.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
