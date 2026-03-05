import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Shop() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: "Shop Waitlist",
        email,
        message: "Interesse na loja online — waitlist",
        service_interest: "shop",
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Você está na lista!");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 md:px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg mx-auto text-center space-y-8"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>

            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-foreground">
                Shop — Em Breve
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Estamos preparando uma seleção especial de produtos para cuidados com sobrancelhas,
                cabelo e unhas. Deixe seu email para ser a primeira a saber!
              </p>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/5 rounded-xl p-6"
              >
                <p className="text-primary font-medium">
                  ✨ Pronto! Vamos te avisar quando a loja abrir.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-3 max-w-sm mx-auto">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={loading} className="gap-1 shrink-0">
                  Avisar-me
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
