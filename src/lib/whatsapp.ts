export const PUBLIC_BOOKING_ENABLED = false;
export const WHATSAPP_NUMBER = "17329153430";

export type WhatsAppContext = {
  source: "home" | "header" | "hub" | "category" | "service" | "sku" | "guided" | "legacy_booking";
  category?: string;
  serviceName?: string;
  serviceId?: string;
  skuName?: string;
  skuId?: string;
  intent?: "availability" | "price" | "guidance";
  language: "pt" | "en";
};

export const whatsappTranslations = {
  pt: {
    "wa.home.cta": "Agendar pelo WhatsApp",
    "wa.category.cta": "Consultar disponibilidade",
    "wa.service.cta": "Consultar este serviço",
    "wa.sku.cta": "Consultar esta opção",
    "wa.continue": "Continuar no WhatsApp",
    "wa.guided.cta": "Conversar no WhatsApp",
    "wa.general": "Olá! Conheci a ACS Beauty pelo site e gostaria de consultar a disponibilidade para um atendimento.",
    "wa.hub": "Olá! Acessei o hub da ACS Beauty e gostaria de consultar a disponibilidade para um atendimento.",
    "wa.category.cabelo": "Olá! Estava conhecendo os serviços de cabelo da ACS e gostaria de saber mais sobre as opções e disponibilidade.",
    "wa.category.sobrancelhas": "Olá! Tenho interesse nos serviços de sobrancelhas da ACS e gostaria de saber mais sobre as opções e disponibilidade.",
    "wa.category.unhas": "Olá! Tenho interesse nos serviços de unhas da ACS e gostaria de consultar a disponibilidade.",
    "wa.category.other": "Olá! Tenho interesse nos serviços de {category} da ACS e gostaria de consultar a disponibilidade.",
    "wa.service": "Olá! Vi o serviço de {serviceName} no site da ACS e gostaria de saber mais sobre as opções e disponibilidade.",
    "wa.sku": "Olá! Tenho interesse em {serviceName}, na opção {skuName}. Gostaria de consultar a disponibilidade.",
    "wa.sku.only": "Olá! Tenho interesse na opção {skuName} da ACS Beauty. Gostaria de consultar a disponibilidade.",
    "wa.guided": "Olá! Usei o guia da ACS Beauty e tenho interesse em {interest}. {intent}",
    "wa.guided.uncertain": "Olá! Usei o guia da ACS Beauty e ainda não tenho certeza de qual serviço escolher{category}. Gostaria de orientação personalizada.",
    "wa.guided.category": " na categoria {category}",
    "wa.intent.availability": "Gostaria de consultar a disponibilidade.",
    "wa.intent.price": "Gostaria de saber mais sobre os valores.",
    "wa.intent.guidance": "Gostaria de orientação personalizada.",
    "wa.transition.title": "Vamos continuar pelo WhatsApp?",
    "wa.transition.description": "Para oferecer um atendimento mais personalizado, nossa equipe está realizando os agendamentos diretamente pelo WhatsApp.",
    "wa.guide.open": "Não sabe qual serviço escolher?",
    "wa.guide.q1": "O que você procura hoje?",
    "wa.guide.q2": "Qual opção mais combina com você?",
    "wa.guide.q3": "O que gostaria de saber primeiro?",
    "wa.guide.uncertain": "Ainda não tenho certeza",
    "wa.guide.availability": "Disponibilidade",
    "wa.guide.price": "Valores",
    "wa.guide.guidance": "Orientação personalizada",
    "wa.guide.result": "Sua conversa começa aqui.",
    "wa.guide.description": "Preparamos uma mensagem para nossa equipe entender o que você procura.",
    "wa.guide.progress": "Etapa {step} de 3",
    "wa.guide.close": "Fechar",
    "wa.guide.error": "Não foi possível carregar os serviços.",
    "wa.guide.retry": "Tentar novamente",
  },
  en: {
    "wa.home.cta": "Book via WhatsApp",
    "wa.category.cta": "Check Availability",
    "wa.service.cta": "Inquire About This Service",
    "wa.sku.cta": "Inquire About This Option",
    "wa.continue": "Continue on WhatsApp",
    "wa.guided.cta": "Continue on WhatsApp",
    "wa.general": "Hi! I found ACS Beauty through your website and would like to check appointment availability.",
    "wa.hub": "Hi! I visited the ACS Beauty hub and would like to check appointment availability.",
    "wa.category.cabelo": "Hi! I was exploring your hair services and would love to know more about the options and availability.",
    "wa.category.sobrancelhas": "Hi! I'm interested in your brow services and would love to learn about the options and availability.",
    "wa.category.unhas": "Hi! I'm interested in your nail services and would love to check availability.",
    "wa.category.other": "Hi! I'm interested in your {category} services and would love to check availability.",
    "wa.service": "Hi! I saw your {serviceName} service on the ACS website and would love to know more about the options and availability.",
    "wa.sku": "Hi! I'm interested in {serviceName}, specifically {skuName}. Could you tell me about availability?",
    "wa.sku.only": "Hi! I'm interested in the {skuName} option at ACS Beauty. Could you tell me about availability?",
    "wa.guided": "Hi! I used the ACS Beauty service guide and I'm interested in {interest}. {intent}",
    "wa.guided.uncertain": "Hi! I used the ACS Beauty service guide and I'm not sure which service to choose{category}. I'd like personalized guidance.",
    "wa.guided.category": " in the {category} category",
    "wa.intent.availability": "I'd like to check availability.",
    "wa.intent.price": "I'd like to know more about pricing.",
    "wa.intent.guidance": "I'd like personalized guidance.",
    "wa.transition.title": "Let's continue on WhatsApp",
    "wa.transition.description": "Our team is currently handling appointments directly to provide a more personalized experience.",
    "wa.guide.open": "Need Help Choosing?",
    "wa.guide.q1": "What are you looking for today?",
    "wa.guide.q2": "Which service interests you?",
    "wa.guide.q3": "What would you like to know first?",
    "wa.guide.uncertain": "I'm not sure yet",
    "wa.guide.availability": "Availability",
    "wa.guide.price": "Pricing",
    "wa.guide.guidance": "Personalized Guidance",
    "wa.guide.result": "Let's make it personal.",
    "wa.guide.description": "We've prepared a message so our team knows what you're looking for.",
    "wa.guide.progress": "Step {step} of 3",
    "wa.guide.close": "Close",
    "wa.guide.error": "Unable to load services.",
    "wa.guide.retry": "Try again",
  },
};

