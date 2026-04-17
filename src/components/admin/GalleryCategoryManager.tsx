import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
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

export interface GalleryCategory {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
  sort_order: number;
  show_on_home: boolean;
  is_active: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function GalleryCategoryManager({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GalleryCategory | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["gallery-categories-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_categories" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as GalleryCategory[];
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = slugify(newLabel);
      if (!slug) throw new Error("Nome inválido");
      const maxOrder = Math.max(0, ...categories.map((c) => c.sort_order));
      const { error } = await supabase.from("gallery_categories" as any).insert({
        slug,
        label: newLabel.trim(),
        emoji: newEmoji.trim() || null,
        sort_order: maxOrder + 1,
        show_on_home: false,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-categories-admin"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast({ title: "Categoria criada ✓" });
      setNewLabel("");
      setNewEmoji("");
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<GalleryCategory> }) => {
      const { error } = await supabase
        .from("gallery_categories" as any)
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-categories-admin"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_categories" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-categories-admin"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast({ title: "Categoria removida ✓" });
      setDeleteTarget(null);
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar categorias</DialogTitle>
            <DialogDescription>
              Crie, edite e controle quais categorias aparecem na home pública.
            </DialogDescription>
          </DialogHeader>

          {/* Create new */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <Label className="text-xs">Nova categoria</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Emoji"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                className="w-16 text-center"
                maxLength={2}
              />
              <Input
                placeholder="Nome (ex: Casamentos)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => createMutation.mutate()}
                disabled={!newLabel.trim() || createMutation.isPending}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-card"
                >
                  <span className="text-xl w-8 text-center">{cat.emoji || "📷"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cat.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{cat.slug}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex flex-col items-center gap-0.5">
                      <Switch
                        checked={cat.show_on_home}
                        onCheckedChange={(v) =>
                          updateMutation.mutate({ id: cat.id, patch: { show_on_home: v } })
                        }
                      />
                      <span className="text-[9px] text-muted-foreground">Home</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() =>
                        updateMutation.mutate({
                          id: cat.id,
                          patch: { is_active: !cat.is_active },
                        })
                      }
                      title={cat.is_active ? "Desativar" : "Ativar"}
                    >
                      {cat.is_active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(cat)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover categoria "{deleteTarget?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              As fotos existentes nessa categoria continuam no banco, mas perdem o agrupamento.
              Considere apenas desativar a categoria em vez de remover.
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
    </>
  );
}
