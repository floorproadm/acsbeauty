import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Instagram, Facebook } from "lucide-react";
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
            href="https://www.threads.net/@acsbeautynj"
            target="_blank"
            rel="noopener noreferrer"
            className="text-espresso/70 hover:text-espresso transition-colors"
            aria-label="Threads"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.133 1.37-2.788.812-.552 1.862-.9 3.122-1.033-.02-.332-.043-.63-.064-.866-.081-.869-.182-1.453-.304-1.878-.253-.879-.592-1.388-1.073-1.609-.294-.136-.64-.186-1.056-.154-1.05.084-1.95.626-2.677 1.614-.733.996-1.134 2.262-1.193 3.765l-2.118-.06c.08-2.028.642-3.748 1.67-5.117 1.052-1.399 2.47-2.2 4.217-2.378.65-.067 1.272-.025 1.85.125 1.143.297 2.003 1.053 2.559 2.248.384.825.615 1.862.747 3.176.098 1.002.133 2.09.106 3.247.735.168 1.386.424 1.943.768 1.04.642 1.826 1.532 2.336 2.647.796 1.74.845 4.537-1.328 6.664-1.827 1.789-4.15 2.6-7.333 2.625Zm-.091-5.945c1.107-.06 1.91-.462 2.386-1.193.418-.644.69-1.503.804-2.544-.91-.152-1.881-.204-2.867-.153-.907.047-1.593.244-2.044.586-.375.286-.556.63-.539 1.02.033.637.421 1.143 1.127 1.469.527.243 1.138.35 1.822.35.108 0 .209-.002.311-.005v-.53Z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
