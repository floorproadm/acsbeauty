import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Clock,
  DollarSign,
  Pencil,
  Plus,
  ChevronDown,
  ChevronRight,
  Layers,
  Package,
  Search,
  X,
  ExternalLink,
  Eye,
  GripVertical,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VariationsModal } from "./VariationsModal";
import { SkusModal } from "./SkusModal";
import { ServiceImageUpload } from "./ServiceImageUpload";
import { ServiceVideoUpload } from "./ServiceVideoUpload";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Service {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  category: string | null;
  category_slug: string | null;
  duration_minutes: number;
  price: number;
  promo_price: number | null;
  base_price: number | null;
  is_active: boolean | null;
  hero_image_url: string | null;
  hero_video_url: string | null;
  sort_order: number;
  variations_count: number;
  skus_count: number;
}

const CATEGORIES = ["Cabelo", "Sobrancelhas", "Unhas", "Maquiagem", "Tratamentos"];

const defaultFormData = {
  name: "",
  description: "",
  category: "Cabelo",
  duration_minutes: 60,
  price: 0,
  promo_price: "",
  hero_image_url: null as string | null,
  hero_video_url: null as string | null,
};

export function ServicesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    () => CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: true }), {})
  );
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [variationsService, setVariationsService] = useState<Service | null>(null);
  const [skusService, setSkusService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services-unified"],
    queryFn: async () => {
      const [servicesRes, variationsRes, skusRes] = await Promise.all([
        supabase
          .from("services")
          .select("*")
          .order("category", { ascending: true })
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
        supabase.from("service_variations").select("service_id"),
        supabase.from("service_skus").select("service_id"),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (variationsRes.error) throw variationsRes.error;
      if (skusRes.error) throw skusRes.error;

      const varCounts: Record<string, number> = {};
      variationsRes.data?.forEach((v) => {
        varCounts[v.service_id] = (varCounts[v.service_id] || 0) + 1;
      });
      const skuCounts: Record<string, number> = {};
      skusRes.data?.forEach((s) => {
        skuCounts[s.service_id] = (skuCounts[s.service_id] || 0) + 1;
      });

      return servicesRes.data.map((s) => ({
        ...s,
        variations_count: varCounts[s.id] || 0,
        skus_count: skuCounts[s.id] || 0,
      })) as Service[];
    },
  });

  const reorderServices = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Update sort_order one by one (small lists, fine for admin)
      await Promise.all(
        orderedIds.map((id, idx) =>
          supabase.from("services").update({ sort_order: idx + 1 }).eq("id", id)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services-unified"] });
      toast({ title: "Ordem salva" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar ordem", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["admin-services-unified"] });
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Service> }) => {
      const { error } = await supabase.from("services").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services-unified"] });
      toast({ title: "Serviço atualizado!" });
      setEditingService(null);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services-unified"] });
      toast({ title: "Serviço excluído!" });
      setEditingService(null);
    },
    onError: () => {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    },
  });

  const createService = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("services").insert({
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        description: data.description || null,
        category: data.category,
        category_slug: data.category?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || null,
        duration_minutes: data.duration_minutes,
        price: data.price,
        promo_price: data.promo_price ? Number(data.promo_price) : null,
        hero_image_url: data.hero_image_url,
        hero_video_url: data.hero_video_url,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services-unified"] });
      toast({ title: "Serviço criado!" });
      setIsCreating(false);
      setFormData(defaultFormData);
    },
    onError: () => {
      toast({ title: "Erro ao criar", variant: "destructive" });
    },
  });

  const openEditModal = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description || "",
      category: service.category || "Cabelo",
      duration_minutes: service.duration_minutes,
      price: service.price,
      promo_price: service.promo_price?.toString() || "",
      hero_image_url: service.hero_image_url || null,
      hero_video_url: service.hero_video_url || null,
    });
    setEditingService(service);
  };

  const openCreateModal = (category?: string) => {
    setFormData({ ...defaultFormData, category: category || "Cabelo" });
    setIsCreating(true);
  };

  const handleSaveEdit = () => {
    if (!editingService) return;
    updateService.mutate({
      id: editingService.id,
      updates: {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        category_slug: formData.category
          ? formData.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
          : null,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        promo_price: formData.promo_price ? Number(formData.promo_price) : null,
        hero_image_url: formData.hero_image_url,
        hero_video_url: formData.hero_video_url,
      },
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.price) {
      toast({ title: "Nome e preço são obrigatórios", variant: "destructive" });
      return;
    }
    createService.mutate(formData);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredServices = normalizedQuery
    ? services?.filter((s) =>
        [s.name, s.description, s.category]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(normalizedQuery))
      )
    : services;

  const groupedServices = filteredServices?.reduce((acc, service) => {
    const category = service.category || "Outros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (category: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (normalizedQuery) return; // disable reorder while filtering

    const list = groupedServices?.[category] || [];
    const oldIndex = list.findIndex((s) => s.id === active.id);
    const newIndex = list.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(list, oldIndex, newIndex);
    reorderServices.mutate(reordered.map((s) => s.id));
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            {services?.filter((s) => s.is_active).length || 0} ativos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <a href="/services" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4 mr-1" />
                  Ver pública
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent>Ver como cliente</TooltipContent>
          </Tooltip>
          <Button size="sm" onClick={() => openCreateModal()}>
            <Plus className="w-4 h-4 mr-1" />
            Novo
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar serviços por nome, descrição ou categoria..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Modals */}
      <ServiceFormModal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        title="Editar Serviço"
        onSave={handleSaveEdit}
        isPending={updateService.isPending}
        formData={formData}
        setFormData={setFormData}
        onDelete={() => editingService && deleteService.mutate(editingService.id)}
        isDeleting={deleteService.isPending}
      />
      <ServiceFormModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Novo Serviço"
        onSave={handleCreate}
        isPending={createService.isPending}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !services?.length ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Nenhum serviço cadastrado</p>
          <Button onClick={() => openCreateModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Criar primeiro serviço
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {CATEGORIES.map((category) => {
            const categoryServices = groupedServices?.[category] || [];
            // Hide empty categories while searching to focus on matches
            if (normalizedQuery && categoryServices.length === 0) return null;
            const isOpen = normalizedQuery ? true : (openCategories[category] ?? true);

            return (
              <Collapsible
                key={category}
                open={isOpen}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <span className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-gold" />
                    {category}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({categoryServices.length})
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const catSlug = categoryServices[0]?.category_slug
                        || category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={`/servicos/${catSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                              aria-label="Ver categoria como cliente"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Ver categoria como cliente</TooltipContent>
                        </Tooltip>
                      );
                    })()}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateModal(category);
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-2 space-y-2">
                  {categoryServices.length === 0 ? (
                    <div className="text-center py-4 bg-muted/30 rounded-lg border border-dashed">
                      <p className="text-sm text-muted-foreground">Nenhum serviço</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleDragEnd(category, e)}
                    >
                      <SortableContext
                        items={categoryServices.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {categoryServices.map((service) => (
                            <SortableServiceCard
                              key={service.id}
                              service={service}
                              category={category}
                              isExpanded={expandedService === service.id}
                              onToggleExpand={() =>
                                setExpandedService(
                                  expandedService === service.id ? null : service.id
                                )
                              }
                              onEdit={() => openEditModal(service)}
                              onToggleActive={(checked) =>
                                updateService.mutate({
                                  id: service.id,
                                  updates: { is_active: checked },
                                })
                              }
                              onOpenVariations={() => setVariationsService(service)}
                              onOpenSkus={() => setSkusService(service)}
                              dragDisabled={!!normalizedQuery}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Variations Modal */}
      {variationsService && (
        <VariationsModal
          open={!!variationsService}
          onOpenChange={(open) => !open && setVariationsService(null)}
          serviceId={variationsService.id}
          serviceName={variationsService.name}
        />
      )}

      {/* SKUs Modal */}
      {skusService && (
        <SkusModal
          open={!!skusService}
          onOpenChange={(open) => !open && setSkusService(null)}
          serviceId={skusService.id}
          serviceName={skusService.name}
        />
      )}
    </div>
    </TooltipProvider>
  );
}

/* ---------- Sortable Service Card ---------- */
function SortableServiceCard({
  service,
  category,
  isExpanded,
  onToggleExpand,
  onEdit,
  onToggleActive,
  onOpenVariations,
  onOpenSkus,
  dragDisabled,
}: {
  service: Service;
  category: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onToggleActive: (checked: boolean) => void;
  onOpenVariations: () => void;
  onOpenSkus: () => void;
  dragDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: service.id,
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const categorySlug =
    service.category_slug ||
    category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-xl border border-border shadow-soft ${
        !service.is_active ? "opacity-60" : ""
      }`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              className={`shrink-0 p-1 -ml-1 text-muted-foreground/60 hover:text-foreground transition-colors touch-none ${
                dragDisabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing"
              }`}
              aria-label="Arrastar para reordenar"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </button>

            {service.hero_image_url ? (
              <img
                src={service.hero_image_url}
                alt={service.name}
                className="h-12 w-12 rounded-lg object-cover border border-border shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-muted-foreground/50" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate flex items-center gap-1.5">
                <span className="truncate">{service.name}</span>
                {service.hero_video_url && (
                  <span title="Possui vídeo" aria-label="Possui vídeo" className="shrink-0 text-[11px] leading-none">
                    🎬
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {service.duration_minutes}min
                </span>
                <span className="flex items-center gap-0.5">
                  <DollarSign className="w-3 h-3" />
                  {service.price}
                  {service.promo_price && (
                    <span className="text-rose-gold ml-0.5">→{service.promo_price}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                {service.is_active ? (
                  <a
                    href={`/servicos/${categorySlug}/${(service as any).slug || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    aria-label="Ver como cliente"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground/40 cursor-not-allowed">
                    <Eye className="w-3.5 h-3.5" />
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent>
                {service.is_active ? "Ver como cliente" : "Ative o serviço para visualizar"}
              </TooltipContent>
            </Tooltip>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Switch
              checked={service.is_active || false}
              onCheckedChange={onToggleActive}
              className="scale-75"
            />
          </div>
        </div>

        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span>
            {service.variations_count} técnica{service.variations_count !== 1 ? "s" : ""} ·{" "}
            {service.skus_count} opç{service.skus_count !== 1 ? "ões" : "ão"}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-border px-3 py-2 bg-muted/30 rounded-b-xl">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={onOpenVariations}>
              <Layers className="w-3 h-3 mr-1" />
              Técnicas ({service.variations_count})
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={onOpenSkus}>
              <Package className="w-3 h-3 mr-1" />
              Opções ({service.skus_count})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Form Modal ---------- */
function ServiceFormModal({
  isOpen,
  onClose,
  title,
  onSave,
  isPending,
  formData,
  setFormData,
  onDelete,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSave: () => void;
  isPending: boolean;
  formData: typeof defaultFormData;
  setFormData: React.Dispatch<React.SetStateAction<typeof defaultFormData>>;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Foto do Serviço</Label>
            <ServiceImageUpload
              value={formData.hero_image_url}
              onChange={(url) => setFormData({ ...formData, hero_image_url: url })}
            />
          </div>
          <div className="space-y-2">
            <Label>Vídeo do Serviço (opcional)</Label>
            <ServiceVideoUpload
              value={formData.hero_video_url}
              onChange={(url) => setFormData({ ...formData, hero_video_url: url })}
            />
            <p className="text-[11px] text-muted-foreground">
              Quando definido, o vídeo aparece no lugar da foto na página pública do serviço.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (min)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço ($)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo_price">Preço Promo ($)</Label>
              <Input
                id="promo_price"
                type="number"
                placeholder="Opcional"
                value={formData.promo_price}
                onChange={(e) => setFormData({ ...formData, promo_price: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4">
            {onDelete ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso removerá permanentemente "{formData.name}" e todas as técnicas e opções associadas. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={onSave} disabled={isPending}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
