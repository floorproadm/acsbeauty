import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Json } from "@/integrations/supabase/types";

interface Quiz {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  is_active: boolean;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  order_index: number;
  image_url: string | null;
}

interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  emoji: string | null;
  order_index: number;
  points: Json;
}

interface SortableQuestionProps {
  question: QuizQuestion;
  options: QuizOption[];
  onUpdate: (question: QuizQuestion) => void;
  onDelete: (questionId: string) => void;
  onAddOption: (questionId: string) => void;
  onUpdateOption: (option: QuizOption) => void;
  onDeleteOption: (optionId: string) => void;
  onReorderOptions: (questionId: string, options: QuizOption[]) => void;
}

function SortableOption({
  option,
  onUpdate,
  onDelete,
}: {
  option: QuizOption;
  onUpdate: (option: QuizOption) => void;
  onDelete: (optionId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: option.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-muted/50 p-2 rounded-md"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-muted rounded p-1"
        type="button"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Input
        value={option.emoji || ""}
        onChange={(e) => onUpdate({ ...option, emoji: e.target.value })}
        placeholder="😊"
        className="w-14 text-center"
      />
      <Input
        value={option.option_text}
        onChange={(e) => onUpdate({ ...option, option_text: e.target.value })}
        placeholder="Texto da opção..."
        className="flex-1"
      />
      <Input
        type="number"
        value={typeof option.points === "number" ? option.points : 0}
        onChange={(e) => onUpdate({ ...option, points: parseInt(e.target.value) || 0 })}
        placeholder="Pontos"
        className="w-20"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(option.id)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SortableQuestion({
  question,
  options,
  onUpdate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onReorderOptions,
}: SortableQuestionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleOptionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex((o) => o.id === active.id);
      const newIndex = options.findIndex((o) => o.id === over.id);
      const newOptions = arrayMove(options, oldIndex, newIndex).map((o, i) => ({
        ...o,
        order_index: i,
      }));
      onReorderOptions(question.id, newOptions);
    }
  }

  return (
    <Card ref={setNodeRef} style={style} className="border-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4">
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-muted rounded p-1 mt-1"
              type="button"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                  {question.order_index + 1}
                </span>
                <Input
                  value={question.question_text}
                  onChange={(e) =>
                    onUpdate({ ...question, question_text: e.target.value })
                  }
                  placeholder="Digite a pergunta..."
                  className="flex-1 font-medium"
                />
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(question.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Resposta</Label>
                <Select
                  value={question.question_type}
                  onValueChange={(value) =>
                    onUpdate({ ...question, question_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_choice">Escolha Única</SelectItem>
                    <SelectItem value="multiple_choice">
                      Múltipla Escolha
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={question.is_required}
                  onCheckedChange={(checked) =>
                    onUpdate({ ...question, is_required: checked })
                  }
                />
                <Label>Obrigatória</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL da Imagem (opcional)</Label>
              <Input
                value={question.image_url || ""}
                onChange={(e) =>
                  onUpdate({ ...question, image_url: e.target.value || null })
                }
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Opções de Resposta</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddOption(question.id)}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleOptionDragEnd}
              >
                <SortableContext
                  items={options.map((o) => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {options.map((option) => (
                      <SortableOption
                        key={option.id}
                        option={option}
                        onUpdate={onUpdateOption}
                        onDelete={onDeleteOption}
                      />
                    ))}
                    {options.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma opção adicionada
                      </p>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface QuizEditorModalProps {
  quiz: Quiz;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuizEditorModal({ quiz, open, onOpenChange }: QuizEditorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [options, setOptions] = useState<Record<string, QuizOption[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch questions
  const { data: fetchedQuestions, isLoading: loadingQuestions } = useQuery({
    queryKey: ["quiz-questions", quiz.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("order_index");
      if (error) throw error;
      return data as QuizQuestion[];
    },
    enabled: open,
  });

  // Fetch options
  const { data: fetchedOptions, isLoading: loadingOptions } = useQuery({
    queryKey: ["quiz-options", quiz.id],
    queryFn: async () => {
      if (!fetchedQuestions?.length) return [];
      const questionIds = fetchedQuestions.map((q) => q.id);
      const { data, error } = await supabase
        .from("quiz_options")
        .select("*")
        .in("question_id", questionIds)
        .order("order_index");
      if (error) throw error;
      return data as QuizOption[];
    },
    enabled: open && !!fetchedQuestions?.length,
  });

  // Initialize state from fetched data
  useEffect(() => {
    if (fetchedQuestions) {
      setQuestions(fetchedQuestions);
    }
  }, [fetchedQuestions]);

  useEffect(() => {
    if (fetchedOptions) {
      const grouped: Record<string, QuizOption[]> = {};
      fetchedOptions.forEach((opt) => {
        if (!grouped[opt.question_id]) {
          grouped[opt.question_id] = [];
        }
        grouped[opt.question_id].push(opt);
      });
      setOptions(grouped);
    }
  }, [fetchedOptions]);

  function handleQuestionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((q) => q.id === active.id);
        const newIndex = items.findIndex((q) => q.id === over.id);
        return arrayMove(items, oldIndex, newIndex).map((q, i) => ({
          ...q,
          order_index: i,
        }));
      });
    }
  }

  function addQuestion() {
    const newQuestion: QuizQuestion = {
      id: `new-${Date.now()}`,
      quiz_id: quiz.id,
      question_text: "",
      question_type: "single_choice",
      is_required: true,
      order_index: questions.length,
      image_url: null,
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setOptions((prev) => ({ ...prev, [newQuestion.id]: [] }));
  }

  function updateQuestion(updated: QuizQuestion) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q))
    );
  }

  function deleteQuestion(questionId: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setOptions((prev) => {
      const newOptions = { ...prev };
      delete newOptions[questionId];
      return newOptions;
    });
  }

  function addOption(questionId: string) {
    const questionOptions = options[questionId] || [];
    const newOption: QuizOption = {
      id: `new-${Date.now()}`,
      question_id: questionId,
      option_text: "",
      emoji: "",
      order_index: questionOptions.length,
      points: 0,
    };
    setOptions((prev) => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), newOption],
    }));
  }

  function updateOption(updated: QuizOption) {
    setOptions((prev) => ({
      ...prev,
      [updated.question_id]: (prev[updated.question_id] || []).map((o) =>
        o.id === updated.id ? updated : o
      ),
    }));
  }

  function deleteOption(optionId: string) {
    setOptions((prev) => {
      const newOptions = { ...prev };
      Object.keys(newOptions).forEach((qId) => {
        newOptions[qId] = newOptions[qId].filter((o) => o.id !== optionId);
      });
      return newOptions;
    });
  }

  function reorderOptions(questionId: string, newOptions: QuizOption[]) {
    setOptions((prev) => ({
      ...prev,
      [questionId]: newOptions,
    }));
  }

  async function saveChanges() {
    setIsSaving(true);
    try {
      // Get existing question IDs
      const existingQuestionIds = fetchedQuestions?.map((q) => q.id) || [];
      const currentQuestionIds = questions
        .filter((q) => !q.id.startsWith("new-"))
        .map((q) => q.id);

      // Delete removed questions
      const questionsToDelete = existingQuestionIds.filter(
        (id) => !currentQuestionIds.includes(id)
      );
      if (questionsToDelete.length > 0) {
        await supabase
          .from("quiz_questions")
          .delete()
          .in("id", questionsToDelete);
      }

      // Upsert questions
      for (const question of questions) {
        const isNew = question.id.startsWith("new-");
        if (isNew) {
          const { data: insertedQuestion, error } = await supabase
            .from("quiz_questions")
            .insert({
              quiz_id: question.quiz_id,
              question_text: question.question_text,
              question_type: question.question_type,
              is_required: question.is_required,
              order_index: question.order_index,
              image_url: question.image_url,
            })
            .select()
            .single();

          if (error) throw error;

          // Insert options for new question
          const questionOptions = options[question.id] || [];
          if (questionOptions.length > 0) {
            const optionsToInsert = questionOptions.map((opt) => ({
              question_id: insertedQuestion.id,
              option_text: opt.option_text,
              emoji: opt.emoji || null,
              order_index: opt.order_index,
              points: opt.points,
            }));
            const { error: optError } = await supabase
              .from("quiz_options")
              .insert(optionsToInsert);
            if (optError) throw optError;
          }
        } else {
          // Update existing question
          const { error } = await supabase
            .from("quiz_questions")
            .update({
              question_text: question.question_text,
              question_type: question.question_type,
              is_required: question.is_required,
              order_index: question.order_index,
              image_url: question.image_url,
            })
            .eq("id", question.id);

          if (error) throw error;

          // Handle options for existing question
          const questionOptions = options[question.id] || [];
          const existingOptionIds =
            fetchedOptions
              ?.filter((o) => o.question_id === question.id)
              .map((o) => o.id) || [];
          const currentOptionIds = questionOptions
            .filter((o) => !o.id.startsWith("new-"))
            .map((o) => o.id);

          // Delete removed options
          const optionsToDelete = existingOptionIds.filter(
            (id) => !currentOptionIds.includes(id)
          );
          if (optionsToDelete.length > 0) {
            await supabase
              .from("quiz_options")
              .delete()
              .in("id", optionsToDelete);
          }

          // Upsert options
          for (const option of questionOptions) {
            const isNewOption = option.id.startsWith("new-");
            if (isNewOption) {
              const { error: optError } = await supabase
                .from("quiz_options")
                .insert({
                  question_id: question.id,
                  option_text: option.option_text,
                  emoji: option.emoji || null,
                  order_index: option.order_index,
                  points: option.points,
                });
              if (optError) throw optError;
            } else {
              const { error: optError } = await supabase
                .from("quiz_options")
                .update({
                  option_text: option.option_text,
                  emoji: option.emoji || null,
                  order_index: option.order_index,
                  points: option.points,
                })
                .eq("id", option.id);
              if (optError) throw optError;
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["quiz-questions", quiz.id] });
      queryClient.invalidateQueries({ queryKey: ["quiz-options", quiz.id] });
      toast({ title: "Quiz salvo com sucesso!" });
      onOpenChange(false);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const isLoading = loadingQuestions || loadingOptions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editar Quiz: {quiz.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Carregando perguntas...</div>
            </div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleQuestionDragEnd}
              >
                <SortableContext
                  items={questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <SortableQuestion
                        key={question.id}
                        question={question}
                        options={options[question.id] || []}
                        onUpdate={updateQuestion}
                        onDelete={deleteQuestion}
                        onAddOption={addOption}
                        onUpdateOption={updateOption}
                        onDeleteOption={deleteOption}
                        onReorderOptions={reorderOptions}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {questions.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">
                      Nenhuma pergunta adicionada
                    </p>
                    <Button onClick={addQuestion} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Primeira Pergunta
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={addQuestion} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Pergunta
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={saveChanges} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
