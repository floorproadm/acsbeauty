import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import acsLogo from "@/assets/acs-logo.png";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#f5f0eb] text-foreground">
      <div className="container mx-auto px-5 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3 md:space-y-4">
            <Link to="/">
              <img 
                src={acsLogo} 
                alt="ACS Beauty" 
                className="h-12 md:h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-foreground/70 text-xs md:text-sm leading-relaxed font-light">
              {t("footer.description")}
            </p>
            <div className="flex gap-3 md:gap-4 pt-1 md:pt-2">
              <a
                href="https://www.instagram.com/acsbeautynj"
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                className="p-2 rounded-full bg-foreground/10 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-foreground/10 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-light tracking-[0.1em] uppercase text-base md:text-lg">{t("footer.quick_links")}</h4>
            <nav className="flex flex-col gap-2">
              <Link
                to="/services"
                className="text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors font-light"
              >
                {t("nav.services")}
              </Link>
              <Link
                to="/services"
                className="text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors font-light"
              >
                {t("footer.book_appointment")}
              </Link>
              <Link
                to="/studio"
                className="text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors font-light"
              >
                Estúdio
              </Link>
              <Link
                to="/team"
                className="text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors font-light"
              >
                Equipe
              </Link>
              <Link
                to="/contact"
                className="text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors font-light"
              >
                {t("footer.contact_us")}
              </Link>
            </nav>
          </div>

          {/* Services - 3 Core Pillars */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-light tracking-[0.1em] uppercase text-base md:text-lg">{t("footer.our_services")}</h4>
            <nav className="flex flex-col gap-2">
              <Link
                to="/servicos/sobrancelhas"
                className="text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors font-light"
              >
                {t("home.services.brows")}
              </Link>
              <Link
                to="/servicos/cabelo"
                className="text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors font-light"
              >
                {t("home.services.hair")}
              </Link>
              <Link
                to="/servicos/unhas"
                className="text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors font-light"
              >
                {t("home.services.nails")}
              </Link>
              <Link
                to="/shop"
                className="text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors font-light"
              >
                Shop
              </Link>
              <Link
                to="/gift-cards"
                className="text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors font-light"
              >
                Gift Cards
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-light tracking-[0.1em] uppercase text-base md:text-lg">{t("footer.contact_us")}</h4>
            <div className="space-y-2 md:space-y-3">
              <a
                href="tel:+17329153430"
                className="flex items-center gap-2 md:gap-3 text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors font-light"
              >
                <Phone className="w-3.5 h-3.5 md:w-4 md:h-4" />
                (732) 915-3430
              </a>
              <a
                href="mailto:Acsbeautystudio@gmail.com"
                className="flex items-center gap-2 md:gap-3 text-foreground/70 hover:text-primary text-xs md:text-sm transition-colors break-all font-light"
              >
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                Acsbeautystudio@gmail.com
              </a>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=375+Chestnut+St+Newark+NJ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 md:gap-3 text-foreground/70 text-xs md:text-sm hover:text-primary transition-colors font-light"
              >
                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 mt-0.5 shrink-0" />
                <span>375 Chestnut St<br />3rd Floor, Suite 3B<br />Newark, NJ</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-foreground/10 mt-8 md:mt-12 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <p className="text-foreground/50 text-xs md:text-sm text-center md:text-left font-light">
            {t("global.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-4 md:gap-6">
            <Link
              to="/privacy"
              className="text-foreground/50 hover:text-primary text-xs md:text-sm transition-colors font-light"
            >
              {t("footer.privacy_policy")}
            </Link>
            <Link
              to="/terms"
              className="text-foreground/50 hover:text-primary text-xs md:text-sm transition-colors font-light"
            >
              {t("footer.terms_of_service")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
