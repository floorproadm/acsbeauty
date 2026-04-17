import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxImage {
  id: string;
  image_url: string;
  title: string | null;
  media_type?: string | null;
}

interface GalleryLightboxProps {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export function GalleryLightbox({ images, index, onClose, onNavigate }: GalleryLightboxProps) {
  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((index! - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onNavigate((index! + 1) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {index !== null && images[index] && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={onClose}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="w-7 h-7" />
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate((index - 1 + images.length) % images.length);
                }}
                aria-label="Anterior"
              >
                <ChevronLeft className="w-9 h-9" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate((index + 1) % images.length);
                }}
                aria-label="Próxima"
              >
                <ChevronRight className="w-9 h-9" />
              </button>
            </>
          )}

          <motion.div
            key={images[index].id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="max-w-5xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {images[index].media_type === "video" ? (
              <video
                src={images[index].image_url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[82vh] rounded-lg bg-black"
              />
            ) : (
              <img
                src={images[index].image_url}
                alt={images[index].title || ""}
                className="max-w-full max-h-[82vh] object-contain rounded-lg"
              />
            )}
            {images[index].title && (
              <p className="text-white/80 text-center mt-3 text-sm">{images[index].title}</p>
            )}
            <p className="text-white/40 text-center mt-1 text-xs">
              {index + 1} / {images.length}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
