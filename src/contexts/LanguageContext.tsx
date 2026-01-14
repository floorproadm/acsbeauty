import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "pt";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "acs_lang";

const translations: Record<Language, Record<string, string>> = {
  en: {
    // ========== GLOBAL ==========
    "global.book_now": "Book Now",
    "global.back": "Back",
    "global.learn_more": "Learn More",
    "global.view_offers": "View Offers",
    "global.view_all_offers": "View All Offers",
    "global.contact_us": "Contact Us",
    "global.processing": "Processing...",
    "global.minutes": "minutes",
    "global.days": "days",
    "global.save": "Save",
    "global.most_popular": "Most Popular",
    "global.all_rights_reserved": "All rights reserved.",
    "global.copyright": "© {year} ACS Beauty. All rights reserved.",

    // ========== NAV ==========
    "nav.services": "Services",
    "nav.packages": "Packages",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.sign_in": "Sign In",

    // ========== FOOTER ==========
    "footer.description": "Elevating beauty through exceptional service, expertise, and a commitment to helping you look and feel your absolute best.",
    "footer.quick_links": "Quick Links",
    "footer.book_appointment": "Book Appointment",
    "footer.about_us": "About Us",
    "footer.our_services": "Our Services",
    "footer.contact_us": "Contact Us",
    "footer.privacy_policy": "Privacy Policy",
    "footer.terms_of_service": "Terms of Service",

    // ========== HOME ==========
    "home.hero.badge": "Premium Beauty Studio",
    "home.hero.title_1": "Hair, Brows & Nails",
    "home.hero.title_2": "with Technique & Sophistication",
    "home.hero.description": "We enhance your natural beauty with specialized hair, brow, and nail services, offering personalized care in an elegant and welcoming environment.",
    "home.hero.cta_offers": "View Special Offers",
    "home.hero.cta_services": "Book Now",
    "home.hero.stat_years": "Years Experience",
    "home.hero.stat_clients": "Happy Clients",
    "home.hero.stat_treatments": "Treatments",
    "home.hero.premium_care": "Premium Care",
    "home.hero.personalized_treatments": "Personalized treatments",

    "home.services.badge": "Our Expertise",
    "home.services.title": "Specialized Treatments for You",
    "home.services.description": "Premium services focused on results, aesthetics, and recurring care.",
    "home.services.hair": "Hair",
    "home.services.hair_desc": "Hair extensions, highlights, keratin treatment, hair botox, sealing, hair treatments, cut, color, blowout.",
    "home.services.brows": "Brows",
    "home.services.brows_desc": "Design, henna, and definition to enhance your look with balance and naturalness.",
    "home.services.nails": "Nails",
    "home.services.nails_desc": "Manicure, gel, and complete care for flawless nails every day.",
    "home.services.view_offers": "View Our Offers",
    "home.services.explore": "Explore",
    "home.services.explore_services": "Explore Our Services",

    "home.packages.badge": "Special Offers",
    "home.packages.title": "Special Offers to Enhance Your Beauty",
    "home.packages.description": "Exclusive conditions for you to care for your hair, brows, and nails with quality and sophistication.",
    "home.packages.book_offer": "Book This Offer",
    "home.packages.view_all": "View All Offers",

    "home.testimonials.badge": "Testimonials",
    "home.testimonials.title": "What Our Clients Say",
    "home.testimonials.description": "Real stories from real clients who have experienced the ACS Beauty difference.",

    "home.cta.title_1": "Ready to Be Cared for by",
    "home.cta.title_2": "Specialist Professionals?",
    "home.cta.description": "Book your appointment and experience the ACS Beauty difference in hair, brows, and nails.",
    "home.cta.view_offers": "View Special Offers",

    // ========== SERVICES PAGE ==========
    "services.badge": "Start Your Journey",
    "services.title": "Our Special Offers",
    "services.description": "Begin your skincare journey with our introductory offers designed for new clients.",
    "services.new_client_special": "New Client Special",
    "services.free_consultation": "Free Consultation",
    "services.view_packages": "View Our Offers",

    // ========== DEDICATED SERVICE PAGES ==========
    "servicos.what_we_offer": "What We Offer",
    "servicos.who_is_for": "Who Is This For",
    "servicos.cta_title": "Ready to Get Started?",
    "servicos.cta_description": "Book your appointment and experience the ACS Beauty difference.",
    "servicos.view_related_offers": "View Related Offers",
    
    // Hair
    "servicos.cabelo.badge": "Hair Services",
    "servicos.cabelo.title": "Hair That Expresses Who You Are",
    "servicos.cabelo.subtitle": "We enhance your natural beauty with specialized techniques, premium products, and personalized care for healthy, radiant hair.",
    "servicos.cabelo.about_title": "Our Approach to Hair",
    "servicos.cabelo.about_text": "At ACS Beauty, we believe hair is an extension of your personality. Our specialized team combines technical expertise with an artistic eye to create looks that align with your lifestyle and enhance your natural beauty. We use only high-quality products and stay updated with the latest trends and techniques.",
    "servicos.cabelo.service_1": "Hair Extensions",
    "servicos.cabelo.service_2": "Highlights & Balayage",
    "servicos.cabelo.service_3": "Keratin Treatment",
    "servicos.cabelo.service_4": "Hair Botox",
    "servicos.cabelo.service_5": "Sealing Treatment",
    "servicos.cabelo.service_6": "Hair Treatments",
    "servicos.cabelo.service_7": "Precision Cuts",
    "servicos.cabelo.service_8": "Color & Blowout",
    "servicos.cabelo.ideal_1": "For those seeking a complete hair transformation with lasting results",
    "servicos.cabelo.ideal_2": "For those who want to maintain healthy, well-cared-for hair on a regular basis",
    "servicos.cabelo.ideal_3": "For those looking to align their look with their lifestyle and routine",
    "servicos.cabelo.ideal_4": "For those who value technique, quality, and personalized attention",
    
    // Brows
    "servicos.sobrancelhas.badge": "Brow Services",
    "servicos.sobrancelhas.title": "Brows That Frame Your Look",
    "servicos.sobrancelhas.subtitle": "Transform your gaze with design, definition, and natural balance. Brows that enhance without exaggeration.",
    "servicos.sobrancelhas.about_title": "Our Approach to Brows",
    "servicos.sobrancelhas.about_text": "Brows are the frame of the face, and we treat them with the attention they deserve. Our technique focuses on enhancing your natural features, creating balance and harmony with your facial structure. Each design is personalized to your unique face shape and preferences.",
    "servicos.sobrancelhas.service_1": "Brow Design",
    "servicos.sobrancelhas.service_2": "Henna Brows",
    "servicos.sobrancelhas.service_3": "Brow Definition",
    "servicos.sobrancelhas.service_4": "Maintenance Sessions",
    "servicos.sobrancelhas.ideal_1": "For those who want natural, well-defined brows",
    "servicos.sobrancelhas.ideal_2": "For those seeking to enhance their gaze with balance",
    "servicos.sobrancelhas.ideal_3": "For those who prefer subtle, elegant enhancement",
    "servicos.sobrancelhas.ideal_4": "For those who value precision and personalized care",
    
    // Nails
    "servicos.unhas.badge": "Nail Services",
    "servicos.unhas.title": "Nails That Reflect Your Care",
    "servicos.unhas.subtitle": "Impeccable nails for everyday life. Quality, durability, and attention to detail in every service.",
    "servicos.unhas.about_title": "Our Approach to Nails",
    "servicos.unhas.about_text": "We believe beautiful nails are an expression of self-care. Our nail services combine aesthetics with health, using quality products that deliver lasting results while maintaining nail integrity. Every detail matters, from cuticle care to the perfect finish.",
    "servicos.unhas.service_1": "Classic Manicure",
    "servicos.unhas.service_2": "Gel Manicure",
    "servicos.unhas.service_3": "Nail Art",
    "servicos.unhas.service_4": "Nail Strengthening",
    "servicos.unhas.service_5": "Complete Nail Care",
    "servicos.unhas.ideal_1": "For those who want beautiful, lasting nails for everyday life",
    "servicos.unhas.ideal_2": "For those seeking practical elegance in their self-care routine",
    "servicos.unhas.ideal_3": "For those who value durability and quality in nail services",
    "servicos.unhas.ideal_4": "For those who appreciate attention to detail and hygiene",

    // ========== OFFERS ==========
    "offers.back": "Back to Offers",
    "offers.treatment_details": "Treatment Details",
    "offers.book_anytime": "Book anytime",
    "offers.not_found": "Offer Not Found",
    "offers.not_found_desc": "This offer may have expired or is no longer available.",

    // ========== PACKAGES PAGE ==========
    "packages.badge": "Special Offers",
    "packages.title": "Special Offers",
    "packages.description": "Commit to your beauty journey and save with our curated special offers.",
    "packages.view_offer": "View Offer",
    "packages.sessions_included": "{n} sessions included",

    // ========== PACKAGE LANDING ==========
    "packages.back": "Back to Offers",
    "packages.treatment_package": "Special Offer",
    "packages.includes": "Package Includes",
    "packages.treatment_sessions": "{n} treatment sessions",
    "packages.valid_for": "Valid for {n} days",
    "packages.buy": "Buy Offer",
    "packages.stripe_coming_soon": "Stripe integration coming soon",
    "packages.book_using": "Book Using Existing Package",
    "packages.not_found": "Package Not Found",
    "packages.not_found_desc": "This package may no longer be available.",

    // ========== BOOKING ==========
    "booking.badge": "Book Appointment",
    "booking.title": "Complete Your Booking",
    "booking.for": "Booking",
    "booking.full_name": "Full Name",
    "booking.full_name_placeholder": "Your full name",
    "booking.phone": "Phone Number",
    "booking.instagram": "Instagram Handle (optional)",
    "booking.confirm": "Confirm Booking",
    "booking.contact_schedule": "We will contact you to schedule the exact appointment time.",
    "booking.success_title": "Booking Confirmed!",
    "booking.success_message": "Thank you for booking. We will contact you shortly to confirm your appointment time.",
    "booking.return_home": "Return Home",
    "booking.name_min_error": "Name must be at least 2 characters",
    "booking.phone_error": "Please enter a valid phone number",

    // ========== ABOUT PAGE ==========
    "about.badge": "Our Story",
    "about.hero_title": "Where Beauty Meets Excellence",
    "about.hero_description": "For over a decade, ACS Beauty has been transforming lives through personalized skincare and aesthetic treatments.",
    "about.founder_badge": "Meet the Founder",
    "about.founder_title": "A Passion for Beauty",
    "about.founder_text_1": "With over 15 years of experience in the beauty industry, our founder built ACS Beauty on the belief that everyone deserves to feel confident in their own skin.",
    "about.founder_text_2": "What started as a small studio has grown into a trusted destination for clients seeking premium skincare treatments and personalized care.",
    "about.pillars_title": "Our Pillars",
    "about.pillars_description": "The values that guide everything we do.",
    "about.pillar_excellence_title": "Excellence",
    "about.pillar_excellence_desc": "We use only the finest products and cutting-edge techniques to deliver exceptional results.",
    "about.pillar_care_title": "Personal Care",
    "about.pillar_care_desc": "Every treatment is tailored to your unique needs, because your skin deserves individual attention.",
    "about.pillar_trust_title": "Trust",
    "about.pillar_trust_desc": "Building lasting relationships through transparency, honesty, and consistent results.",
    "about.location_title": "Visit Us",
    "about.location_description": "Located in the heart of the city, our studio offers a tranquil escape where you can relax and rejuvenate.",
    "about.cta_title": "Ready to Experience the Difference?",
    "about.cta_description": "Book your appointment today and discover why our clients trust us with their skincare journey.",

    // ========== CONTACT PAGE ==========
    "contact.badge": "Get in Touch",
    "contact.hero_title": "We'd Love to Hear from You",
    "contact.hero_description": "Have questions or ready to book? Reach out to us through any of the channels below.",
    "contact.phone_title": "Phone",
    "contact.email_title": "Email",
    "contact.address_title": "Address",
    "contact.hours_title": "Opening Hours",
    "contact.hours_mon_fri": "Monday - Friday",
    "contact.hours_saturday": "Saturday",
    "contact.hours_sunday": "Sunday",
    "contact.map_placeholder": "Map integration coming soon",
    "contact.cta_title": "Ready to Book Your Appointment?",
    "contact.cta_description": "Schedule your treatment today and take the first step towards radiant skin.",

    // ========== CONFIRMATION PAGE ==========
    "confirm.title": "Booking Confirmed!",
    "confirm.subtitle": "We look forward to seeing you.",
    "confirm.not_found": "Booking Not Found",
    "confirm.not_found_desc": "This booking may not exist or you don't have access to it.",
    "confirm.service_label": "Service",
    "confirm.date_label": "Date",
    "confirm.time_label": "Time",
    "confirm.add_calendar": "Add to Calendar",
    "confirm.directions": "Directions",
    "confirm.reschedule": "Need to reschedule?",
    "confirm.reschedule_coming_soon": "Reschedule feature coming soon!",
    "confirm.calendar_details": "Your appointment at ACS Beauty Studio. Please arrive 5 minutes early.",
    "confirm.prep_title": "Before Your Appointment",
    "confirm.prep_1": "Please arrive 5-10 minutes early to check in.",
    "confirm.prep_2": "Avoid heavy makeup on the treatment area if applicable.",
    "confirm.prep_3": "Let us know of any allergies or skin sensitivities.",
    "confirm.addon_title": "Enhance Your Visit",
    "confirm.addon_note": "Request this add-on and we'll confirm availability.",
    "confirm.addon_request": "Request Add-On",
    "confirm.addon_requested": "Add-on request sent! We'll confirm when you arrive.",
  },
  pt: {
    // ========== GLOBAL ==========
    "global.book_now": "Agendar",
    "global.back": "Voltar",
    "global.learn_more": "Saiba Mais",
    "global.view_offers": "Ver Ofertas",
    "global.view_all_offers": "Ver Todas as Ofertas",
    "global.contact_us": "Fale Conosco",
    "global.processing": "Processando...",
    "global.minutes": "minutos",
    "global.days": "dias",
    "global.save": "Economize",
    "global.most_popular": "Mais Popular",
    "global.all_rights_reserved": "Todos os direitos reservados.",
    "global.copyright": "© {year} ACS Beauty. Todos os direitos reservados.",

    // ========== NAV ==========
    "nav.services": "Serviços",
    "nav.packages": "Pacotes",
    "nav.about": "Sobre",
    "nav.contact": "Contato",
    "nav.sign_in": "Entrar",

    // ========== FOOTER ==========
    "footer.description": "Elevando a beleza através de um serviço excepcional, expertise e compromisso em ajudá-la a se sentir incrível.",
    "footer.quick_links": "Links Rápidos",
    "footer.book_appointment": "Agendar Horário",
    "footer.about_us": "Sobre Nós",
    "footer.our_services": "Nossos Serviços",
    "footer.contact_us": "Contato",
    "footer.privacy_policy": "Política de Privacidade",
    "footer.terms_of_service": "Termos de Uso",

    // ========== HOME ==========
    "home.hero.badge": "Estúdio de Beleza Premium",
    "home.hero.title_1": "Cabelo, Sobrancelhas e Unhas",
    "home.hero.title_2": "com Técnica e Sofisticação",
    "home.hero.description": "Realçamos sua beleza natural com serviços especializados em cabelo, sobrancelhas e unhas, oferecendo atendimento personalizado em um ambiente elegante e acolhedor.",
    "home.hero.cta_offers": "Ver Ofertas Especiais",
    "home.hero.cta_services": "Agendar Horário",
    "home.hero.stat_years": "Anos de Experiência",
    "home.hero.stat_clients": "Clientes Satisfeitas",
    "home.hero.stat_treatments": "Tratamentos",
    "home.hero.premium_care": "Cuidado Premium",
    "home.hero.personalized_treatments": "Tratamentos personalizados",

    "home.services.badge": "Nossa Especialidade",
    "home.services.title": "Tratamentos Especializados para Você",
    "home.services.description": "Serviços premium focados em resultado, estética e recorrência.",
    "home.services.hair": "Cabelo",
    "home.services.hair_desc": "Extensões de cabelos, Highlights, progressiva, botox capilar, selagem, tratamentos capilares, corte, tintura, escova.",
    "home.services.brows": "Sobrancelhas",
    "home.services.brows_desc": "Design, henna e definição para valorizar seu olhar com equilíbrio e naturalidade.",
    "home.services.nails": "Unhas",
    "home.services.nails_desc": "Manicure, gel e cuidados completos para unhas impecáveis no dia a dia.",
    "home.services.view_offers": "Ver Nossas Ofertas",
    "home.services.explore": "Explorar",
    "home.services.explore_services": "Explorar Serviços",

    "home.packages.badge": "Ofertas Especiais",
    "home.packages.title": "Ofertas Especiais para Realçar Sua Beleza",
    "home.packages.description": "Condições exclusivas para você cuidar do cabelo, das sobrancelhas e das unhas com qualidade e sofisticação.",
    "home.packages.book_offer": "Agendar Esta Oferta",
    "home.packages.view_all": "Ver Todas as Ofertas",

    "home.testimonials.badge": "Depoimentos",
    "home.testimonials.title": "O Que Nossas Clientes Dizem",
    "home.testimonials.description": "Histórias reais de clientes que vivenciaram a diferença ACS Beauty.",

    "home.cta.title_1": "Pronta para Cuidar de Você com",
    "home.cta.title_2": "Profissionais Especialistas?",
    "home.cta.description": "Agende seu horário e viva a experiência ACS Beauty em cabelo, sobrancelhas e unhas.",
    "home.cta.view_offers": "Ver Ofertas Especiais",

    // ========== SERVICES PAGE ==========
    "services.badge": "Comece Sua Jornada",
    "services.title": "Nossas Ofertas Especiais",
    "services.description": "Comece sua jornada de cuidados com a pele com nossas ofertas introdutórias para novas clientes.",
    "services.new_client_special": "Especial Primeira Visita",
    "services.free_consultation": "Consulta Gratuita",
    "services.view_packages": "Ver Nossas Ofertas",

    // ========== DEDICATED SERVICE PAGES ==========
    "servicos.what_we_offer": "O Que Oferecemos",
    "servicos.who_is_for": "Para Quem É",
    "servicos.cta_title": "Pronta para Começar?",
    "servicos.cta_description": "Agende seu horário e viva a experiência ACS Beauty.",
    "servicos.view_related_offers": "Ver Ofertas Relacionadas",
    
    // Cabelo
    "servicos.cabelo.badge": "Serviços de Cabelo",
    "servicos.cabelo.title": "Cabelos que Expressam Quem Você É",
    "servicos.cabelo.subtitle": "Realçamos sua beleza natural com técnicas especializadas, produtos premium e cuidado personalizado para cabelos saudáveis e radiantes.",
    "servicos.cabelo.about_title": "Nossa Abordagem para Cabelos",
    "servicos.cabelo.about_text": "Na ACS Beauty, acreditamos que o cabelo é uma extensão da sua personalidade. Nossa equipe especializada combina expertise técnica com olhar artístico para criar visuais que se alinham ao seu estilo de vida e realçam sua beleza natural. Utilizamos apenas produtos de alta qualidade e nos mantemos atualizadas com as últimas tendências e técnicas.",
    "servicos.cabelo.service_1": "Extensões de Cabelo",
    "servicos.cabelo.service_2": "Highlights e Balayage",
    "servicos.cabelo.service_3": "Progressiva",
    "servicos.cabelo.service_4": "Botox Capilar",
    "servicos.cabelo.service_5": "Selagem",
    "servicos.cabelo.service_6": "Tratamentos Capilares",
    "servicos.cabelo.service_7": "Cortes de Precisão",
    "servicos.cabelo.service_8": "Coloração e Escova",
    "servicos.cabelo.ideal_1": "Para quem busca uma transformação completa do cabelo com resultados duradouros",
    "servicos.cabelo.ideal_2": "Para quem deseja manter cabelos saudáveis e bem cuidados regularmente",
    "servicos.cabelo.ideal_3": "Para quem quer alinhar o visual ao estilo de vida e rotina",
    "servicos.cabelo.ideal_4": "Para quem valoriza técnica, qualidade e atenção personalizada",
    
    // Sobrancelhas
    "servicos.sobrancelhas.badge": "Serviços de Sobrancelhas",
    "servicos.sobrancelhas.title": "Sobrancelhas que Emolduram Seu Olhar",
    "servicos.sobrancelhas.subtitle": "Transforme seu olhar com design, definição e equilíbrio natural. Sobrancelhas que valorizam sem exagerar.",
    "servicos.sobrancelhas.about_title": "Nossa Abordagem para Sobrancelhas",
    "servicos.sobrancelhas.about_text": "As sobrancelhas são a moldura do rosto, e tratamos cada uma com a atenção que merece. Nossa técnica foca em valorizar seus traços naturais, criando equilíbrio e harmonia com a estrutura do seu rosto. Cada design é personalizado para o formato único do seu rosto e suas preferências.",
    "servicos.sobrancelhas.service_1": "Design de Sobrancelhas",
    "servicos.sobrancelhas.service_2": "Henna",
    "servicos.sobrancelhas.service_3": "Definição",
    "servicos.sobrancelhas.service_4": "Manutenção",
    "servicos.sobrancelhas.ideal_1": "Para quem deseja sobrancelhas naturais e bem definidas",
    "servicos.sobrancelhas.ideal_2": "Para quem busca valorizar o olhar com equilíbrio",
    "servicos.sobrancelhas.ideal_3": "Para quem prefere realce sutil e elegante",
    "servicos.sobrancelhas.ideal_4": "Para quem valoriza precisão e cuidado personalizado",
    
    // Unhas
    "servicos.unhas.badge": "Serviços de Unhas",
    "servicos.unhas.title": "Unhas que Refletem Seu Cuidado",
    "servicos.unhas.subtitle": "Unhas impecáveis para o dia a dia. Qualidade, durabilidade e atenção aos detalhes em cada serviço.",
    "servicos.unhas.about_title": "Nossa Abordagem para Unhas",
    "servicos.unhas.about_text": "Acreditamos que unhas bonitas são uma expressão de autocuidado. Nossos serviços de unhas combinam estética com saúde, usando produtos de qualidade que entregam resultados duradouros enquanto mantêm a integridade das unhas. Cada detalhe importa, do cuidado com as cutículas ao acabamento perfeito.",
    "servicos.unhas.service_1": "Manicure Clássica",
    "servicos.unhas.service_2": "Manicure em Gel",
    "servicos.unhas.service_3": "Nail Art",
    "servicos.unhas.service_4": "Fortalecimento",
    "servicos.unhas.service_5": "Cuidado Completo",
    "servicos.unhas.ideal_1": "Para quem quer unhas bonitas e duradouras no dia a dia",
    "servicos.unhas.ideal_2": "Para quem busca elegância prática na rotina de autocuidado",
    "servicos.unhas.ideal_3": "Para quem valoriza durabilidade e qualidade nos serviços de unhas",
    "servicos.unhas.ideal_4": "Para quem aprecia atenção aos detalhes e higiene",

    // ========== OFFERS ==========
    "offers.back": "Voltar para Ofertas",
    "offers.treatment_details": "Detalhes do Tratamento",
    "offers.book_anytime": "Agende quando quiser",
    "offers.not_found": "Oferta Não Encontrada",
    "offers.not_found_desc": "Esta oferta pode ter expirado ou não está mais disponível.",

    // ========== PACKAGES PAGE ==========
    "packages.badge": "Ofertas Especiais",
    "packages.title": "Ofertas Especiais",
    "packages.description": "Comprometa-se com sua jornada de beleza e economize com nossas ofertas especiais.",
    "packages.view_offer": "Ver Oferta",
    "packages.sessions_included": "{n} sessões incluídas",

    // ========== PACKAGE LANDING ==========
    "packages.back": "Voltar para Ofertas",
    "packages.treatment_package": "Oferta Especial",
    "packages.includes": "O Pacote Inclui",
    "packages.treatment_sessions": "{n} sessões de tratamento",
    "packages.valid_for": "Válido por {n} dias",
    "packages.buy": "Comprar Oferta",
    "packages.stripe_coming_soon": "Integração com pagamento em breve",
    "packages.book_using": "Agendar com Pacote Existente",
    "packages.not_found": "Pacote Não Encontrado",
    "packages.not_found_desc": "Este pacote pode não estar mais disponível.",

    // ========== BOOKING ==========
    "booking.badge": "Agendar Horário",
    "booking.title": "Complete Seu Agendamento",
    "booking.for": "Agendando",
    "booking.full_name": "Nome Completo",
    "booking.full_name_placeholder": "Seu nome completo",
    "booking.phone": "Telefone",
    "booking.instagram": "Instagram (opcional)",
    "booking.confirm": "Confirmar Agendamento",
    "booking.contact_schedule": "Entraremos em contato para confirmar o horário exato.",
    "booking.success_title": "Agendamento Confirmado!",
    "booking.success_message": "Obrigada por agendar. Entraremos em contato em breve para confirmar o horário.",
    "booking.return_home": "Voltar ao Início",
    "booking.name_min_error": "Nome deve ter pelo menos 2 caracteres",
    "booking.phone_error": "Por favor, insira um telefone válido",

    // ========== ABOUT PAGE ==========
    "about.badge": "Nossa História",
    "about.hero_title": "Onde Beleza Encontra Excelência",
    "about.hero_description": "Há mais de uma década, a ACS Beauty transforma vidas através de tratamentos estéticos e cuidados personalizados com a pele.",
    "about.founder_badge": "Conheça a Fundadora",
    "about.founder_title": "Uma Paixão pela Beleza",
    "about.founder_text_1": "Com mais de 15 anos de experiência no mercado de beleza, nossa fundadora criou a ACS Beauty com a crença de que todos merecem se sentir confiantes em sua própria pele.",
    "about.founder_text_2": "O que começou como um pequeno estúdio cresceu e se tornou um destino de confiança para clientes que buscam tratamentos premium e cuidado personalizado.",
    "about.pillars_title": "Nossos Pilares",
    "about.pillars_description": "Os valores que guiam tudo o que fazemos.",
    "about.pillar_excellence_title": "Excelência",
    "about.pillar_excellence_desc": "Utilizamos apenas os melhores produtos e técnicas avançadas para entregar resultados excepcionais.",
    "about.pillar_care_title": "Cuidado Pessoal",
    "about.pillar_care_desc": "Cada tratamento é personalizado para suas necessidades únicas, porque sua pele merece atenção individual.",
    "about.pillar_trust_title": "Confiança",
    "about.pillar_trust_desc": "Construímos relacionamentos duradouros através de transparência, honestidade e resultados consistentes.",
    "about.location_title": "Visite-nos",
    "about.location_description": "Localizado no coração da cidade, nosso estúdio oferece um refúgio tranquilo onde você pode relaxar e rejuvenescer.",
    "about.cta_title": "Pronta para Experimentar a Diferença?",
    "about.cta_description": "Agende seu horário hoje e descubra por que nossas clientes confiam em nós para sua jornada de cuidados.",

    // ========== CONTACT PAGE ==========
    "contact.badge": "Fale Conosco",
    "contact.hero_title": "Adoraríamos Ouvir Você",
    "contact.hero_description": "Tem dúvidas ou quer agendar? Entre em contato por qualquer um dos canais abaixo.",
    "contact.phone_title": "Telefone",
    "contact.email_title": "E-mail",
    "contact.address_title": "Endereço",
    "contact.hours_title": "Horário de Funcionamento",
    "contact.hours_mon_fri": "Segunda a Sexta",
    "contact.hours_saturday": "Sábado",
    "contact.hours_sunday": "Domingo",
    "contact.map_placeholder": "Integração com mapa em breve",
    "contact.cta_title": "Pronta para Agendar?",
    "contact.cta_description": "Marque seu tratamento hoje e dê o primeiro passo para uma pele radiante.",

    // ========== CONFIRMATION PAGE ==========
    "confirm.title": "Agendamento Confirmado!",
    "confirm.subtitle": "Estamos ansiosas para te receber.",
    "confirm.not_found": "Agendamento Não Encontrado",
    "confirm.not_found_desc": "Este agendamento pode não existir ou você não tem acesso.",
    "confirm.service_label": "Serviço",
    "confirm.date_label": "Data",
    "confirm.time_label": "Horário",
    "confirm.add_calendar": "Adicionar ao Calendário",
    "confirm.directions": "Como Chegar",
    "confirm.reschedule": "Precisa reagendar?",
    "confirm.reschedule_coming_soon": "Reagendamento em breve!",
    "confirm.calendar_details": "Seu agendamento na ACS Beauty Studio. Por favor, chegue 5 minutos antes.",
    "confirm.prep_title": "Antes do Seu Atendimento",
    "confirm.prep_1": "Por favor, chegue 5-10 minutos antes para fazer check-in.",
    "confirm.prep_2": "Evite maquiagem pesada na área de tratamento, se aplicável.",
    "confirm.prep_3": "Informe-nos sobre alergias ou sensibilidades de pele.",
    "confirm.addon_title": "Aproveite Sua Visita",
    "confirm.addon_note": "Solicite este adicional e confirmaremos a disponibilidade.",
    "confirm.addon_request": "Solicitar Adicional",
    "confirm.addon_requested": "Solicitação enviada! Confirmaremos quando você chegar.",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "pt" || stored === "en") return stored;
    }
    return "en"; // Default is now EN
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, vars?: Record<string, string | number>): string => {
    let text = translations[language][key] || key;
    
    // Replace variables like {year}, {n}
    if (vars) {
      Object.entries(vars).forEach(([varKey, value]) => {
        text = text.replace(new RegExp(`\\{${varKey}\\}`, "g"), String(value));
      });
    }
    
    return text;
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
