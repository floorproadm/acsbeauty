import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, RotateCcw, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Json } from "@/integrations/supabase/types";

interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  emoji: string | null;
  image_url: string | null;
  order_index: number;
  points: Json;
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

interface QuizPreviewProps {
  quizName: string;
  questions: QuizQuestion[];
  options: Record<string, QuizOption[]>;
}

export function QuizPreview({ quizName, questions, options }: QuizPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");

  const currentQuestion = questions[currentIndex];
  const questionOptions = currentQuestion ? options[currentQuestion.id] || [] : [];
  const currentSelections = currentQuestion ? selectedOptions[currentQuestion.id] || [] : [];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  function handleSelect(optionId: string) {
    if (!currentQuestion) return;
    
    const isMultiple = currentQuestion.question_type === "multiple_choice";
    
    setSelectedOptions(prev => {
      const current = prev[currentQuestion.id] || [];
      
      if (isMultiple) {
        if (current.includes(optionId)) {
          return { ...prev, [currentQuestion.id]: current.filter(id => id !== optionId) };
        }
        return { ...prev, [currentQuestion.id]: [...current, optionId] };
      }
      
      return { ...prev, [currentQuestion.id]: [optionId] };
    });
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }

  function reset() {
    setCurrentIndex(0);
    setSelectedOptions({});
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Monitor className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-2">Nenhuma pergunta para visualizar</h3>
        <p className="text-sm text-muted-foreground">
          Adicione perguntas na aba "Questões" para ver o preview
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("mobile")}
            className="gap-1.5"
          >
            <Smartphone className="h-4 w-4" />
            Mobile
          </Button>
          <Button
            variant={viewMode === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("desktop")}
            className="gap-1.5"
          >
            <Monitor className="h-4 w-4" />
            Desktop
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
          <RotateCcw className="h-4 w-4" />
          Reiniciar
        </Button>
      </div>

      {/* Preview Container */}
      <div 
        className={cn(
          "mx-auto bg-background border rounded-2xl shadow-lg overflow-hidden transition-all duration-300",
          viewMode === "mobile" ? "max-w-[375px]" : "max-w-full"
        )}
      >
        {/* Quiz Header */}
        <div className="px-4 py-3 bg-gradient-to-b from-primary/10 to-transparent">
          <p className="text-xs text-muted-foreground text-center mb-2">{quizName}</p>
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center mt-2">
            {currentIndex + 1} de {questions.length}
          </p>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentQuestion?.id || "empty"}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Question Image */}
              {currentQuestion?.image_url && (
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={currentQuestion.image_url}
                    alt=""
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* Question Text */}
              <h2 className={cn(
                "font-bold text-foreground text-center",
                viewMode === "mobile" ? "text-xl" : "text-2xl"
              )}>
                {currentQuestion?.question_text || "Texto da pergunta..."}
              </h2>

              {currentQuestion?.question_type === "multiple_choice" && (
                <p className="text-center text-muted-foreground text-xs">
                  Você pode selecionar múltiplas opções
                </p>
              )}

              {/* Options */}
              <div className="grid gap-2">
                {questionOptions.length > 0 ? (
                  questionOptions.map((option, index) => {
                    const isSelected = currentSelections.includes(option.id);
                    
                    return (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelect(option.id)}
                        className={cn(
                          "relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-border bg-card"
                        )}
                      >
                        {/* Selection Indicator */}
                        <div
                          className={cn(
                            "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>

                        {/* Emoji */}
                        {option.emoji && (
                          <span className="text-xl">{option.emoji}</span>
                        )}

                        {/* Option Image */}
                        {option.image_url && (
                          <img
                            src={option.image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}

                        {/* Option Text */}
                        <span
                          className={cn(
                            "flex-1 text-sm font-medium transition-colors",
                            isSelected ? "text-primary" : "text-foreground"
                          )}
                        >
                          {option.option_text || "Texto da opção..."}
                        </span>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                    Adicione opções para esta pergunta
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          {currentIndex < questions.length - 1 ? (
            <Button
              size="sm"
              onClick={goNext}
              disabled={currentSelections.length === 0}
              className="gap-1"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" disabled={currentSelections.length === 0}>
              Ver Resultado
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {questions.map((q, idx) => {
          const hasSelection = (selectedOptions[q.id] || []).length > 0;
          
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-8 h-8 rounded-full text-xs font-medium transition-all",
                idx === currentIndex
                  ? "bg-primary text-primary-foreground"
                  : hasSelection
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
