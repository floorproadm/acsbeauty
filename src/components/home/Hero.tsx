import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMark from "@/assets/logo-mark.png";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-hero overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-champagne/40 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-nude/50 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-6 pt-32 pb-16 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Logo mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <img 
              src={logoMark} 
              alt="ACS" 
              className="h-24 md:h-32 w-auto"
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-elegant text-sm md:text-base tracking-[0.3em] uppercase text-charcoal-light mb-8"
          >
            Premium Beauty Studio
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-6 text-charcoal"
          >
            Elevate Your{" "}
            <span className="text-gradient-gold">Natural Beauty</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base md:text-lg text-charcoal-light font-light leading-relaxed mb-10 max-w-2xl"
          >
            Experience transformative beauty treatments designed to enhance your 
            unique features. Our expert aestheticians deliver personalized care 
            in a luxurious, calming environment.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/booking">
              <Button variant="hero" size="xl" className="group font-light tracking-wide">
                Book Your Appointment
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="hero-outline" size="xl" className="font-light tracking-wide">
                Explore Services
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-3 gap-12 md:gap-20 mt-16 pt-16 border-t border-beige"
          >
            {[
              { value: "10+", label: "Years Experience" },
              { value: "5K+", label: "Happy Clients" },
              { value: "50+", label: "Treatments" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-2xl md:text-3xl font-light text-charcoal">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-charcoal-light font-light tracking-wide mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
