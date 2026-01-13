import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  option_text: string;
  image_url: string | null;
  emoji: string | null;
  order_index: number;
  points: Record<string, number>;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
  is_required: boolean;
  image_url: string | null;
  settings: Record<string, unknown>;
  quiz_options: Option[];
}

interface QuizQuestionProps {
  question: Question;
  selectedOptions: string[];
  onSelect: (optionId: string) => void;
}

export function QuizQuestion({
  question,
  selectedOptions,
  onSelect,
}: QuizQuestionProps) {
  const isMultiple = question.question_type === "multiple_choice";

  return (
    <div className="space-y-6">
      {/* Question Image */}
      {question.image_url && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl overflow-hidden"
        >
          <img
            src={question.image_url}
            alt=""
            className="w-full h-48 object-cover"
          />
        </motion.div>
      )}

      {/* Question Text */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-bold text-foreground text-center"
      >
        {question.question_text}
      </motion.h2>

      {isMultiple && (
        <p className="text-center text-muted-foreground text-sm">
          Você pode selecionar múltiplas opções
        </p>
      )}

      {/* Options Grid */}
      <div className="grid gap-3">
        {question.quiz_options.map((option, index) => {
          const isSelected = selectedOptions.includes(option.id);

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(option.id)}
              className={cn(
                "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                "hover:border-primary/50 hover:bg-primary/5",
                isSelected
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                  : "border-border bg-card"
              )}
            >
              {/* Selection Indicator */}
              <div
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
              </div>

              {/* Emoji */}
              {option.emoji && (
                <span className="text-2xl">{option.emoji}</span>
              )}

              {/* Option Image */}
              {option.image_url && (
                <img
                  src={option.image_url}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}

              {/* Option Text */}
              <span
                className={cn(
                  "flex-1 text-left font-medium transition-colors",
                  isSelected ? "text-primary" : "text-foreground"
                )}
              >
                {option.option_text}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
