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
      {/* Silk fabric background effect */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `
            linear-gradient(145deg, 
              hsl(35, 35%, 88%) 0%,
              hsl(38, 40%, 92%) 15%,
              hsl(32, 30%, 85%) 30%,
              hsl(40, 45%, 94%) 45%,
              hsl(35, 38%, 90%) 60%,
              hsl(30, 32%, 82%) 75%,
              hsl(38, 42%, 91%) 90%,
              hsl(35, 35%, 88%) 100%
            )
          `,
        }}
      />
      
      {/* Silk wave overlay - creates the flowing fabric effect */}
      <div 
        className="absolute inset-0 z-0 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 20% 30%, hsl(38, 50%, 95%) 0%, transparent 50%),
            radial-gradient(ellipse 100% 60% at 80% 70%, hsl(32, 35%, 80%) 0%, transparent 45%),
            radial-gradient(ellipse 80% 100% at 50% 100%, hsl(35, 40%, 85%) 0%, transparent 50%)
          `,
        }}
      />

      {/* Subtle shine lines for silk texture */}
      <div 
        className="absolute inset-0 z-0 opacity-40"
        style={{
          background: `
            linear-gradient(135deg, 
              transparent 0%, 
              hsl(40, 50%, 96%) 10%, 
              transparent 20%,
              transparent 40%,
              hsl(38, 45%, 94%) 50%,
              transparent 60%,
              transparent 80%,
              hsl(35, 40%, 92%) 90%,
              transparent 100%
            )
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-2xl mx-auto">
        {/* Logo */}
        <div className="mb-16">
          <h2 
            className="text-2xl md:text-3xl tracking-[0.4em] font-light mb-1"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              color: 'hsl(25, 25%, 25%)',
              letterSpacing: '0.35em'
            }}
          >
            ACS
          </h2>
          <h2 
            className="text-2xl md:text-3xl tracking-[0.4em] font-light"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              color: 'hsl(25, 25%, 25%)',
              letterSpacing: '0.35em'
            }}
          >
            BEAUTY
          </h2>
        </div>

        {/* Main Heading */}
        <h1 
          className="text-6xl md:text-7xl lg:text-8xl mb-8 leading-tight font-light"
          style={{ 
            fontFamily: "'Playfair Display', serif",
            color: 'hsl(25, 25%, 25%)'
          }}
        >
          Launching
          <br />
          soon!
        </h1>

        {/* Subtitle */}
        <p 
          className="text-lg md:text-xl mb-12 max-w-md font-light"
          style={{ color: 'hsl(25, 20%, 40%)' }}
        >
          We are currently making some improvements to our website!
        </p>

        {/* Notify Form */}
        <form onSubmit={handleNotify} className="w-full max-w-xs mb-16">
          <div className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/50 border-[hsl(25,20%,70%)] text-center h-12 placeholder:text-[hsl(25,20%,55%)] focus:border-[hsl(25,25%,45%)] rounded-none"
              style={{ color: 'hsl(25, 25%, 25%)' }}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-none tracking-[0.25em] text-sm font-normal border-2 transition-all duration-300"
              style={{ 
                backgroundColor: 'transparent',
                borderColor: 'hsl(25, 20%, 35%)',
                color: 'hsl(25, 25%, 25%)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(25, 20%, 35%)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'hsl(25, 25%, 25%)';
              }}
            >
              {isSubmitting ? "SENDING..." : "NOTIFY ME"}
            </Button>
          </div>
        </form>

        {/* Social Icons */}
        <div className="flex items-center gap-8">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-60"
            aria-label="Facebook"
            style={{ color: 'hsl(25, 25%, 30%)' }}
          >
            <Facebook className="w-7 h-7" strokeWidth={1.5} />
          </a>
          <a
            href="https://www.instagram.com/acsbeautynj?igsh=c2hsdmg1bm9kOHNo"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-60"
            aria-label="Instagram"
            style={{ color: 'hsl(25, 25%, 30%)' }}
          >
            <Instagram className="w-7 h-7" strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
