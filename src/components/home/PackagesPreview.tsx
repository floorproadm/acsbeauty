import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const packages = [
  {
    name: "Essential Glow",
    description: "Perfect introduction to our signature treatments",
    price: 199,
    originalPrice: 250,
    sessions: 3,
    features: [
      "Deep Cleansing Facial",
      "Hydrating Mask Treatment",
      "LED Light Therapy",
    ],
    featured: false,
  },
  {
    name: "Radiance Package",
    description: "Our most popular choice for complete rejuvenation",
    price: 399,
    originalPrice: 520,
    sessions: 6,
    features: [
      "Premium Anti-Aging Facial",
      "Chemical Peel Treatment",
      "Microdermabrasion",
      "Eye Contour Treatment",
      "Take-Home Skincare Kit",
    ],
    featured: true,
  },
  {
    name: "Bridal Beauty",
    description: "Complete pre-wedding preparation package",
    price: 899,
    originalPrice: 1200,
    sessions: 12,
    features: [
      "Monthly Facial Treatments",
      "Body Polishing Sessions",
      "Trial Makeup Session",
      "Wedding Day Makeup",
      "Complimentary Touch-ups",
    ],
    featured: false,
  },
];

export function PackagesPreview() {
  return (
    <section className="py-24 bg-background">
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
            Value Packages
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-6 text-charcoal">
            Save More with Packages
          </h2>
          <p className="text-charcoal-light font-light leading-relaxed">
            Our curated packages offer exceptional value with bundled treatments 
            designed to achieve your beauty goals.
          </p>
        </motion.div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-lg p-8 transition-all duration-500 ${
                pkg.featured
                  ? "bg-charcoal text-ivory shadow-elevated scale-[1.02]"
                  : "bg-card shadow-card hover:shadow-elevated border border-beige"
              }`}
            >
              {pkg.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold text-ivory text-xs font-light tracking-widest uppercase">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-serif text-2xl font-light mb-2">{pkg.name}</h3>
                <p className={`text-sm font-light ${pkg.featured ? "text-ivory/70" : "text-charcoal-light"}`}>
                  {pkg.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-light">${pkg.price}</span>
                  <span className={`text-sm line-through ${pkg.featured ? "text-ivory/40" : "text-charcoal-light/60"}`}>
                    ${pkg.originalPrice}
                  </span>
                </div>
                <span className={`text-xs tracking-wide ${pkg.featured ? "text-ivory/60" : "text-charcoal-light"}`}>
                  {pkg.sessions} sessions included
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${pkg.featured ? "text-gold" : "text-gold"}`} />
                    <span className={`text-sm font-light ${pkg.featured ? "text-ivory/90" : "text-charcoal"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/booking" className="block">
                <Button
                  variant={pkg.featured ? "gold" : "hero"}
                  className="w-full"
                >
                  Book This Package
                </Button>
              </Link>
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
          <Link to="/packages">
            <Button variant="hero-outline" size="lg" className="group">
              View All Packages
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
