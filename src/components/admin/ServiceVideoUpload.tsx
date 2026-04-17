import { useState, useRef } from "react";
import { Upload, X, Loader2, Video as VideoIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ServiceVideoUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/mov"];
const MAX_SIZE_MB = 50;

export function ServiceVideoUpload({
  value,
  onChange,
  className,
}: ServiceVideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useRef(`service-vid-${Math.random().toString(36).substring(7)}`);

  async function uploadFile(file: File) {
    // Validate type (some browsers report empty mime — fallback to extension)
    const isAcceptedType =
      file.type.startsWith("video/") ||
      /\.(mp4|mov|webm|m4v)$/i.test(file.name);
    if (!isAcceptedType) {
      setError("Selecione um arquivo de vídeo (MP4, MOV ou WebM).");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`O vídeo deve ter no máximo ${MAX_SIZE_MB}MB.`);
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(10);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `videos/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Simulate progress while upload is in flight (Supabase JS SDK has no real progress event)
      const progressInterval = setInterval(() => {
        setProgress((p) => (p < 85 ? p + 5 : p));
      }, 300);

      const { error: uploadError } = await supabase.storage
        .from("service-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "video/mp4",
        });

      clearInterval(progressInterval);
      if (uploadError) throw uploadError;

      setProgress(100);
      const { data } = supabase.storage.from("service-images").getPublicUrl(fileName);
      onChange(data.publicUrl);
    } catch (err) {
      console.error("Video upload error:", err);
      setError("Erro no upload. Tente novamente.");
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*"
        onChange={handleFileChange}
        className="hidden"
        id={inputId.current}
      />
      {value ? (
        <div
          className={cn(
            "relative group rounded-lg border border-border transition-all overflow-hidden bg-muted",
            isDragging && "ring-2 ring-primary ring-offset-2"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <video
            src={value}
            controls
            playsInline
            preload="metadata"
            className="w-full h-40 object-contain bg-black"
          />
          {isDragging && (
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
              <span className="text-sm font-medium text-primary-foreground bg-primary px-3 py-1 rounded-full">
                Solte para substituir
              </span>
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            <label
              htmlFor={inputId.current}
              className="h-7 w-7 bg-background/90 backdrop-blur rounded-full flex items-center justify-center cursor-pointer hover:bg-background transition-colors shadow-sm"
              title="Trocar vídeo"
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
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed rounded-lg cursor-pointer transition-all",
            "hover:border-primary hover:bg-primary/5",
            isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border",
            error && "border-destructive"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">
                Enviando vídeo... {progress}%
              </span>
              <div className="w-3/4 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : isDragging ? (
            <>
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium text-primary">Solte o vídeo aqui</span>
            </>
          ) : (
            <>
              <VideoIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Arraste um vídeo ou clique para selecionar
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                MP4, MOV, WebM até {MAX_SIZE_MB}MB
              </span>
            </>
          )}
        </label>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
