import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical, Scissors, Link2, Camera, Loader2 } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  staff_profile_id: string | null;
}

interface ServiceOption {
  id: string;
  name: string;
  category: string | null;
}

interface StaffProfile {
  user_id: string;
  name: string | null;
  active: boolean;
}

interface FormState {
  name: string;
  role: string;
  sort_order: number;
  is_active: boolean;
  staff_profile_id: string | null;
}

const emptyForm: FormState = {
  name: "",
  role: "",
  sort_order: 0,
  is_active: true,
  staff_profile_id: null,
};

export function TeamMembersSubTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, role, image_url, sort_order, is_active, staff_profile_id")
        .order("sort_order");
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const { data: staffProfiles = [] } = useQuery({
    queryKey: ["staff-profiles-for-link"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("user_id, name, active")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as StaffProfile[];
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services-for-staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, category")
        .eq("is_active", true)
        .order("category, name");
      if (error) throw error;
      return data as ServiceOption[];
    },
  });

  const { data: allStaffServices = [] } = useQuery({
    queryKey: ["all-staff-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_services")
        .select("team_member_id, service_id");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (editing) {
      const memberServiceIds = allStaffServices
        .filter((ss) => ss.team_member_id === editing.id)
        .map((ss) => ss.service_id);
      setSelectedServiceIds(memberServiceIds);
    } else {
      setSelectedServiceIds([]);
    }
  }, [editing, allStaffServices]);

  // Staff profiles already linked to other members (exclude current editing member)
  const linkedStaffIds = members
    .filter((m) => m.staff_profile_id && m.id !== editing?.id)
    .map((m) => m.staff_profile_id!);

  const availableStaffProfiles = staffProfiles.filter(
    (sp) => !linkedStaffIds.includes(sp.user_id)
  );

  const saveMutation = useMutation({
    mutationFn: async (member: FormState & { id?: string }) => {
      let memberId = member.id;

      const payload = {
        name: member.name,
        role: member.role,
        sort_order: member.sort_order,
        is_active: member.is_active,
        staff_profile_id: member.staff_profile_id,
      };

      if (memberId) {
        const { error } = await supabase
          .from("team_members")
          .update(payload)
          .eq("id", memberId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("team_members")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        memberId = data.id;
      }

      // Sync staff_services
      if (memberId) {
        await supabase.from("staff_services").delete().eq("team_member_id", memberId);
        if (selectedServiceIds.length > 0) {
          const inserts = selectedServiceIds.map((serviceId) => ({
            team_member_id: memberId!,
            service_id: serviceId,
          }));
          const { error: ssError } = await supabase.from("staff_services").insert(inserts);
          if (ssError) throw ssError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      queryClient.invalidateQueries({ queryKey: ["all-staff-services"] });
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setSelectedServiceIds([]);
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
      queryClient.invalidateQueries({ queryKey: ["all-staff-services"] });
      setDeleteConfirm(null);
      toast({ title: "Membro removido" });
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: members.length });
    setSelectedServiceIds([]);
    setModalOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditing(m);
    setForm({
      name: m.name,
      role: m.role,
      sort_order: m.sort_order,
      is_active: m.is_active,
      staff_profile_id: m.staff_profile_id,
    });
    setModalOpen(true);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  const servicesByCategory = services.reduce<Record<string, ServiceOption[]>>((acc, svc) => {
    const cat = svc.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  const getMemberServiceCount = (memberId: string) => {
    return allStaffServices.filter((ss) => ss.team_member_id === memberId).length;
  };

  const getStaffName = (staffProfileId: string | null) => {
    if (!staffProfileId) return null;
    return staffProfiles.find((sp) => sp.user_id === staffProfileId)?.name || null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Profissionais</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie membros, serviços e vínculos com perfis do sistema
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
        <div className="grid gap-3">
          {members.map((m) => {
            const svcCount = getMemberServiceCount(m.id);
            const linkedName = getStaffName(m.staff_profile_id);
            return (
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
                      {svcCount > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Scissors className="w-2.5 h-2.5" />
                          {svcCount} serviço{svcCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {m.staff_profile_id && (
                        <Badge variant="outline" className="text-[10px] gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700">
                          <Link2 className="w-2.5 h-2.5" />
                          Vinculado{linkedName ? ` • ${linkedName}` : ""}
                        </Badge>
                      )}
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
            );
          })}
        </div>
      )}

      {/* Edit / Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Profissional" : "Nova Profissional"}</DialogTitle>
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

            {/* Staff Profile Link */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4" />
                Vincular ao Perfil do Sistema
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Vincula esta profissional a um login do sistema para conectar agendamentos, escalas e performance
              </p>
              <Select
                value={form.staff_profile_id || "none"}
                onValueChange={(v) => setForm({ ...form, staff_profile_id: v === "none" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem vínculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {availableStaffProfiles.map((sp) => (
                    <SelectItem key={sp.user_id} value={sp.user_id}>
                      {sp.name || sp.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Services Matrix */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Scissors className="w-4 h-4" />
                Serviços Habilitados
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Selecione quais serviços esta profissional pode realizar
              </p>
              <div className="space-y-4 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                {Object.entries(servicesByCategory).map(([category, svcs]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {category}
                    </p>
                    <div className="space-y-1.5">
                      {svcs.map((svc) => (
                        <label
                          key={svc.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors"
                        >
                          <Checkbox
                            checked={selectedServiceIds.includes(svc.id)}
                            onCheckedChange={() => toggleService(svc.id)}
                          />
                          <span className="text-sm">{svc.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum serviço cadastrado.</p>
                )}
              </div>
              {selectedServiceIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedServiceIds.length} serviço{selectedServiceIds.length > 1 ? "s" : ""} selecionado{selectedServiceIds.length > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Ativo (visível no site e agendamento)</Label>
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
            Tem certeza que deseja remover este membro da equipe? Os serviços vinculados também serão removidos.
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
