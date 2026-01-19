import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Users,
  Phone,
  Mail,
  Instagram,
  Calendar,
  Filter,
  Download,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

type LeadStatus = "novo" | "em_contato" | "convertido" | "perdido";

interface QuizResponse {
  id: string;
  quiz_id: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  client_instagram: string | null;
  answers: unknown;
  calculated_score: unknown;
  utm_source: string | null;
  utm_campaign: string | null;
  completed_at: string | null;
  created_at: string;
  recommended_result_id: string | null;
  status: LeadStatus;
  quizzes?: { name: string } | null;
  quiz_results?: { title: string } | null;
}

interface Quiz {
  id: string;
  name: string;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; icon: React.ElementType; bgColor: string }> = {
  novo: { 
    label: "Novo", 
    color: "text-blue-600", 
    icon: UserPlus,
    bgColor: "bg-blue-500/10 border-blue-200"
  },
  em_contato: { 
    label: "Em Contato", 
    color: "text-amber-600", 
    icon: Clock,
    bgColor: "bg-amber-500/10 border-amber-200"
  },
  convertido: { 
    label: "Convertido", 
    color: "text-green-600", 
    icon: CheckCircle2,
    bgColor: "bg-green-500/10 border-green-200"
  },
  perdido: { 
    label: "Perdido", 
    color: "text-red-600", 
    icon: XCircle,
    bgColor: "bg-red-500/10 border-red-200"
  },
};

const ITEMS_PER_PAGE = 20;

