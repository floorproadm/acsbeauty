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
} from "lucide-react";
import { VariationsModal } from "./VariationsModal";
import { SkusModal } from "./SkusModal";
import { ServiceImageUpload } from "./ServiceImageUpload";

type ServiceStatus = "entry" | "upsell" | "premium" | "inactive";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  category_slug: string | null;
  duration_minutes: number;
  price: number;
  promo_price: number | null;
  base_price: number | null;
  status: ServiceStatus | null;
  is_active: boolean | null;
  hero_image_url: string | null;
  variations_count: number;
  skus_count: number;
}

const CATEGORIES = ["Cabelo", "Sobrancelhas", "Unhas", "Maquiagem", "Tratamentos"];

const statusConfig: Record<ServiceStatus, { label: string; color: string }> = {
  entry: { label: "Entrada", color: "bg-green-100 text-green-700" },
  upsell: { label: "Upsell", color: "bg-blue-100 text-blue-700" },
  premium: { label: "Premium", color: "bg-purple-100 text-purple-700" },
  inactive: { label: "Inativo", color: "bg-gray-100 text-gray-500" },
};

const defaultFormData = {
  name: "",
  description: "",
  category: "Cabelo",
  duration_minutes: 60,
  price: 0,
  promo_price: "",
  status: "entry" as ServiceStatus,
  hero_image_url: null as string | null,
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

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services-unified"],
    queryFn: async () => {
      const [servicesRes, variationsRes, skusRes] = await Promise.all([
        supabase
          .from("services")
          .select("*")
          .order("category", { ascending: true })
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
        status: data.status,
        hero_image_url: data.hero_image_url,
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

  const cycleStatus = (currentStatus: ServiceStatus | null) => {
    const order: ServiceStatus[] = ["entry", "upsell", "premium", "inactive"];
    const idx = order.indexOf(currentStatus || "entry");
    return order[(idx + 1) % order.length];
  };

  const openEditModal = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description || "",
      category: service.category || "Cabelo",
      duration_minutes: service.duration_minutes,
      price: service.price,
      promo_price: service.promo_price?.toString() || "",
      status: service.status || "entry",
      hero_image_url: service.hero_image_url || null,
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
        status: formData.status,
        hero_image_url: formData.hero_image_url,
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

  const groupedServices = services?.reduce((acc, service) => {
    const category = service.category || "Outros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            {services?.filter((s) => s.is_active).length || 0} ativos
          </p>
        </div>
        <Button size="sm" onClick={() => openCreateModal()}>
          <Plus className="w-4 h-4 mr-1" />
          Novo
        </Button>
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
            const isOpen = openCategories[category] ?? true;

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
                    categoryServices.map((service) => {
                      const status = statusConfig[service.status as ServiceStatus] || statusConfig.entry;
                      const isExpanded = expandedService === service.id;
                      const hasTechniques = service.variations_count > 0 || service.skus_count > 0;

                      return (
                        <div
                          key={service.id}
                          className={`bg-card rounded-xl border border-border shadow-soft ${
                            !service.is_active ? "opacity-60" : ""
                          }`}
                        >
                          {/* Main row */}
                          <div className="p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-sm truncate">{service.name}</h3>
                                  <Badge
                                    variant="outline"
                                    className={`${status.color} text-[10px] px-1.5 py-0 cursor-pointer hover:opacity-80 shrink-0`}
                                    onClick={() =>
                                      updateService.mutate({
                                        id: service.id,
                                        updates: { status: cycleStatus(service.status as ServiceStatus) },
                                      })
                                    }
                                  >
                                    {status.label}
                                  </Badge>
                                </div>
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

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => openEditModal(service)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Switch
                                  checked={service.is_active || false}
                                  onCheckedChange={(checked) =>
                                    updateService.mutate({ id: service.id, updates: { is_active: checked } })
                                  }
                                  className="scale-75"
                                />
                              </div>
                            </div>

                            {/* Expandable techniques/options row */}
                            <button
                              onClick={() => setExpandedService(isExpanded ? null : service.id)}
                              className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              <span>
                                {service.variations_count} técnica{service.variations_count !== 1 ? "s" : ""} ·{" "}
                                {service.skus_count} opç{service.skus_count !== 1 ? "ões" : "ão"}
                              </span>
                            </button>
                          </div>

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="border-t border-border px-3 py-2 bg-muted/30 rounded-b-xl">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => setVariationsService(service)}
                                >
                                  <Layers className="w-3 h-3 mr-1" />
                                  Técnicas ({service.variations_count})
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => setSkusService(service)}
                                >
                                  <Package className="w-3 h-3 mr-1" />
                                  Opções ({service.skus_count})
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
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
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ServiceStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
