import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold">
              ACS <span className="text-rose-gold">BEAUTY</span>
            </h3>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              {t("footer_description")}
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="#"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-rose-gold hover:text-foreground transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-rose-gold hover:text-foreground transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">{t("quick_links")}</h4>
            <nav className="flex flex-col gap-2">
              <Link
                to="/services"
                className="text-primary-foreground/70 hover:text-rose-gold text-sm transition-colors"
              >
                {t("nav_services")}
              </Link>
              <Link
                to="/packages"
                className="text-primary-foreground/70 hover:text-rose-gold text-sm transition-colors"
              >
                {t("nav_packages")}
              </Link>
              <Link
                to="/services"
                className="text-primary-foreground/70 hover:text-rose-gold text-sm transition-colors"
              >
                {t("book_appointment")}
              </Link>
              <Link
                to="/about"
                className="text-primary-foreground/70 hover:text-rose-gold text-sm transition-colors"
              >
                {t("about_us")}
              </Link>
              <Link
                to="/contact"
                className="text-primary-foreground/70 hover:text-rose-gold text-sm transition-colors"
              >
                {t("contact_us_title")}
              </Link>
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">{t("our_services")}</h4>
            <nav className="flex flex-col gap-2">
              <span className="text-primary-foreground/70 text-sm">
                {t("service_facial")}
              </span>
              <span className="text-primary-foreground/70 text-sm">
                {t("service_body")}
              </span>
              <span className="text-primary-foreground/70 text-sm">
                {t("service_advanced")}
              </span>
              <span className="text-primary-foreground/70 text-sm">
                {t("service_makeup")}
              </span>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">{t("contact_us_title")}</h4>
            <div className="space-y-3">
              <a
                href="tel:+1234567890"
                className="flex items-center gap-3 text-primary-foreground/70 hover:text-rose-gold text-sm transition-colors"
              >
                <Phone className="w-4 h-4" />
                (123) 456-7890
              </a>
              <a
                href="mailto:hello@acsbeauty.com"
                className="flex items-center gap-3 text-primary-foreground/70 hover:text-rose-gold text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@acsbeauty.com
              </a>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=375+Chestnut+St+Newark+NJ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-primary-foreground/70 text-sm hover:text-primary-foreground transition-colors"
              >
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>375 Chestnut St<br />3rd Floor, Suite 3B<br />Newark, NJ</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} ACS Beauty. {t("all_rights_reserved")}
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="text-primary-foreground/50 hover:text-rose-gold text-sm transition-colors"
            >
              {t("privacy_policy")}
            </Link>
            <Link
              to="/terms"
              className="text-primary-foreground/50 hover:text-rose-gold text-sm transition-colors"
            >
              {t("terms_of_service")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
