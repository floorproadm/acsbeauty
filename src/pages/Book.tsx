import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Check, Loader2, Clock, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays, parseISO } from "date-fns";
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
  booking?: {
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
  };
  google_event_id?: string;
  error?: string;
  code?: string;
}

const DEFAULT_CONSULTATION_DURATION = 30;

const isUUID = (param: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);

export default function Book() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const offerId = searchParams.get("offer_id");
  const packageId = searchParams.get("package_id");
  const serviceParamRaw = searchParams.get("service_id") || searchParams.get("service");
  const servicesParam = searchParams.get("services");
  const preselectedServiceFromList = servicesParam
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean)[0] ?? null;
  const serviceParam = serviceParamRaw || preselectedServiceFromList;
  const skuParam = searchParams.get("sku");
  const flowMode = searchParams.get("flow");
  const isPortalSource = searchParams.get("source") === "portal";
  const { t, language } = useLanguage();

  // Resolve service param (UUID vs slug)
  const serviceParamIsUUID = serviceParam ? isUUID(serviceParam) : false;

  // Determine if we're in direct calendar flow
  const isCalendarFlow = flowMode === "calendar" && !offerId && !packageId && !serviceParam;

  // Booking flow state
  const [step, setStep] = useState<"service" | "sku" | "date" | "time" | "form">(
    isCalendarFlow ? "date" : serviceParam ? "sku" : "service"
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Selected service/variation/SKU
  const [pickedServiceId, setPickedServiceId] = useState<string | null>(null);
  const [pickedVariationId, setPickedVariationId] = useState<string | null>(null);
  const [pickedSkuId, setPickedSkuId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [slugResolved, setSlugResolved] = useState(false);

  const bookingSchema = z.object({
    name: z.string().trim().min(2, t("booking.name_min_error")).max(100),
    phone: z.string().trim().min(8, t("booking.phone_error")).max(20),
    instagram: z.string().trim().max(50).optional(),
  });

  type BookingFormData = z.infer<typeof bookingSchema>;

  // Resolve service by slug (when param is not UUID)
  const { data: resolvedServiceBySlug } = useQuery({
    queryKey: ["resolve-service-slug", serviceParam],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("slug", serviceParam!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!serviceParam && !serviceParamIsUUID,
  });

  // Resolve SKU by slug
  const { data: resolvedSkuBySlug } = useQuery({
    queryKey: ["resolve-sku-slug", skuParam, pickedServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_skus")
        .select("*")
        .eq("slug", skuParam!)
        .eq("service_id", pickedServiceId!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!skuParam && !!pickedServiceId && !isUUID(skuParam),
  });

  // Effect: resolve slug params and pre-select
  useEffect(() => {
    if (slugResolved) return;

    if (serviceParam && serviceParamIsUUID) {
      setPickedServiceId(serviceParam);
      setSlugResolved(true);
    } else if (resolvedServiceBySlug) {
      setPickedServiceId(resolvedServiceBySlug.id);
      setSlugResolved(true);
    }
  }, [serviceParam, serviceParamIsUUID, resolvedServiceBySlug, slugResolved]);

  // Effect: resolve SKU slug after service is resolved
  useEffect(() => {
    if (!pickedServiceId || !skuParam || pickedSkuId) return;

    if (isUUID(skuParam)) {
      setPickedSkuId(skuParam);
      setStep("date");
    } else if (resolvedSkuBySlug) {
      setPickedSkuId(resolvedSkuBySlug.id);
      setStep("date");
    }
  }, [pickedServiceId, skuParam, resolvedSkuBySlug, pickedSkuId]);

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
  const activeServiceId = pickedServiceId || (serviceParam && serviceParamIsUUID ? serviceParam : null);

  const { data: service } = useQuery({
    queryKey: ["service", activeServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", activeServiceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeServiceId,
  });

  // Fetch all active services for service selection step
  const { data: allServices, isLoading: isLoadingServices } = useQuery({
    queryKey: ["active-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: step === "service",
  });

  // Fetch variations for picked service
  const { data: serviceVariations } = useQuery({
    queryKey: ["book-variations", activeServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_variations")
        .select("*")
        .eq("service_id", activeServiceId!)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeServiceId && step === "sku",
  });

  // Fetch SKUs for picked service (filtered by variation if selected)
  const { data: serviceSkus } = useQuery({
    queryKey: ["book-skus", activeServiceId, pickedVariationId],
    queryFn: async () => {
      let query = supabase
        .from("service_skus")
        .select("*")
        .eq("service_id", activeServiceId!)
        .eq("is_active", true)
        .order("sort_order");

      if (pickedVariationId) {
        query = query.eq("variation_id", pickedVariationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeServiceId && step === "sku",
  });

  // Get selected SKU object
  const { data: selectedSkuData } = useQuery({
    queryKey: ["selected-sku", pickedSkuId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_skus")
        .select("*")
        .eq("id", pickedSkuId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!pickedSkuId,
  });

  // Auto-skip logic for SKU step
  useEffect(() => {
    if (step !== "sku" || !activeServiceId) return;
    if (!serviceVariations || !serviceSkus) return;

    // If no variations, and only 1 SKU → auto-select
    if (serviceVariations.length === 0 && serviceSkus.length === 1) {
      setPickedSkuId(serviceSkus[0].id);
      setStep("date");
      return;
    }

    // If no variations and no SKUs → go to date (legacy mode)
    if (serviceVariations.length === 0 && serviceSkus.length === 0) {
      setStep("date");
      return;
    }

    // If 1 variation → auto-select it
    if (serviceVariations.length === 1 && !pickedVariationId) {
      setPickedVariationId(serviceVariations[0].id);
    }
  }, [step, activeServiceId, serviceVariations, serviceSkus, pickedVariationId]);

  // When variation is auto-selected and SKUs load, auto-select if only 1
  useEffect(() => {
    if (step !== "sku" || !pickedVariationId || !serviceSkus) return;

    const filteredSkus = serviceSkus.filter(s => s.variation_id === pickedVariationId);
    if (filteredSkus.length === 1) {
      setPickedSkuId(filteredSkus[0].id);
      setStep("date");
    }
  }, [step, pickedVariationId, serviceSkus]);

  // Service duration: use SKU duration > service duration > default
  const serviceDuration = selectedSkuData?.duration_minutes ||
    offer?.services?.duration_minutes ||
    service?.duration_minutes ||
    DEFAULT_CONSULTATION_DURATION;

  // Fetch available slots for selected date
  const { data: availability, isLoading: isLoadingSlots, refetch: refetchSlots } = useQuery({
    queryKey: ["availability", selectedDate?.toISOString(), serviceDuration],
    queryFn: async (): Promise<AvailabilityResponse> => {
      const dateStr = format(selectedDate!, "yyyy-MM-dd");
      const response = await supabase.functions.invoke("calendar-availability", {
        body: { date: dateStr, service_duration_minutes: serviceDuration },
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    enabled: !!selectedDate && step === "time",
    staleTime: 30000,
  });

  // Create hold mutation
  const createHold = useMutation({
    mutationFn: async (slot: TimeSlot): Promise<HoldResponse> => {
      const finalServiceId = offer?.service_id || activeServiceId || null;
      const response = await supabase.functions.invoke("calendar-hold", {
        body: {
          start_time: slot.start,
          end_time: slot.end,
          service_id: finalServiceId,
          package_id: packageId || null,
        },
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.hold_id) {
        setHoldId(data.hold_id);
        setHoldExpiresAt(new Date(data.expires_at!));
        setStep("form");
        toast.success(language === "pt" ? "Horário reservado por 5 minutos" : "Time slot reserved for 5 minutes");
      } else if (data.code === 'RATE_LIMITED') {
        toast.error(language === "pt"
          ? "Muitas tentativas. Aguarde um momento ou fale conosco pelo WhatsApp."
          : "Too many attempts. Please wait or contact us via WhatsApp.",
          { duration: 8000, action: { label: "WhatsApp", onClick: () => window.open("https://wa.me/19739004498", "_blank") } }
        );
      } else {
        toast.error(data.error || "Failed to reserve time slot");
        refetchSlots();
      }
    },
    onError: (error) => {
      console.error("Hold error:", error);
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("429") || msg.toLowerCase().includes("too many")) {
        toast.error(language === "pt"
          ? "Muitas tentativas. Aguarde um momento ou fale conosco pelo WhatsApp."
          : "Too many attempts. Please wait or contact us via WhatsApp.",
          { duration: 8000, action: { label: "WhatsApp", onClick: () => window.open("https://wa.me/19739004498", "_blank") } }
        );
      } else {
        toast.error(language === "pt" ? "Erro ao reservar horário" : "Failed to reserve time slot");
      }
      refetchSlots();
    },
  });

  // Confirm booking mutation
  const confirmBooking = useMutation({
    mutationFn: async (formData: BookingFormData): Promise<ConfirmResponse> => {
      if (!holdId || !selectedSlot) throw new Error("Missing booking information");

      const finalServiceId = offer?.service_id || activeServiceId || null;

      const requestBody = {
        hold_id: holdId,
        client_name: formData.name,
        client_phone: formData.phone,
        client_instagram: formData.instagram || null,
        service_id: finalServiceId,
        package_id: packageId || null,
        offer_id: offerId || null,
        sku_id: pickedSkuId || null,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
      };

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/calendar-confirm-booking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 429 || errorData.code === 'RATE_LIMITED') throw new Error('RATE_LIMITED');
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(language === "pt" ? "Tempo limite excedido. Tente novamente." : "Request timeout. Please try again.");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success && data.booking) {
        toast.success(t("booking.success_title"));
        navigate(`/confirm/${data.booking.id}`, { state: { bookingData: data.booking } });
      } else {
        toast.error(data.error || "Failed to confirm booking");
        setStep("time");
        setHoldId(null);
        setSelectedSlot(null);
        refetchSlots();
      }
    },
    onError: (error) => {
      console.error("Confirm error:", error);
      const msg = error instanceof Error ? error.message : "";
      if (msg === 'RATE_LIMITED' || msg.includes("429")) {
        toast.error(language === "pt"
          ? "Muitas tentativas. Aguarde um momento ou fale conosco pelo WhatsApp."
          : "Too many attempts. Please wait or contact us via WhatsApp.",
          { duration: 8000, action: { label: "WhatsApp", onClick: () => window.open("https://wa.me/19739004498", "_blank") } }
        );
      } else {
        toast.error(msg || (language === "pt" ? "Erro ao confirmar agendamento" : "Failed to confirm booking"));
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Portal confirm mutation — inserts booking as "requested" (pending) without Google Calendar
  const portalConfirmBooking = useMutation({
    mutationFn: async (formData: BookingFormData) => {
      if (!holdId || !selectedSlot) throw new Error("Missing booking information");

      const finalServiceId = offer?.service_id || activeServiceId || null;

      // Upsert client by phone
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("phone", formData.phone)
        .maybeSingle();

      let clientId: string;
      if (existingClient) {
        clientId = existingClient.id;
        await supabase.from("clients").update({
          name: formData.name,
          instagram: formData.instagram || null,
        }).eq("id", clientId);
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            name: formData.name,
            phone: formData.phone,
            instagram: formData.instagram || null,
          })
          .select()
          .single();
        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // Fetch SKU price (price lock)
      let totalPrice: number | null = null;
      if (pickedSkuId) {
        const { data: skuData } = await supabase
          .from("service_skus")
          .select("price, promo_price")
          .eq("id", pickedSkuId)
          .single();
        if (skuData) {
          totalPrice = (skuData.promo_price != null && Number(skuData.promo_price) < Number(skuData.price))
            ? Number(skuData.promo_price)
            : Number(skuData.price);
        }
      }

      // Insert booking as "requested" (pending approval)
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          client_id: clientId,
          client_name: formData.name,
          client_phone: formData.phone,
          client_email: `${formData.phone.replace(/\D/g, "")}@placeholder.com`,
          service_id: finalServiceId,
          package_id: packageId || null,
          sku_id: pickedSkuId || null,
          total_price: totalPrice,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
          timezone: "America/New_York",
          status: "requested",
          notes: null,
        })
        .select("*, services(id, name, duration_minutes, price, promo_price), packages(id, name, total_price, sessions_qty)")
        .single();

      if (bookingError) throw bookingError;

      // Delete hold
      await supabase.from("booking_holds").delete().eq("id", holdId);

      return booking;
    },
    onSuccess: (booking) => {
      toast.success(language === "pt" ? "Solicitação enviada!" : "Request submitted!");
      navigate(`/confirm/${booking.id}`, {
        state: {
          bookingData: {
            id: booking.id,
            client_name: booking.client_name,
            start_time: booking.start_time,
            end_time: booking.end_time,
            timezone: booking.timezone,
            status: "requested",
            services: booking.services,
            packages: booking.packages,
          },
          isPending: true,
        },
      });
    },
    onError: (error) => {
      console.error("Portal confirm error:", error);
      toast.error(language === "pt" ? "Erro ao enviar solicitação" : "Failed to submit request");
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

  // Handle service selection — go to SKU step to check for variations/SKUs
  const handleServiceSelect = (serviceId: string | null) => {
    setPickedServiceId(serviceId);
    setPickedVariationId(null);
    setPickedSkuId(null);

    if (!serviceId) {
      // Consultation — no SKU needed
      setStep("date");
    } else {
      // Go to SKU step (auto-skip will handle if no SKUs exist)
      setStep("sku");
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setHoldId(null);
    if (date) setStep("time");
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

  // Display name
  const skuName = selectedSkuData?.name;
  const itemName = offer?.headline || offer?.name || pkg?.name || skuName || service?.name ||
    ((isCalendarFlow || step === "service") ? (language === "pt" ? "Consulta" : "Consultation") : "Consultation");

  const today = new Date();
  const maxDate = addDays(today, 60);

  // Step list for indicator
  const allSteps = (() => {
    const base: string[] = [];
    if (!serviceParam && !offerId && !packageId && !isPortalSource) base.push("service");
    if (activeServiceId && !isPortalSource) base.push("sku");
    base.push("date", "time", "form");
    return base;
  })();

  // Handle back navigation
  const handleBack = () => {
    if (step === "form") {
      setStep("time");
      setHoldId(null);
      setHoldExpiresAt(null);
    } else if (step === "time") {
      setStep("date");
      setSelectedDate(undefined);
    } else if (step === "date") {
      if (isPortalSource) {
        navigate(-1);
      } else if (pickedSkuId || activeServiceId) {
        setStep("sku");
      } else if (isCalendarFlow) {
        setStep("service");
      } else {
        navigate(-1);
      }
    } else if (step === "sku") {
      if (isPortalSource) {
        navigate(-1);
      } else {
        setPickedVariationId(null);
        setPickedSkuId(null);
        setStep("service");
      }
    } else if (step === "service") {
      navigate(-1);
    } else {
      navigate(-1);
    }
  };

  // On mount: if service param exists and no sku param, go to sku step to check
  useEffect(() => {
    if (!slugResolved || !activeServiceId) return;
    if (skuParam) return; // SKU resolution effect handles this
    if (pickedSkuId) return; // Already resolved

    // If service is pre-selected via URL but no SKU param, show SKU selection
    if (serviceParam && !pickedSkuId) {
      setStep("sku");
    }
  }, [slugResolved, activeServiceId, serviceParam, skuParam, pickedSkuId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          {/* Back button */}
          <button onClick={handleBack} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            {t("global.back")}
          </button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl font-bold mb-2">{t("booking.title")}</h1>
              <p className="text-muted-foreground">
                {t("booking.for")}: <span className="font-medium text-foreground">{itemName}</span>
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {allSteps.map((s, i) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    step === s ? "w-8 bg-rose-gold" :
                    allSteps.indexOf(step) > i ? "w-2 bg-rose-gold" : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Step: Service Selection */}
              {step === "service" && (
                <motion.div
                  key="service"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-card rounded-2xl p-6 shadow-soft"
                >
                  <h2 className="font-serif text-xl font-semibold mb-2 text-center">
                    {language === "pt" ? "Escolha o serviço" : "Choose a service"}
                  </h2>
                  <p className="text-center text-sm text-muted-foreground mb-6">
                    {language === "pt"
                      ? "Selecione o serviço desejado ou continue com consulta"
                      : "Select your desired service or continue with consultation"}
                  </p>

                  {isLoadingServices ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-rose-gold mb-4" />
                      <p className="text-muted-foreground">
                        {language === "pt" ? "Carregando serviços..." : "Loading services..."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Category filter tabs */}
                      {allServices && allServices.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                          <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              selectedCategory === null ? "bg-rose-gold text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {language === "pt" ? "Todos" : "All"}
                          </button>
                          {["Cabelo", "Sobrancelhas", "Unhas"].map((cat) => {
                            const hasServices = allServices.some(s => s.category === cat);
                            if (!hasServices) return null;
                            const categoryLabel = language === "pt" ? cat :
                              cat === "Cabelo" ? "Hair" : cat === "Sobrancelhas" ? "Brows" : "Nails";
                            return (
                              <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                  selectedCategory === cat ? "bg-rose-gold text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >
                                {categoryLabel}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Default consultation option */}
                      {!selectedCategory && (
                        <button
                          onClick={() => handleServiceSelect(null)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-rose-gold/50 ${
                            !pickedServiceId ? "border-rose-gold bg-rose-light/30" : "border-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{language === "pt" ? "Consulta" : "Consultation"}</p>
                              
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Filtered services list */}
                      {allServices && (() => {
                        const filteredServices = selectedCategory
                          ? allServices.filter(s => s.category === selectedCategory)
                          : allServices;

                        const groupedServices = filteredServices.reduce((acc, svc) => {
                          const cat = svc.category || (language === "pt" ? "Outros" : "Other");
                          if (!acc[cat]) acc[cat] = [];
                          acc[cat].push(svc);
                          return acc;
                        }, {} as Record<string, typeof allServices>);

                        return Object.entries(groupedServices).map(([category, services]) => (
                          <div key={category} className="pt-2">
                            {!selectedCategory && (
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                {language === "pt" ? category :
                                  category === "Cabelo" ? "Hair" :
                                  category === "Sobrancelhas" ? "Brows" :
                                  category === "Unhas" ? "Nails" : category}
                              </p>
                            )}
                            <div className="space-y-2">
                              {services.map((svc) => (
                                <button
                                  key={svc.id}
                                  onClick={() => handleServiceSelect(svc.id)}
                                  className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-rose-gold/50 ${
                                    pickedServiceId === svc.id ? "border-rose-gold bg-rose-light/30" : "border-muted"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{svc.name}</p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step: Variation & SKU Selection */}
              {step === "sku" && (
                <motion.div
                  key="sku"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-card rounded-2xl p-6 shadow-soft"
                >
                  <h2 className="font-serif text-xl font-semibold mb-2 text-center">
                    {language === "pt" ? "Escolha a opção" : "Choose an option"}
                  </h2>
                  <p className="text-center text-sm text-muted-foreground mb-6">
                    {service?.name || (language === "pt" ? "Carregando..." : "Loading...")}
                  </p>

                  {(!serviceVariations || !serviceSkus) ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-rose-gold mb-4" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Variation selector (if multiple) */}
                      {serviceVariations.length > 1 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            {language === "pt" ? "Técnica" : "Technique"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {serviceVariations.map((v) => (
                              <button
                                key={v.id}
                                onClick={() => {
                                  setPickedVariationId(v.id);
                                  setPickedSkuId(null);
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                  pickedVariationId === v.id
                                    ? "bg-rose-gold text-white"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >
                                {v.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SKU list */}
                      {(() => {
                        const displaySkus = pickedVariationId
                          ? serviceSkus.filter(s => s.variation_id === pickedVariationId)
                          : serviceSkus;

                        if (displaySkus.length === 0 && !pickedVariationId && serviceVariations.length > 1) {
                          return (
                            <p className="text-center text-sm text-muted-foreground py-4">
                              {language === "pt" ? "Selecione uma técnica acima" : "Select a technique above"}
                            </p>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            {displaySkus.map((sku) => {
                              const hasPromo = sku.promo_price != null && Number(sku.promo_price) < Number(sku.price);
                              return (
                                <button
                                  key={sku.id}
                                  onClick={() => {
                                    setPickedSkuId(sku.id);
                                    setStep("date");
                                  }}
                                  className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-rose-gold/50 ${
                                    pickedSkuId === sku.id ? "border-rose-gold bg-rose-light/30" : "border-muted"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{sku.name}</p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step: Date Selection */}
              {step === "date" && (
                <motion.div
                  key="date"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-card rounded-2xl p-6 shadow-soft"
                >
                  <h2 className="font-serif text-xl font-semibold mb-2 text-center">
                    {language === "pt" ? "Escolha a data" : "Choose a date"}
                  </h2>


                  <div className="flex justify-center">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) =>
                        date < today || date > maxDate || date.getDay() === 0 || date.getDay() === 1
                      }
                      locale={language === "pt" ? ptBR : undefined}
                      className="rounded-md border"
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    {language === "pt"
                      ? "Atendemos de terça a sábado, 9h às 18h"
                      : "We're open Tuesday to Saturday, 9am to 6pm"}
                  </p>
                </motion.div>
              )}

              {/* Step: Time Selection */}
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
                      <Button variant="outline" className="mt-4" onClick={() => refetchSlots()}>
                        {language === "pt" ? "Tentar novamente" : "Try again"}
                      </Button>
                    </div>
                  ) : availability?.available_slots?.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {language === "pt" ? "Nenhum horário disponível neste dia" : "No available times on this day"}
                      </p>
                      <Button variant="outline" className="mt-4" onClick={() => setStep("date")}>
                        {language === "pt" ? "Escolher outra data" : "Choose another date"}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {availability?.available_slots?.map((slot) => {
                        const slotTime = parseISO(slot.start);
                        const isSelected = selectedSlot?.start === slot.start;
                        const displayTime = new Intl.DateTimeFormat('en-US', {
                          hour: '2-digit', minute: '2-digit', hour12: false,
                          timeZone: availability.timezone || 'America/New_York',
                        }).format(slotTime);

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
                            ) : displayTime}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step: Client Information */}
              {step === "form" && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Service/SKU Summary Card */}
                  {(selectedSkuData || service || pkg || offer) && (
                    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-light flex items-center justify-center shrink-0">
                          <Calendar className="w-6 h-6 text-rose-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-lg font-semibold text-foreground leading-tight">
                            {itemName}
                          </h3>
                          {selectedSkuData && selectedSkuData.name !== service?.name && (
                            <p className="text-sm text-muted-foreground mt-0.5">{service?.name}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border/50 space-y-2.5">
                        {/* Duration */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {language === "pt" ? "Duração" : "Duration"}
                          </span>
                          <span className="font-medium">{serviceDuration} min</span>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {language === "pt" ? "Data e horário" : "Date & time"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {selectedDate && format(selectedDate, "dd/MM/yyyy")}
                              {" "}{language === "pt" ? "às" : "at"}{" "}
                              {selectedSlot && new Intl.DateTimeFormat('en-US', {
                                hour: '2-digit', minute: '2-digit', hour12: false,
                                timeZone: 'America/New_York',
                              }).format(parseISO(selectedSlot.start))}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setStep("time");
                                setHoldId(null);
                                setHoldExpiresAt(null);
                                setSelectedSlot(null);
                              }}
                              className="text-xs text-rose-gold hover:underline font-medium"
                            >
                              {language === "pt" ? "Alterar" : "Change"}
                            </button>
                          </div>
                        </div>

                        {/* Price */}
                        {(() => {
                          const skuPrice = selectedSkuData?.price ? Number(selectedSkuData.price) : null;
                          const skuPromo = selectedSkuData?.promo_price ? Number(selectedSkuData.promo_price) : null;
                          const hasPromo = skuPromo != null && skuPrice != null && skuPromo < skuPrice;
                          const displayPrice = hasPromo ? skuPromo : (skuPrice || (service?.promo_price ? Number(service.promo_price) : null) || service?.price);
                          const originalPrice = hasPromo ? skuPrice : (service?.promo_price && Number(service.promo_price) < service.price ? service.price : null);

                          if (!displayPrice) return null;
                          return (
                            <div className="flex items-center justify-between text-sm pt-2.5 border-t border-border/50">
                              <span className="font-semibold text-foreground">Total</span>
                              <div className="flex items-center gap-2">
                                {originalPrice && (
                                  <span className="text-muted-foreground line-through text-xs">
                                    ${Number(originalPrice).toFixed(2)}
                                  </span>
                                )}
                                <span className="font-bold text-lg text-rose-gold">
                                  ${Number(displayPrice).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Form Card */}
                  <div className="bg-card rounded-2xl p-6 shadow-soft">
                    {/* Hold countdown - compact */}
                    {holdExpiresAt && countdown > 0 && !isPortalSource && (
                      <div className={`text-center mb-5 p-2.5 rounded-lg text-sm ${
                        countdown <= 60 ? "bg-destructive/10 text-destructive" : "bg-rose-light text-rose-gold"
                      }`}>
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium">
                            {language === "pt" ? "Reservado por" : "Reserved for"} {formatCountdown(countdown)}
                          </span>
                        </div>
                      </div>
                    )}

                    <h3 className="font-serif text-lg font-semibold mb-4">
                      {language === "pt" ? "Seus dados" : "Your information"}
                    </h3>

                    <form onSubmit={handleSubmit((data) => isPortalSource ? portalConfirmBooking.mutate(data) : confirmBooking.mutate(data))} className="space-y-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">{t("booking.full_name")} *</Label>
                        <Input
                          id="name"
                          placeholder={t("booking.full_name_placeholder")}
                          {...register("name")}
                          className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone">{t("booking.phone")} *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          {...register("phone")}
                          className={errors.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="instagram">{t("booking.instagram")}</Label>
                        <Input id="instagram" placeholder="@yourusername" {...register("instagram")} />
                      </div>

                      <Button
                        type="submit"
                        variant="hero"
                        size="xl"
                        className="w-full"
                        disabled={confirmBooking.isPending || portalConfirmBooking.isPending || (!isPortalSource && countdown <= 0)}
                      >
                        {(confirmBooking.isPending || portalConfirmBooking.isPending) ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t("global.processing")}
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            {isPortalSource ? (language === "pt" ? "Enviar solicitação" : "Submit request") : t("booking.confirm")}
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
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
