import { useState } from "react";
import { MessageCircle, User, Sparkles, Clock, ArrowRight, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP_NUMBER = "17329153430";

const SERVICE_CATEGORIES = [
  { value: "cabelo", label: "Cabelo", emoji: "✂️" },
  { value: "sobrancelha", label: "Sobrancelha", emoji: "👁️" },
  { value: "unhas", label: "Unhas", emoji: "💅" },
];

const URGENCY_OPTIONS = [
  { value: "urgente", label: "Urgente (próximos dias)", emoji: "🔥" },
  { value: "proxima_semana", label: "Próxima semana", emoji: "📅" },
  { value: "proximo_mes", label: "Próximo mês", emoji: "🗓️" },
  { value: "apenas_informacao", label: "Só quero informações", emoji: "💬" },
];

interface WhatsAppDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagePath: string;
  utmParams: {
    utm_source: string | null;
    utm_campaign: string | null;
    utm_medium: string | null;
  };
  sessionId: string;
}

export function WhatsAppDrawer({
  open,
  onOpenChange,
  pagePath,
  utmParams,
  sessionId,
}: WhatsAppDrawerProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [urgency, setUrgency] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !selectedService || !urgency) return;

    setIsSubmitting(true);

    try {
      const serviceLabel = SERVICE_CATEGORIES.find((s) => s.value === selectedService)?.label || selectedService;
      const urgencyLabel = URGENCY_OPTIONS.find((u) => u.value === urgency)?.label || urgency;
      
      // Build formatted message for database
      const dbMessage = `Contato via WhatsApp
Serviço: ${serviceLabel}
Urgência: ${urgencyLabel}
Página: ${pagePath}`;

      // Save lead to contact_submissions
      await supabase.from("contact_submissions").insert({
        name: name.trim(),
        email: "whatsapp@lead.local",
        service_interest: selectedService,
        message: dbMessage,
        utm_source: utmParams.utm_source,
        utm_campaign: utmParams.utm_campaign,
        utm_medium: utmParams.utm_medium,
        status: "novo",
      });

      console.log("[WhatsApp] Lead saved to contact_submissions");

      // Build WhatsApp message
      const whatsappMessage = `Olá! Meu nome é ${name.trim()}.

Tenho interesse no serviço: ${serviceLabel}
Urgência: ${urgencyLabel}

Gostaria de mais informações e agendar um horário.`;

      // Redirect to WhatsApp
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      // Reset and close
      setStep(1);
      setName("");
      setSelectedService("");
      setUrgency("");
      onOpenChange(false);
    } catch (error) {
      console.error("[WhatsApp] Error saving lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length >= 2;
    if (step === 2) return !!selectedService;
    if (step === 3) return !!urgency;
    return false;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-[#25D366]/10 rounded-full flex items-center justify-center mb-2">
            <MessageCircle className="w-6 h-6 text-[#25D366]" />
          </div>
          <DrawerTitle className="text-xl">Fale Conosco</DrawerTitle>
          <DrawerDescription>
            Preencha as informações para agilizar seu atendimento
          </DrawerDescription>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-8 bg-[#25D366]"
                    : s < step
                    ? "w-2 bg-[#25D366]"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </DrawerHeader>

        <div className="px-4 py-4 space-y-4">
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>Passo 1 de 3</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium">
                  Qual é o seu nome?
                </Label>
                <Input
                  id="name"
                  placeholder="Digite seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-lg"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 2: Service Category */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>Passo 2 de 3</span>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Qual serviço você procura?
                </Label>
                <RadioGroup value={selectedService} onValueChange={setSelectedService} className="space-y-2">
                  {SERVICE_CATEGORIES.map((category) => (
                    <div
                      key={category.value}
                      className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                        selectedService === category.value
                          ? "border-[#25D366] bg-[#25D366]/5"
                          : "border-border hover:border-[#25D366]/50"
                      }`}
                      onClick={() => setSelectedService(category.value)}
                    >
                      <RadioGroupItem value={category.value} id={category.value} />
                      <Label
                        htmlFor={category.value}
                        className="flex-1 cursor-pointer flex items-center gap-2 text-base"
                      >
                        <span>{category.emoji}</span>
                        <span>{category.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 3: Urgency */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Passo 3 de 3</span>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Para quando você precisa?
                </Label>
                <RadioGroup value={urgency} onValueChange={setUrgency} className="space-y-2">
                  {URGENCY_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                        urgency === option.value
                          ? "border-[#25D366] bg-[#25D366]/5"
                          : "border-border hover:border-[#25D366]/50"
                      }`}
                      onClick={() => setUrgency(option.value)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label
                        htmlFor={option.value}
                        className="flex-1 cursor-pointer flex items-center gap-2"
                      >
                        <span>{option.emoji}</span>
                        <span>{option.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="pt-2">
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                disabled={isSubmitting}
              >
                Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className={`flex-1 ${
                step === 3
                  ? "bg-[#25D366] hover:bg-[#20BD5A]"
                  : ""
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : step === 3 ? (
                <>
                  Abrir WhatsApp
                  <MessageCircle className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
