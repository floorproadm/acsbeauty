import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Flag } from "lucide-react";
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

interface TaskCalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  low: { label: "Baixa", color: "text-slate-600", bg: "bg-slate-100" },
  medium: { label: "Média", color: "text-amber-600", bg: "bg-amber-50" },
  high: { label: "Alta", color: "text-red-600", bg: "bg-red-50" },
};

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: "A Fazer", color: "border-l-slate-400" },
  in_progress: { label: "Em Progresso", color: "border-l-blue-400" },
  done: { label: "Concluída", color: "border-l-green-400" },
};

export function TaskCalendarView({ tasks, onEditTask }: TaskCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const tasksWithDueDate = tasks.filter((t) => t.due_date);
  const dueDates = tasksWithDueDate.map((t) => new Date(t.due_date!));

  const selectedDayTasks = tasks.filter(
    (t) => t.due_date && isSameDay(new Date(t.due_date), selectedDate)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-1">
        <div className="bg-card rounded-xl border border-border p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ptBR}
            className="pointer-events-auto"
            modifiers={{
              hasTasks: dueDates,
            }}
            modifiersStyles={{
              hasTasks: {
                fontWeight: "bold",
                textDecoration: "underline",
                textDecorationColor: "hsl(var(--rose-gold))",
              },
            }}
          />
        </div>
      </div>

      {/* Tasks for selected date */}
      <div className="lg:col-span-2">
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedDayTasks.length} tarefa(s) com vencimento
            </p>
          </div>

          <div className="p-4">
            {selectedDayTasks.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma tarefa com vencimento neste dia
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className={cn(
                      "p-4 rounded-lg border border-border border-l-4 cursor-pointer hover:shadow-md transition-shadow",
                      statusConfig[task.status].color
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "font-medium",
                            task.status === "done" && "line-through text-muted-foreground"
                          )}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                            priorityConfig[task.priority].bg,
                            priorityConfig[task.priority].color
                          )}
                        >
                          <Flag className="w-3 h-3" />
                          {priorityConfig[task.priority].label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {statusConfig[task.status].label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
