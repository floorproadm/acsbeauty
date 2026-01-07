import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLanguage("en")}
        className={cn(
          "px-1.5 py-0.5 transition-all duration-200",
          language === "en"
            ? "font-semibold text-foreground"
            : "font-normal text-muted-foreground hover:text-foreground"
        )}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="text-muted-foreground/50">|</span>
      <button
        onClick={() => setLanguage("pt")}
        className={cn(
          "px-1.5 py-0.5 transition-all duration-200",
          language === "pt"
            ? "font-semibold text-foreground"
            : "font-normal text-muted-foreground hover:text-foreground"
        )}
        aria-label="Switch to Portuguese"
      >
        PT
      </button>
    </div>
  );
}
