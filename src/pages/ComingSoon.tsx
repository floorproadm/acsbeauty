import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ComingSoon = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Por favor, insira seu email");
      return;
    }

    setIsSubmitting(true);
    try {
      // Store email in clients table for notification
      const { error } = await supabase.from("clients").insert({
        email: email.trim(),
        name: "Coming Soon Subscriber",
        tags: ["coming-soon-subscriber"],
      });

      if (error && !error.message.includes("duplicate")) {
        throw error;
      }

      toast.success("Obrigado! Você será notificado quando lançarmos.");
      setEmail("");
    } catch (error) {
      console.error("Error saving email:", error);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Elegant gradient background mimicking silk fabric */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, hsl(var(--champagne)) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, hsl(var(--rose-gold) / 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, hsl(var(--ivory)) 0%, hsl(var(--cream)) 100%)
          `,
        }}
      />
      
      {/* Subtle overlay for depth */}
      <div 
        className="absolute inset-0 z-0 opacity-30"
        style={{
          background: `
            linear-gradient(135deg, transparent 0%, hsl(var(--champagne) / 0.4) 50%, transparent 100%)
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-2xl mx-auto">
        {/* Logo */}
        <div className="mb-12">
          <h2 className="font-serif text-xl md:text-2xl tracking-[0.3em] text-espresso font-medium">
            ACS
          </h2>
          <h2 className="font-serif text-xl md:text-2xl tracking-[0.3em] text-espresso font-medium">
            BEAUTY
          </h2>
        </div>

        {/* Main Heading */}
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-espresso mb-6 leading-tight">
          Launching
          <br />
          soon!
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-md">
          We are currently making some improvements to our website!
        </p>

        {/* Notify Form */}
        <form onSubmit={handleNotify} className="w-full max-w-sm mb-12">
          <div className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/80 border-espresso/20 text-center h-12"
            />
            <Button
              type="submit"
              variant="elegant"
              size="lg"
              disabled={isSubmitting}
              className="w-full h-12 border-espresso/30 hover:bg-espresso hover:text-background tracking-widest text-sm font-medium"
            >
              {isSubmitting ? "ENVIANDO..." : "NOTIFY ME"}
            </Button>
          </div>
        </form>

        {/* Social Icons */}
        <div className="flex items-center gap-6">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-espresso/70 hover:text-espresso transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-7 h-7" />
          </a>
          <a
            href="https://www.instagram.com/acsbeautynj?igsh=c2hsdmg1bm9kOHNo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-espresso/70 hover:text-espresso transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-7 h-7" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-espresso/70 hover:text-espresso transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-7 h-7" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
