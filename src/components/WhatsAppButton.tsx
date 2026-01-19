import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP_NUMBER = "17329153430"; // (732) 915-3430
const DEFAULT_MESSAGE = "Olá! Gostaria de agendar um horário no ACS Beauty Studio.";

export const WhatsAppButton = () => {
  const handleClick = async () => {
    // Track click
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[WhatsApp] Button clicked", {
        timestamp: new Date().toISOString(),
        userId: session?.user?.id || "anonymous",
        page: window.location.pathname,
      });
    } catch (error) {
      console.error("[WhatsApp] Tracking error:", error);
    }

    // Open WhatsApp
    const encodedMessage = encodeURIComponent(DEFAULT_MESSAGE);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-pulse hover:animate-none"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="w-7 h-7" fill="currentColor" />
    </button>
  );
};
