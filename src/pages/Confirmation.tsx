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
  ArrowLeft
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
  const { t } = useLanguage();
  
  // Get booking data from navigation state (passed from Book.tsx)
  // This eliminates the need to query the database with RLS restrictions
  const bookingData = location.state?.bookingData as BookingData | undefined;

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

  const serviceName = bookingData.services?.name || bookingData.packages?.name || "Appointment";
  const appointmentDate = new Date(bookingData.start_time);

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

            {/* Contact for add-ons */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-rose-gold" />
                <h3 className="font-semibold">{t("confirm.addon_title")}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {t("confirm.addon_note")}
              </p>
              <Link to="/services">
                <Button variant="outline" size="sm" className="w-full">
                  {t("confirm.view_services") || "View Our Services"}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
