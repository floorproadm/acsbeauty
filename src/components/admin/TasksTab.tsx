import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, LayoutGrid, Calendar as CalendarIcon } from "lucide-react";
import { TaskModal } from "./tasks/TaskModal";
import { TaskKanbanView } from "./tasks/TaskKanbanView";
import { TaskCalendarView } from "./tasks/TaskCalendarView";
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

type ViewMode = "kanban" | "calendar";

export function TasksTab() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  const handleCreateTask = () => {
    setSelectedTask(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setModalMode("edit");
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Tarefas</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie as tarefas do estúdio
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </Button>
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Calendário</span>
            </Button>
          </div>

          <Button onClick={handleCreateTask} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-xl" />
          ))}
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground mb-4">
            Nenhuma tarefa cadastrada ainda
          </p>
          <Button onClick={handleCreateTask} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Criar primeira tarefa
          </Button>
        </div>
      ) : viewMode === "kanban" ? (
        <TaskKanbanView tasks={tasks} onEditTask={handleEditTask} />
      ) : (
        <TaskCalendarView tasks={tasks} onEditTask={handleEditTask} />
      )}

      {/* Modal */}
      <TaskModal
        task={selectedTask}
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
      />
    </div>
  );
}
