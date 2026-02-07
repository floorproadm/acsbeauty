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
  Layers,
  Save,
  X,
} from "lucide-react";

interface Variation {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

interface VariationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceName: string;
}

export function VariationsModal({
  open,
  onOpenChange,
  serviceId,
  serviceName,
}: VariationsModalProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch variations for this service
  const { data: variations, isLoading } = useQuery({
    queryKey: ["service-variations-crud", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_variations")
        .select("id, name, sort_order, is_active")
        .eq("service_id", serviceId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Variation[];
    },
    enabled: open && !!serviceId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = variations?.reduce((max, v) => Math.max(max, v.sort_order), -1) ?? -1;
      
      const { error } = await supabase.from("service_variations").insert({
        service_id: serviceId,
        name: name.trim(),
        sort_order: maxOrder + 1,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-variations-crud", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-with-sku-counts"] });
      setNewName("");
      setShowNewForm(false);
      toast.success("Variação criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Variation> }) => {
      const { error } = await supabase
        .from("service_variations")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-variations-crud", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-with-sku-counts"] });
      setEditingId(null);
      toast.success("Variação atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_variations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-variations-crud", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["admin-services-with-sku-counts"] });
      setDeleteId(null);
      toast.success("Variação excluída!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!variations) return;
      
      const currentIndex = variations.findIndex((v) => v.id === id);
      if (currentIndex === -1) return;
      
      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= variations.length) return;

      const current = variations[currentIndex];
      const swap = variations[swapIndex];

      // Swap sort_order values
      await supabase
        .from("service_variations")
        .update({ sort_order: swap.sort_order })
        .eq("id", current.id);

      await supabase
        .from("service_variations")
        .update({ sort_order: current.sort_order })
        .eq("id", swap.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-variations-crud", serviceId] });
    },
  });

  const handleStartEdit = (variation: Variation) => {
    setEditingId(variation.id);
    setEditName(variation.name);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateMutation.mutate({ id: editingId, updates: { name: editName.trim() } });
  };

  const handleToggleActive = (variation: Variation) => {
    updateMutation.mutate({ id: variation.id, updates: { is_active: !variation.is_active } });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate(newName);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-gold" />
              Variações: {serviceName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add New Button */}
            {!showNewForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewForm(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Variação
              </Button>
            )}

            {/* New Form */}
            {showNewForm && (
              <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                <Label>Nome da Variação</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Com Henna, Sem Linha..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={!newName.trim() || createMutation.isPending}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowNewForm(false);
                      setNewName("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* List */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !variations?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Nenhuma variação cadastrada</p>
                <p className="text-sm">
                  Crie variações como "Com Henna", "Design Simples", etc.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {variations.map((variation, index) => (
                  <div
                    key={variation.id}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-card"
                  >
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={index === 0 || reorderMutation.isPending}
                        onClick={() => reorderMutation.mutate({ id: variation.id, direction: "up" })}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={index === variations.length - 1 || reorderMutation.isPending}
                        onClick={() => reorderMutation.mutate({ id: variation.id, direction: "down" })}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      {editingId === variation.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{variation.name}</span>
                          <Badge variant={variation.is_active ? "default" : "secondary"}>
                            {variation.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {editingId !== variation.id && (
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={variation.is_active}
                          onCheckedChange={() => handleToggleActive(variation)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(variation)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(variation.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
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
            <AlertDialogTitle>Excluir Variação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. SKUs vinculados a esta variação terão o vínculo removido.
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
