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
import {
  GripVertical,
  Plus,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Settings,
  ListChecks,
  CheckCircle2,
  Image as ImageIcon,
  MoreVertical,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Json } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { ImageUpload, CompactImageUpload } from "./ImageUpload";

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
  image_url: string | null;
  order_index: number;
  points: Json;
}

const EMOJI_LIST = [
  "💇", "💇‍♀️", "💇‍♂️", "✂️", "💆", "💆‍♀️", "💆‍♂️", "💅", "🧴", "🪮",
  "✨", "💫", "⭐", "🌟", "💖", "💕", "❤️", "🔥", "👍", "👎",
  "😊", "😍", "🤩", "😎", "🥰", "😌", "😀", "🙂", "😐", "😢",
  "👩", "👨", "👩‍🦱", "👨‍🦱", "👩‍🦰", "👨‍🦰", "👱‍♀️", "👱‍♂️", "🧑", "👧",
  "✅", "❌", "⭕", "💯", "🎯", "🏆", "🎉", "🎁", "💎", "👑",
];

function EmojiPicker({ 
  value, 
  onChange 
}: { 
  value: string | null; 
  onChange: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-lg transition-colors border-2 border-transparent hover:border-primary/20"
        >
          {value || "➕"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-10 gap-1">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="w-6 h-6 hover:bg-muted rounded flex items-center justify-center text-sm"
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
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
      className={cn(
        "flex items-center gap-2 py-2 px-1 rounded-lg group transition-all",
        isDragging && "opacity-50 bg-muted"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-muted rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        type="button"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <EmojiPicker
        value={option.emoji}
        onChange={(emoji) => onUpdate({ ...option, emoji })}
      />
      
      <CompactImageUpload
        value={option.image_url}
        onChange={(url) => onUpdate({ ...option, image_url: url })}
        folder="options"
      />
      
      <button
        type="button"
        onClick={() => onDelete(option.id)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      
      <Input
        value={option.option_text}
        onChange={(e) => onUpdate({ ...option, option_text: e.target.value })}
        placeholder="Texto da opção..."
        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-8"
      />
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="end">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Pontuação</Label>
                <Input
                  type="number"
                  value={typeof option.points === "number" ? option.points : 0}
                  onChange={(e) => onUpdate({ ...option, points: parseInt(e.target.value) || 0 })}
                  className="h-8"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

interface SortableQuestionProps {
  question: QuizQuestion;
  questionNumber: number;
  options: QuizOption[];
  onUpdate: (question: QuizQuestion) => void;
  onDelete: (questionId: string) => void;
  onDuplicate: (question: QuizQuestion, options: QuizOption[]) => void;
  onAddOption: (questionId: string) => void;
  onUpdateOption: (option: QuizOption) => void;
  onDeleteOption: (optionId: string) => void;
  onReorderOptions: (questionId: string, options: QuizOption[]) => void;
}

function SortableQuestion({
  question,
  questionNumber,
  options,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onReorderOptions,
}: SortableQuestionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
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

  const questionTypeIcon = question.question_type === "multiple_choice" 
    ? <ListChecks className="h-4 w-4" /> 
    : <CheckCircle2 className="h-4 w-4" />;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border rounded-xl shadow-sm overflow-hidden transition-all",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Question Header */}
      <div className="flex items-start gap-2 p-4 bg-gradient-to-r from-muted/50 to-transparent">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-muted rounded p-1 mt-0.5"
          type="button"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          {questionTypeIcon}
        </div>
        
        <div className="flex-1">
          <Input
            value={question.question_text}
            onChange={(e) => onUpdate({ ...question, question_text: e.target.value })}
            placeholder="Digite sua pergunta aqui..."
            className="text-base font-medium border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
          />
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          
          <Badge variant="outline" className="text-xs">
            {questionNumber}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(question, options)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(question.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Question Content */}
      {!isCollapsed && (
        <div className="p-4 pt-0 space-y-3">
          {/* Options */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleOptionDragEnd}
          >
            <SortableContext
              items={options.map((o) => o.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {options.map((option) => (
                  <SortableOption
                    key={option.id}
                    option={option}
                    onUpdate={onUpdateOption}
                    onDelete={onDeleteOption}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          {/* Add Option Button */}
          <button
            type="button"
            onClick={() => onAddOption(question.id)}
            className="text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors"
          >
            Adicione uma resposta ou pressione "Enter" ↵
          </button>
          
          {/* Question Toolbar */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Tipo de Resposta</Label>
                      <Select
                        value={question.question_type}
                        onValueChange={(value) =>
                          onUpdate({ ...question, question_type: value })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single_choice">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Escolha Única
                            </div>
                          </SelectItem>
                          <SelectItem value="multiple_choice">
                            <div className="flex items-center gap-2">
                              <ListChecks className="h-4 w-4" />
                              Múltipla Escolha
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Obrigatória</Label>
                      <Switch
                        checked={question.is_required}
                        onCheckedChange={(checked) =>
                          onUpdate({ ...question, is_required: checked })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Imagem da Pergunta</Label>
                      <ImageUpload
                        value={question.image_url}
                        onChange={(url) =>
                          onUpdate({ ...question, image_url: url })
                        }
                        folder="questions"
                        aspectRatio="video"
                        placeholder="Clique para adicionar"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <div className="flex items-center gap-0.5 px-2 py-1 bg-muted rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6",
                    question.question_type === "single_choice" && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => onUpdate({ ...question, question_type: "single_choice" })}
                  title="Escolha única"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6",
                    question.question_type === "multiple_choice" && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => onUpdate({ ...question, question_type: "multiple_choice" })}
                  title="Múltipla escolha"
                >
                  <ListChecks className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              {question.is_required && (
                <Badge variant="secondary" className="text-xs">
                  Obrigatória
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDuplicate(question, options)}
                title="Duplicar"
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDelete(question.id)}
                title="Excluir"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
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
  const [activeTab, setActiveTab] = useState("questions");

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

  function duplicateQuestion(question: QuizQuestion, questionOptions: QuizOption[]) {
    const newQuestionId = `new-${Date.now()}`;
    const newQuestion: QuizQuestion = {
      ...question,
      id: newQuestionId,
      question_text: `${question.question_text} (cópia)`,
      order_index: questions.length,
    };
    const newOptions = questionOptions.map((opt, idx) => ({
      ...opt,
      id: `new-${Date.now()}-${idx}`,
      question_id: newQuestionId,
    }));
    setQuestions((prev) => [...prev, newQuestion]);
    setOptions((prev) => ({ ...prev, [newQuestionId]: newOptions }));
    toast({ title: "Pergunta duplicada!" });
  }

  function addOption(questionId: string) {
    const questionOptions = options[questionId] || [];
    const newOption: QuizOption = {
      id: `new-${Date.now()}`,
      question_id: questionId,
      option_text: "",
      emoji: "",
      image_url: null,
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
              image_url: opt.image_url || null,
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
                  image_url: option.image_url || null,
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
                  image_url: option.image_url || null,
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-muted/30 space-y-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">{quiz.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">/{quiz.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/quiz/${quiz.slug}`, "_blank")}
                className="gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ver</span>
              </Button>
              <Button onClick={saveChanges} disabled={isSaving} size="sm" className="gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "Salvando..." : "Publicar"}
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs Navigation */}
        <div className="px-4 py-2 border-b bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent gap-1 p-0 h-auto w-full justify-start">
              <TabsTrigger 
                value="questions" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-1.5 text-sm"
              >
                Questões
              </TabsTrigger>
              <TabsTrigger 
                value="results"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-1.5 text-sm"
              >
                Resultados
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-1.5 text-sm"
              >
                Configurações
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Carregando perguntas...</div>
            </div>
          ) : (
            <>
              {activeTab === "questions" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-muted-foreground">
                      {questions.length} {questions.length === 1 ? "pergunta" : "perguntas"}
                    </p>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      Recolher tudo
                    </Button>
                  </div>

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
                        {questions.map((question, index) => (
                          <SortableQuestion
                            key={question.id}
                            question={question}
                            questionNumber={index + 1}
                            options={options[question.id] || []}
                            onUpdate={updateQuestion}
                            onDelete={deleteQuestion}
                            onDuplicate={duplicateQuestion}
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
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-2">Nenhuma pergunta ainda</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Comece adicionando sua primeira pergunta
                        </p>
                        <Button onClick={addQuestion} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Adicionar Pergunta
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === "results" && (
                <div>
                  <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground text-sm">
                        Editor de resultados em breve...
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "settings" && (
                <div>
                  <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground text-sm">
                        Configurações em breve...
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-background">
          <Button onClick={addQuestion} className="gap-2 rounded-full" size="default">
            <Plus className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <Button size="sm" className="gap-1.5">
              Próximo
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
