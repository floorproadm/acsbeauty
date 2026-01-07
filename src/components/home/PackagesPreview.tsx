import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Star } from "lucide-react";
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
          <span className="inline-block text-sm font-medium tracking-wider text-rose-gold uppercase mb-4">
            Value Packages
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            Save More with Packages
          </h2>
          <p className="text-muted-foreground text-lg">
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
              className={`relative rounded-2xl p-8 transition-all duration-500 ${
                pkg.featured
                  ? "bg-primary text-primary-foreground shadow-elevated scale-105"
                  : "bg-card shadow-card hover:shadow-elevated"
              }`}
            >
              {pkg.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1 rounded-full bg-rose-gold text-foreground text-sm font-medium">
                  <Star className="w-4 h-4" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-serif text-2xl font-bold mb-2">{pkg.name}</h3>
                <p className={pkg.featured ? "text-primary-foreground/70" : "text-muted-foreground"}>
                  {pkg.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-4xl font-bold">${pkg.price}</span>
                  <span className={`text-sm line-through ${pkg.featured ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                    ${pkg.originalPrice}
                  </span>
                </div>
                <span className={`text-sm ${pkg.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {pkg.sessions} sessions included
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 mt-0.5 ${pkg.featured ? "text-rose-gold" : "text-rose-gold"}`} />
                    <span className={`text-sm ${pkg.featured ? "text-primary-foreground/90" : "text-foreground"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/booking" className="block">
                <Button
                  variant={pkg.featured ? "rose" : "hero"}
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
