import { useState } from "react";
import {
  DollarSign,
  User,
  Heart,
  MessageSquare,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const PRESET_AMOUNTS = [50, 100, 150, 200];

const OCCASIONS = {
  pt: [
    { value: "aniversario", label: "Aniversário", emoji: "🎂" },
    { value: "obrigada", label: "Obrigada", emoji: "💝" },
    { value: "natal", label: "Natal", emoji: "🎄" },
    { value: "dia_das_maes", label: "Dia das Mães", emoji: "💐" },
    { value: "qualquer", label: "Qualquer Ocasião", emoji: "✨" },
  ],
  en: [
    { value: "aniversario", label: "Birthday", emoji: "🎂" },
    { value: "obrigada", label: "Thank You", emoji: "💝" },
    { value: "natal", label: "Christmas", emoji: "🎄" },
    { value: "dia_das_maes", label: "Mother's Day", emoji: "💐" },
    { value: "qualquer", label: "Any Occasion", emoji: "✨" },
  ],
};

const STEPS = {
  pt: [
    { icon: DollarSign, label: "Valor" },
    { icon: User, label: "Destinatário" },
    { icon: Heart, label: "Ocasião" },
    { icon: MessageSquare, label: "Mensagem" },
    { icon: CreditCard, label: "Pagamento" },
  ],
  en: [
    { icon: DollarSign, label: "Amount" },
    { icon: User, label: "Recipient" },
    { icon: Heart, label: "Occasion" },
    { icon: MessageSquare, label: "Message" },
    { icon: CreditCard, label: "Payment" },
  ],
};

const TEXTS = {
  pt: {
    chooseAmount: "Escolha o valor do Gift Card",
    customAmount: "Valor personalizado",
    otherAmount: "Outro valor",
    whoReceives: "Quem vai receber o Gift Card?",
    recipientName: "Nome do destinatário",
    fullName: "Nome completo",
    recipientEmail: "Email do destinatário",
    chooseOccasion: "Escolha a ocasião",
    addMessage: "Adicione uma mensagem personalizada (opcional)",
    messagePlaceholder: "Ex: Feliz aniversário! Aproveite um dia especial no ACS Beauty ✨",
    characters: "caracteres",
    yourDetails: "Seus dados para finalizar a compra",
    yourName: "Seu nome",
    yourFullName: "Seu nome completo",
    yourEmail: "Seu email",
    summary: "Resumo",
    amount: "Valor",
    to: "Para",
    occasion: "Ocasião",
    whatsappBtn: "Finalizar via WhatsApp",
    cardBtn: "Pagar com Cartão (em breve)",
    back: "Voltar",
    continue: "Continuar",
    successTitle: "Gift Card criado!",
    successDesc: "Finalize o pagamento pelo WhatsApp. Após confirmação, enviaremos o código ao destinatário.",
    errorTitle: "Erro",
    errorDesc: "Não foi possível criar o gift card.",
    whatsappMsg: (amount: number, recipientName: string, recipientEmail: string, occasionLabel: string, personalMessage: string, buyerName: string, buyerEmail: string, code: string) =>
      `Olá! Gostaria de comprar um Gift Card ACS Beauty.

💳 Valor: $${amount}
🎁 Para: ${recipientName}
✉️ Email destinatário: ${recipientEmail}
🎉 Ocasião: ${occasionLabel}
${personalMessage ? `💬 Mensagem: "${personalMessage}"` : ""}

Meu nome: ${buyerName}
Meu email: ${buyerEmail}

Código: ${code}`,
  },
  en: {
    chooseAmount: "Choose the Gift Card amount",
    customAmount: "Custom amount",
    otherAmount: "Other amount",
    whoReceives: "Who will receive the Gift Card?",
    recipientName: "Recipient's name",
    fullName: "Full name",
    recipientEmail: "Recipient's email",
    chooseOccasion: "Choose the occasion",
    addMessage: "Add a personal message (optional)",
    messagePlaceholder: "E.g.: Happy birthday! Enjoy a special day at ACS Beauty ✨",
    characters: "characters",
    yourDetails: "Your details to complete the purchase",
    yourName: "Your name",
    yourFullName: "Your full name",
    yourEmail: "Your email",
    summary: "Summary",
    amount: "Amount",
    to: "To",
    occasion: "Occasion",
    whatsappBtn: "Complete via WhatsApp",
    cardBtn: "Pay with Card (coming soon)",
    back: "Back",
    continue: "Continue",
    successTitle: "Gift Card created!",
    successDesc: "Complete payment via WhatsApp. After confirmation, we'll send the code to the recipient.",
    errorTitle: "Error",
    errorDesc: "Could not create the gift card.",
    whatsappMsg: (amount: number, recipientName: string, recipientEmail: string, occasionLabel: string, personalMessage: string, buyerName: string, buyerEmail: string, code: string) =>
      `Hi! I'd like to purchase an ACS Beauty Gift Card.

💳 Amount: $${amount}
🎁 For: ${recipientName}
✉️ Recipient email: ${recipientEmail}
🎉 Occasion: ${occasionLabel}
${personalMessage ? `💬 Message: "${personalMessage}"` : ""}

My name: ${buyerName}
My email: ${buyerEmail}

Code: ${code}`,
  },
};

const WHATSAPP_NUMBER = "17329153430";

interface GiftCardFormProps {
  onFieldChange: (fields: {
    amount: number;
    recipientName: string;
    occasion: string;
    personalMessage: string;
    buyerName: string;
  }) => void;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `ACS-${part()}-${part()}`;
}

export function GiftCardForm({ onFieldChange }: GiftCardFormProps) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "pt";
  const txt = TEXTS[lang];
  const occasions = OCCASIONS[lang];
  const steps = STEPS[lang];

  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [occasion, setOccasion] = useState("qualquer");
  const [personalMessage, setPersonalMessage] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const effectiveAmount = customAmount ? Number(customAmount) : amount;

  const notify = (overrides: Partial<{ amount: number; recipientName: string; occasion: string; personalMessage: string; buyerName: string }> = {}) => {
    onFieldChange({
      amount: overrides.amount ?? effectiveAmount,
      recipientName: overrides.recipientName ?? recipientName,
      occasion: overrides.occasion ?? occasion,
      personalMessage: overrides.personalMessage ?? personalMessage,
      buyerName: overrides.buyerName ?? buyerName,
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return effectiveAmount >= 10;
      case 1: return recipientName.trim().length >= 2 && recipientEmail.includes("@");
      case 2: return !!occasion;
      case 3: return true;
      case 4: return buyerName.trim().length >= 2 && buyerEmail.includes("@");
      default: return false;
    }
  };

  const handleWhatsApp = () => {
    if (!canProceed()) return;
    setIsSubmitting(true);

    const code = generateCode();
    const occasionLabel = occasions.find((o) => o.value === occasion)?.label || occasion;
    const msg = txt.whatsappMsg(
      effectiveAmount,
      recipientName.trim(),
      recipientEmail.trim(),
      occasionLabel,
      personalMessage,
      buyerName.trim(),
      buyerEmail.trim(),
      code
    );

    // Open WhatsApp FIRST (synchronous, in click context) to avoid popup blocker
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer"
    );

    // Then save to database (async, fire-and-forget)
    supabase.from("gift_cards").insert({
      code,
      amount: effectiveAmount,
      balance: effectiveAmount,
      buyer_name: buyerName.trim(),
      buyer_email: buyerEmail.trim(),
      recipient_name: recipientName.trim(),
      recipient_email: recipientEmail.trim(),
      occasion,
      personal_message: personalMessage || null,
      payment_method: "whatsapp",
      status: "pending",
    }).then(({ error }) => {
      if (error) {
        console.error("[GiftCard] DB error:", error);
        toast({ title: txt.errorTitle, description: txt.errorDesc, variant: "destructive" });
      } else {
        toast({ title: txt.successTitle, description: txt.successDesc });
      }
      setIsSubmitting(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${i < step ? "bg-primary/30" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <h3 className="text-lg font-serif font-medium">
        {steps[step].label}
      </h3>

      {/* Step 0: Amount */}
      {step === 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-sm text-muted-foreground">{txt.chooseAmount}</p>
          <div className="grid grid-cols-2 gap-3">
            {PRESET_AMOUNTS.map((v) => (
              <button
                key={v}
                onClick={() => { setAmount(v); setCustomAmount(""); notify({ amount: v }); }}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  !customAmount && amount === v
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-2xl font-serif font-bold">${v}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>{txt.customAmount}</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                min={10}
                max={1000}
                placeholder={txt.otherAmount}
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  notify({ amount: Number(e.target.value) || 0 });
                }}
                className="pl-9 h-12"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Recipient */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-sm text-muted-foreground">{txt.whoReceives}</p>
          <div className="space-y-3">
            <div>
              <Label>{txt.recipientName}</Label>
              <Input
                placeholder={txt.fullName}
                value={recipientName}
                onChange={(e) => { setRecipientName(e.target.value); notify({ recipientName: e.target.value }); }}
                className="h-12"
                autoFocus
              />
            </div>
            <div>
              <Label>{txt.recipientEmail}</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Occasion */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-sm text-muted-foreground">{txt.chooseOccasion}</p>
          <div className="space-y-2">
            {occasions.map((o) => (
              <button
                key={o.value}
                onClick={() => { setOccasion(o.value); notify({ occasion: o.value }); }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  occasion === o.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-2xl">{o.emoji}</span>
                <span className="font-medium">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Message */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-sm text-muted-foreground">{txt.addMessage}</p>
          <Textarea
            placeholder={txt.messagePlaceholder}
            value={personalMessage}
            onChange={(e) => { setPersonalMessage(e.target.value); notify({ personalMessage: e.target.value }); }}
            rows={4}
            className="resize-none"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">{personalMessage.length}/200 {txt.characters}</p>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-sm text-muted-foreground">{txt.yourDetails}</p>
          <div className="space-y-3">
            <div>
              <Label>{txt.yourName}</Label>
              <Input
                placeholder={txt.yourFullName}
                value={buyerName}
                onChange={(e) => { setBuyerName(e.target.value); notify({ buyerName: e.target.value }); }}
                className="h-12"
                autoFocus
              />
            </div>
            <div>
              <Label>{txt.yourEmail}</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
            <h4 className="font-medium text-sm">{txt.summary}</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>{txt.amount}: <span className="text-foreground font-medium">${effectiveAmount}</span></p>
              <p>{txt.to}: <span className="text-foreground">{recipientName}</span></p>
              <p>{txt.occasion}: <span className="text-foreground">{occasions.find((o) => o.value === occasion)?.label}</span></p>
            </div>
          </div>

          {/* Payment options */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleWhatsApp}
              disabled={!canProceed() || isSubmitting}
              className="w-full h-12 bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <MessageCircle className="w-4 h-4 mr-2" />
              )}
              {txt.whatsappBtn}
            </Button>
            <Button
              variant="outline"
              disabled
              className="w-full h-12 opacity-50"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {txt.cardBtn}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {txt.back}
            </Button>
          )}
          <Button
            onClick={() => { notify(); setStep(step + 1); }}
            disabled={!canProceed()}
            className="flex-1"
          >
            {txt.continue}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
      {step === 4 && step > 0 && (
        <Button variant="ghost" onClick={() => setStep(step - 1)} className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {txt.back}
        </Button>
      )}
    </div>
  );
}
