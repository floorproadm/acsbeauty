import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP_NUMBER = "17329153430"; // (732) 915-3430
const DEFAULT_MESSAGE = "Olá! Gostaria de agendar um horário no ACS Beauty Studio.";

// Pages where the WhatsApp button should appear
const ALLOWED_PATHS = [
  "/contact",
  "/services",
  "/servicos/cabelo",
  "/servicos/sobrancelhas",
  "/servicos/unhas",
];

// Generate or retrieve session ID for anonymous tracking
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("wa_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("wa_session_id", sessionId);
  }
  return sessionId;
};

// Extract UTM params from URL
const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_campaign: params.get("utm_campaign"),
    utm_medium: params.get("utm_medium"),
  };
};

export const WhatsAppButton = () => {
  const location = useLocation();
  
  // Only show on allowed pages
  const shouldShow = ALLOWED_PATHS.includes(location.pathname);
  
  if (!shouldShow) return null;

  const handleClick = async () => {
    const utmParams = getUtmParams();
    
    // Track click in database
    try {
      await supabase.from("whatsapp_clicks").insert({
        page_path: window.location.pathname,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        utm_source: utmParams.utm_source,
        utm_campaign: utmParams.utm_campaign,
        utm_medium: utmParams.utm_medium,
        session_id: getSessionId(),
      });
      console.log("[WhatsApp] Click tracked successfully");
    } catch (error) {
      console.error("[WhatsApp] Tracking error:", error);
    }

    // Open WhatsApp
    const encodedMessage = encodeURIComponent(DEFAULT_MESSAGE);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.button
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20, 
        delay: 1 
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg hover:shadow-xl transition-colors duration-300"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="w-7 h-7" fill="currentColor" />
    </motion.button>
  );
};
