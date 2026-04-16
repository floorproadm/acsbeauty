import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const SHORT_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface BusinessHour {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_open: boolean;
  staff_id: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  staff_profile_id: string | null;
}

export function TeamScheduleSubTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<BusinessHour[]>([]);

  const { data: teamMembers = [], isLoading: loadingTeam } = useQuery({
    queryKey: ["team-members-schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, role, is_active, staff_profile_id")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const { data: allHours = [], isLoading: loadingHours } = useQuery({
    queryKey: ["business-hours-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .order("day_of_week");
      if (error) throw error;
      return data as BusinessHour[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ staffProfileId, hours }: { staffProfileId: string; hours: BusinessHour[] }) => {
      // Delete existing hours for this staff_profile_id
      const { error: delError } = await supabase
        .from("business_hours")
        .delete()
        .eq("staff_id", staffProfileId);
      if (delError) throw delError;

      const inserts = hours.map((h) => ({
        staff_id: staffProfileId,
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
        is_open: h.is_open,
      }));

      const { error: insError } = await supabase.from("business_hours").insert(inserts);
      if (insError) throw insError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-hours-all"] });
      setEditingMember(null);
      toast({ title: "Horários atualizados!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  // General hours (staff_id is null)
  const generalHours = allHours.filter((h) => !h.staff_id);

  const getMemberHours = (member: TeamMember) => {
    if (!member.staff_profile_id) return generalHours;
    const memberHours = allHours.filter((h) => h.staff_id === member.staff_profile_id);
    return memberHours.length > 0 ? memberHours : generalHours;
  };

  const hasCustomHours = (member: TeamMember) => {
    if (!member.staff_profile_id) return false;
    return allHours.some((h) => h.staff_id === member.staff_profile_id);
  };

  const today = new Date().getDay();

  const openEditModal = (member: TeamMember) => {
    if (!member.staff_profile_id) {
      toast({
        title: "Vínculo necessário",
        description: "Vincule esta profissional a um perfil do sistema na aba Membros para personalizar horários.",
        variant: "destructive",
      });
      return;
    }

    const staffId = member.staff_profile_id;
    const existing = allHours.filter((h) => h.staff_id === staffId);
    if (existing.length > 0) {
      setEditHours(existing.map((h) => ({ ...h })));
    } else {
      setEditHours(
        generalHours.length > 0
          ? generalHours.map((h) => ({ ...h, id: crypto.randomUUID(), staff_id: staffId }))
          : Array.from({ length: 7 }, (_, i) => ({
              id: crypto.randomUUID(),
              day_of_week: i,
              open_time: "09:00",
              close_time: "18:00",
              is_open: i >= 2 && i <= 6,
              staff_id: staffId,
            }))
      );
    }
    setEditingMember(member.id);
  };

  const updateEditHour = (dayIndex: number, field: keyof BusinessHour, value: any) => {
    setEditHours((prev) =>
      prev.map((h) => (h.day_of_week === dayIndex ? { ...h, [field]: value } : h))
    );
  };

  const isLoading = loadingTeam || loadingHours;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  const editingMemberData = teamMembers.find(m => m.id === editingMember);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Escalas & Disponibilidade
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Horários individuais por profissional • Hoje: {DAY_NAMES[today]}
        </p>
      </div>

      {/* Today's availability summary */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Disponíveis Hoje</p>
          <div className="flex flex-wrap gap-2">
            {teamMembers.map((member) => {
              const hours = getMemberHours(member);
              const todayHour = hours.find((h) => h.day_of_week === today);
              const isAvailable = todayHour?.is_open ?? false;

              return (
                <Badge
                  key={member.id}
                  variant={isAvailable ? "default" : "secondary"}
                  className="gap-1.5 py-1 px-2.5"
                >
                  {isAvailable ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {member.name}
                  {isAvailable && todayHour && (
                    <span className="text-[10px] opacity-75 ml-1">
                      {todayHour.open_time.slice(0, 5)}–{todayHour.close_time.slice(0, 5)}
                    </span>
                  )}
                </Badge>
              );
            })}
            {teamMembers.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum membro da equipe cadastrado.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Member Schedule Cards */}
      <div className="grid gap-4">
        {teamMembers.map((member) => {
          const hours = getMemberHours(member);
          const hasCustom = hasCustomHours(member);
          const isLinked = !!member.staff_profile_id;

          return (
            <Card key={member.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{member.name}</span>
                    <span className="text-[10px] text-muted-foreground">{member.role}</span>
                    {hasCustom ? (
                      <Badge variant="outline" className="text-[10px]">Personalizado</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Padrão geral</Badge>
                    )}
                    {!isLinked && (
                      <Badge variant="secondary" className="text-[10px] text-amber-700 dark:text-amber-400">
                        Sem vínculo
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(member)}
                    disabled={!isLinked}
                  >
                    Editar
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }, (_, i) => {
                    const h = hours.find((bh) => bh.day_of_week === i);
                    const isOpen = h?.is_open ?? false;
                    const isTodayCol = i === today;

                    return (
                      <div
                        key={i}
                        className={`text-center p-1.5 rounded-md text-[10px] ${
                          isTodayCol ? "ring-1 ring-primary/50" : ""
                        } ${isOpen ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted/50"}`}
                      >
                        <p className="font-medium text-[10px]">{SHORT_DAYS[i]}</p>
                        {isOpen && h ? (
                          <p className="text-muted-foreground mt-0.5">
                            {h.open_time.slice(0, 5)}<br />{h.close_time.slice(0, 5)}
                          </p>
                        ) : (
                          <p className="text-muted-foreground/50 mt-0.5">—</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Schedule Modal */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editar Horários — {editingMemberData?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {editHours
              .sort((a, b) => a.day_of_week - b.day_of_week)
              .map((h) => (
                <div key={h.day_of_week} className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium">{SHORT_DAYS[h.day_of_week]}</div>
                  <Switch
                    checked={h.is_open}
                    onCheckedChange={(v) => updateEditHour(h.day_of_week, "is_open", v)}
                  />
                  {h.is_open && (
                    <>
                      <Input
                        type="time"
                        value={h.open_time.slice(0, 5)}
                        onChange={(e) => updateEditHour(h.day_of_week, "open_time", e.target.value)}
                        className="w-24 text-xs"
                      />
                      <span className="text-muted-foreground text-xs">—</span>
                      <Input
                        type="time"
                        value={h.close_time.slice(0, 5)}
                        onChange={(e) => updateEditHour(h.day_of_week, "close_time", e.target.value)}
                        className="w-24 text-xs"
                      />
                    </>
                  )}
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (editingMemberData?.staff_profile_id) {
                  saveMutation.mutate({
                    staffProfileId: editingMemberData.staff_profile_id,
                    hours: editHours,
                  });
                }
              }}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
