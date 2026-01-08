import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Check, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Book() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const offerId = searchParams.get("offer_id");
  const packageId = searchParams.get("package_id");
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useLanguage();

  const bookingSchema = z.object({
    name: z.string().trim().min(2, t("booking.name_min_error")).max(100),
    phone: z.string().trim().min(8, t("booking.phone_error")).max(20),
    instagram: z.string().trim().max(50).optional(),
  });

  type BookingFormData = z.infer<typeof bookingSchema>;

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

  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const createBooking = useMutation({
    mutationFn: async (formData: BookingFormData) => {
      // Create client first
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: formData.name,
          phone: formData.phone,
          instagram: formData.instagram || null,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create booking
      const bookingData: any = {
        client_id: client.id,
        client_name: formData.name,
        client_phone: formData.phone,
        client_email: `${formData.phone.replace(/\D/g, '')}@placeholder.com`, // Placeholder email
        status: "confirmed",
        start_time: new Date().toISOString(), // Placeholder - will be selected in calendar later
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      if (offer?.service_id) {
        bookingData.service_id = offer.service_id;
      }
      if (packageId) {
        bookingData.package_id = packageId;
      }

      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) throw bookingError;

      return { client, booking: newBooking };
    },
    onSuccess: (data) => {
      toast.success(t("booking.success_title"));
      // Navigate to confirmation page with booking ID
      navigate(`/confirm/${data.booking.id}`);
    },
    onError: (error) => {
      console.error("Booking error:", error);
      toast.error("Failed to create booking. Please try again.");
    },
  });

  const itemName = offer?.headline || offer?.name || pkg?.name || "Consultation";

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-md text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl p-8 shadow-soft"
            >
              <div className="w-16 h-16 bg-rose-light rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-rose-gold" />
              </div>
              <h1 className="font-serif text-3xl font-bold mb-4">{t("booking.success_title")}</h1>
              <p className="text-muted-foreground mb-6">
                {t("booking.success_message")}
              </p>
              <Link to="/">
                <Button variant="hero">{t("booking.return_home")}</Button>
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <Link to={offerId ? `/o/${offerId}` : packageId ? `/p/${packageId}` : "/services"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t("global.back")}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
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

            <form onSubmit={handleSubmit((data) => createBooking.mutate(data))} className="space-y-6">
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
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("global.processing")}
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    {t("booking.confirm")}
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t("booking.contact_schedule")}
              </p>
            </form>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
