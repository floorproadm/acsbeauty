import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    title: "Facial Treatments",
    description: "Rejuvenating facials tailored to your skin type for a radiant, youthful glow.",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Body Treatments",
    description: "Luxurious body wraps, scrubs, and massages for complete relaxation.",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Advanced Aesthetics",
    description: "Cutting-edge treatments including microdermabrasion and chemical peels.",
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Makeup Services",
    description: "Professional makeup artistry for every occasion, from bridal to editorial.",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=600&q=80",
  },
];

export function ServicesPreview() {
  return (
    <section className="py-24 bg-gradient-warm">
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
            Our Services
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-6 text-charcoal">
            Treatments Designed for You
          </h2>
          <p className="text-charcoal-light font-light leading-relaxed">
            Discover our comprehensive range of beauty and wellness services, 
            each crafted to help you look and feel your absolute best.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-card rounded-lg overflow-hidden shadow-soft hover:shadow-card transition-all duration-500"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-ivory">
                <h3 className="font-serif text-xl font-light mb-2">{service.title}</h3>
                <p className="text-ivory/80 text-sm font-light leading-relaxed">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link to="/services">
            <Button variant="hero-outline" size="lg" className="group">
              View All Services
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
