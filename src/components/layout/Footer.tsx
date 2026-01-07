import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import logoFull from "@/assets/logo-full.png";

export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <img 
              src={logoFull} 
              alt="ACS Beauty" 
              className="h-14 w-auto brightness-0 invert opacity-90"
            />
            <p className="text-ivory/60 text-sm font-light leading-relaxed">
              Elevating beauty through exceptional service, expertise, and a 
              commitment to helping you look and feel your absolute best.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="#"
                className="p-2 rounded-full bg-ivory/10 hover:bg-gold hover:text-charcoal transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-ivory/10 hover:bg-gold hover:text-charcoal transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-light tracking-widest uppercase text-xs text-ivory/80">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              {[
                { label: "Services", href: "/services" },
                { label: "Packages", href: "/packages" },
                { label: "Book Appointment", href: "/booking" },
                { label: "About Us", href: "/about" },
              ].map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-ivory/60 hover:text-gold text-sm font-light transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-light tracking-widest uppercase text-xs text-ivory/80">Our Services</h4>
            <nav className="flex flex-col gap-2">
              {[
                "Facial Treatments",
                "Body Treatments",
                "Hair Removal",
                "Makeup Services",
                "Bridal Packages",
              ].map((service) => (
                <span
                  key={service}
                  className="text-ivory/60 text-sm font-light"
                >
                  {service}
                </span>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-light tracking-widest uppercase text-xs text-ivory/80">Contact Us</h4>
            <div className="space-y-3">
              <a
                href="tel:+1234567890"
                className="flex items-center gap-3 text-ivory/60 hover:text-gold text-sm font-light transition-colors"
              >
                <Phone className="w-4 h-4" />
                (123) 456-7890
              </a>
              <a
                href="mailto:hello@acsbeauty.com"
                className="flex items-center gap-3 text-ivory/60 hover:text-gold text-sm font-light transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@acsbeauty.com
              </a>
              <div className="flex items-start gap-3 text-ivory/60 text-sm font-light">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>123 Beauty Lane<br />Suite 100<br />New York, NY 10001</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-ivory/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-ivory/40 text-sm font-light">
            © {new Date().getFullYear()} ACS Beauty. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="text-ivory/40 hover:text-gold text-sm font-light transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-ivory/40 hover:text-gold text-sm font-light transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
