import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Eye, Sparkles, X, ChevronLeft, ChevronRight, Calendar, ArrowRight, Image as ImageIcon, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  media_type?: string | null;
}

interface GalleryCategoryRow {
  slug: string;
  label: string;
  emoji: string | null;
  show_on_home: boolean;
  is_active: boolean;
  sort_order: number;
}

// Built-in fallback assets/icons/copy keyed by slug
const PRESETS: Record<string, { icon: any; titleKey?: string; descKey?: string; fallback?: string }> = {
  cabelo: { icon: Scissors, titleKey: "home.services.hair", descKey: "home.services.hair_desc", fallback: hairServiceImg },
  sobrancelhas: { icon: Eye, titleKey: "home.services.brows", descKey: "home.services.brows_desc", fallback: browsServiceImg },
  unhas: { icon: Sparkles, titleKey: "home.services.nails", descKey: "home.services.nails_desc", fallback: nailsServiceImg },
};

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

  const { data: dynamicCategories = [] } = useQuery({
    queryKey: ["gallery-categories-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_categories" as any)
        .select("slug,label,emoji,show_on_home,is_active,sort_order")
        .eq("is_active", true)
        .eq("show_on_home", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as GalleryCategoryRow[];
    },
  });

  const homeCategories = dynamicCategories.length > 0
    ? dynamicCategories
    : [
        { slug: "cabelo", label: "Cabelo", emoji: "💇‍♀️", show_on_home: true, is_active: true, sort_order: 1 },
        { slug: "sobrancelhas", label: "Sobrancelhas", emoji: "👁️", show_on_home: true, is_active: true, sort_order: 2 },
        { slug: "unhas", label: "Unhas", emoji: "💅", show_on_home: true, is_active: true, sort_order: 3 },
      ];

  const imagesByCategory = homeCategories.map((cat) => {
    const preset = PRESETS[cat.slug];
    const images = galleryImages.filter((img) => img.category === cat.slug);
    return {
      slug: cat.slug,
      label: preset?.titleKey ? t(preset.titleKey) : cat.label,
      description: preset?.descKey ? t(preset.descKey) : "",
      icon: preset?.icon ?? ImageIcon,
      emoji: cat.emoji,
      fallback: preset?.fallback,
      images,
    };
  });

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

  const gridCols = imagesByCategory.length <= 3
    ? "md:grid-cols-3"
    : imagesByCategory.length === 4
    ? "md:grid-cols-2 lg:grid-cols-4"
    : "md:grid-cols-2 lg:grid-cols-3";

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
          <div className={cn("grid gap-6 md:gap-8", gridCols)}>
            {imagesByCategory.map((cat, index) => {
              const coverItem = cat.images.length > 0 ? cat.images[0] : null;
              const coverIsVideo = coverItem?.media_type === "video";
              const coverImage = coverItem ? coverItem.image_url : cat.fallback;
              const photoCount = cat.images.length;
              if (!coverImage && photoCount === 0) return null;

              return (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-card rounded-2xl overflow-hidden shadow-soft cursor-pointer"
                  onClick={() => openLightbox(cat.slug)}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    {coverImage ? (
                      coverIsVideo ? (
                        <>
                          <video
                            src={coverImage}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            preload="metadata"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="h-12 w-12 rounded-full bg-background/85 flex items-center justify-center shadow-lg">
                              <Play className="h-5 w-5 text-foreground fill-foreground translate-x-[1px]" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <img
                          src={coverImage}
                          alt={cat.label}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-gold/20 to-foreground/40 flex items-center justify-center text-5xl">
                        {cat.emoji}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 text-primary-foreground">
                    <div className="flex items-center gap-2 mb-2">
                      <cat.icon className="w-5 h-5 text-rose-gold" />
                      <h3 className="font-serif text-xl md:text-2xl font-semibold">{cat.label}</h3>
                    </div>
                    {cat.description && (
                      <p className="text-primary-foreground/80 text-sm leading-relaxed line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                    {photoCount > 1 && (
                      <div className="mt-3 flex items-center gap-1 text-rose-gold text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver {photoCount} {photoCount === 1 ? "item" : "itens"}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-10 md:mt-14"
          >
            <Link to="/portal">
              <Button variant="hero" size="lg" className="group min-h-[52px] px-8 text-base">
                <Calendar className="w-5 h-5" />
                {t("home.hero.cta_services")}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
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
              {lightbox.images[lightbox.index].media_type === "video" ? (
                <video
                  src={lightbox.images[lightbox.index].image_url}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-[80vh] rounded-lg bg-black"
                />
              ) : (
                <img
                  src={lightbox.images[lightbox.index].image_url}
                  alt={lightbox.images[lightbox.index].title || ""}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              )}
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
