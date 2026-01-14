import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Regular Client",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    content: "ACS Beauty has completely transformed my skincare routine. The personalized attention and expert advice have given me the best skin I've ever had.",
    rating: 5,
  },
  {
    name: "Emily Chen",
    role: "Bridal Client",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    content: "My wedding day makeup was absolutely flawless. The team understood exactly what I wanted and executed it perfectly. I felt like a princess!",
    rating: 5,
  },
  {
    name: "Jessica Taylor",
    role: "Package Member",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    content: "The Radiance Package was worth every penny. Six months later, my skin is glowing and I receive compliments constantly. Highly recommend!",
    rating: 5,
  },
];

export function Testimonials() {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24 bg-accent/30">
      <div className="container mx-auto px-5 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-10 md:mb-16"
        >
          <span className="inline-block text-xs md:text-sm font-medium tracking-wider text-rose-gold uppercase mb-3 md:mb-4">
            {t("home.testimonials.badge")}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
            {t("home.testimonials.title")}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            {t("home.testimonials.description")}
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-5 md:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-card rounded-xl md:rounded-2xl p-6 md:p-8 shadow-soft hover:shadow-card transition-all duration-500"
            >
              <Quote className="absolute top-4 md:top-6 right-4 md:right-6 w-8 h-8 md:w-10 md:h-10 text-rose-light" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-3 md:mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-rose-gold text-rose-gold" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground leading-relaxed mb-5 md:mb-6 text-sm md:text-base">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 md:gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-foreground text-sm md:text-base">{testimonial.name}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
