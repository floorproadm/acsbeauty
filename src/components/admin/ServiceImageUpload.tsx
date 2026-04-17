import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export function ServiceImageUpload({
  value,
  onChange,
  className,
}: ServiceImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useRef(`service-img-${Math.random().toString(36).substring(7)}`);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("service-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("service-images").getPublicUrl(fileName);
      onChange(data.publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Erro no upload. Tente novamente.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id={inputId.current}
      />
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Service"
            className="w-full h-32 object-cover rounded-lg border border-border"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <label
              htmlFor={inputId.current}
              className="h-7 w-7 bg-background/90 backdrop-blur rounded-full flex items-center justify-center cursor-pointer hover:bg-background transition-colors shadow-sm"
              title="Trocar imagem"
            >
              <Upload className="h-3.5 w-3.5" />
            </label>
            <button
              type="button"
              className="h-7 w-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-sm"
              onClick={() => onChange(null)}
              title="Remover"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId.current}
          className={cn(
            "flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            "hover:border-primary hover:bg-primary/5 border-border",
            error && "border-destructive"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">Enviando...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Adicionar foto do serviço</span>
            </>
          )}
        </label>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
