import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Save, Trash2, User, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];
type TaskPriority = Database["public"]["Enums"]["task_priority"];

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_by: string;
  assigned_to?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
}

export function TaskModal({ task, open, onOpenChange, mode }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as TaskStatus,
    priority: "medium" as TaskPriority,
    due_date: null as Date | null,
    assigned_to: null as string | null,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staffMembers } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("user_id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch full task data with timestamps when editing
  const { data: fullTask } = useQuery({
    queryKey: ["task-detail", task?.id],
    queryFn: async () => {
      if (!task?.id) return null;
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", task.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: mode === "edit" && !!task?.id && open,
  });

  useEffect(() => {
    const source = fullTask || task;
    if (source && mode === "edit") {
      setFormData({
        title: source.title,
        description: source.description || "",
        status: source.status,
        priority: source.priority,
        due_date: source.due_date ? new Date(source.due_date) : null,
        assigned_to: source.assigned_to || null,
      });
    } else if (mode === "create") {
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        due_date: null,
        assigned_to: null,
      });
    }
  }, [task, fullTask, mode, open]);

  const createTask = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("tasks").insert({
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
        assigned_to: data.assigned_to || null,
        created_by: session.session.user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast({ title: "Tarefa criada com sucesso!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao criar tarefa", variant: "destructive" });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!task) return;

      const { error } = await supabase
        .from("tasks")
        .update({
          title: data.title,
          description: data.description || null,
          status: data.status,
          priority: data.priority,
          due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
          assigned_to: data.assigned_to || null,
        })
        .eq("id", task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast({ title: "Tarefa atualizada!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar tarefa", variant: "destructive" });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async () => {
      if (!task) return;
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      toast({ title: "Tarefa excluída!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao excluir tarefa", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: "Título é obrigatório", variant: "destructive" });
      return;
    }

    if (mode === "create") {
      createTask.mutate(formData);
    } else {
      updateTask.mutate(formData);
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;
  const taskData = fullTask || task;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nova Tarefa" : "Editar Tarefa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Ligar para cliente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detalhes da tarefa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: TaskPriority) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select
              value={formData.assigned_to || "unassigned"}
              onValueChange={(value) =>
                setFormData({ ...formData, assigned_to: value === "unassigned" ? null : value })
              }
            >
              <SelectTrigger>
                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sem responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sem responsável</SelectItem>
                {staffMembers?.map((staff) => (
                  <SelectItem key={staff.user_id} value={staff.user_id}>
                    {staff.name || "Sem nome"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de Vencimento */}
          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date
                    ? format(formData.due_date, "dd/MM/yyyy", { locale: ptBR })
                    : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date || undefined}
                  onSelect={(date) =>
                    setFormData({ ...formData, due_date: date || null })
                  }
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Timestamps - only in edit mode */}
          {mode === "edit" && taskData?.created_at && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Criada {formatDistanceToNow(new Date(taskData.created_at), { addSuffix: true, locale: ptBR })}
                  {" · "}
                  {format(new Date(taskData.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              {taskData.updated_at && taskData.updated_at !== taskData.created_at && (
                <div className="flex items-center gap-2 pl-5">
                  <span>
                    Atualizada {formatDistanceToNow(new Date(taskData.updated_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {mode === "edit" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    disabled={deleteTask.isPending}
                  >
                    {deleteTask.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação não pode ser desfeita. A tarefa "{formData.title}" será excluída permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteTask.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {mode === "create" ? "Criar" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
