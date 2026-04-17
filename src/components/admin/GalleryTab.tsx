import { useState, useRef, useCallback, useMemo, useEffect } from "react";
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
  Settings2,
  Search,
  CheckSquare,
  Square,
  FolderInput,
  Maximize2,
  Play,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GalleryLightbox } from "./GalleryLightbox";
import { GalleryCategoryManager, GalleryCategory } from "./GalleryCategoryManager";

interface GalleryImage {
  id: string;
  category: string;
  title: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  media_type?: string | null;
}

type StatusFilter = "all" | "visible" | "hidden";
type SortMode = "manual" | "newest" | "oldest";

// ----- Sortable card -----
interface SortableCardProps {
  image: GalleryImage;
  isSelected: boolean;
  selectionMode: boolean;
  isInBulk: boolean;
  categoryEmoji: string;
  onClick: () => void;
  onDoubleClick: () => void;
  onToggleBulk: () => void;
}

function SortableCard({
  image,
  isSelected,
  selectionMode,
  isInBulk,
  categoryEmoji,
  onClick,
  onDoubleClick,
  onToggleBulk,
}: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200 touch-none",
        isSelected && !selectionMode
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[0.97]"
          : "hover:opacity-90",
        isInBulk && "ring-2 ring-primary",
        !image.is_active && "opacity-50",
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (selectionMode) {
          onToggleBulk();
        } else {
          onClick();
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!selectionMode) onDoubleClick();
      }}
    >
      <div className="aspect-square">
        <img
          src={image.image_url}
          alt={image.title || ""}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          draggable={false}
        />
      </div>
      <div className="absolute top-1 left-1">
        <span className="text-[10px] font-medium bg-foreground/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
          {categoryEmoji}
        </span>
      </div>
      {!image.is_active && (
        <div className="absolute top-1 right-1">
          <EyeOff className="w-3 h-3 text-white drop-shadow-md" />
        </div>
      )}
      {selectionMode && (
        <div className="absolute bottom-1 right-1">
          {isInBulk ? (
            <CheckSquare className="w-5 h-5 text-primary bg-background rounded" />
          ) : (
            <Square className="w-5 h-5 text-white drop-shadow-md" />
          )}
        </div>
      )}
      {isSelected && !selectionMode && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}

