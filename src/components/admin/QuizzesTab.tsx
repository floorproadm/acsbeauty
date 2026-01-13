import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ExternalLink, Copy, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuizEditorModal } from "./QuizEditorModal";

interface Quiz {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
}

interface QuizResponse {
  id: string;
  quiz_id: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  completed_at: string | null;
  created_at: string;
}

export function QuizzesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editorQuiz, setEditorQuiz] = useState<Quiz | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type: "service_discovery",
  });

  const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
    queryKey: ["admin-quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quiz[];
    },
  });

  const { data: responses } = useQuery({
    queryKey: ["admin-quiz-responses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_responses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as QuizResponse[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("quizzes").insert({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        type: data.type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      setIsCreating(false);
      setFormData({ name: "", slug: "", description: "", type: "service_discovery" });
      toast({ title: "Quiz criado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar quiz", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("quizzes").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      setEditingQuiz(null);
      toast({ title: "Quiz atualizado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      toast({ title: "Quiz excluído!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function copyQuizLink(slug: string) {
    const url = `${window.location.origin}/quiz/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  }

  function getResponseCount(quizId: string) {
    return responses?.filter((r) => r.quiz_id === quizId).length || 0;
  }

  const typeLabels: Record<string, string> = {
    service_discovery: "Descoberta de Serviços",
    price_calculator: "Calculadora de Preço",
    hair_diagnosis: "Diagnóstico Capilar",
  };

  if (loadingQuizzes) {
    return <div className="p-6">Carregando quizzes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quizzes</h2>
          <p className="text-muted-foreground">
            Crie quizzes interativos para engajar e capturar leads
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Quiz
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Quiz</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Nome do Quiz</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    }));
                  }}
                  placeholder="Ex: Descubra seu tratamento ideal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="descubra-seu-tratamento"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Descubra qual tratamento é ideal para você..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service_discovery">
                      Descoberta de Serviços
                    </SelectItem>
                    <SelectItem value="price_calculator">
                      Calculadora de Preço
                    </SelectItem>
                    <SelectItem value="hair_diagnosis">
                      Diagnóstico Capilar
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Quiz"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quizzes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes?.filter((q) => q.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Respostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responses?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quizzes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Respostas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes?.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{quiz.name}</p>
                      <p className="text-sm text-muted-foreground">/{quiz.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{typeLabels[quiz.type] || quiz.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      {getResponseCount(quiz.id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={quiz.is_active}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: quiz.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditorQuiz(quiz)}
                        title="Editar perguntas"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyQuizLink(quiz.slug)}
                        title="Copiar link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/quiz/${quiz.slug}`, "_blank")}
                        title="Visualizar"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(quiz.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!quizzes || quizzes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum quiz criado ainda. Clique em "Novo Quiz" para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Responses */}
      {responses && responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Respostas Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.slice(0, 10).map((response) => (
                  <TableRow key={response.id}>
                    <TableCell className="font-medium">
                      {response.client_name || "Anônimo"}
                    </TableCell>
                    <TableCell>
                      {response.client_phone || response.client_email || "-"}
                    </TableCell>
                    <TableCell>
                      {response.completed_at
                        ? new Date(response.completed_at).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Quiz Editor Modal */}
      {editorQuiz && (
        <QuizEditorModal
          quiz={editorQuiz}
          open={!!editorQuiz}
          onOpenChange={(open) => !open && setEditorQuiz(null)}
        />
      )}
    </div>
  );
}
