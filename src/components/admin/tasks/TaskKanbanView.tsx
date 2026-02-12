import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GripVertical, Calendar, Flag } from "lucide-react";
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
}

interface TaskKanbanViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "A Fazer", color: "bg-slate-100 border-slate-200" },
  { id: "in_progress", label: "Em Progresso", color: "bg-blue-50 border-blue-200" },
  { id: "done", label: "Concluída", color: "bg-green-50 border-green-200" },
];

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-slate-500" },
  medium: { label: "Média", color: "text-amber-600" },
  high: { label: "Alta", color: "text-red-600" },
};

export function TaskKanbanView({ tasks, onEditTask }: TaskKanbanViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar tarefa", variant: "destructive" });
    },
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      updateStatus.mutate({ taskId, status });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);

        return (
          <div
            key={column.id}
            className={cn(
              "rounded-xl border-2 p-4 min-h-[200px] lg:min-h-[400px]",
              column.color
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">{column.label}</h3>
              <span className="text-xs bg-background px-2 py-1 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onEditTask(task)}
                  className="bg-card p-3 rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs",
                            priorityConfig[task.priority].color
                          )}
                        >
                          <Flag className="w-3 h-3" />
                          {priorityConfig[task.priority].label}
                        </span>
                        {task.due_date && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.due_date), "dd/MM", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Arraste tarefas aqui
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
