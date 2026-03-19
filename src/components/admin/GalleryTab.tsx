import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Loader2,
  ImageIcon,
  Camera,
  X,
  Check,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CATEGORIES = [
  { value: "cabelo", label: "Cabelo", emoji: "💇‍♀️" },
  { value: "sobrancelhas", label: "Sobrancelhas", emoji: "✨" },
  { value: "unhas", label: "Unhas", emoji: "💅" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

interface GalleryImage {
  id: string;
  category: string;
  title: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export function GalleryTab() {
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCategory, setUploadCategory] = useState<Category>("cabelo");
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["gallery-images", filterCategory],
    queryFn: async () => {
      let query = supabase
        .from("gallery_images")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (filterCategory !== "all") {
        query = query.eq("category", filterCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      toast({ title: "Foto removida ✓" });
      setSelectedImage(null);
      setDeleteTarget(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("gallery_images")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      toast({ title: "Visibilidade atualizada ✓" });
    },
  });

  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string | null }) => {
      const { error } = await supabase
        .from("gallery_images")
        .update({ title })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      toast({ title: "Legenda salva ✓" });
      setSelectedImage(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("gallery_images")
        .update({ display_order: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
    },
  });

  const handleMultiUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const validFiles = files.filter(
        (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
      );

      if (validFiles.length !== files.length) {
        toast({
          title: `${files.length - validFiles.length} arquivo(s) ignorado(s)`,
          description: "Máximo 5MB, formato de imagem.",
          variant: "destructive",
        });
      }

      if (!validFiles.length) return;

      setUploading(true);
      setUploadProgress(0);

      let uploaded = 0;

      for (const file of validFiles) {
        try {
          const ext = file.name.split(".").pop();
          const fileName = `${uploadCategory}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("gallery")
            .upload(fileName, file, { cacheControl: "3600", upsert: false });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("gallery")
            .getPublicUrl(fileName);

          const currentImages = images.filter((i) => i.category === uploadCategory);
          const maxOrder = currentImages.length + uploaded;

          const { error: insertError } = await supabase
            .from("gallery_images")
            .insert({
              category: uploadCategory,
              title: null,
              image_url: urlData.publicUrl,
              display_order: maxOrder,
            });

          if (insertError) throw insertError;
          uploaded++;
          setUploadProgress(Math.round((uploaded / validFiles.length) * 100));
        } catch (err) {
          console.error("Upload error:", err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      toast({
        title: `${uploaded} foto${uploaded > 1 ? "s" : ""} adicionada${uploaded > 1 ? "s" : ""} ✓`,
      });
      setUploading(false);
      setUploadProgress(0);
      setShowUploadArea(false);
      if (inputRef.current) inputRef.current.value = "";
    },
    [uploadCategory, images, queryClient, toast]
  );

  function handleMove(image: GalleryImage, direction: "up" | "down") {
    const categoryImages = images
      .filter((i) => i.category === image.category)
      .sort((a, b) => a.display_order - b.display_order);

    const idx = categoryImages.findIndex((i) => i.id === image.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categoryImages.length) return;

    const other = categoryImages[swapIdx];
    reorderMutation.mutate({ id: image.id, newOrder: other.display_order });
    reorderMutation.mutate({ id: other.id, newOrder: image.display_order });
  }

  const categoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.label || cat;

  const categoryEmoji = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.emoji || "";

  const counts = {
    all: images.length,
    cabelo: images.filter((i) => i.category === "cabelo").length,
    sobrancelhas: images.filter((i) => i.category === "sobrancelhas").length,
    unhas: images.filter((i) => i.category === "unhas").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold">Galeria</h2>
          <p className="text-xs text-muted-foreground">
            {images.length} foto{images.length !== 1 ? "s" : ""} na home
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 rounded-full px-4"
          onClick={() => setShowUploadArea(!showUploadArea)}
        >
          {showUploadArea ? (
            <X className="w-4 h-4" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {showUploadArea ? "Fechar" : "Enviar"}
        </Button>
      </div>

      {/* Upload Area — inline, no dialog */}
      {showUploadArea && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Category pills */}
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setUploadCategory(c.value)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                  uploadCategory === c.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <span className="block text-base mb-0.5">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Upload button */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleMultiUpload}
            className="hidden"
            id="gallery-multi-upload"
          />
          <label
            htmlFor="gallery-multi-upload"
            className={cn(
              "flex flex-col items-center justify-center gap-2 py-8 rounded-lg cursor-pointer transition-all",
              "bg-background border border-border hover:border-primary/50 hover:shadow-sm",
              uploading && "pointer-events-none opacity-70"
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">
                  Enviando... {uploadProgress}%
                </span>
                <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Toque para selecionar fotos
                </span>
                <span className="text-xs text-muted-foreground">
                  Múltiplas fotos • Máx 5MB cada
                </span>
              </>
            )}
          </label>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {[
          { value: "all" as const, label: "Todas", emoji: "📷" },
          ...CATEGORIES,
        ].map((c) => (
          <button
            key={c.value}
            onClick={() => setFilterCategory(c.value)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-medium transition-all shrink-0",
              filterCategory === c.value
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted text-muted-foreground"
            )}
          >
            {c.emoji} {c.label}
            <span
              className={cn(
                "ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full",
                filterCategory === c.value
                  ? "bg-background/20"
                  : "bg-foreground/5"
              )}
            >
              {counts[c.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma foto ainda</p>
          <p className="text-xs mt-1">
            Toque em "Enviar" para adicionar a primeira!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {images.map((image) => {
            const isSelected = selectedImage?.id === image.id;
            return (
              <div
                key={image.id}
                className={cn(
                  "relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[0.97]"
                    : "hover:opacity-90",
                  !image.is_active && "opacity-50"
                )}
                onClick={() => {
                  if (isSelected) {
                    setSelectedImage(null);
                  } else {
                    setSelectedImage(image);
                    setEditingTitle(image.title || "");
                  }
                }}
              >
                <div className="aspect-square">
                  <img
                    src={image.image_url}
                    alt={image.title || ""}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Category badge — always visible */}
                <div className="absolute top-1 left-1">
                  <span className="text-[10px] font-medium bg-foreground/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm capitalize">
                    {categoryEmoji(image.category)}
                  </span>
                </div>
                {/* Hidden badge */}
                {!image.is_active && (
                  <div className="absolute top-1 right-1">
                    <EyeOff className="w-3 h-3 text-white drop-shadow-md" />
                  </div>
                )}
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Action Bar — appears when image is selected */}
      {selectedImage && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50 animate-in slide-in-from-bottom-4 duration-200 safe-bottom">
          <div className="max-w-3xl mx-auto p-3 space-y-3">
            {/* Preview + title */}
            <div className="flex gap-3 items-start">
              <img
                src={selectedImage.image_url}
                alt=""
                className="h-16 w-16 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  placeholder="Adicionar legenda..."
                  className="h-8 text-sm"
                />
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    {categoryLabel(selectedImage.category)}
                  </Badge>
                  <span>•</span>
                  <span>
                    {selectedImage.is_active ? "Visível" : "Oculta"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {/* Save title */}
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5 text-xs"
                onClick={() =>
                  updateTitleMutation.mutate({
                    id: selectedImage.id,
                    title: editingTitle || null,
                  })
                }
                disabled={updateTitleMutation.isPending}
              >
                <Check className="w-3.5 h-3.5" />
                Salvar
              </Button>

              {/* Toggle visibility */}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() =>
                  toggleActiveMutation.mutate({
                    id: selectedImage.id,
                    is_active: !selectedImage.is_active,
                  })
                }
                disabled={toggleActiveMutation.isPending}
              >
                {selectedImage.is_active ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                {selectedImage.is_active ? "Ocultar" : "Mostrar"}
              </Button>

              {/* Move */}
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  handleMove(selectedImage, "up");
                }}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </Button>

              {/* Delete */}
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8 shrink-0"
                onClick={() => setDeleteTarget(selectedImage)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. A foto será removida da galeria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