export function buildWhatsAppMessage(context: WhatsAppContext): string {
  const dictionary: Record<string, string> = whatsappTranslations[context.language];
  const text = (key: string, vars: Record<string, string> = {}) =>
    dictionary[key].replace(/\{(\w+)\}/g, (_, name: string) => vars[name] || "");
  const categoryLabel = context.category && ["cabelo", "sobrancelhas", "unhas"].includes(context.category)
    ? ({ pt: { cabelo: "Cabelo", sobrancelhas: "Sobrancelhas", unhas: "Unhas" }, en: { cabelo: "Hair", sobrancelhas: "Brows", unhas: "Nails" } }[context.language] as Record<string, string>)[context.category]
    : context.category;
  if (context.source === "guided") {
    if (!context.serviceName && !context.skuName) {
      return text("wa.guided.uncertain", { category: categoryLabel ? text("wa.guided.category", { category: categoryLabel }) : "" });
    }
    return text("wa.guided", {
      interest: [context.serviceName, context.skuName].filter(Boolean).join(" — "),
      intent: text(`wa.intent.${context.intent || "guidance"}`),
    });
  }
  if (context.skuName) return text(context.serviceName ? "wa.sku" : "wa.sku.only", { serviceName: context.serviceName || "", skuName: context.skuName });
  if (context.serviceName) return text("wa.service", { serviceName: context.serviceName });
  if (context.category) return text(dictionary[`wa.category.${context.category}`] ? `wa.category.${context.category}` : "wa.category.other", { category: categoryLabel || "" });
  return text(context.source === "hub" ? "wa.hub" : "wa.general");
}

export function buildWhatsAppUrl(context: WhatsAppContext): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(context))}`;
}

export function isProtectedConversionPath(pathname: string): boolean {
  return ["/contact", "/ane-caroline"].includes(pathname.toLowerCase().replace(/\/$/, ""));
}