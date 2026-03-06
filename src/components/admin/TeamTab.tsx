import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical, X } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  specialties: string[];
  image_url: string | null;
  instagram: string | null;
  badge_label: string | null;
  badge_value: string | null;
  sort_order: number;
  is_active: boolean;
}

const emptyMember: Omit<TeamMember, "id"> = {
  name: "",
  role: "",
  bio: "",
  specialties: [],
  image_url: null,
  instagram: null,
  badge_label: null,
  badge_value: null,
  sort_order: 0,
  is_active: true,
};

export function TeamTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(emptyMember);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (member: typeof form & { id?: string }) => {
      if (member.id) {
        const { error } = await supabase
          .from("team_members")
          .update({
            name: member.name,
            role: member.role,
            bio: member.bio,
            specialties: member.specialties,
            image_url: member.image_url,
            instagram: member.instagram,
            badge_label: member.badge_label,
            badge_value: member.badge_value,
            sort_order: member.sort_order,
            is_active: member.is_active,
          })
          .eq("id", member.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("team_members").insert({
          name: member.name,
          role: member.role,
          bio: member.bio,
          specialties: member.specialties,
          image_url: member.image_url,
          instagram: member.instagram,
          badge_label: member.badge_label,
          badge_value: member.badge_value,
          sort_order: member.sort_order,
          is_active: member.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      setModalOpen(false);
      setEditing(null);
      setForm(emptyMember);
      toast({ title: "Membro salvo com sucesso!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      setDeleteConfirm(null);
      toast({ title: "Membro removido" });
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyMember, sort_order: members.length });
    setModalOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditing(m);
    setForm({
      name: m.name,
      role: m.role,
      bio: m.bio || "",
      specialties: m.specialties || [],
      image_url: m.image_url,
      instagram: m.instagram,
      badge_label: m.badge_label,
      badge_value: m.badge_value,
      sort_order: m.sort_order,
      is_active: m.is_active,
    });
    setModalOpen(true);
  };

  const addSpecialty = () => {
    const s = newSpecialty.trim();
    if (s && !form.specialties.includes(s)) {
      setForm({ ...form, specialties: [...form.specialties, s] });
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (s: string) => {
    setForm({ ...form, specialties: form.specialties.filter((x) => x !== s) });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Equipe</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os membros que aparecem na página /team
          </p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum membro cadastrado.</p>
      ) : (
        <div className="grid gap-4">
          {members.map((m) => (
            <Card key={m.id} className={!m.is_active ? "opacity-50" : ""}>
              <CardContent className="flex items-center gap-4 py-4">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                {m.image_url ? (
                  <img
                    src={m.image_url}
                    alt={m.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs text-muted-foreground">Foto</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{m.name}</span>
                    {!m.is_active && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{m.role}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.specialties?.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirm(m.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Membro" : "Novo Membro"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Ex: Hair Stylist"
                />
              </div>
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Descrição profissional"
                rows={3}
              />
            </div>

            <div>
              <Label>URL da Imagem</Label>
              <Input
                value={form.image_url || ""}
                onChange={(e) => setForm({ ...form, image_url: e.target.value || null })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>Instagram</Label>
              <Input
                value={form.instagram || ""}
                onChange={(e) => setForm({ ...form, instagram: e.target.value || null })}
                placeholder="@usuario"
              />
            </div>

            {/* Specialties */}
            <div>
              <Label>Especialidades</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                  placeholder="Adicionar especialidade"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addSpecialty}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.specialties.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s}
                    <button onClick={() => removeSpecialty(s)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Badge */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Badge - Label</Label>
                <Input
                  value={form.badge_label || ""}
                  onChange={(e) => setForm({ ...form, badge_label: e.target.value || null })}
                  placeholder="Ex: Especialista em"
                />
              </div>
              <div>
                <Label>Badge - Valor</Label>
                <Input
                  value={form.badge_value || ""}
                  onChange={(e) => setForm({ ...form, badge_value: e.target.value || null })}
                  placeholder="Ex: Hair Styling"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Ativo (visível na página)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover este membro da equipe?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
