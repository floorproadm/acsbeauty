import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface BeforeAfterImage {
  before: string;
  after: string;
  label?: string;
}

interface BeforeAfterGalleryProps {
  images: BeforeAfterImage[];
  title?: string;
}

export function BeforeAfterGallery({ images, title }: BeforeAfterGalleryProps) {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showAfter, setShowAfter] = useState<{ [key: number]: boolean }>({});

  const toggleBeforeAfter = (index: number) => {
    setShowAfter((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  if (images.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4 text-center text-foreground">
            {title || t("servicos.gallery.title")}
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            {t("servicos.gallery.subtitle")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative group cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-elegant">
                  {/* Before Image */}
                  <img
                    src={showAfter[index] ? image.after : image.before}
                    alt={showAfter[index] ? "Depois" : "Antes"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  
                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {image.label && (
                      <p className="text-sm font-medium text-foreground mb-2">{image.label}</p>
                    )}
                    
                    {/* Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBeforeAfter(index);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-card/90 backdrop-blur-sm border border-border hover:bg-card transition-colors"
                    >
                      <span className={`text-xs font-medium uppercase tracking-wider transition-colors ${!showAfter[index] ? 'text-rose-gold' : 'text-muted-foreground'}`}>
                        {t("servicos.gallery.before")}
                      </span>
                      <div className="relative w-12 h-6 rounded-full bg-muted">
                        <motion.div
                          className="absolute top-1 w-4 h-4 rounded-full bg-rose-gold"
                          animate={{ left: showAfter[index] ? '28px' : '4px' }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </div>
                      <span className={`text-xs font-medium uppercase tracking-wider transition-colors ${showAfter[index] ? 'text-rose-gold' : 'text-muted-foreground'}`}>
                        {t("servicos.gallery.after")}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-4"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors z-10"
            >
              <X className="w-6 h-6 text-foreground" />
            </button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 p-3 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors z-10"
                >
                  <ChevronLeft className="w-6 h-6 text-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 p-3 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors z-10"
                >
                  <ChevronRight className="w-6 h-6 text-foreground" />
                </button>
              </>
            )}

            {/* Images side by side */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col md:flex-row gap-4 max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Before */}
              <div className="flex-1 relative">
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("servicos.gallery.before")}
                  </span>
                </div>
                <img
                  src={images[selectedIndex].before}
                  alt="Antes"
                  className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
                />
              </div>
              
              {/* After */}
              <div className="flex-1 relative">
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-rose-gold/80 backdrop-blur-sm">
                  <span className="text-xs font-medium uppercase tracking-wider text-white">
                    {t("servicos.gallery.after")}
                  </span>
                </div>
                <img
                  src={images[selectedIndex].after}
                  alt="Depois"
                  className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
                />
              </div>
            </motion.div>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm">
              <span className="text-sm text-muted-foreground">
                {selectedIndex + 1} / {images.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
