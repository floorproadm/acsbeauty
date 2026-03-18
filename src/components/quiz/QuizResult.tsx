import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Calendar, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface QuizResultData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  service_id: string | null;
  package_id: string | null;
  offer_id: string | null;
  min_score: number;
  max_score: number;
  cta_text: string;
  cta_url: string | null;
}

interface QuizResultProps {
  result: QuizResultData;
}

export function QuizResult({ result }: QuizResultProps) {
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger confetti celebration
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: ReturnType<typeof setInterval> = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#D4AF37", "#B8860B", "#FFD700"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#D4AF37", "#B8860B", "#FFD700"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  function handleCTA() {
    if (result.cta_url) {
      if (result.cta_url.startsWith("http")) {
        window.open(result.cta_url, "_blank");
      } else {
        navigate(result.cta_url);
      }
    } else if (result.offer_id) {
      navigate(`/o/${result.offer_id}`);
    } else if (result.package_id) {
      navigate(`/p/${result.package_id}`);
    } else if (result.service_id) {
      navigate("/portal");
    } else {
      navigate("/portal");
    }
  }

  return (
    <div className="space-y-8">
      {/* Success Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="flex justify-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/30">
          <Sparkles className="h-10 w-10 text-primary-foreground" />
        </div>
      </motion.div>

      {/* Result Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          {result.image_url && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={result.image_url}
                alt={result.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>
          )}

          <CardContent className="p-6 md:p-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Gift className="h-4 w-4" />
              Seu Resultado
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {result.title}
            </h2>

            {result.description && (
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {result.description}
              </p>
            )}

            <Button
              size="lg"
              onClick={handleCTA}
              className="w-full sm:w-auto min-w-[200px] h-14 text-lg gap-2 shadow-xl shadow-primary/30"
            >
              <Calendar className="h-5 w-5" />
              {result.cta_text}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Social Proof */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <p className="text-sm text-muted-foreground">
          Mais de <span className="font-bold text-primary">500+ clientes</span> já
          descobriram o tratamento ideal através deste quiz
        </p>
      </motion.div>

      {/* Back to Home */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <Button variant="ghost" onClick={() => navigate("/")}>
          Voltar ao início
        </Button>
      </motion.div>
    </div>
  );
}
