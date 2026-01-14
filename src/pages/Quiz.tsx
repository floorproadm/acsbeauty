import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QuizQuestion } from "@/components/quiz/QuizQuestion";
import { QuizLeadCapture } from "@/components/quiz/QuizLeadCapture";
import { QuizResult } from "@/components/quiz/QuizResult";
import { LanguageProvider } from "@/contexts/LanguageContext";

interface Quiz {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  settings: Record<string, unknown>;
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

interface Option {
  id: string;
  option_text: string;
  image_url: string | null;
  emoji: string | null;
  order_index: number;
  points: Record<string, number> | null;
}

interface QuizResultData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  service_id: string | null;
  package_id: string | null;
  offer_id: string | null;
  min_score: number;
  max_score: number;
  cta_text: string;
  cta_url: string | null;
}

type Step = "questions" | "lead-capture" | "result";

export default function QuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<QuizResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState<Step>("questions");
  const [recommendedResult, setRecommendedResult] = useState<QuizResultData | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);

  const utmSource = searchParams.get("utm_source") || undefined;
  const utmCampaign = searchParams.get("utm_campaign") || undefined;

  useEffect(() => {
    if (slug) {
      loadQuiz();
    }
  }, [slug]);

  async function loadQuiz() {
    setLoading(true);
    try {
      // Load quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (quizError) throw quizError;
      if (!quizData) {
        toast({
          title: "Quiz não encontrado",
          description: "Este quiz pode não existir ou estar inativo.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setQuiz(quizData as Quiz);

      // Load questions with options
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select(`
          *,
          quiz_options(*)
        `)
        .eq("quiz_id", quizData.id)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;

      const sortedQuestions = (questionsData || []).map((q) => ({
        ...q,
        quiz_options: (q.quiz_options || []).sort(
          (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
        ),
      })) as Question[];

      setQuestions(sortedQuestions);

      // Load results
      const { data: resultsData, error: resultsError } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("quiz_id", quizData.id);

      if (resultsError) throw resultsError;
      setResults((resultsData || []) as QuizResultData[]);
    } catch (error) {
      console.error("Error loading quiz:", error);
      toast({
        title: "Erro ao carregar quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSelectOption(questionId: string, optionId: string, isMultiple: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        if (current.includes(optionId)) {
          return { ...prev, [questionId]: current.filter((id) => id !== optionId) };
        }
        return { ...prev, [questionId]: [...current, optionId] };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  }

  function calculateScore(): Record<string, number> {
    const scores: Record<string, number> = {};

    Object.entries(answers).forEach(([questionId, optionIds]) => {
      const question = questions.find((q) => q.id === questionId);
      if (!question) return;

      optionIds.forEach((optionId) => {
        const option = question.quiz_options.find((o) => o.id === optionId);
        if (option?.points && typeof option.points === "object") {
          Object.entries(option.points).forEach(([key, value]) => {
            if (typeof value === "number") {
              scores[key] = (scores[key] || 0) + value;
            }
          });
        }
      });
    });

    return scores;
  }

  function findBestResult(scores: Record<string, number>): QuizResultData | null {
    if (results.length === 0) return null;

    // Calculate total score
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    // Find result that matches the score range
    const matchedResult = results.find(
      (r) => totalScore >= r.min_score && totalScore <= r.max_score
    );

    if (matchedResult) return matchedResult;

    // If no match, return the first result as default
    return results[0];
  }

  function handleNext() {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.is_required && !answers[currentQuestion.id]?.length) {
      toast({
        title: "Resposta obrigatória",
        description: "Por favor, selecione uma opção para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setStep("lead-capture");
    }
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }

  async function handleLeadSubmit(leadData: {
    name: string;
    phone: string;
    email?: string;
    instagram?: string;
  }) {
    if (!quiz) return;

    const scores = calculateScore();
    const bestResult = findBestResult(scores);
    setRecommendedResult(bestResult);

    try {
      // Create client (if phone provided, try to find existing first)
      let clientId: string | null = null;
      
      if (leadData.phone) {
        // Try to insert client, ignore conflict
        const { data: newClient } = await supabase
          .from("clients")
          .insert({
            name: leadData.name,
            phone: leadData.phone,
            email: leadData.email || null,
            instagram: leadData.instagram || null,
          })
          .select("id")
          .maybeSingle();
        
        clientId = newClient?.id || null;
      } else {
        // No phone, just create new client
        const { data: newClient } = await supabase
          .from("clients")
          .insert({
            name: leadData.name,
            email: leadData.email || null,
            instagram: leadData.instagram || null,
          })
          .select("id")
          .maybeSingle();
        
        clientId = newClient?.id || null;
      }

      // Save quiz response
      const { data: responseData, error: responseError } = await supabase
        .from("quiz_responses")
        .insert({
          quiz_id: quiz.id,
          client_id: clientId,
          client_name: leadData.name,
          client_phone: leadData.phone,
          client_email: leadData.email || null,
          client_instagram: leadData.instagram || null,
          answers: Object.entries(answers).map(([questionId, optionIds]) => ({
            question_id: questionId,
            option_ids: optionIds,
          })),
          calculated_score: scores,
          recommended_result_id: bestResult?.id || null,
          utm_source: utmSource,
          utm_campaign: utmCampaign,
          completed_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (responseError) throw responseError;
      setResponseId(responseData?.id || null);
      setStep("result");
    } catch (error) {
      console.error("Error saving quiz response:", error);
      toast({
        title: "Erro ao salvar respostas",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Sparkles className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Carregando quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz não encontrado</h1>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              {quiz.name}
            </div>
            {quiz.description && (
              <p className="text-muted-foreground">{quiz.description}</p>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {step === "questions" && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Question */}
                <QuizQuestion
                  question={currentQuestion}
                  selectedOptions={answers[currentQuestion.id] || []}
                  onSelect={(optionId) =>
                    handleSelectOption(
                      currentQuestion.id,
                      optionId,
                      currentQuestion.question_type === "multiple_choice"
                    )
                  }
                />

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button onClick={handleNext} className="gap-2">
                    {currentQuestionIndex === questions.length - 1 ? "Ver Resultado" : "Próxima"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "lead-capture" && (
              <motion.div
                key="lead-capture"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <QuizLeadCapture
                  onSubmit={handleLeadSubmit}
                  onBack={() => setStep("questions")}
                />
              </motion.div>
            )}

            {step === "result" && recommendedResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <QuizResult result={recommendedResult} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LanguageProvider>
  );
}
