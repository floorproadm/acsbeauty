import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  ArrowLeft
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

// Studio location - update with actual address
const STUDIO_ADDRESS = "123 Beauty Lane, Suite 100, Miami, FL 33101";
const STUDIO_COORDS = "25.7617,-80.1918"; // Miami coords as placeholder

export default function Confirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { t } = useLanguage();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking-confirmation", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(*), packages(*)")
        .eq("id", bookingId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  // Fetch one upsell suggestion (a different active service)
  const { data: upsellService } = useQuery({
    queryKey: ["upsell-suggestion", booking?.service_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .neq("id", booking?.service_id || "")
        .limit(1)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!booking,
  });

  const generateGoogleCalendarUrl = () => {
    if (!booking) return "#";
    
    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);
    
    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };
    
    const serviceName = booking.services?.name || booking.packages?.name || "Beauty Appointment";
    
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">{t("global.processing")}</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-md text-center">
            <h1 className="font-serif text-2xl font-bold mb-4">{t("confirm.not_found")}</h1>
            <p className="text-muted-foreground mb-6">{t("confirm.not_found_desc")}</p>
            <Link to="/">
              <Button variant="hero">{t("booking.return_home")}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const serviceName = booking.services?.name || booking.packages?.name || "Appointment";
  const appointmentDate = new Date(booking.start_time);

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
              <div className="w-16 h-16 bg-rose-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-rose-gold" />
              </div>
              <h1 className="font-serif text-3xl font-bold mb-2">{t("confirm.title")}</h1>
              <p className="text-muted-foreground">{t("confirm.subtitle")}</p>
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

            {/* Prep Instructions */}
            <div className="border-t border-border pt-6 mb-8">
              <h3 className="font-semibold mb-3">{t("confirm.prep_title")}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-rose-gold">•</span>
                  {t("confirm.prep_1")}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-gold">•</span>
                  {t("confirm.prep_2")}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-gold">•</span>
                  {t("confirm.prep_3")}
                </li>
              </ul>
            </div>

            {/* Upsell Suggestion */}
            {upsellService && (
              <div className="border-t border-border pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-rose-gold" />
                  <h3 className="font-semibold">{t("confirm.addon_title")}</h3>
                </div>
                <div className="p-4 bg-rose-light/30 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{upsellService.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {upsellService.duration_minutes} {t("global.minutes")}
                      </p>
                    </div>
                    <p className="font-semibold text-rose-gold">
                      ${upsellService.promo_price || upsellService.price}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t("confirm.addon_note")}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      // Future: send request to add service
                      alert(t("confirm.addon_requested"));
                    }}
                  >
                    {t("confirm.addon_request")}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
