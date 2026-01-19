import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { WhatsAppDrawer } from "./WhatsAppDrawer";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Only show on allowed pages
  const shouldShow = ALLOWED_PATHS.includes(location.pathname);
  
  if (!shouldShow) return null;

  const handleClick = () => {
    setDrawerOpen(true);
  };

  return (
    <>
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

      <WhatsAppDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        pagePath={location.pathname}
        utmParams={getUtmParams()}
        sessionId={getSessionId()}
      />
    </>
  );
};
