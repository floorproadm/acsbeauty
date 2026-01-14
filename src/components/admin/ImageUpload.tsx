import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "auto";
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = "general",
  className,
  aspectRatio = "auto",
  placeholder = "Adicionar imagem",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("quiz-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("quiz-images")
        .getPublicUrl(fileName);

      onChange(publicUrlData.publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Erro ao fazer upload. Tente novamente.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleRemove() {
    onChange(null);
  }

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  };

  if (value) {
    return (
      <div className={cn("relative group", className)}>
        <img
          src={value}
          alt="Uploaded"
          className={cn(
            "w-full object-cover rounded-lg border",
            aspectClasses[aspectRatio]
          )}
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className={cn(
          "flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          "hover:border-primary hover:bg-primary/5",
          error && "border-destructive",
          aspectClasses[aspectRatio]
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            <span className="text-sm text-muted-foreground">Enviando...</span>
          </>
        ) : (
          <>
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          </>
        )}
      </label>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// Compact version for options
interface CompactImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
}

export function CompactImageUpload({
  value,
  onChange,
  folder = "options",
}: CompactImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("quiz-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("quiz-images")
        .getPublicUrl(fileName);

      onChange(publicUrlData.publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  const inputId = `compact-upload-${Math.random().toString(36).substring(7)}`;

  if (value) {
    return (
      <div className="relative group">
        <img
          src={value}
          alt="Option"
          className="h-10 w-10 object-cover rounded-lg border"
        />
        <button
          type="button"
          className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onChange(null)}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id={inputId}
      />
      <label
        htmlFor={inputId}
        className="h-10 w-10 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </label>
    </>
  );
}
