import { useState, useEffect, useMemo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Users,
  Phone,
  Mail,
  Instagram,
  Calendar,
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
  LayoutList,
  LayoutGrid,
  GripVertical,
  Sparkles,
  Globe,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type LeadStatus = "novo" | "em_contato" | "convertido" | "perdido";
type LeadSource = "quiz" | "contact";
type ViewMode = "table" | "board";

interface UnifiedLead {
  id: string;
  source: LeadSource;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  client_instagram: string | null;
  status: LeadStatus;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string;
  // Quiz specific
  quiz_name?: string;
  quiz_result?: string;
  answers?: unknown;
  completed_at?: string | null;
  // WhatsApp specific
  service_interest?: string | null;
  service_name?: string;
  urgency?: string | null;
  page_path?: string;
  // Contact form specific
  message?: string | null;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; icon: React.ElementType; bgColor: string; columnColor: string }> = {
  novo: { 
    label: "Novo", 
    color: "text-blue-600", 
    icon: UserPlus,
    bgColor: "bg-blue-500/10 border-blue-200",
    columnColor: "border-t-blue-500"
  },
  em_contato: { 
    label: "Em Contato", 
    color: "text-amber-600", 
    icon: Clock,
    bgColor: "bg-amber-500/10 border-amber-200",
    columnColor: "border-t-amber-500"
  },
  convertido: { 
    label: "Convertido", 
    color: "text-green-600", 
    icon: CheckCircle2,
    bgColor: "bg-green-500/10 border-green-200",
    columnColor: "border-t-green-500"
  },
  perdido: { 
    label: "Perdido", 
    color: "text-red-600", 
    icon: XCircle,
    bgColor: "bg-red-500/10 border-red-200",
    columnColor: "border-t-red-500"
  },
};

const URGENCY_LABELS: Record<string, string> = {
  urgente: "🔥 Urgente",
  proxima_semana: "📅 Próxima semana",
  proximo_mes: "🗓️ Próximo mês",
  apenas_informacao: "💬 Só informações",
};

const ITEMS_PER_PAGE = 20;

// Source Badge Component
function SourceBadge({ source }: { source: LeadSource }) {
  const config = {
    quiz: { className: "bg-purple-50 text-purple-700 border-purple-200 text-xs", label: "📝 Quiz" },
    contact: { className: "bg-green-50 text-green-700 border-green-200 text-xs", label: "💬 Contato" },
  };
  
  const { className, label } = config[source];
  
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: LeadStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.color} ${config.bgColor} text-xs gap-1`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

// Draggable Lead Card Component for Kanban
function LeadCard({ 
  lead, 
  onClick,
}: { 
  lead: UnifiedLead; 
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-all hover:shadow-md group ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{lead.client_name || "Anônimo"}</p>
            <div className="flex items-center gap-1 mt-1">
              {lead.source === "quiz" ? (
                <>
                  <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {lead.quiz_result || lead.quiz_name || "—"}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {lead.service_name || "—"}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <SourceBadge source={lead.source} />
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(lead.created_at), "dd/MM")}
              </span>
            </div>
            {lead.utm_source && (
              <Badge variant="secondary" className="text-[10px] mt-2 h-5">
                {lead.utm_source}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Kanban Column Component
function KanbanColumn({
  status,
  leads,
  onLeadClick,
}: {
  status: LeadStatus;
  leads: UnifiedLead[];
  onLeadClick: (lead: UnifiedLead) => void;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={`flex flex-col bg-muted/30 rounded-lg border border-t-4 ${config.columnColor} min-w-[280px] max-w-[320px] flex-1`}>
      <div className="p-3 border-b bg-background/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.color}`} />
            <span className="font-medium text-sm">{config.label}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
      </div>
      <ScrollArea className="flex-1 p-2">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[200px]">
            {leads.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                Nenhum lead
              </div>
            ) : (
              leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onLeadClick(lead)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

export function UnifiedLeadsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedUtmSource, setSelectedUtmSource] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<UnifiedLead | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<UnifiedLead | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [activeId, setActiveId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Fetch quiz leads
  const { data: quizLeads, isLoading: quizLoading } = useQuery({
    queryKey: ["unified-quiz-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_responses")
        .select("*, quizzes(name), quiz_results(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch Contact form leads
  const { data: contactLeads, isLoading: contactLoading } = useQuery({
    queryKey: ["unified-contact-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch services for contact leads
  const { data: services } = useQuery({
    queryKey: ["services-lookup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId || !services) return "—";
    return services.find(s => s.id === serviceId)?.name || serviceId;
  };

  // Normalize and combine leads
  const allLeads = useMemo(() => {
    const normalized: UnifiedLead[] = [];
    
    quizLeads?.forEach(l => normalized.push({
      id: l.id,
      source: "quiz" as LeadSource,
      client_name: l.client_name,
      client_phone: l.client_phone,
      client_email: l.client_email,
      client_instagram: l.client_instagram,
      status: l.status as LeadStatus,
      utm_source: l.utm_source,
      utm_campaign: l.utm_campaign,
      created_at: l.created_at,
      quiz_name: l.quizzes?.name || undefined,
      quiz_result: l.quiz_results?.title || undefined,
      answers: l.answers,
      completed_at: l.completed_at,
    }));

    contactLeads?.forEach(l => normalized.push({
      id: l.id,
      source: "contact" as LeadSource,
      client_name: l.name,
      client_phone: l.phone,
      client_email: l.email,
      client_instagram: null,
      status: (l.status || "novo") as LeadStatus,
      utm_source: l.utm_source,
      utm_campaign: l.utm_campaign,
      created_at: l.created_at,
      service_interest: l.service_interest,
      service_name: getServiceName(l.service_interest),
      message: l.message,
    }));
    
    return normalized.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [quizLeads, contactLeads, services]);

  // Get unique UTM sources
  const uniqueUtmSources = [...new Set(allLeads.map(l => l.utm_source).filter(Boolean))];

  // Filter leads
  const filteredLeads = allLeads.filter((lead) => {
    const searchMatch =
      !searchQuery ||
      lead.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.client_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.client_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.client_instagram?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.quiz_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const sourceMatch = selectedSource === "all" || lead.source === selectedSource;
    const utmSourceMatch = selectedUtmSource === "all" || lead.utm_source === selectedUtmSource;
    const statusMatch = selectedStatus === "all" || lead.status === selectedStatus;

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

    return searchMatch && sourceMatch && utmSourceMatch && periodMatch && statusMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Group leads by status for Kanban
  const leadsByStatus: Record<LeadStatus, UnifiedLead[]> = {
    novo: filteredLeads.filter(l => l.status === "novo"),
    em_contato: filteredLeads.filter(l => l.status === "em_contato"),
    convertido: filteredLeads.filter(l => l.status === "convertido"),
    perdido: filteredLeads.filter(l => l.status === "perdido"),
  };

  // Stats
  const statusStats = {
    novo: allLeads.filter(l => l.status === "novo").length,
    em_contato: allLeads.filter(l => l.status === "em_contato").length,
    convertido: allLeads.filter(l => l.status === "convertido").length,
    perdido: allLeads.filter(l => l.status === "perdido").length,
  };

  const conversionRate = allLeads.length 
    ? Math.round((statusStats.convertido / allLeads.length) * 100) 
    : 0;

  // Export to CSV
  const handleExport = () => {
    const headers = ["Nome", "Telefone", "Email", "Instagram", "Origem", "Tipo", "Status", "UTM Source", "Data"];
    const rows = filteredLeads.map((lead) => [
      lead.client_name || "",
      lead.client_phone || "",
      lead.client_email || "",
      lead.client_instagram || "",
      lead.source === "quiz" ? "Quiz" : "Contato",
      lead.source === "quiz" ? (lead.quiz_name || "") : (lead.service_name || lead.message?.substring(0, 50) || ""),
      STATUS_CONFIG[lead.status]?.label || lead.status,
      lead.utm_source || "",
      format(new Date(lead.created_at), "dd/MM/yyyy HH:mm"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads-captacao-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  // Update lead status
  const handleUpdateStatus = async (lead: UnifiedLead, newStatus: LeadStatus) => {
    try {
      let error;
      
      if (lead.source === "quiz") {
        const result = await supabase
          .from("quiz_responses")
          .update({ status: newStatus })
          .eq("id", lead.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("contact_submissions")
          .update({ status: newStatus })
          .eq("id", lead.id);
        error = result.error;
      }
      
      if (error) throw error;
      
      toast.success(`Status atualizado para "${STATUS_CONFIG[newStatus].label}"`);
      queryClient.invalidateQueries({ queryKey: ["unified-quiz-leads"] });
      queryClient.invalidateQueries({ queryKey: ["unified-contact-leads"] });
      
      if (selectedLead?.id === lead.id) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  // Delete lead
  const handleDeleteLead = async () => {
    if (!isAdmin || !leadToDelete) return;
    
    setIsDeleting(true);
    try {
      let error;
      
      if (leadToDelete.source === "quiz") {
        const result = await supabase.from("quiz_responses").delete().eq("id", leadToDelete.id);
        error = result.error;
      } else {
        const result = await supabase.from("contact_submissions").delete().eq("id", leadToDelete.id);
        error = result.error;
      }
      
      if (error) throw error;
      
      toast.success("Lead excluído com sucesso");
      setSelectedLead(null);
      setLeadToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["unified-quiz-leads"] });
      queryClient.invalidateQueries({ queryKey: ["unified-contact-leads"] });
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Erro ao excluir lead");
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete leads
  const handleBulkDelete = async () => {
    if (!isAdmin || selectedLeadIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      const selectedLeads = allLeads.filter(l => selectedLeadIds.has(l.id));
      const quizIds = selectedLeads.filter(l => l.source === "quiz").map(l => l.id);
      const contactIds = selectedLeads.filter(l => l.source === "contact").map(l => l.id);

      if (quizIds.length > 0) {
        const { error } = await supabase.from("quiz_responses").delete().in("id", quizIds);
        if (error) throw error;
      }

      if (contactIds.length > 0) {
        const { error } = await supabase.from("contact_submissions").delete().in("id", contactIds);
        if (error) throw error;
      }
      
      toast.success(`${selectedLeadIds.size} leads excluídos com sucesso`);
      setSelectedLeadIds(new Set());
      setShowBulkDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["unified-quiz-leads"] });
      queryClient.invalidateQueries({ queryKey: ["unified-contact-leads"] });
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
    const pageLeadIds = paginatedLeads.map(l => l.id);
    const allSelected = pageLeadIds.every(id => selectedLeadIds.has(id));
    
    const newSet = new Set(selectedLeadIds);
    if (allSelected) {
      pageLeadIds.forEach(id => newSet.delete(id));
    } else {
      pageLeadIds.forEach(id => newSet.add(id));
    }
    setSelectedLeadIds(newSet);
  };

  const allOnPageSelected = paginatedLeads.length ? paginatedLeads.every(l => selectedLeadIds.has(l.id)) : false;
  const someOnPageSelected = paginatedLeads.some(l => selectedLeadIds.has(l.id)) && !allOnPageSelected;

  // Drag handlers for Kanban
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = active.id as string;
    const overId = over.id as string;

    let newStatus: LeadStatus | null = null;
    
    for (const [status, statusLeads] of Object.entries(leadsByStatus)) {
      if (statusLeads.some(l => l.id === overId)) {
        newStatus = status as LeadStatus;
        break;
      }
    }

    if (!newStatus && (["novo", "em_contato", "convertido", "perdido"] as LeadStatus[]).includes(overId as LeadStatus)) {
      newStatus = overId as LeadStatus;
    }

    if (!newStatus) return;

    const activeLead = allLeads.find(l => l.id === activeLeadId);
    if (!activeLead || activeLead.status === newStatus) return;

    handleUpdateStatus(activeLead, newStatus);
  };

  const isLoading = quizLoading || contactLoading;
  const activeLead = allLeads.find(l => l.id === activeId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {filteredLeads.length} leads encontrados
        </p>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("table")}
            >
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "board" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("board")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
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
                  <div className="p-2 rounded-lg bg-background/50">
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
          value={selectedSource}
          onValueChange={(v) => {
            setSelectedSource(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Origens</SelectItem>
            <SelectItem value="quiz">📝 Quiz</SelectItem>
            <SelectItem value="contact">💬 Contato</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedUtmSource}
          onValueChange={(v) => {
            setSelectedUtmSource(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="UTM Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas UTMs</SelectItem>
            {uniqueUtmSources.map((source) => (
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
          <SelectTrigger className="w-full sm:w-[140px]">
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

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : viewMode === "table" ? (
        // Table View
        filteredLeads.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum lead encontrado</p>
          </div>
        ) : (
          <>
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
                      <TableHead>Origem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead className="hidden md:table-cell">Detalhe</TableHead>
                      <TableHead className="hidden sm:table-cell">UTM</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLeads.map((lead) => (
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
                        <TableCell>
                          <SourceBadge source={lead.source} />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={lead.status}
                            onValueChange={(value) => handleUpdateStatus(lead, value as LeadStatus)}
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
                            {lead.source === "quiz" 
                              ? (lead.quiz_result || lead.quiz_name || "-")
                              : (lead.service_name || "-")}
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
                          {format(new Date(lead.created_at), "dd/MM/yy", { locale: ptBR })}
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
                                      `Olá ${lead.client_name || ""}! Gostaria de falar com você.`
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length)} de{" "}
                  {filteredLeads.length} leads
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
          </>
        )
      ) : (
        // Board/Kanban View
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leads={leadsByStatus[status]}
                onLeadClick={setSelectedLead}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <Card className="shadow-xl ring-2 ring-primary cursor-grabbing w-[280px]">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activeLead.client_name}</p>
                      <SourceBadge source={activeLead.source} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Lead Detail Modal */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              {selectedLead?.client_name || "Lead Anônimo"}
              {selectedLead && <SourceBadge source={selectedLead.source} />}
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
                        onClick={() => handleUpdateStatus(selectedLead, status)}
                      >
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Info (Quiz leads) */}
              {selectedLead.source === "quiz" && (
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
              )}

              {/* Quiz Info */}
              {selectedLead.source === "quiz" && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Quiz</h4>
                  <div className="p-3 rounded-md bg-muted/50 space-y-1">
                    {selectedLead.quiz_name && (
                      <p className="text-sm font-medium">{selectedLead.quiz_name}</p>
                    )}
                    {selectedLead.quiz_result && (
                      <p className="text-sm text-muted-foreground">
                        Resultado: <span className="text-foreground">{selectedLead.quiz_result}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}


              {/* Contact Form Info */}
              {selectedLead.source === "contact" && (
                <>
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Contato</h4>
                    <div className="grid gap-2">
                      {selectedLead.client_phone && (
                        <a
                          href={`tel:${selectedLead.client_phone}`}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-sm"
                        >
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {selectedLead.client_phone}
                        </a>
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
                    </div>
                  </div>

                  {selectedLead.service_name && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Serviço de Interesse</p>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <p className="font-medium">{selectedLead.service_name}</p>
                      </div>
                    </div>
                  )}

                  {selectedLead.message && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedLead.message}</p>
                    </div>
                  )}
                </>
              )}
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
                  Capturado em:{" "}
                  {format(new Date(selectedLead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
              {isDeleting ? "Excluindo..." : "Excluir todos"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
