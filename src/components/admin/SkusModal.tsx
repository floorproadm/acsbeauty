import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Package,
  Save,
  X,
  Clock,
  DollarSign,
} from "lucide-react";
import { ServiceImageUpload } from "./ServiceImageUpload";

interface Sku {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  promo_price: number | null;
  variation_id: string | null;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
}

interface Variation {
  id: string;
  name: string;
}

interface SkuFormData {
  name: string;
  duration_minutes: number;
  price: string;
  promo_price: string;
  variation_id: string | null;
  is_active: boolean;
  image_url: string | null;
}

const emptyForm: SkuFormData = {
  name: "",
  duration_minutes: 30,
  price: "",
  promo_price: "",
  variation_id: null,
  is_active: true,
  image_url: null,
};

interface SkusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceName: string;
}

export function SkusModal({
  open,
  onOpenChange,
  serviceId,
  serviceName,
}: SkusModalProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SkuFormData>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch variations for select
  const { data: variations } = useQuery({
    queryKey: ["service-variations-list", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_variations")
        .select("id, name")
        .eq("service_id", serviceId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Variation[];
    },
    enabled: open && !!serviceId,
  });

  // Fetch SKUs for this service
  const { data: skus, isLoading } = useQuery({
    queryKey: ["service-skus-crud", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_skus")
        .select(`
          id, name, duration_minutes, price, promo_price, 
          variation_id, sort_order, is_active, image_url,
          service_variations (name)
        `)
        .eq("service_id", serviceId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data.map((sku) => ({
        ...sku,
        variation_name: sku.service_variations?.name || null,
      })) as (Sku & { variation_name: string | null })[];
    },
    enabled: open && !!serviceId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SkuFormData) => {
      const maxOrder = skus?.reduce((max, s) => Math.max(max, s.sort_order), -1) ?? -1;

      const { error } = await supabase.from("service_skus").insert({
        service_id: serviceId,
        name: data.name.trim(),
        duration_minutes: data.duration_minutes,
        price: data.price ? parseFloat(data.price) : null,
        promo_price: data.promo_price ? parseFloat(data.promo_price) : null,
        variation_id: data.variation_id || null,
        sort_order: maxOrder + 1,
        is_active: data.is_active,
        image_url: data.image_url,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-skus-crud", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-with-sku-counts"] });
      resetForm();
      toast.success("Opção criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SkuFormData> }) => {
      const updates: Record<string, unknown> = {};
      
      if (data.name !== undefined) updates.name = data.name.trim();
      if (data.duration_minutes !== undefined) updates.duration_minutes = data.duration_minutes;
      if (data.price !== undefined) updates.price = data.price ? parseFloat(data.price) : null;
      if (data.promo_price !== undefined) updates.promo_price = data.promo_price ? parseFloat(data.promo_price) : null;
      if (data.variation_id !== undefined) updates.variation_id = data.variation_id || null;
      if (data.is_active !== undefined) updates.is_active = data.is_active;
      if (data.image_url !== undefined) updates.image_url = data.image_url;

      const { error } = await supabase.from("service_skus").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-skus-crud", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-with-sku-counts"] });
      resetForm();
      toast.success("Opção atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_skus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-skus-crud", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-with-sku-counts"] });
      setDeleteId(null);
      toast.success("Opção excluída!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!skus) return;

      const currentIndex = skus.findIndex((s) => s.id === id);
      if (currentIndex === -1) return;

      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= skus.length) return;

      const current = skus[currentIndex];
      const swap = skus[swapIndex];

      await supabase.from("service_skus").update({ sort_order: swap.sort_order }).eq("id", current.id);
      await supabase.from("service_skus").update({ sort_order: current.sort_order }).eq("id", swap.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-skus-crud", serviceId] });
    },
  });

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleStartEdit = (sku: Sku) => {
    setEditingId(sku.id);
    setFormData({
      name: sku.name,
      duration_minutes: sku.duration_minutes,
      price: sku.price?.toString() || "",
      promo_price: sku.promo_price?.toString() || "",
      variation_id: sku.variation_id,
      is_active: sku.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || formData.duration_minutes <= 0) {
      toast.error("Nome e duração são obrigatórios");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (sku: Sku) => {
    updateMutation.mutate({ id: sku.id, data: { is_active: !sku.is_active } });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-gold" />
              Opções: {serviceName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add/Edit Form */}
            {showForm ? (
              <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {editingId ? "Editar Opção" : "Nova Opção"}
                  </h4>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome da Opção *</Label>
                    <Input
                      placeholder="Ex: 30 min, Cabelo Curto..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Duração (min) *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.duration_minutes}
                      onChange={(e) =>
                        setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div>
                    <Label>Técnica (opcional)</Label>
                    <Select
                      value={formData.variation_id || "none"}
                      onValueChange={(v) =>
                        setFormData({ ...formData, variation_id: v === "none" ? null : v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sem técnica" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem técnica</SelectItem>
                        {variations?.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Preço ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Preço Promo ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={formData.promo_price}
                      onChange={(e) => setFormData({ ...formData, promo_price: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                      <Label>Ativo</Label>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? "Salvar" : "Criar"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Nova Opção
              </Button>
            )}

            {/* List */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !skus?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Nenhuma opção cadastrada</p>
                <p className="text-sm">Opções definem durações e preços específicos.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {skus.map((sku, index) => (
                  <div
                    key={sku.id}
                    className={`flex items-center gap-2 p-3 border rounded-lg bg-card ${
                      !sku.is_active ? "opacity-60" : ""
                    }`}
                  >
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={index === 0 || reorderMutation.isPending}
                        onClick={() => reorderMutation.mutate({ id: sku.id, direction: "up" })}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={index === skus.length - 1 || reorderMutation.isPending}
                        onClick={() => reorderMutation.mutate({ id: sku.id, direction: "down" })}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{sku.name}</span>
                        {sku.variation_name && (
                          <Badge variant="outline" className="text-xs">
                            {sku.variation_name}
                          </Badge>
                        )}
                        <Badge variant={sku.is_active ? "default" : "secondary"}>
                          {sku.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sku.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {sku.price ? `$${sku.price}` : "-"}
                          {sku.promo_price && (
                            <span className="text-rose-gold ml-1">(promo: ${sku.promo_price})</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Switch checked={sku.is_active} onCheckedChange={() => handleToggleActive(sku)} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(sku)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(sku.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Opção?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
