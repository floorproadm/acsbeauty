import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 text-sm font-medium tracking-wide">
      <button
        onClick={() => setLanguage("pt")}
        className={cn(
          "px-1 py-0.5 transition-all duration-300",
          language === "pt"
            ? "text-foreground"
            : "text-muted-foreground/50 hover:text-muted-foreground"
        )}
        aria-label="Mudar para Português"
      >
        PT
      </button>
      <span className="text-muted-foreground/30">|</span>
      <button
        onClick={() => setLanguage("en")}
        className={cn(
          "px-1 py-0.5 transition-all duration-300",
          language === "en"
            ? "text-foreground"
            : "text-muted-foreground/50 hover:text-muted-foreground"
        )}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}