export function LeadsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<QuizResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<QuizResponse | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  // Check if current user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin_owner")
        .maybeSingle();
      
      setIsAdmin(!!data);
    };
    checkAdminRole();
  }, []);

  // Fetch all leads
  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_responses")
        .select("*, quizzes(name), quiz_results(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QuizResponse[];
    },
  });

  // Fetch quizzes for filter
  const { data: quizzes } = useQuery({
    queryKey: ["admin-quizzes-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Quiz[];
    },
  });

  // Get unique sources
  const uniqueSources = [...new Set(leads?.map((l) => l.utm_source).filter(Boolean) || [])];

  // Filter leads
  const filteredLeads = leads?.filter((lead) => {
    // Search filter
    const searchMatch =
      !searchQuery ||
      lead.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.client_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.client_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.client_instagram?.toLowerCase().includes(searchQuery.toLowerCase());

    // Quiz filter
    const quizMatch = selectedQuiz === "all" || lead.quiz_id === selectedQuiz;

    // Source filter
    const sourceMatch = selectedSource === "all" || lead.utm_source === selectedSource;

    // Status filter
    const statusMatch = selectedStatus === "all" || lead.status === selectedStatus;

    // Period filter
    let periodMatch = true;
    if (selectedPeriod !== "all" && lead.created_at) {
      const leadDate = new Date(lead.created_at);
      const now = new Date();
      
      switch (selectedPeriod) {
        case "today":
          periodMatch = isWithinInterval(leadDate, {
            start: startOfDay(now),
            end: endOfDay(now),
          });
          break;
        case "7days":
          periodMatch = leadDate >= subDays(now, 7);
          break;
        case "30days":
          periodMatch = leadDate >= subDays(now, 30);
          break;
        case "90days":
          periodMatch = leadDate >= subDays(now, 90);
          break;
      }
    }

    return searchMatch && quizMatch && sourceMatch && periodMatch && statusMatch;
  });

  // Pagination
  const totalPages = Math.ceil((filteredLeads?.length || 0) / ITEMS_PER_PAGE);
  const paginatedLeads = filteredLeads?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Export to CSV
  const handleExport = () => {
    if (!filteredLeads) return;

    const headers = ["Nome", "Telefone", "Email", "Instagram", "Quiz", "Resultado", "Status", "Origem", "Data"];
    const rows = filteredLeads.map((lead) => [
      lead.client_name || "",
      lead.client_phone || "",
      lead.client_email || "",
      lead.client_instagram || "",
      lead.quizzes?.name || "",
      lead.quiz_results?.title || "",
      STATUS_CONFIG[lead.status]?.label || lead.status,
      lead.utm_source || "",
      lead.completed_at ? format(new Date(lead.completed_at), "dd/MM/yyyy HH:mm") : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  // Update lead status
  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const { error } = await supabase
        .from("quiz_responses")
        .update({ status: newStatus })
        .eq("id", leadId);
      
      if (error) throw error;
      
      toast.success(`Status atualizado para "${STATUS_CONFIG[newStatus].label}"`);
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      
      // Update selected lead if open
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  // Delete lead (admin only)
  const handleDeleteLead = async () => {
    if (!isAdmin || !leadToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("quiz_responses")
        .delete()
        .eq("id", leadToDelete.id);
      
      if (error) throw error;
      
      toast.success("Lead excluído com sucesso");
      setSelectedLead(null);
      setLeadToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Erro ao excluir lead");
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete leads (admin only)
  const handleBulkDelete = async () => {
    if (!isAdmin || selectedLeadIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("quiz_responses")
        .delete()
        .in("id", Array.from(selectedLeadIds));
      
      if (error) throw error;
      
      toast.success(`${selectedLeadIds.size} leads excluídos com sucesso`);
      setSelectedLeadIds(new Set());
      setShowBulkDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
    } catch (error) {
      console.error("Error deleting leads:", error);
      toast.error("Erro ao excluir leads");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle lead selection
  const toggleLeadSelection = (leadId: string) => {
    const newSet = new Set(selectedLeadIds);
    if (newSet.has(leadId)) {
      newSet.delete(leadId);
    } else {
      newSet.add(leadId);
    }
    setSelectedLeadIds(newSet);
  };

  // Toggle all leads on current page
  const toggleAllOnPage = () => {
    const pageLeadIds = paginatedLeads?.map(l => l.id) || [];
    const allSelected = pageLeadIds.every(id => selectedLeadIds.has(id));
    
    const newSet = new Set(selectedLeadIds);
    if (allSelected) {
      pageLeadIds.forEach(id => newSet.delete(id));
    } else {
      pageLeadIds.forEach(id => newSet.add(id));
    }
    setSelectedLeadIds(newSet);
  };

  const allOnPageSelected = paginatedLeads?.length ? paginatedLeads.every(l => selectedLeadIds.has(l.id)) : false;
  const someOnPageSelected = paginatedLeads?.some(l => selectedLeadIds.has(l.id)) && !allOnPageSelected;

  // Stats by status
  const statusStats = {
    novo: leads?.filter((l) => l.status === "novo").length || 0,
    em_contato: leads?.filter((l) => l.status === "em_contato").length || 0,
    convertido: leads?.filter((l) => l.status === "convertido").length || 0,
    perdido: leads?.filter((l) => l.status === "perdido").length || 0,
  };

  const conversionRate = leads?.length 
    ? Math.round((statusStats.convertido / leads.length) * 100) 
    : 0;

  // Get status badge component
  const StatusBadge = ({ status }: { status: LeadStatus }) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} ${config.bgColor} text-xs gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {filteredLeads?.length || 0} leads encontrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          {isAdmin && selectedLeadIds.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir ({selectedLeadIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const count = statusStats[status];
          const isActive = selectedStatus === status;
          
          return (
            <Card 
              key={status}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? "ring-2 ring-primary" : ""
              } ${config.bgColor}`}
              onClick={() => {
                setSelectedStatus(isActive ? "all" : status);
                setCurrentPage(1);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-background/50`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Conversion Rate Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Taxa Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={selectedQuiz}
          onValueChange={(v) => {
            setSelectedQuiz(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Quiz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Quizzes</SelectItem>
            {quizzes?.map((quiz) => (
              <SelectItem key={quiz.id} value={quiz.id}>
                {quiz.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedSource}
          onValueChange={(v) => {
            setSelectedSource(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Origens</SelectItem>
            {uniqueSources.map((source) => (
              <SelectItem key={source} value={source!}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedPeriod}
          onValueChange={(v) => {
            setSelectedPeriod(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="90days">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredLeads?.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum lead encontrado</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && (
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={toggleAllOnPage}
                        aria-label="Selecionar todos"
                        className={someOnPageSelected ? "data-[state=checked]:bg-primary/50" : ""}
                      />
                    </TableHead>
                  )}
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="hidden md:table-cell">Quiz</TableHead>
                  <TableHead className="hidden sm:table-cell">Origem</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads?.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className={`cursor-pointer hover:bg-muted/50 ${selectedLeadIds.has(lead.id) ? "bg-muted/30" : ""}`}
                    onClick={() => setSelectedLead(lead)}
                  >
                    {isAdmin && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedLeadIds.has(lead.id)}
                          onCheckedChange={() => toggleLeadSelection(lead.id)}
                          aria-label={`Selecionar ${lead.client_name || "lead"}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {lead.client_name || "Anônimo"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={lead.status}
                        onValueChange={(value) => handleUpdateStatus(lead.id, value as LeadStatus)}
                      >
                        <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent p-0 hover:bg-muted/50">
                          <StatusBadge status={lead.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => {
                            const config = STATUS_CONFIG[status];
                            const Icon = config.icon;
                            return (
                              <SelectItem key={status} value={status}>
                                <span className={`flex items-center gap-2 ${config.color}`}>
                                  <Icon className="w-4 h-4" />
                                  {config.label}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {lead.client_phone && (
                          <span className="text-xs flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.client_phone}
                          </span>
                        )}
                        {lead.client_email && (
                          <span className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {lead.client_email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {lead.quizzes?.name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {lead.utm_source ? (
                        <Badge variant="secondary" className="text-xs">
                          {lead.utm_source}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.completed_at
                        ? format(new Date(lead.completed_at), "dd/MM/yy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {lead.client_phone && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `https://wa.me/${lead.client_phone?.replace(/\D/g, "")}?text=${encodeURIComponent(
                                  `Olá ${lead.client_name || ""}! Vi que você respondeu nosso quiz e gostaria de falar sobre seu resultado.`
                                )}`,
                                "_blank"
                              );
                            }}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads?.length || 0)} de{" "}
            {filteredLeads?.length || 0} leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {selectedLead?.client_name || "Lead Anônimo"}
            </DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              {/* Status Selector */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => {
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;
                    const isActive = selectedLead.status === status;
                    
                    return (
                      <Button
                        key={status}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={`gap-1.5 ${isActive ? "" : config.color}`}
                        onClick={() => handleUpdateStatus(selectedLead.id, status)}
                      >
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Contato</h4>
                <div className="grid gap-2">
                  {selectedLead.client_phone && (
                    <>
                      <a
                        href={`tel:${selectedLead.client_phone}`}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-sm"
                      >
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {selectedLead.client_phone}
                      </a>
                      <a
                        href={`https://wa.me/${selectedLead.client_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Olá ${selectedLead.client_name || ""}! Vi que você respondeu nosso quiz e gostaria de falar sobre seu resultado.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-md bg-green-100 hover:bg-green-200 text-green-800 transition-colors text-sm font-medium"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Enviar WhatsApp
                      </a>
                    </>
                  )}
                  {selectedLead.client_email && (
                    <a
                      href={`mailto:${selectedLead.client_email}`}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {selectedLead.client_email}
                    </a>
                  )}
                  {selectedLead.client_instagram && (
                    <a
                      href={`https://instagram.com/${selectedLead.client_instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                      <Instagram className="w-4 h-4 text-muted-foreground" />
                      @{selectedLead.client_instagram.replace("@", "")}
                    </a>
                  )}
                </div>
              </div>

              {/* Quiz Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Quiz</h4>
                <div className="p-3 rounded-md bg-muted/50 space-y-1">
                  {selectedLead.quizzes?.name && (
                    <p className="text-sm font-medium">{selectedLead.quizzes.name}</p>
                  )}
                  {selectedLead.quiz_results?.title && (
                    <p className="text-sm text-muted-foreground">
                      Resultado: <span className="text-foreground">{selectedLead.quiz_results.title}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* UTM Info */}
              {(selectedLead.utm_source || selectedLead.utm_campaign) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Origem</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.utm_source && (
                      <Badge variant="outline" className="text-xs">
                        Source: {selectedLead.utm_source}
                      </Badge>
                    )}
                    {selectedLead.utm_campaign && (
                      <Badge variant="outline" className="text-xs">
                        Campaign: {selectedLead.utm_campaign}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamp + Delete */}
              <div className="pt-2 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Respondido em:{" "}
                  {selectedLead.completed_at
                    ? format(new Date(selectedLead.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : format(new Date(selectedLead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setLeadToDelete(selectedLead)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead {leadToDelete?.client_name || "Anônimo"}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedLeadIds.size} leads?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedLeadIds.size} leads selecionados? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : `Excluir ${selectedLeadIds.size} leads`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
