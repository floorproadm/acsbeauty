import { useParams, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Check, 
  Calendar, 
  MapPin, 
  Clock, 
  Navigation, 
  CalendarPlus,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  MessageCircle
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

// Booking data interface matching edge function response
interface BookingData {
  id: string;
  client_name: string;
  start_time: string;
  end_time: string;
  timezone: string;
  status: string;
  services?: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
    promo_price?: number;
  } | null;
  packages?: {
    id: string;
    name: string;
    total_price: number;
    sessions_qty: number;
  } | null;
}

// Studio location - official address
const STUDIO_ADDRESS = "375 Chestnut St, 3rd Floor, Suite 3B, Newark, NJ";

export default function Confirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const { t, language } = useLanguage();
  
  // Get booking data from navigation state (passed from Book.tsx)
  const bookingData = location.state?.bookingData as BookingData | undefined;
  const isWhatsApp =
    location.state?.isWhatsApp === true || bookingData?.status === "whatsapp_pending";
  const whatsappUrl = location.state?.whatsappUrl as string | undefined;
  const stateServiceName = location.state?.serviceName as string | undefined;
  const stateStaffName = location.state?.staffName as string | undefined;
  const isPending =
    !isWhatsApp && (location.state?.isPending === true || bookingData?.status === "requested");

  const generateGoogleCalendarUrl = () => {
    if (!bookingData) return "#";
    
    const startDate = new Date(bookingData.start_time);
    const endDate = new Date(bookingData.end_time);
    
    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };
    
    const serviceName = bookingData.services?.name || bookingData.packages?.name || "Beauty Appointment";
    
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `ACS Beauty - ${serviceName}`,
      dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
      details: t("confirm.calendar_details"),
      location: STUDIO_ADDRESS,
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const getDirectionsUrl = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(STUDIO_ADDRESS)}`;
  };

  // If no booking data available (e.g., direct URL access without state)
  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-md text-center">
            <div className="w-16 h-16 bg-rose-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-rose-gold" />
            </div>
            <h1 className="font-serif text-2xl font-bold mb-4">{t("confirm.title")}</h1>
            <p className="text-muted-foreground mb-6">
              {t("confirm.check_email") || "Your booking has been confirmed. Please check your email for details."}
            </p>
            <Link to="/">
              <Button variant="hero">{t("booking.return_home")}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const serviceName =
    stateServiceName ||
    bookingData.services?.name ||
    bookingData.packages?.name ||
    (language === "pt" ? "Atendimento" : "Appointment");
  const appointmentDate = new Date(bookingData.start_time);
  const shortCode = bookingData.id.slice(0, 8).toUpperCase();

  // ============= WHATSAPP "JÁ CONFIRMEI" SCREEN =============
  if (isWhatsApp) {
    const wa = {
      title: language === "pt" ? "Mensagem enviada pelo WhatsApp 💛" : "Message sent on WhatsApp 💛",
      subtitle:
        language === "pt"
          ? "Recebemos sua intenção de reserva. Nossa equipe vai confirmar seu horário pelo WhatsApp em alguns minutos."
          : "We received your booking request. Our team will confirm your time on WhatsApp shortly.",
      codeLabel: language === "pt" ? "Código da reserva" : "Booking code",
      timeline: language === "pt" ? "O que acontece agora" : "What happens next",
      step1: language === "pt"
        ? "Sua mensagem foi aberta no WhatsApp — verifique se você apertou enviar."
        : "Your message opened on WhatsApp — make sure you tapped send.",
      step2: language === "pt"
        ? "Nossa equipe confirma o horário pelo WhatsApp (em horário comercial)."
        : "Our team confirms your time on WhatsApp (during business hours).",
      step3: language === "pt"
        ? "Você recebe a confirmação final com todos os detalhes."
        : "You receive the final confirmation with all details.",
      reopen: language === "pt" ? "Reabrir conversa no WhatsApp" : "Reopen WhatsApp chat",
      didntSend:
        language === "pt"
          ? "Não enviou a mensagem ou fechou sem querer? Toca aqui pra reabrir 👇"
          : "Didn't send the message or closed by mistake? Tap to reopen 👇",
      copyCode: language === "pt" ? "Copiar código" : "Copy code",
      copied: language === "pt" ? "Código copiado!" : "Code copied!",
      doubt: language === "pt" ? "Precisa de algo? Fale com a gente:" : "Need anything? Talk to us:",
      callUs: language === "pt" ? "Ligar (732) 915-3430" : "Call (732) 915-3430",
      home: language === "pt" ? "Voltar para o início" : "Back to home",
      slot: language === "pt" ? "Horário reservado" : "Time slot reserved",
      reservedNote:
        language === "pt"
          ? "Esse horário fica segurado pra você por 5 minutos enquanto confirmamos."
          : "We're holding this time slot for you for 5 minutes while we confirm.",
    };

    const fallbackWaUrl =
      whatsappUrl ||
      `https://wa.me/17329153430?text=${encodeURIComponent(
        language === "pt"
          ? `Olá! Acabei de reservar um horário pelo site.\n\n• Serviço: ${serviceName}\n• Data: ${format(appointmentDate, "dd/MM/yyyy")}\n• Horário: ${format(appointmentDate, "HH:mm")}\n\nCódigo: *${shortCode}*\n\nPor favor confirma meu agendamento. Obrigada!`
          : `Hi! I just reserved a time on the website.\n\n• Service: ${serviceName}\n• Date: ${format(appointmentDate, "MM/dd/yyyy")}\n• Time: ${format(appointmentDate, "HH:mm")}\n\nCode: *${shortCode}*\n\nPlease confirm my booking. Thanks!`
      )}`;

    const handleCopyCode = async () => {
      try {
        await navigator.clipboard.writeText(shortCode);
        // Use built-in toast pattern (sonner is global)
        const { toast } = await import("sonner");
        toast.success(wa.copied);
      } catch { /* noop */ }
    };

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-lg">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4" />
              {t("global.back")}
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-6 sm:p-8 shadow-soft"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#25D366]/15"
                >
                  <MessageCircle className="w-8 h-8 text-[#128C4B]" fill="currentColor" />
                </motion.div>
                <h1 className="font-serif text-[26px] sm:text-3xl leading-snug font-semibold mb-2">
                  {wa.title}
                </h1>
                <p className="text-muted-foreground text-[15px]">{wa.subtitle}</p>
              </div>

              {/* Booking code card */}
              <div className="bg-muted/40 border border-dashed border-bronze-300/50 rounded-2xl p-4 mb-5 text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  {wa.codeLabel}
                </p>
                <div className="font-mono font-bold text-2xl text-foreground tracking-widest mb-2">
                  {shortCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-xs text-bronze-600 hover:text-bronze-700 underline-offset-4 hover:underline"
                >
                  {wa.copyCode}
                </button>
              </div>

              {/* Slot summary */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
                  <Sparkles className="w-5 h-5 text-rose-gold mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-[15px] truncate">{serviceName}</p>
                    {stateStaffName && (
                      <p className="text-sm text-muted-foreground">
                        {language === "pt" ? "Com" : "With"} {stateStaffName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
                  <Calendar className="w-5 h-5 text-rose-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-[15px] capitalize">
                      {format(appointmentDate, language === "pt" ? "EEEE, dd/MM/yyyy" : "EEEE, MMM dd, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(appointmentDate, "HH:mm")} · {wa.slot}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground mb-5 italic">
                {wa.reservedNote}
              </p>

              {/* Reopen WhatsApp CTA */}
              <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-4 mb-6">
                <p className="text-sm text-center text-foreground/80 mb-3">{wa.didntSend}</p>
                <a href={fallbackWaUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full h-12 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold">
                    <MessageCircle className="w-5 h-5" fill="currentColor" />
                    {wa.reopen}
                  </Button>
                </a>
              </div>

              {/* Timeline */}
              <div className="border-t border-border pt-6 mb-6">
                <h3 className="font-semibold mb-4 text-[15px]">{wa.timeline}</h3>
                <ol className="space-y-3 text-sm">
                  {[wa.step1, wa.step2, wa.step3].map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-bronze-100 text-bronze-700 font-semibold text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Footer actions */}
              <div className="border-t border-border pt-5 space-y-2">
                <p className="text-sm text-muted-foreground text-center mb-3">{wa.doubt}</p>
                <div className="grid grid-cols-2 gap-2">
                  <a href="tel:+17329153430">
                    <Button variant="outline" className="w-full text-sm">
                      📞 {wa.callUs}
                    </Button>
                  </a>
                  <Link to="/">
                    <Button variant="outline" className="w-full text-sm">
                      {wa.home}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  // ============= /WHATSAPP SCREEN =============

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t("global.back")}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-8 shadow-soft"
          >
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isPending ? "bg-yellow-100" : "bg-rose-light"}`}>
                {isPending ? <Clock className="w-8 h-8 text-yellow-600" /> : <Check className="w-8 h-8 text-rose-gold" />}
              </div>
              <h1 className="font-serif text-3xl font-bold mb-2">
                {isPending ? "Solicitação Enviada!" : t("confirm.title")}
              </h1>
              <p className="text-muted-foreground">
                {isPending
                  ? "Seu agendamento está aguardando confirmação. Você receberá uma notificação assim que for aprovado."
                  : t("confirm.subtitle")}
              </p>
            </div>

            {/* Booking Details */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                <Sparkles className="w-5 h-5 text-rose-gold mt-0.5" />
                <div>
                  <p className="font-medium">{serviceName}</p>
                  <p className="text-sm text-muted-foreground">{t("confirm.service_label")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                <Calendar className="w-5 h-5 text-rose-gold mt-0.5" />
                <div>
                  <p className="font-medium">{format(appointmentDate, "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-sm text-muted-foreground">{t("confirm.date_label")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                <Clock className="w-5 h-5 text-rose-gold mt-0.5" />
                <div>
                  <p className="font-medium">{format(appointmentDate, "h:mm a")}</p>
                  <p className="text-sm text-muted-foreground">{t("confirm.time_label")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                <MapPin className="w-5 h-5 text-rose-gold mt-0.5" />
                <div>
                  <p className="font-medium">ACS Beauty Studio</p>
                  <p className="text-sm text-muted-foreground">{STUDIO_ADDRESS}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <a href={generateGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full gap-2">
                  <CalendarPlus className="w-4 h-4" />
                  {t("confirm.add_calendar")}
                </Button>
              </a>
              <a href={getDirectionsUrl()} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full gap-2">
                  <Navigation className="w-4 h-4" />
                  {t("confirm.directions")}
                </Button>
              </a>
            </div>

            {/* Reschedule Link */}
            <div className="text-center mb-8">
              <button 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  // Future: implement reschedule flow
                  alert(t("confirm.reschedule_coming_soon"));
                }}
              >
                <RefreshCw className="w-4 h-4" />
                {t("confirm.reschedule")}
              </button>
            </div>

            {/* Prep - arrive early */}
            <div className="border-t border-border pt-6 mb-8">
              <h3 className="font-semibold mb-3">{t("confirm.prep_title")}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-rose-gold">•</span>
                  {t("confirm.prep_1")}
                </li>
              </ul>
            </div>

            {/* WhatsApp support */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <h3 className="font-semibold">Alguma dúvida?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Fale diretamente conosco pelo WhatsApp.
              </p>
              <a
                href={(() => {
                  const msg = `Olá! Tenho uma dúvida sobre meu agendamento:\n\n• Serviço: ${serviceName}\n• Data: ${format(appointmentDate, "dd/MM/yyyy")}\n• Horário: ${format(appointmentDate, "HH:mm")}\n• Nome: ${bookingData.client_name}\n\nPoderia me ajudar?`;
                  return `https://wa.me/17329153430?text=${encodeURIComponent(msg)}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white">
                  <MessageCircle className="w-4 h-4" />
                  Falar no WhatsApp
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
