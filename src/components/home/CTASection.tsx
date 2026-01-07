import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 bg-charcoal relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-ivory mb-6">
            Ready to Start Your{" "}
            <span className="text-gradient-gold">Beauty Journey?</span>
          </h2>
          <p className="text-ivory/60 font-light leading-relaxed mb-10 max-w-2xl mx-auto">
            Book your appointment today and experience the transformative 
            power of personalized beauty care. Your perfect look awaits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking">
              <Button variant="gold" size="xl" className="group">
                <Calendar className="w-4 h-4" />
                Book Your Appointment
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                variant="outline"
                size="xl"
                className="border-ivory/30 text-ivory hover:bg-ivory/10 hover:text-ivory"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
