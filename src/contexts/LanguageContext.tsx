import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "pt";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "acs_lang";

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Core UI Strings
    book_now: "Book Now",
    view_offers: "View Offers",
    view_packages: "View Packages",
    buy_package: "Buy Package",
    confirm_booking: "Confirm Booking",
    booking_confirmed: "Booking Confirmed!",
    select_date_time: "Select Date & Time",
    full_name: "Full Name",
    phone_number: "Phone Number",
    instagram_optional: "Instagram (optional)",
    back: "Back",
    limited_spots: "Limited Spots",
    save_more: "Save More",
    
    // Header & Navigation
    nav_services: "Services",
    nav_packages: "Packages",
    nav_about: "About",
    nav_contact: "Contact",
    sign_in: "Sign In",
    
    // Hero Section
    hero_badge: "Premium Beauty Studio",
    hero_title_1: "Elevate Your",
    hero_title_2: "Natural Beauty",
    hero_description: "Experience transformative beauty treatments designed to enhance your unique features. Our expert aestheticians deliver personalized care in a luxurious, relaxing environment.",
    hero_cta_offers: "View Our Offers",
    hero_cta_services: "Explore Services",
    stat_years: "Years Experience",
    stat_clients: "Happy Clients",
    stat_treatments: "Treatments",
    premium_care: "Premium Care",
    personalized_treatments: "Personalized treatments",
    
    // Services Preview
    services_badge: "Our Services",
    services_title: "Treatments Designed for You",
    services_description: "Discover our comprehensive range of beauty and wellness services, each crafted to help you look and feel your absolute best.",
    service_facial: "Facial Treatments",
    service_facial_desc: "Rejuvenating facials tailored to your skin type for a radiant, youthful glow.",
    service_body: "Body Treatments",
    service_body_desc: "Luxurious body wraps, scrubs, and massages for complete relaxation.",
    service_advanced: "Advanced Aesthetics",
    service_advanced_desc: "Cutting-edge treatments including microdermabrasion and chemical peels.",
    service_makeup: "Makeup Services",
    service_makeup_desc: "Professional makeup artistry for every occasion, from bridal to editorial.",
    view_all_services: "View All Services",
    
    // Packages Preview
    packages_badge: "Value Packages",
    packages_title: "Save More with Packages",
    packages_description: "Our curated packages offer exceptional value with bundled treatments designed to achieve your beauty goals.",
    most_popular: "Most Popular",
    sessions_included: "sessions included",
    book_this_package: "Book This Package",
    view_all_packages: "View All Packages",
    
    // Testimonials
    testimonials_badge: "Testimonials",
    testimonials_title: "What Our Clients Say",
    testimonials_description: "Real stories from real clients who have experienced the ACS Beauty difference.",
    
    // CTA Section
    cta_title_1: "Ready to Start Your",
    cta_title_2: "Beauty Journey?",
    cta_description: "Book your appointment today and experience the transformative power of personalized beauty care. Your perfect look awaits.",
    view_our_offers: "View Our Offers",
    contact_us: "Contact Us",
    
    // Footer
    footer_description: "Elevating beauty through exceptional service, expertise, and a commitment to helping you look and feel your absolute best.",
    quick_links: "Quick Links",
    book_appointment: "Book Appointment",
    about_us: "About Us",
    our_services: "Our Services",
    contact_us_title: "Contact Us",
    privacy_policy: "Privacy Policy",
    terms_of_service: "Terms of Service",
    all_rights_reserved: "All rights reserved.",
    
    // Services Page
    services_page_badge: "Start Your Journey",
    services_page_title: "Our Special Offers",
    services_page_description: "Begin your skincare journey with our introductory offers designed for new clients.",
    new_client_special: "New Client Special",
    free_consultation: "Free Consultation",
    learn_more: "Learn More",
    view_our_packages: "View Our Packages",
    
    // Packages Page
    packages_page_badge: "Save More",
    packages_page_title: "Treatment Packages",
    packages_page_description: "Commit to your skincare journey and save with our curated treatment packages.",
    view_package: "View Package",
    
    // Offer Landing
    back_to_offers: "Back to Offers",
    treatment_details: "Treatment Details",
    minutes: "minutes",
    book_anytime: "Book anytime",
    offer_not_found: "Offer Not Found",
    offer_not_found_desc: "This offer may have expired or is no longer available.",
    view_all_offers: "View All Offers",
    
    // Package Landing
    back_to_packages: "Back to Packages",
    treatment_package: "Treatment Package",
    save: "Save",
    package_includes: "Package Includes",
    treatment_sessions: "treatment sessions",
    valid_for_days: "Valid for",
    days: "days",
    stripe_coming_soon: "Stripe integration coming soon",
    book_using_package: "Book Using Existing Package",
    package_not_found: "Package Not Found",
    package_not_found_desc: "This package may no longer be available.",
    
    // Book Page
    book_appointment_badge: "Book Appointment",
    complete_booking: "Complete Your Booking",
    booking: "Booking",
    your_full_name: "Your full name",
    instagram_handle: "Instagram Handle (optional)",
    processing: "Processing...",
    contact_to_schedule: "We will contact you to schedule the exact appointment time.",
    
    // Booking Success
    booking_success_message: "Thank you for booking. We will contact you shortly to confirm your appointment time.",
    return_home: "Return Home",
    
    // Validation
    name_min_error: "Name must be at least 2 characters",
    phone_error: "Please enter a valid phone number",
  },
  pt: {
    // Core UI Strings
    book_now: "Agendar",
    view_offers: "Ver Ofertas",
    view_packages: "Ver Pacotes",
    buy_package: "Comprar Pacote",
    confirm_booking: "Confirmar Agendamento",
    booking_confirmed: "Agendamento Confirmado!",
    select_date_time: "Escolha Data e Horário",
    full_name: "Nome Completo",
    phone_number: "Telefone",
    instagram_optional: "Instagram (opcional)",
    back: "Voltar",
    limited_spots: "Vagas Limitadas",
    save_more: "Economize Mais",
    
    // Header & Navigation
    nav_services: "Serviços",
    nav_packages: "Pacotes",
    nav_about: "Sobre",
    nav_contact: "Contato",
    sign_in: "Entrar",
    
    // Hero Section
    hero_badge: "Estúdio de Beleza Premium",
    hero_title_1: "Eleve a Sua",
    hero_title_2: "Beleza Natural",
    hero_description: "Experimente tratamentos de beleza transformadores, pensados para realçar suas características únicas. Nossas esteticistas oferecem cuidado personalizado em um ambiente luxuoso e relaxante.",
    hero_cta_offers: "Ver Nossas Ofertas",
    hero_cta_services: "Explorar Serviços",
    stat_years: "Anos de Experiência",
    stat_clients: "Clientes Satisfeitas",
    stat_treatments: "Tratamentos",
    premium_care: "Cuidado Premium",
    personalized_treatments: "Tratamentos personalizados",
    
    // Services Preview
    services_badge: "Nossos Serviços",
    services_title: "Tratamentos Feitos para Você",
    services_description: "Descubra nossa ampla gama de serviços de beleza e bem-estar, cada um criado para ajudá-la a se sentir incrível.",
    service_facial: "Tratamentos Faciais",
    service_facial_desc: "Limpezas de pele personalizadas para um brilho radiante e jovial.",
    service_body: "Tratamentos Corporais",
    service_body_desc: "Esfoliações, envolvimentos corporais e massagens para relaxamento completo.",
    service_advanced: "Estética Avançada",
    service_advanced_desc: "Tratamentos de última geração, incluindo microdermoabrasão e peelings.",
    service_makeup: "Maquiagem",
    service_makeup_desc: "Arte em maquiagem profissional para todas as ocasiões, de noivas a editoriais.",
    view_all_services: "Ver Todos os Serviços",
    
    // Packages Preview
    packages_badge: "Pacotes Especiais",
    packages_title: "Economize com Pacotes",
    packages_description: "Nossos pacotes oferecem excelente custo-benefício com tratamentos combinados para alcançar seus objetivos de beleza.",
    most_popular: "Mais Popular",
    sessions_included: "sessões incluídas",
    book_this_package: "Agendar Este Pacote",
    view_all_packages: "Ver Todos os Pacotes",
    
    // Testimonials
    testimonials_badge: "Depoimentos",
    testimonials_title: "O Que Nossas Clientes Dizem",
    testimonials_description: "Histórias reais de clientes que vivenciaram a diferença ACS Beauty.",
    
    // CTA Section
    cta_title_1: "Pronta para Iniciar Sua",
    cta_title_2: "Jornada de Beleza?",
    cta_description: "Agende seu horário hoje e experimente o poder transformador do cuidado de beleza personalizado. Seu visual perfeito espera por você.",
    view_our_offers: "Ver Nossas Ofertas",
    contact_us: "Fale Conosco",
    
    // Footer
    footer_description: "Elevando a beleza através de um serviço excepcional, expertise e compromisso em ajudá-la a se sentir incrível.",
    quick_links: "Links Rápidos",
    book_appointment: "Agendar Horário",
    about_us: "Sobre Nós",
    our_services: "Nossos Serviços",
    contact_us_title: "Contato",
    privacy_policy: "Política de Privacidade",
    terms_of_service: "Termos de Uso",
    all_rights_reserved: "Todos os direitos reservados.",
    
    // Services Page
    services_page_badge: "Comece Sua Jornada",
    services_page_title: "Nossas Ofertas Especiais",
    services_page_description: "Comece sua jornada de cuidados com a pele com nossas ofertas introdutórias para novas clientes.",
    new_client_special: "Especial Primeira Visita",
    free_consultation: "Consulta Gratuita",
    learn_more: "Saiba Mais",
    view_our_packages: "Ver Nossos Pacotes",
    
    // Packages Page
    packages_page_badge: "Economize Mais",
    packages_page_title: "Pacotes de Tratamento",
    packages_page_description: "Comprometa-se com sua jornada de cuidados e economize com nossos pacotes selecionados.",
    view_package: "Ver Pacote",
    
    // Offer Landing
    back_to_offers: "Voltar para Ofertas",
    treatment_details: "Detalhes do Tratamento",
    minutes: "minutos",
    book_anytime: "Agende quando quiser",
    offer_not_found: "Oferta Não Encontrada",
    offer_not_found_desc: "Esta oferta pode ter expirado ou não está mais disponível.",
    view_all_offers: "Ver Todas as Ofertas",
    
    // Package Landing
    back_to_packages: "Voltar para Pacotes",
    treatment_package: "Pacote de Tratamento",
    save: "Economize",
    package_includes: "O Pacote Inclui",
    treatment_sessions: "sessões de tratamento",
    valid_for_days: "Válido por",
    days: "dias",
    stripe_coming_soon: "Integração com pagamento em breve",
    book_using_package: "Agendar com Pacote Existente",
    package_not_found: "Pacote Não Encontrado",
    package_not_found_desc: "Este pacote pode não estar mais disponível.",
    
    // Book Page
    book_appointment_badge: "Agendar Horário",
    complete_booking: "Complete Seu Agendamento",
    booking: "Agendando",
    your_full_name: "Seu nome completo",
    instagram_handle: "Instagram (opcional)",
    processing: "Processando...",
    contact_to_schedule: "Entraremos em contato para confirmar o horário exato.",
    
    // Booking Success
    booking_success_message: "Obrigada por agendar. Entraremos em contato em breve para confirmar o horário.",
    return_home: "Voltar ao Início",
    
    // Validation
    name_min_error: "Nome deve ter pelo menos 2 caracteres",
    phone_error: "Por favor, insira um telefone válido",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "pt" || stored === "en") return stored;
    }
    return "pt";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
