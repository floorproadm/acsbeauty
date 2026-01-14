import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-5 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3 md:space-y-4">
            <h3 className="font-serif text-xl md:text-2xl font-bold">
              ACS <span className="text-rose-gold">BEAUTY</span>
            </h3>
            <p className="text-primary-foreground/70 text-xs md:text-sm leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="flex gap-3 md:gap-4 pt-1 md:pt-2">
              <a
                href="https://www.instagram.com/acsbeautystudio_"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-rose-gold hover:text-foreground transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-rose-gold hover:text-foreground transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-medium text-base md:text-lg">{t("footer.quick_links")}</h4>
            <nav className="flex flex-col gap-2">
              <Link
                to="/services"
                className="text-primary-foreground/70 hover:text-rose-gold text-xs md:text-sm transition-colors"
              >
                {t("nav.services")}
              </Link>
              <Link
                to="/services"
                className="text-primary-foreground/70 hover:text-rose-gold text-xs md:text-sm transition-colors"
              >
                {t("footer.book_appointment")}
              </Link>
              <Link
                to="/about"
                className="text-primary-foreground/70 hover:text-rose-gold text-xs md:text-sm transition-colors"
              >
                {t("footer.about_us")}
              </Link>
              <Link
                to="/contact"
                className="text-primary-foreground/70 hover:text-rose-gold text-xs md:text-sm transition-colors"
              >
                {t("footer.contact_us")}
              </Link>
            </nav>
          </div>

          {/* Services - 3 Core Pillars */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-medium text-base md:text-lg">{t("footer.our_services")}</h4>
            <nav className="flex flex-col gap-2">
              <span className="text-primary-foreground/70 text-xs md:text-sm">
                {t("home.services.hair")}
              </span>
              <span className="text-primary-foreground/70 text-xs md:text-sm">
                {t("home.services.brows")}
              </span>
              <span className="text-primary-foreground/70 text-xs md:text-sm">
                {t("home.services.nails")}
              </span>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-medium text-base md:text-lg">{t("footer.contact_us")}</h4>
            <div className="space-y-2 md:space-y-3">
              <a
                href="tel:+17329153430"
                className="flex items-center gap-2 md:gap-3 text-primary-foreground/70 hover:text-rose-gold text-xs md:text-sm transition-colors"
              >
                <Phone className="w-3.5 h-3.5 md:w-4 md:h-4" />
                (732) 915-3430
              </a>
              <a
                href="mailto:Acsbeautystudio@gmail.com"
                className="flex items-center gap-2 md:gap-3 text-primary-foreground/70 hover:text-rose-gold text-xs md:text-sm transition-colors break-all"
              >
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                Acsbeautystudio@gmail.com
              </a>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=375+Chestnut+St+Newark+NJ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 md:gap-3 text-primary-foreground/70 text-xs md:text-sm hover:text-primary-foreground transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 mt-0.5 shrink-0" />
                <span>375 Chestnut St<br />3rd Floor, Suite 3B<br />Newark, NJ</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/10 mt-8 md:mt-12 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <p className="text-primary-foreground/50 text-xs md:text-sm text-center md:text-left">
            {t("global.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-4 md:gap-6">
            <Link
              to="/privacy"
              className="text-primary-foreground/50 hover:text-rose-gold text-xs md:text-sm transition-colors"
            >
              {t("footer.privacy_policy")}
            </Link>
            <Link
              to="/terms"
              className="text-primary-foreground/50 hover:text-rose-gold text-xs md:text-sm transition-colors"
            >
              {t("footer.terms_of_service")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
