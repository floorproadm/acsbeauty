import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GiftCardForm } from "@/components/gift-cards/GiftCardForm";
import { GiftCardPreview } from "@/components/gift-cards/GiftCardPreview";
import { Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function GiftCards() {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    amount: 100,
    recipientName: "",
    occasion: "qualquer",
    personalMessage: "",
    buyerName: "",
  });

  const isPt = language === "pt";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Gift className="w-4 h-4" />
              Gift Cards
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              {isPt ? (
                <>Presenteie com{" "}<span className="text-primary">Beleza</span></>
              ) : (
                <>The Gift of{" "}<span className="text-primary">Beauty</span></>
              )}
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {isPt
                ? "O presente perfeito para quem você ama. Escolha o valor, personalize e envie com carinho."
                : "The perfect gift for someone you love. Choose the amount, personalize, and send with care."}
            </p>
          </div>

          {/* Split layout */}
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-start">
            {/* Form */}
            <div className="order-2 lg:order-1">
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
                <GiftCardForm onFieldChange={setFormData} />
              </div>
            </div>

            {/* Preview */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-28">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center font-medium uppercase tracking-wider">
                  Preview
                </p>
                <GiftCardPreview {...formData} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
