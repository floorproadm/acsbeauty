import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { supabase } from "@/integrations/supabase/client";
import acsLogo from "@/assets/acs-logo.png";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const onboardingDone = typeof window !== "undefined" && localStorage.getItem("acs_onboarding_done") === "1";
  const ctaHref = isLoggedIn ? "/portal" : onboardingDone ? "/auth" : "/onboarding";

  const navItems = [
    { label: t("nav.services"), href: "/services" },
    { label: "Gift Cards", href: "/gift-cards" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      // Close mobile menu when user scrolls
      if (isMobileMenuOpen && window.scrollY > 10) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobileMenuOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-soft py-3"
          : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo - Brand Manual Style */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img 
              src={acsLogo} 
              alt="ACS Beauty" 
              className="h-14 md:h-16 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation - Centered */}
            <nav className="hidden md:flex items-center justify-center gap-12 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "text-sm font-light tracking-[0.1em] uppercase transition-colors duration-300 hover:text-gold",
                  location.pathname === item.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <LanguageToggle />
            <Link to={ctaHref}>
              <Button variant="hero" size="default" className="gap-2">
                <Calendar className="w-4 h-4" />
                {t("global.book_now")}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <LanguageToggle />
            <button
              className="p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="md:hidden fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Menu Panel */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-background z-50 border-b border-border shadow-lg animate-fade-in">
              {/* Header with logo and close button */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <img 
                    src={acsLogo} 
                    alt="ACS Beauty" 
                    className="h-12 w-auto object-contain"
                  />
                </Link>
                <button
                  className="p-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {/* Navigation */}
              <nav className="flex flex-col py-6 px-6 gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="text-base font-light tracking-[0.1em] uppercase py-2 hover:text-gold transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <Link to={ctaHref} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="hero" className="w-full gap-2">
                      <Calendar className="w-4 h-4" />
                      {t("global.book_now")}
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
