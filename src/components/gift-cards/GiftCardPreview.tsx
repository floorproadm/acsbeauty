import { Gift, Sparkles } from "lucide-react";

interface GiftCardPreviewProps {
  amount: number;
  recipientName: string;
  occasion: string;
  personalMessage: string;
  buyerName: string;
}

const OCCASION_EMOJIS: Record<string, string> = {
  aniversario: "🎂",
  obrigada: "💝",
  natal: "🎄",
  dia_das_maes: "💐",
  qualquer: "✨",
};

export function GiftCardPreview({
  amount,
  recipientName,
  occasion,
  personalMessage,
  buyerName,
}: GiftCardPreviewProps) {
  const emoji = OCCASION_EMOJIS[occasion] || "✨";

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div className="relative aspect-[1.6/1] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-[hsl(var(--gold-dark))] via-[hsl(var(--gold))] to-[hsl(var(--gold-light))]">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full border border-white/30" />
          <div className="absolute top-8 right-8 w-24 h-24 rounded-full border border-white/20" />
          <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full border border-white/20" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-6 text-white">
          {/* Top */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-serif text-lg tracking-wider">ACS BEAUTY</span>
            </div>
            <span className="text-3xl">{emoji}</span>
          </div>

          {/* Center - Amount */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] opacity-80 mb-1">Gift Card</p>
            <p className="text-5xl font-serif font-bold tracking-tight">
              ${amount || 0}
            </p>
          </div>

          {/* Bottom */}
          <div className="flex items-end justify-between">
            <div>
              {recipientName && (
                <p className="text-sm opacity-90">
                  Para: <span className="font-medium">{recipientName}</span>
                </p>
              )}
              {buyerName && (
                <p className="text-xs opacity-70">
                  De: {buyerName}
                </p>
              )}
            </div>
            <Gift className="w-6 h-6 opacity-60" />
          </div>
        </div>
      </div>

      {/* Message below card */}
      {personalMessage && (
        <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-sm italic text-muted-foreground text-center leading-relaxed">
            "{personalMessage}"
          </p>
        </div>
      )}
    </div>
  );
}
