import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Check, Loader2, Clock, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimeSlot {
  start: string;
  end: string;
}

interface AvailabilityResponse {
  available_slots: TimeSlot[];
  timezone: string;
  business_hours?: {
    open: string;
    close: string;
  };
  error?: string;
}

interface HoldResponse {
  success: boolean;
  hold_id?: string;
  expires_at?: string;
  hold_duration_minutes?: number;
  error?: string;
  code?: string;
}

interface ConfirmResponse {
  success: boolean;
  booking_id?: string;
  google_event_id?: string;
  error?: string;
  code?: string;
}

export default function Book() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const offerId = searchParams.get("offer_id");
  const packageId = searchParams.get("package_id");
  const serviceId = searchParams.get("service_id");
  const { t, language } = useLanguage();

  // Booking flow state
  const [step, setStep] = useState<"date" | "time" | "form">("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  const bookingSchema = z.object({
    name: z.string().trim().min(2, t("booking.name_min_error")).max(100),
    phone: z.string().trim().min(8, t("booking.phone_error")).max(20),
    instagram: z.string().trim().max(50).optional(),
  });

  type BookingFormData = z.infer<typeof bookingSchema>;

  // Fetch offer details
  const { data: offer } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, services(*)")
        .eq("id", offerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });

  // Fetch package details
  const { data: pkg } = useQuery({
    queryKey: ["package", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("id", packageId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!packageId,
  });

  // Fetch service details
  const { data: service } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });

  // Determine service duration
  const serviceDuration = offer?.services?.duration_minutes || 
                          service?.duration_minutes || 
                          60; // Default 60 minutes

  // Fetch available slots for selected date
  const { data: availability, isLoading: isLoadingSlots, refetch: refetchSlots } = useQuery({
    queryKey: ["availability", selectedDate?.toISOString(), serviceDuration],
    queryFn: async (): Promise<AvailabilityResponse> => {
      const dateStr = format(selectedDate!, "yyyy-MM-dd");
      
      const response = await supabase.functions.invoke("calendar-availability", {
        body: {
          date: dateStr,
          service_duration_minutes: serviceDuration,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    enabled: !!selectedDate && step === "time",
    staleTime: 30000, // Cache for 30 seconds
  });

  // Create hold mutation
  const createHold = useMutation({
    mutationFn: async (slot: TimeSlot): Promise<HoldResponse> => {
      const response = await supabase.functions.invoke("calendar-hold", {
        body: {
          start_time: slot.start,
          end_time: slot.end,
          service_id: offer?.service_id || serviceId || null,
          package_id: packageId || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.hold_id) {
        setHoldId(data.hold_id);
        setHoldExpiresAt(new Date(data.expires_at!));
        setStep("form");
        toast.success(language === "pt" ? "Horário reservado por 5 minutos" : "Time slot reserved for 5 minutes");
      } else {
        toast.error(data.error || "Failed to reserve time slot");
        refetchSlots();
      }
    },
    onError: (error) => {
      console.error("Hold error:", error);
      toast.error(language === "pt" ? "Erro ao reservar horário" : "Failed to reserve time slot");
      refetchSlots();
    },
  });

  // Confirm booking mutation
  const confirmBooking = useMutation({
    mutationFn: async (formData: BookingFormData): Promise<ConfirmResponse> => {
      if (!holdId || !selectedSlot) {
        throw new Error("Missing booking information");
      }

      const response = await supabase.functions.invoke("calendar-confirm-booking", {
        body: {
          hold_id: holdId,
          client_name: formData.name,
          client_phone: formData.phone,
          client_instagram: formData.instagram || null,
          service_id: offer?.service_id || serviceId || null,
          package_id: packageId || null,
          offer_id: offerId || null,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.booking_id) {
        toast.success(t("booking.success_title"));
        navigate(`/confirm/${data.booking_id}`);
      } else {
        toast.error(data.error || "Failed to confirm booking");
        // Reset to time selection
        setStep("time");
        setHoldId(null);
        setSelectedSlot(null);
        refetchSlots();
      }
    },
    onError: (error) => {
      console.error("Confirm error:", error);
      toast.error(language === "pt" ? "Erro ao confirmar agendamento" : "Failed to confirm booking");
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  // Countdown timer for hold expiration
  useEffect(() => {
    if (!holdExpiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((holdExpiresAt.getTime() - now.getTime()) / 1000));
      setCountdown(remaining);

      if (remaining <= 0) {
        // Hold expired
        toast.error(language === "pt" ? "Tempo expirado. Por favor, selecione um novo horário." : "Time expired. Please select a new time.");
        setStep("time");
        setHoldId(null);
        setHoldExpiresAt(null);
        setSelectedSlot(null);
        refetchSlots();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt, language, refetchSlots]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setHoldId(null);
    if (date) {
      setStep("time");
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    createHold.mutate(slot);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const itemName = offer?.headline || offer?.name || pkg?.name || service?.name || "Consultation";

  // Generate available dates (next 30 days, excluding past dates)
  const today = new Date();
  const maxDate = addDays(today, 60);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          {/* Back button */}
          <button
            onClick={() => {
              if (step === "form") {
                setStep("time");
                setHoldId(null);
                setHoldExpiresAt(null);
              } else if (step === "time") {
                setStep("date");
                setSelectedDate(undefined);
              } else {
                navigate(-1);
              }
            }}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("global.back")}
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-light text-rose-gold text-sm font-medium mb-4">
                <Calendar className="w-4 h-4" />
                {t("booking.badge")}
              </div>
              <h1 className="font-serif text-3xl font-bold mb-2">{t("booking.title")}</h1>
              <p className="text-muted-foreground">
                {t("booking.for")}: <span className="font-medium text-foreground">{itemName}</span>
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {["date", "time", "form"].map((s, i) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    step === s
                      ? "w-8 bg-rose-gold"
                      : i < ["date", "time", "form"].indexOf(step)
                      ? "w-2 bg-rose-gold"
                      : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Date Selection */}
              {step === "date" && (
                <motion.div
                  key="date"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-card rounded-2xl p-6 shadow-soft"
                >
                  <h2 className="font-serif text-xl font-semibold mb-4 text-center">
                    {language === "pt" ? "Escolha a data" : "Choose a date"}
                  </h2>
                  <div className="flex justify-center">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => 
                        date < today || 
                        date > maxDate ||
                        date.getDay() === 0 || // Sunday
                        date.getDay() === 1    // Monday
                      }
                      locale={language === "pt" ? ptBR : undefined}
                      className="rounded-md border"
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    {language === "pt" 
                      ? "Atendemos de terça a sábado, 10h às 19h" 
                      : "We're open Tuesday to Saturday, 10am to 7pm"}
                  </p>
                </motion.div>
              )}

              {/* Step 2: Time Selection */}
              {step === "time" && (
                <motion.div
                  key="time"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-card rounded-2xl p-6 shadow-soft"
                >
                  <h2 className="font-serif text-xl font-semibold mb-2 text-center">
                    {language === "pt" ? "Escolha o horário" : "Choose a time"}
                  </h2>
                  <p className="text-center text-sm text-muted-foreground mb-6">
                    {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: language === "pt" ? ptBR : undefined })}
                  </p>

                  {isLoadingSlots ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-rose-gold mb-4" />
                      <p className="text-muted-foreground">
                        {language === "pt" ? "Carregando horários..." : "Loading available times..."}
                      </p>
                    </div>
                  ) : availability?.error ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                      <p className="text-destructive">{availability.error}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => refetchSlots()}
                      >
                        {language === "pt" ? "Tentar novamente" : "Try again"}
                      </Button>
                    </div>
                  ) : availability?.available_slots?.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {language === "pt" 
                          ? "Nenhum horário disponível neste dia" 
                          : "No available times on this day"}
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setStep("date")}
                      >
                        {language === "pt" ? "Escolher outra data" : "Choose another date"}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {availability?.available_slots?.map((slot) => {
                        const slotTime = parseISO(slot.start);
                        const isSelected = selectedSlot?.start === slot.start;
                        
                        return (
                          <Button
                            key={slot.start}
                            variant={isSelected ? "default" : "outline"}
                            className={`h-12 ${isSelected ? "bg-rose-gold hover:bg-rose-gold/90" : ""}`}
                            onClick={() => handleSlotSelect(slot)}
                            disabled={createHold.isPending}
                          >
                            {createHold.isPending && selectedSlot?.start === slot.start ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              format(slotTime, "HH:mm")
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Client Information */}
              {step === "form" && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-card rounded-2xl p-6 shadow-soft"
                >
                  {/* Hold countdown */}
                  {holdExpiresAt && countdown > 0 && (
                    <div className={`text-center mb-6 p-3 rounded-lg ${
                      countdown <= 60 ? "bg-destructive/10 text-destructive" : "bg-rose-light text-rose-gold"
                    }`}>
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {language === "pt" ? "Reservado por" : "Reserved for"} {formatCountdown(countdown)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Selected time summary */}
                  <div className="bg-muted rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === "pt" ? "Data e horário" : "Date and time"}
                        </p>
                        <p className="font-medium">
                          {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: language === "pt" ? ptBR : undefined })}
                          {" "}{language === "pt" ? "às" : "at"}{" "}
                          {selectedSlot && format(parseISO(selectedSlot.start), "HH:mm")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStep("time");
                          setHoldId(null);
                          setHoldExpiresAt(null);
                          setSelectedSlot(null);
                        }}
                      >
                        {language === "pt" ? "Alterar" : "Change"}
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit((data) => confirmBooking.mutate(data))} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("booking.full_name")} *</Label>
                      <Input
                        id="name"
                        placeholder={t("booking.full_name_placeholder")}
                        {...register("name")}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("booking.phone")} *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        {...register("phone")}
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">{t("booking.instagram")}</Label>
                      <Input
                        id="instagram"
                        placeholder="@yourusername"
                        {...register("instagram")}
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="hero"
                      size="xl"
                      className="w-full"
                      disabled={confirmBooking.isPending || countdown <= 0}
                    >
                      {confirmBooking.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {t("global.processing")}
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          {t("booking.confirm")}
                        </>
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
