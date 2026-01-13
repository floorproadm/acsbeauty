import { useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, Mail, Instagram, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface QuizLeadCaptureProps {
  onSubmit: (data: {
    name: string;
    phone: string;
    email?: string;
    instagram?: string;
  }) => void;
  onBack: () => void;
}

export function QuizLeadCapture({ onSubmit, onBack }: QuizLeadCaptureProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    instagram: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim() || formData.name.length < 2) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira seu nome completo.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast({
        title: "Telefone inválido",
        description: "Por favor, insira um número de telefone válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        instagram: formData.instagram.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Quase lá! ✨
        </h2>
        <p className="text-muted-foreground">
          Informe seus dados para ver seu resultado personalizado
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="space-y-4 bg-card border border-border rounded-2xl p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Nome completo *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Seu nome"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            WhatsApp *
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(00) 00000-0000"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            className="h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            E-mail (opcional)
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-muted-foreground" />
            Instagram (opcional)
          </Label>
          <Input
            id="instagram"
            type="text"
            placeholder="@seu_instagram"
            value={formData.instagram}
            onChange={(e) => setFormData((prev) => ({ ...prev, instagram: e.target.value }))}
            className="h-12"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-12"
          >
            {isSubmitting ? "Processando..." : "Ver Meu Resultado"}
          </Button>
        </div>
      </motion.form>

      <p className="text-center text-xs text-muted-foreground">
        Seus dados estão seguros e não serão compartilhados com terceiros.
      </p>
    </div>
  );
}
