import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

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
  return (
    <section className="py-24 bg-champagne/40">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block font-elegant text-sm tracking-[0.3em] uppercase text-gold mb-4">
            Testimonials
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-6 text-charcoal">
            What Our Clients Say
          </h2>
          <p className="text-charcoal-light font-light leading-relaxed">
            Real stories from real clients who have experienced the 
            ACS Beauty difference.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-card rounded-lg p-8 shadow-soft hover:shadow-card transition-all duration-500 border border-beige"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-gold-soft" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>

              {/* Content */}
              <p className="text-charcoal font-light leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-charcoal">{testimonial.name}</div>
                  <div className="text-sm text-charcoal-light font-light">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
