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
    "home.hero.badge": "Beauty Studio · Newark, NJ",
    "home.hero.title_1": "Where you become",
    "home.hero.title_2": "exactly who you already are.",
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

    "home.testimonials.badge": "Google Reviews",
    "home.testimonials.title": "What Our Clients Say",
    "home.testimonials.description": "Real reviews from real clients — verified on Google.",
    "home.testimonials.leave_review": "See All Reviews",
    "home.testimonials.read_more": "Read more",
    "home.testimonials.verified": "Verified",

    "home.cta.title_1": "Ready to see",
    "home.cta.title_2": "ACS's work?",
    "home.cta.description": "Book your appointment and experience the ACS Beauty difference in hair, brows, and nails.",
    "home.cta.view_services": "View Our Services",
    "home.cta.book_now": "Book Now",

    // ========== SERVICES PAGE ==========
    "services.badge": "Our Expertise",
    "services.title": "Our Services",
    "services.description": "Specialized in Hair, Brows, and Nails — discover treatments crafted for you.",
    "services.new_client_special": "New Client Special",
    "services.free_consultation": "Free Consultation",
    "services.view_packages": "View Our Offers",

    // ========== DEDICATED SERVICE PAGES ==========
    "servicos.what_we_offer": "What We Offer",
    "servicos.who_is_for": "Who Is This For",
    "servicos.faq_title": "Frequently Asked Questions",
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
    "servicos.cabelo.faq_1_q": "How long does a color service take?",
    "servicos.cabelo.faq_1_a": "Color services typically take 2-4 hours depending on the technique. A full balayage or extensive highlights may take longer, while a simple root touch-up is usually completed in about 1.5 hours.",
    "servicos.cabelo.faq_2_q": "How often should I get a haircut?",
    "servicos.cabelo.faq_2_a": "We recommend a trim every 6-8 weeks to maintain healthy ends and keep your style looking fresh. For those growing out their hair, visits every 10-12 weeks work well.",
    "servicos.cabelo.faq_3_q": "What products do you use?",
    "servicos.cabelo.faq_3_a": "We exclusively use professional, high-quality products that are gentle on your hair while delivering exceptional results. We can recommend the best products for your hair type during your appointment.",
    "servicos.cabelo.faq_4_q": "How long do keratin treatments last?",
    "servicos.cabelo.faq_4_a": "Keratin treatments typically last 3-5 months depending on your hair type and care routine. We provide aftercare instructions to help maximize the longevity of your treatment.",
    "servicos.cabelo.faq_5_q": "Can I color my hair on the same day as a treatment?",
    "servicos.cabelo.faq_5_a": "We generally recommend doing color services before treatments like keratin or botox. During your consultation, we'll create a personalized plan that works best for your hair goals.",
    
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
    "servicos.sobrancelhas.faq_1_q": "How long does brow design take?",
    "servicos.sobrancelhas.faq_1_a": "A complete brow design session takes approximately 30-45 minutes. This includes consultation, shaping, and finishing touches to ensure perfect symmetry.",
    "servicos.sobrancelhas.faq_2_q": "How long does henna last?",
    "servicos.sobrancelhas.faq_2_a": "Henna brows typically last 2-3 weeks on the skin and 4-6 weeks on the hair. Results vary based on skin type and aftercare routine.",
    "servicos.sobrancelhas.faq_3_q": "Is the procedure painful?",
    "servicos.sobrancelhas.faq_3_a": "Our brow services are gentle and non-invasive. You may feel slight discomfort during tweezing, but most clients find the experience quite relaxing.",
    "servicos.sobrancelhas.faq_4_q": "How often should I get maintenance?",
    "servicos.sobrancelhas.faq_4_a": "We recommend maintenance every 3-4 weeks to keep your brows looking their best. This helps maintain the shape and prevents overgrowth.",
    
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
    "servicos.unhas.faq_1_q": "How long does a gel manicure last?",
    "servicos.unhas.faq_1_a": "A gel manicure typically lasts 2-3 weeks with proper care. We recommend avoiding harsh chemicals and using cuticle oil daily to extend the life of your manicure.",
    "servicos.unhas.faq_2_q": "Is gel harmful to my nails?",
    "servicos.unhas.faq_2_a": "When applied and removed properly by professionals, gel is not harmful. We use quality products and proper removal techniques to maintain your nail health.",
    "servicos.unhas.faq_3_q": "How long does a manicure session take?",
    "servicos.unhas.faq_3_a": "A classic manicure takes about 45 minutes, while a gel manicure takes approximately 1 hour. Nail art designs may require additional time depending on complexity.",
    "servicos.unhas.faq_4_q": "Do you offer nail strengthening treatments?",
    "servicos.unhas.faq_4_a": "Yes! We offer various strengthening treatments for weak or damaged nails. During your consultation, we'll assess your nails and recommend the best treatment for your needs.",

    // Makeup
    "servicos.maquiagem.badge": "Makeup Services",
    "servicos.maquiagem.title": "Makeup That Reveals Your Best Self",
    "servicos.maquiagem.subtitle": "Professional makeup for brides, events, and special productions. Long-lasting finish with techniques tailored to your features.",
    "servicos.maquiagem.about_title": "Our Approach to Makeup",
    "servicos.maquiagem.about_text": "We believe great makeup enhances who you already are. Our team blends classic technique with modern trends, using premium products to deliver flawless, long-lasting looks for every occasion — from intimate moments to your most important days.",

    // Treatments
    "servicos.tratamentos.badge": "Hair Treatments",
    "servicos.tratamentos.title": "Treatments That Restore Health and Shine",
    "servicos.tratamentos.subtitle": "Personalized hair treatments to repair, hydrate, and strengthen — bringing your hair back to life with visible, lasting results.",
    "servicos.tratamentos.about_title": "Our Approach to Treatments",
    "servicos.tratamentos.about_text": "Each strand tells a story. We diagnose your hair's specific needs and design a treatment plan that restores integrity, shine, and softness — using high-performance products and techniques refined by years of expertise.",

    // Gallery
    "servicos.gallery.title": "Before & After Results",
    "servicos.gallery.subtitle": "See the transformations achieved by our specialists. Tap to toggle between before and after.",
    "servicos.gallery.before": "Before",
    "servicos.gallery.after": "After",

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
    "about.hero_description": "More than a studio — a sanctuary built around technique, care, and the women we serve.",
    "about.story_title": "How It All",
    "about.story_title_highlight": "Started",
    "about.story_p1": "ACS Beauty was born from a simple belief: every woman deserves a space where she feels truly seen, heard, and cared for.",
    "about.story_p2": "What began as a small dream became a destination — a studio where technique meets intention, and where every detail is designed to make you feel at home.",
    "about.story_p3": "Today, we are proud to be part of countless transformations, not just of hair and skin, but of confidence and self-image.",
    "about.pillars_title": "Our Pillars",
    "about.pillars_description": "The values that guide everything we do.",
    "about.pillar_excellence_title": "Excellence",
    "about.pillar_excellence_desc": "We use only the finest products and cutting-edge techniques to deliver exceptional results.",
    "about.pillar_care_title": "Personal Care",
    "about.pillar_care_desc": "Every treatment is tailored to your unique needs, because your skin deserves individual attention.",
    "about.pillar_trust_title": "Trust",
    "about.pillar_trust_desc": "Building lasting relationships through transparency, honesty, and consistent results.",
    "about.bridge_title": "Behind the Studio",
    "about.bridge_description": "Meet the team that brings this vision to life every day.",
    "about.bridge_founder": "Meet the Founder",
    "about.bridge_team": "Meet the Team",
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
    "contact.hours_tue_sat": "Tuesday - Saturday",
    "contact.map_placeholder": "Map integration coming soon",
    "contact.cta_title": "Ready to Book Your Appointment?",
    "contact.cta_description": "Schedule your treatment today and take the first step towards radiant skin.",
    "contact.team_title": "Talk to Our Team",
    "contact.team_subtitle": "Tap the icons to interact.",
    "contact.navigate_title": "How would you like to navigate?",
    "contact.find_us": "Find Us",

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

    // ========== TEAM PAGE ==========
    "team.badge": "Meet who takes care of you",
    "team.title_prefix": "Our",
    "team.title_highlight": "Team",
    "team.description": "Professionals passionate about beauty, dedicated to delivering exceptional results with technique and care.",
    "team.specialties": "Specialties",
    "team.photo_placeholder": "Photo",
    "team.loading": "Loading...",
    "team.founder_label": "Founder & Hair Stylist",
    "team.founder_cta": "View full profile",
    "team.bridge_title": "Want to know our story?",
    "team.bridge_description": "Discover the values and vision behind ACS Beauty.",
    "team.bridge_cta": "Read our story",

    // ========== SHOP PAGE ==========
    "shop.title": "Shop — Coming Soon",
    "shop.description": "We're preparing a special selection of hair, brow, and nail care products. Leave your email to be the first to know!",
    "shop.success": "✨ All set! We'll let you know when the shop opens.",
    "shop.notify_me": "Notify me",
    "shop.on_list": "You're on the list!",
    "shop.error": "Error saving. Please try again.",

    // ========== STUDIO PAGE ==========
    "studio.title": "Our Studio",
    "studio.description": "A space designed for you to feel welcome, relax, and leave even more beautiful.",
    "studio.photo_placeholder": "Studio Photo",
    "studio.comfort_title": "Beauty with Comfort",
    "studio.comfort_text_1": "ACS Beauty Studio was created to be more than a salon — it's an experience. Every detail of our space was designed to provide comfort, privacy, and impeccable results.",
    "studio.comfort_text_2": "Located in the heart of Newark, our studio offers a warm and modern environment, with high-quality products and professionals specialized in enhancing your natural beauty.",

    // ========== LOCATION PAGE ==========
    "location.title": "ACS Beauty Studio — Newark",
    "location.description": "Your beauty destination in the heart of Newark, NJ. Specialists in brows, hair, and nails.",
    "location.address_title": "Address",
    "location.contact_title": "Contact",
    "location.hours_title": "Hours",
    "location.closed": "Closed",
    "location.hours_soon": "Hours coming soon.",
    "location.day_0": "Sunday",
    "location.day_1": "Monday",
    "location.day_2": "Tuesday",
    "location.day_3": "Wednesday",
    "location.day_4": "Thursday",
    "location.day_5": "Friday",
    "location.day_6": "Saturday",

    // ========== NOT FOUND PAGE ==========
    "notfound.title": "404",
    "notfound.message": "Oops! Page not found",
    "notfound.back": "Return to Home",

    // ========== REVIEW REQUEST PAGE ==========
    "review.badge": "Service Complete",
    "review.hero_title_1": "Thank You for Choosing",
    "review.hero_title_2": "ACS Beauty Studio",
    "review.hero_subtitle": "Your satisfaction means everything to us. If you loved your experience, a review helps other clients find the quality beauty services they deserve.",
    "review.ane_quote": "Every client who sits in my chair is personal to me. If I delivered a great experience, sharing your story helps other women find the same care for themselves. It takes just 2 minutes and means the world to our team.",
