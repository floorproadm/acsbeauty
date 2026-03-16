import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, ArrowUp, ArrowDown, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";

const CATEGORIES = [
  { value: "cabelo", label: "Cabelo" },
  { value: "sobrancelhas", label: "Sobrancelhas" },
  { value: "unhas", label: "Unhas" },
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("cabelo");
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
      toast({ title: "Imagem removida" });
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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo inválido", description: "Máximo 5MB, formato de imagem.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${newCategory}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(fileName);

      const maxOrder = images.filter((i) => i.category === newCategory).length;

      const { error: insertError } = await supabase.from("gallery_images").insert({
        category: newCategory,
        title: newTitle || null,
        image_url: urlData.publicUrl,
        display_order: maxOrder,
      });

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      toast({ title: "Foto adicionada!" });
      setDialogOpen(false);
      setNewTitle("");
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao enviar", variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold">Galeria</h2>
          <p className="text-sm text-muted-foreground">Gerencie as fotos exibidas na home.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as Category | "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Foto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Foto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={newCategory} onValueChange={(v) => setNewCategory(v as Category)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Legenda (opcional)</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Balayage loiro" />
                </div>
                <div className="space-y-2">
                  <Label>Imagem</Label>
                  <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" id="gallery-upload" />
                  <label
                    htmlFor="gallery-upload"
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
                    )}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                        <span className="text-sm text-muted-foreground">Enviando...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Clique para selecionar</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhuma foto ainda. Adicione a primeira!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image) => (
            <div key={image.id} className="group relative rounded-xl overflow-hidden border bg-card shadow-sm">
              <div className="aspect-square">
                <img src={image.image_url} alt={image.title || ""} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors" />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => handleMove(image, "up")}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => handleMove(image, "down")}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => deleteMutation.mutate(image.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-medium text-white bg-foreground/60 px-2 py-0.5 rounded-full capitalize">
                  {image.category}
                </span>
                {image.title && (
                  <p className="text-xs text-white mt-1 truncate">{image.title}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
