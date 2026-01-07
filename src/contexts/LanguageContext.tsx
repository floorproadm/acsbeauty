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
    view_packages: "View Offers",
    buy_package: "Buy Offer",
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
    hero_title_1: "Hair, Brows & Nails",
    hero_title_2: "with Technique & Sophistication",
    hero_description: "We enhance your natural beauty with specialized hair, brow, and nail services, offering personalized care in an elegant and welcoming environment.",
    hero_cta_offers: "View Special Offers",
    hero_cta_services: "Book Now",
    stat_years: "Years Experience",
    stat_clients: "Happy Clients",
    stat_treatments: "Treatments",
    premium_care: "Premium Care",
    personalized_treatments: "Personalized treatments",
    
    // Services Preview - 3 Pillars
    services_badge: "Our Expertise",
    services_title: "Specialized Treatments for You",
    services_description: "Premium services focused on results, aesthetics, and recurring care.",
    service_hair: "Hair",
    service_hair_desc: "Color, treatments, styling, and personalized care to enhance your identity.",
    service_hair_cta: "View Hair Services",
    service_brows: "Brows",
    service_brows_desc: "Design, henna, and definition to enhance your look with balance and naturalness.",
    service_brows_cta: "View Brow Services",
    service_nails: "Nails",
    service_nails_desc: "Manicure, gel, and complete care for flawless nails every day.",
    service_nails_cta: "View Nail Services",
    view_all_services: "View All Services",
    
    // Packages Preview (now "Special Offers")
    packages_badge: "Special Offers",
    packages_title: "Special Offers for Those Who Seek Results",
    packages_description: "Save by caring for yourself with frequency and planning.",
    most_popular: "Most Popular",
    sessions_included: "sessions included",
    book_this_package: "Book This Offer",
    view_all_packages: "View All Offers",
    
    // Testimonials
    testimonials_badge: "Testimonials",
    testimonials_title: "What Our Clients Say",
    testimonials_description: "Real stories from real clients who have experienced the ACS Beauty difference.",
    
    // CTA Section
    cta_title_1: "Ready to Be Cared for by",
    cta_title_2: "Specialist Professionals?",
    cta_description: "Book your appointment and experience the ACS Beauty difference in hair, brows, and nails.",
    view_our_offers: "View Special Offers",
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
    view_our_packages: "View Our Offers",
    
    // Packages Page (now "Special Offers")
    packages_page_badge: "Special Offers",
    packages_page_title: "Special Offers",
    packages_page_description: "Commit to your beauty journey and save with our curated special offers.",
    view_package: "View Offer",
    
    // Offer Landing
    back_to_offers: "Back to Offers",
    treatment_details: "Treatment Details",
    minutes: "minutes",
    book_anytime: "Book anytime",
    offer_not_found: "Offer Not Found",
    offer_not_found_desc: "This offer may have expired or is no longer available.",
    view_all_offers: "View All Offers",
    
    // Package Landing (now "Special Offers")
    back_to_packages: "Back to Offers",
    treatment_package: "Special Offer",
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
    
    // About Page
    about_badge: "Our Story",
    about_hero_title: "Where Beauty Meets Excellence",
    about_hero_description: "For over a decade, ACS Beauty has been transforming lives through personalized skincare and aesthetic treatments.",
    about_founder_badge: "Meet the Founder",
    about_founder_title: "A Passion for Beauty",
    about_founder_text_1: "With over 15 years of experience in the beauty industry, our founder built ACS Beauty on the belief that everyone deserves to feel confident in their own skin.",
    about_founder_text_2: "What started as a small studio has grown into a trusted destination for clients seeking premium skincare treatments and personalized care.",
    about_founder_image_placeholder: "Founder photo coming soon",
    about_pillars_title: "Our Pillars",
    about_pillars_description: "The values that guide everything we do.",
    about_pillar_excellence_title: "Excellence",
    about_pillar_excellence_desc: "We use only the finest products and cutting-edge techniques to deliver exceptional results.",
    about_pillar_care_title: "Personal Care",
    about_pillar_care_desc: "Every treatment is tailored to your unique needs, because your skin deserves individual attention.",
    about_pillar_trust_title: "Trust",
    about_pillar_trust_desc: "Building lasting relationships through transparency, honesty, and consistent results.",
    about_location_title: "Visit Us",
    about_location_description: "Located in the heart of the city, our studio offers a tranquil escape where you can relax and rejuvenate.",
    about_cta_title: "Ready to Experience the Difference?",
    about_cta_description: "Book your appointment today and discover why our clients trust us with their skincare journey.",
    
    // Contact Page
    contact_badge: "Get in Touch",
    contact_hero_title: "We'd Love to Hear from You",
    contact_hero_description: "Have questions or ready to book? Reach out to us through any of the channels below.",
    contact_phone_title: "Phone",
    contact_email_title: "Email",
    contact_address_title: "Address",
    contact_hours_title: "Opening Hours",
    contact_hours_mon_fri: "Monday - Friday",
    contact_hours_saturday: "Saturday",
    contact_hours_sunday: "Sunday",
    contact_map_placeholder: "Map integration coming soon",
    contact_cta_title: "Ready to Book Your Appointment?",
    contact_cta_description: "Schedule your treatment today and take the first step towards radiant skin.",
  },
  pt: {
    // Core UI Strings
    book_now: "Agendar",
    view_offers: "Ver Ofertas",
    view_packages: "Ver Ofertas",
    buy_package: "Comprar Oferta",
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
    hero_title_1: "Cabelo, Sobrancelhas e Unhas",
    hero_title_2: "com Técnica e Sofisticação",
    hero_description: "Realçamos sua beleza natural com serviços especializados em cabelo, sobrancelhas e unhas, oferecendo atendimento personalizado em um ambiente elegante e acolhedor.",
    hero_cta_offers: "Ver Ofertas Especiais",
    hero_cta_services: "Agendar Horário",
    stat_years: "Anos de Experiência",
    stat_clients: "Clientes Satisfeitas",
    stat_treatments: "Tratamentos",
    premium_care: "Cuidado Premium",
    personalized_treatments: "Tratamentos personalizados",
    
    // Services Preview - 3 Pillars
    services_badge: "Nossa Especialidade",
    services_title: "Tratamentos Especializados para Você",
    services_description: "Serviços premium focados em resultado, estética e recorrência.",
    service_hair: "Cabelo",
    service_hair_desc: "Coloração, tratamentos, finalização e cuidados personalizados para realçar sua identidade.",
    service_hair_cta: "Ver Serviços de Cabelo",
    service_brows: "Sobrancelhas",
    service_brows_desc: "Design, henna e definição para valorizar seu olhar com equilíbrio e naturalidade.",
    service_brows_cta: "Ver Serviços de Sobrancelhas",
    service_nails: "Unhas",
    service_nails_desc: "Manicure, gel e cuidados completos para unhas impecáveis no dia a dia.",
    service_nails_cta: "Ver Serviços de Unhas",
    view_all_services: "Ver Todos os Serviços",
    
    // Packages Preview (now "Ofertas Especiais")
    packages_badge: "Ofertas Especiais",
    packages_title: "Ofertas Especiais para Quem Busca Resultado",
    packages_description: "Economize ao cuidar de você com frequência e planejamento.",
    most_popular: "Mais Popular",
    sessions_included: "sessões incluídas",
    book_this_package: "Agendar Esta Oferta",
    view_all_packages: "Ver Todas as Ofertas",
    
    // Testimonials
    testimonials_badge: "Depoimentos",
    testimonials_title: "O Que Nossas Clientes Dizem",
    testimonials_description: "Histórias reais de clientes que vivenciaram a diferença ACS Beauty.",
    
    // CTA Section
    cta_title_1: "Pronta para Cuidar de Você com",
    cta_title_2: "Profissionais Especialistas?",
    cta_description: "Agende seu horário e viva a experiência ACS Beauty em cabelo, sobrancelhas e unhas.",
    view_our_offers: "Ver Ofertas Especiais",
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
    view_our_packages: "Ver Nossas Ofertas",
    
    // Packages Page (now "Ofertas Especiais")
    packages_page_badge: "Ofertas Especiais",
    packages_page_title: "Ofertas Especiais",
    packages_page_description: "Comprometa-se com sua jornada de beleza e economize com nossas ofertas especiais.",
    view_package: "Ver Oferta",
    
    // Offer Landing
    back_to_offers: "Voltar para Ofertas",
    treatment_details: "Detalhes do Tratamento",
    minutes: "minutos",
    book_anytime: "Agende quando quiser",
    offer_not_found: "Oferta Não Encontrada",
    offer_not_found_desc: "Esta oferta pode ter expirado ou não está mais disponível.",
    view_all_offers: "Ver Todas as Ofertas",
    
    // Package Landing (now "Ofertas Especiais")
    back_to_packages: "Voltar para Ofertas",
    treatment_package: "Oferta Especial",
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
    
    // About Page
    about_badge: "Nossa História",
    about_hero_title: "Onde Beleza Encontra Excelência",
    about_hero_description: "Há mais de uma década, a ACS Beauty transforma vidas através de tratamentos estéticos e cuidados personalizados com a pele.",
    about_founder_badge: "Conheça a Fundadora",
    about_founder_title: "Uma Paixão pela Beleza",
    about_founder_text_1: "Com mais de 15 anos de experiência no mercado de beleza, nossa fundadora criou a ACS Beauty com a crença de que todos merecem se sentir confiantes em sua própria pele.",
    about_founder_text_2: "O que começou como um pequeno estúdio cresceu e se tornou um destino de confiança para clientes que buscam tratamentos premium e cuidado personalizado.",
    about_founder_image_placeholder: "Foto da fundadora em breve",
    about_pillars_title: "Nossos Pilares",
    about_pillars_description: "Os valores que guiam tudo o que fazemos.",
    about_pillar_excellence_title: "Excelência",
    about_pillar_excellence_desc: "Utilizamos apenas os melhores produtos e técnicas avançadas para entregar resultados excepcionais.",
    about_pillar_care_title: "Cuidado Pessoal",
    about_pillar_care_desc: "Cada tratamento é personalizado para suas necessidades únicas, porque sua pele merece atenção individual.",
    about_pillar_trust_title: "Confiança",
    about_pillar_trust_desc: "Construímos relacionamentos duradouros através de transparência, honestidade e resultados consistentes.",
    about_location_title: "Visite-nos",
    about_location_description: "Localizado no coração da cidade, nosso estúdio oferece um refúgio tranquilo onde você pode relaxar e rejuvenescer.",
    about_cta_title: "Pronta para Experimentar a Diferença?",
    about_cta_description: "Agende seu horário hoje e descubra por que nossas clientes confiam em nós para sua jornada de cuidados.",
    
    // Contact Page
    contact_badge: "Fale Conosco",
    contact_hero_title: "Adoraríamos Ouvir Você",
    contact_hero_description: "Tem dúvidas ou quer agendar? Entre em contato por qualquer um dos canais abaixo.",
    contact_phone_title: "Telefone",
    contact_email_title: "E-mail",
    contact_address_title: "Endereço",
    contact_hours_title: "Horário de Funcionamento",
    contact_hours_mon_fri: "Segunda a Sexta",
    contact_hours_saturday: "Sábado",
    contact_hours_sunday: "Domingo",
    contact_map_placeholder: "Integração com mapa em breve",
    contact_cta_title: "Pronta para Agendar?",
    contact_cta_description: "Marque seu tratamento hoje e dê o primeiro passo para uma pele radiante.",
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