...
    "review.ane_quote": "Cada cliente que senta na minha cadeira é especial para mim. Se proporcionei uma ótima experiência, compartilhar sua história ajuda outras mulheres a encontrarem o mesmo cuidado. Leva só 2 minutinhos e significa o mundo para nossa equipe.",
    "review.ane_title": "Fundadora & Hair Stylist",
    "review.platforms_title": "Deixe Seu Review",
    "review.platforms_subtitle": "Escolha sua plataforma preferida — reviews no Google nos ajudam mais!",
    "review.google_desc": "Maior impacto na visibilidade local",
    "review.google_cta": "Avaliar no Google",
    "review.instagram_desc": "Compartilhe sua experiência com a comunidade",
    "review.instagram_cta": "Marcar no Instagram",
    "review.howto_title": "Como Deixar um Review no Google",
    "review.step1_title": "Clique no botão do Google acima",
    "review.step1_desc": "Vai abrir o Google Maps com nossa página",
    "review.step2_title": "Entre na sua conta Google",
    "review.step2_desc": "Use qualquer conta Gmail ou Google que você tenha",
    "review.step3_title": "Selecione as estrelas",
    "review.step3_desc": "Toque nas estrelas — buscamos 5 ⭐ mas agradecemos feedback honesto",
    "review.step4_title": "Escreva algumas palavras e envie",
    "review.step4_desc": "Use nosso gerador de rascunho abaixo ou escreva o seu!",
    "review.draft_title": "Gerador de Rascunho de Review",
    "review.draft_subtitle": "Não sabe o que escrever? Selecione suas opções e criaremos um rascunho personalizado para copiar e colar.",
    "review.service_type": "Tipo de Serviço",
    "review.highlight": "O que se Destacou",
    "review.your_name": "Seu Nome",
    "review.city": "Cidade",
    "review.optional": "opcional",
    "review.copy_draft": "Copiar Rascunho",
    "review.open_google": "Abrir Google Review",
    "review.copied": "Rascunho copiado!",
    "review.photos_title": "Compartilhe sua Transformação",
    "review.photos_subtitle": "Quer suas fotos da transformação? Peça para a Ane enviar — ela sempre captura os melhores momentos!",
    "review.whatsapp_desc": "Peça para a Ane enviar suas fotos de transformação pelo WhatsApp",
    "review.send_photos": "Pedir Minhas Fotos",
    "review.tag_instagram": "Marque-nos no Instagram",
    "review.tag_desc": "Recebeu suas fotos? Poste e marque",
    "review.open_instagram": "Abrir Instagram",
    "review.contact_title": "Dúvidas? Fale Diretamente",
    "review.contact_subtitle": "Ane está sempre disponível para retornos, retoques ou seu próximo agendamento.",
    "review.call_ane": "Ligar para Ane",

    // ========== ANE CAROLINE PAGE ==========
    "ane.hero.title": "Ane Caroline",
    "ane.hero.subtitle": "Hair Stylist",
    "ane.about.title": "Sobre",
    "ane.about.title_highlight": "mim",
    "ane.about.p1": "Minha história com os cabelos começou cedo.",
    "ane.about.p2": "Ainda criança, já cortava o cabelo das minhas irmãs, sem técnica, mas com muito cuidado.",
    "ane.about.p3": "Com o tempo, esse gesto se transformou em profissão.",
    "ane.about.p4": "Desde 2016 venho construindo minha trajetória na área, formando uma clientela fiel e aprimorando constantemente minha técnica.",
    "ane.about.p5": "Hoje, na ACS Beauty sigo fazendo o que sempre me guiou: cuidar de pessoas através do meu trabalho.",
    "ane.mission.title": "Minha",
    "ane.mission.title_highlight": "missão",
    "ane.mission.p1": "Minha missão é cuidar de cada pessoa que passa pela minha cadeira com atenção, sensibilidade e excelência.",
    "ane.mission.p2": "Acredito que o cabelo vai muito além da estética. Ele expressa identidade, autoestima e confiança.",
    "ane.mission.p3": "Por isso, meu compromisso é oferecer mais do que um serviço.",
    "ane.mission.p4": "Quero proporcionar uma experiência onde cada cliente se sinta valorizada, segura e ainda mais confiante com quem é.",
    "ane.services.title_1": "Como posso",
    "ane.services.title_2": "te ajudar",
    "ane.services.title_3": "na sua",
    "ane.services.title_4": "jornada:",
    "ane.services.view_all": "Ver todos os serviços →",
    "ane.cta.contact": "Entrar em contato",
    "ane.footer.rights": "Todos os direitos reservados",
    "ane.faq.q1": "Como funciona o agendamento?",
    "ane.faq.a1": "Você pode agendar diretamente pelo site ou pelo WhatsApp. Respondemos em até 2 horas.",
    "ane.faq.q2": "Qual o valor dos serviços?",
    "ane.faq.a2": "Os valores variam de acordo com o comprimento do cabelo e a técnica escolhida. Entre em contato para um orçamento personalizado.",
    "ane.faq.q3": "Preciso levar algo no dia?",
    "ane.faq.a3": "Não precisa levar nada! Apenas venha com o cabelo lavado e sem produtos. O restante fica por nossa conta.",
    "ane.wa.service_msg": "Olá Ane! Vi seu perfil e tenho interesse em {service}. Gostaria de saber mais e agendar!",
    "ane.wa.general_msg": "Oi Ane! Vi seu perfil e gostaria de agendar.",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "pt" || stored === "en") return stored;
      }
    } catch {
      // localStorage may not be available (e.g., private browsing)
    }
    return "pt"; // Default is PT (Portuguese)
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore localStorage errors
    }
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
