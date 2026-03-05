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

const PRESET_AMOUNTS = [50, 100, 150, 200];

const OCCASIONS = [
  { value: "aniversario", label: "Aniversário", emoji: "🎂" },
  { value: "obrigada", label: "Obrigada", emoji: "💝" },
  { value: "natal", label: "Natal", emoji: "🎄" },
  { value: "dia_das_maes", label: "Dia das Mães", emoji: "💐" },
  { value: "qualquer", label: "Qualquer Ocasião", emoji: "✨" },
];

const STEPS = [
  { icon: DollarSign, label: "Valor" },
  { icon: User, label: "Destinatário" },
  { icon: Heart, label: "Ocasião" },
  { icon: MessageSquare, label: "Mensagem" },
  { icon: CreditCard, label: "Pagamento" },
];

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
      case 3: return true; // message is optional
      case 4: return buyerName.trim().length >= 2 && buyerEmail.includes("@");
      default: return false;
    }
  };

  const handleWhatsApp = async () => {
    if (!canProceed()) return;
    setIsSubmitting(true);

    try {
      const code = generateCode();
      await supabase.from("gift_cards").insert({
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
      });

      const msg = `Olá! Gostaria de comprar um Gift Card ACS Beauty.

💳 Valor: $${effectiveAmount}
🎁 Para: ${recipientName.trim()}
✉️ Email destinatário: ${recipientEmail.trim()}
🎉 Ocasião: ${OCCASIONS.find((o) => o.value === occasion)?.label || occasion}
${personalMessage ? `💬 Mensagem: "${personalMessage}"` : ""}

Meu nome: ${buyerName.trim()}
Meu email: ${buyerEmail.trim()}

Código: ${code}`;

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
        "_blank",
        "noopener,noreferrer"
      );

      toast({
        title: "Gift Card criado!",
        description: "Finalize o pagamento pelo WhatsApp. Após confirmação, enviaremos o código ao destinatário.",
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível criar o gift card.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
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
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${i < step ? "bg-primary/30" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <h3 className="text-lg font-serif font-medium">
        {STEPS[step].label}
      </h3>

      {/* Step 0: Amount */}
      {step === 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-sm text-muted-foreground">Escolha o valor do Gift Card</p>
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
            <Label>Valor personalizado</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                min={10}
                max={1000}
                placeholder="Outro valor"
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
          <p className="text-sm text-muted-foreground">Quem vai receber o Gift Card?</p>
          <div className="space-y-3">
            <div>
              <Label>Nome do destinatário</Label>
              <Input
                placeholder="Nome completo"
                value={recipientName}
                onChange={(e) => { setRecipientName(e.target.value); notify({ recipientName: e.target.value }); }}
                className="h-12"
                autoFocus
              />
            </div>
            <div>
              <Label>Email do destinatário</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
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
          <p className="text-sm text-muted-foreground">Escolha a ocasião</p>
          <div className="space-y-2">
            {OCCASIONS.map((o) => (
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
          <p className="text-sm text-muted-foreground">Adicione uma mensagem personalizada (opcional)</p>
          <Textarea
            placeholder="Ex: Feliz aniversário! Aproveite um dia especial no ACS Beauty ✨"
            value={personalMessage}
            onChange={(e) => { setPersonalMessage(e.target.value); notify({ personalMessage: e.target.value }); }}
            rows={4}
            className="resize-none"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">{personalMessage.length}/200 caracteres</p>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-sm text-muted-foreground">Seus dados para finalizar a compra</p>
          <div className="space-y-3">
            <div>
              <Label>Seu nome</Label>
              <Input
                placeholder="Seu nome completo"
                value={buyerName}
                onChange={(e) => { setBuyerName(e.target.value); notify({ buyerName: e.target.value }); }}
                className="h-12"
                autoFocus
              />
            </div>
            <div>
              <Label>Seu email</Label>
              <Input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
            <h4 className="font-medium text-sm">Resumo</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>Valor: <span className="text-foreground font-medium">${effectiveAmount}</span></p>
              <p>Para: <span className="text-foreground">{recipientName}</span></p>
              <p>Ocasião: <span className="text-foreground">{OCCASIONS.find((o) => o.value === occasion)?.label}</span></p>
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
              Finalizar via WhatsApp
            </Button>
            <Button
              variant="outline"
              disabled
              className="w-full h-12 opacity-50"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pagar com Cartão (em breve)
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
              Voltar
            </Button>
          )}
          <Button
            onClick={() => { notify(); setStep(step + 1); }}
            disabled={!canProceed()}
            className="flex-1"
          >
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
      {step === 4 && step > 0 && (
        <Button variant="ghost" onClick={() => setStep(step - 1)} className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      )}
    </div>
  );
}