export function GalleryTab() {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCategory, setUploadCategory] = useState<string>("cabelo");
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Categories
  const { data: categories = [] } = useQuery({
    queryKey: ["gallery-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_categories" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as GalleryCategory[];
    },
  });

  // Images
  const { data: images = [], isLoading } = useQuery({
    queryKey: ["gallery-images-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  // Make sure uploadCategory is valid
  useEffect(() => {
    if (categories.length && !categories.find((c) => c.slug === uploadCategory)) {
      setUploadCategory(categories[0].slug);
    }
  }, [categories, uploadCategory]);

  // Filtered + sorted view
  const visibleImages = useMemo(() => {
    let filtered = images;
    if (filterCategory !== "all") filtered = filtered.filter((i) => i.category === filterCategory);
    if (statusFilter === "visible") filtered = filtered.filter((i) => i.is_active);
    if (statusFilter === "hidden") filtered = filtered.filter((i) => !i.is_active);
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter((i) => (i.title || "").toLowerCase().includes(t));
    }
    if (sortMode === "newest") {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (sortMode === "oldest") {
      filtered = [...filtered].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    }
    return filtered;
  }, [images, filterCategory, statusFilter, sortMode, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const visible = images.filter((i) => i.is_active).length;
    const hidden = images.length - visible;
    return { total: images.length, visible, hidden };
  }, [images]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: images.length };
    categories.forEach((c) => {
      map[c.slug] = images.filter((i) => i.category === c.slug).length;
    });
    return map;
  }, [images, categories]);

  // ----- Mutations -----
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images-admin"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images-public"] });
      toast({ title: "Foto removida ✓" });
      setSelectedImage(null);
      setDeleteTarget(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("gallery_images").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images-admin"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images-public"] });
      toast({ title: `${bulkSelected.size} foto(s) removida(s) ✓` });
      setBulkSelected(new Set());
      setSelectionMode(false);
      setBulkDeleteOpen(false);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Partial<GalleryImage> }) => {
      const { error } = await supabase.from("gallery_images").update(patch).in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images-admin"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images-public"] });
      toast({ title: `${vars.ids.length} foto(s) atualizada(s) ✓` });
      setBulkSelected(new Set());
      setSelectionMode(false);
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
      queryClient.invalidateQueries({ queryKey: ["gallery-images-admin"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images-public"] });
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
      queryClient.invalidateQueries({ queryKey: ["gallery-images-admin"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images-public"] });
      toast({ title: "Legenda salva ✓" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      const { error } = await supabase
        .from("gallery_images")
        .update({ category })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images-admin"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images-public"] });
      toast({ title: "Categoria atualizada ✓" });
    },
  });

  const reorderBatchMutation = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      // Sequential updates (small batches in practice)
      for (const u of updates) {
        const { error } = await supabase
          .from("gallery_images")
          .update({ display_order: u.display_order })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images-admin"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images-public"] });
    },
  });

  // ----- Upload (shared by file input + drag-drop) -----
  const processFiles = useCallback(
    async (files: File[]) => {
      const validFiles = files.filter(
        (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024,
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
          const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(fileName);
          const currentImages = images.filter((i) => i.category === uploadCategory);
          const maxOrder = currentImages.length + uploaded;
          const { error: insertError } = await supabase.from("gallery_images").insert({
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

      queryClient.invalidateQueries({ queryKey: ["gallery-images-admin"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-images-public"] });
      toast({
        title: `${uploaded} foto${uploaded > 1 ? "s" : ""} adicionada${uploaded > 1 ? "s" : ""} ✓`,
      });
      setUploading(false);
      setUploadProgress(0);
      setShowUploadArea(false);
      if (inputRef.current) inputRef.current.value = "";
    },
    [uploadCategory, images, queryClient, toast],
  );

  const handleMultiUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) processFiles(files);
    },
    [processFiles],
  );

  // ----- Drag & drop reordering -----
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (sortMode !== "manual") {
      toast({
        title: "Mude para 'Ordem manual' para reordenar",
        variant: "destructive",
      });
      return;
    }

    const oldIndex = visibleImages.findIndex((i) => i.id === active.id);
    const newIndex = visibleImages.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(visibleImages, oldIndex, newIndex);
    const updates = reordered.map((img, idx) => ({ id: img.id, display_order: idx }));

    // Optimistic
    queryClient.setQueryData<GalleryImage[]>(["gallery-images-admin"], (old) => {
      if (!old) return old;
      const map = new Map(updates.map((u) => [u.id, u.display_order]));
      return old.map((i) => (map.has(i.id) ? { ...i, display_order: map.get(i.id)! } : i));
    });

    reorderBatchMutation.mutate(updates);
  }

  const categoryLabel = (cat: string) =>
    categories.find((c) => c.slug === cat)?.label || cat;
  const categoryEmoji = (cat: string) =>
    categories.find((c) => c.slug === cat)?.emoji || "📷";

  // ----- Drag drop file zone -----
  function onDropFiles(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) {
      setShowUploadArea(true);
      processFiles(files);
    }
  }

  function toggleBulk(id: string) {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className="space-y-5"
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes("Files")) setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setIsDragOver(false);
      }}
      onDrop={onDropFiles}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-[200] bg-primary/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-background rounded-2xl px-6 py-4 shadow-lg border-2 border-dashed border-primary">
            <p className="font-medium text-primary">Solte para enviar</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-serif font-bold">Galeria</h2>
          <p className="text-xs text-muted-foreground">
            {stats.visible} visíveis · {stats.hidden} ocultas · {stats.total} totais
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => setCategoryManagerOpen(true)}
            title="Gerenciar categorias"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={selectionMode ? "secondary" : "ghost"}
            className="gap-1.5 rounded-full px-3 h-9"
            onClick={() => {
              setSelectionMode(!selectionMode);
              setBulkSelected(new Set());
              setSelectedImage(null);
            }}
          >
            {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            <span className="hidden sm:inline">{selectionMode ? "Sair" : "Selecionar"}</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5 rounded-full px-4 h-9"
            onClick={() => setShowUploadArea(!showUploadArea)}
          >
            {showUploadArea ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            <span className="hidden sm:inline">{showUploadArea ? "Fechar" : "Enviar"}</span>
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      {showUploadArea && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setUploadCategory(c.slug)}
                className={cn(
                  "shrink-0 py-2 px-3 rounded-lg text-xs font-medium transition-all min-w-[80px]",
                  uploadCategory === c.slug
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                <span className="block text-base mb-0.5">{c.emoji || "📷"}</span>
                {c.label}
              </button>
            ))}
          </div>

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
              uploading && "pointer-events-none opacity-70",
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
                  Toque ou arraste fotos aqui
                </span>
                <span className="text-xs text-muted-foreground">
                  Múltiplas fotos • Máx 5MB cada
                </span>
              </>
            )}
          </label>
        </div>
      )}

      {/* Search + filters row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por legenda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                {statusFilter === "all"
                  ? "Todas"
                  : statusFilter === "visible"
                    ? "Visíveis"
                    : "Ocultas"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>Todas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("visible")}>
                Visíveis
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("hidden")}>
                Ocultas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                {sortMode === "manual"
                  ? "Manual"
                  : sortMode === "newest"
                    ? "↓ Recentes"
                    : "↑ Antigas"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortMode("manual")}>
                Ordem manual
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode("newest")}>
                Mais recentes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode("oldest")}>
                Mais antigas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => setFilterCategory("all")}
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-medium transition-all shrink-0",
            filterCategory === "all"
              ? "bg-foreground text-background shadow-sm"
              : "bg-muted text-muted-foreground",
          )}
        >
          📷 Todas
          <span
            className={cn(
              "ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full",
              filterCategory === "all" ? "bg-background/20" : "bg-foreground/5",
            )}
          >
            {counts.all || 0}
          </span>
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setFilterCategory(c.slug)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-medium transition-all shrink-0",
              filterCategory === c.slug
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted text-muted-foreground",
            )}
          >
            {c.emoji || "📷"} {c.label}
            <span
              className={cn(
                "ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full",
                filterCategory === c.slug ? "bg-background/20" : "bg-foreground/5",
              )}
            >
              {counts[c.slug] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectionMode && bulkSelected.size > 0 && (
        <div className="sticky top-0 z-30 bg-card border rounded-xl shadow-sm p-2.5 flex items-center justify-between gap-2 animate-in slide-in-from-top-2">
          <span className="text-sm font-medium pl-1">
            {bulkSelected.size} selecionada{bulkSelected.size > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() =>
                bulkUpdateMutation.mutate({
                  ids: [...bulkSelected],
                  patch: { is_active: false },
                })
              }
            >
              <EyeOff className="w-3.5 h-3.5" />
              Ocultar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() =>
                bulkUpdateMutation.mutate({
                  ids: [...bulkSelected],
                  patch: { is_active: true },
                })
              }
            >
              <Eye className="w-3.5 h-3.5" />
              Mostrar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                  <FolderInput className="w-3.5 h-3.5" />
                  Mover
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mover para</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((c) => (
                  <DropdownMenuItem
                    key={c.slug}
                    onClick={() =>
                      bulkUpdateMutation.mutate({
                        ids: [...bulkSelected],
                        patch: { category: c.slug },
                      })
                    }
                  >
                    {c.emoji} {c.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </Button>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : visibleImages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma foto</p>
          <p className="text-xs mt-1">
            {images.length === 0 ? 'Toque em "Enviar" para começar.' : "Ajuste os filtros."}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleImages.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {visibleImages.map((image, idx) => (
                <SortableCard
                  key={image.id}
                  image={image}
                  isSelected={selectedImage?.id === image.id}
                  selectionMode={selectionMode}
                  isInBulk={bulkSelected.has(image.id)}
                  categoryEmoji={categoryEmoji(image.category)}
                  onClick={() => {
                    if (selectedImage?.id === image.id) {
                      setSelectedImage(null);
                    } else {
                      setSelectedImage(image);
                      setEditingTitle(image.title || "");
                    }
                  }}
                  onDoubleClick={() => setLightboxIndex(idx)}
                  onToggleBulk={() => toggleBulk(image.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit Sheet */}
      <Sheet
        open={!!selectedImage && !selectionMode}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>Editar foto</SheetTitle>
            <SheetDescription>Altere legenda, categoria ou visibilidade.</SheetDescription>
          </SheetHeader>

          {selectedImage && (
            <div className="flex-1 overflow-y-auto space-y-4 mt-4">
              <div
                className="relative rounded-lg overflow-hidden bg-muted aspect-square cursor-zoom-in"
                onClick={() => {
                  const idx = visibleImages.findIndex((i) => i.id === selectedImage.id);
                  if (idx >= 0) setLightboxIndex(idx);
                }}
              >
                <img
                  src={selectedImage.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-foreground/60 text-white p-1.5 rounded-full">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Legenda</label>
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  placeholder="Adicionar legenda..."
                  onBlur={() => {
                    if ((editingTitle || null) !== selectedImage.title) {
                      updateTitleMutation.mutate({
                        id: selectedImage.id,
                        title: editingTitle || null,
                      });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {categoryEmoji(selectedImage.category)} {categoryLabel(selectedImage.category)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {categories.map((c) => (
                      <DropdownMenuItem
                        key={c.slug}
                        onClick={() =>
                          updateCategoryMutation.mutate({
                            id: selectedImage.id,
                            category: c.slug,
                          })
                        }
                      >
                        {c.emoji} {c.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Detalhes</label>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedImage.is_active ? "Visível" : "Oculta"}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {new Date(selectedImage.created_at).toLocaleDateString("pt-BR")}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() =>
                    toggleActiveMutation.mutate({
                      id: selectedImage.id,
                      is_active: !selectedImage.is_active,
                    })
                  }
                >
                  {selectedImage.is_active ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Ocultar do site
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Mostrar no site
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => setDeleteTarget(selectedImage)}
                >
                  <Trash2 className="w-4 h-4" />
                  Remover foto
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Lightbox */}
      <GalleryLightbox
        images={visibleImages.map((i) => ({
          id: i.id,
          image_url: i.image_url,
          title: i.title,
        }))}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />

      {/* Category manager */}
      <GalleryCategoryManager
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
      />

      {/* Single delete */}
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
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {bulkSelected.size} foto(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate([...bulkSelected])}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
