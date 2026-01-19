import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Search,
  Download,
  MessageCircle,
  Trash2,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  Globe,
  GripVertical,
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
import { ScrollArea } from "@/components/ui/scroll-area";

type LeadStatus = "novo" | "em_contato" | "convertido" | "perdido";

interface WhatsAppLead {
  id: string;
  page_path: string;
  client_name: string | null;
  service_interest: string | null;
  urgency: string | null;
  status: LeadStatus | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  referrer: string | null;
  session_id: string | null;
  created_at: string;
  services?: { name: string } | null;
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

// Draggable Lead Card Component
function LeadCard({ 
  lead, 
  onClick,
  getServiceName,
}: { 
  lead: WhatsAppLead; 
  onClick: () => void;
  getServiceName: (id: string | null) => string;
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
            <p className="font-medium text-sm truncate">{lead.client_name}</p>
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {getServiceName(lead.service_interest)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">
                {URGENCY_LABELS[lead.urgency || ""] || "—"}
              </span>
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
  getServiceName,
  onLeadClick,
}: {
  status: LeadStatus;
  leads: WhatsAppLead[];
  getServiceName: (id: string | null) => string;
  onLeadClick: (lead: WhatsAppLead) => void;
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
                  getServiceName={getServiceName}
                />
              ))
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

export function WhatsAppLeadsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<WhatsAppLead | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<WhatsAppLead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
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

  // Fetch all WhatsApp leads (only those with client_name - from drawer)
  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-whatsapp-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_clicks")
        .select("*")
        .not("client_name", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WhatsAppLead[];
    },
  });

  // Fetch services for display
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

  // Get unique sources
  const uniqueSources = [...new Set(leads?.map((l) => l.utm_source).filter(Boolean) || [])];

  // Filter leads
  const filteredLeads = leads?.filter((lead) => {
    const searchMatch =
      !searchQuery ||
      lead.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getServiceName(lead.service_interest).toLowerCase().includes(searchQuery.toLowerCase());

    const urgencyMatch = selectedUrgency === "all" || lead.urgency === selectedUrgency;
    const sourceMatch = selectedSource === "all" || lead.utm_source === selectedSource;

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

    return searchMatch && urgencyMatch && sourceMatch && periodMatch;
  });

  // Group leads by status
  const leadsByStatus: Record<LeadStatus, WhatsAppLead[]> = {
    novo: filteredLeads?.filter(l => (l.status || "novo") === "novo") || [],
    em_contato: filteredLeads?.filter(l => l.status === "em_contato") || [],
    convertido: filteredLeads?.filter(l => l.status === "convertido") || [],
    perdido: filteredLeads?.filter(l => l.status === "perdido") || [],
  };

  // Export to CSV
  const handleExport = () => {
    if (!filteredLeads) return;

    const headers = ["Nome", "Serviço", "Urgência", "Status", "Origem", "Página", "Data"];
    const rows = filteredLeads.map((lead) => [
      lead.client_name || "",
      getServiceName(lead.service_interest),
      URGENCY_LABELS[lead.urgency || ""] || lead.urgency || "",
      STATUS_CONFIG[lead.status || "novo"]?.label || lead.status || "",
      lead.utm_source || "Direto",
      lead.page_path || "",
      format(new Date(lead.created_at), "dd/MM/yyyy HH:mm"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `whatsapp-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  // Update lead status
  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const { error } = await supabase
        .from("whatsapp_clicks")
        .update({ status: newStatus })
        .eq("id", leadId);
      
      if (error) throw error;
      
      toast.success(`Status atualizado para "${STATUS_CONFIG[newStatus].label}"`);
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-leads"] });
      
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
        .from("whatsapp_clicks")
        .delete()
        .eq("id", leadToDelete.id);
      
      if (error) throw error;
      
      toast.success("Lead excluído com sucesso");
      setSelectedLead(null);
      setLeadToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-leads"] });
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Erro ao excluir lead");
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = active.id as string;
    const overId = over.id as string;

    // Find what column we're dropping into
    let newStatus: LeadStatus | null = null;
    
    // Check if dropped on a lead in a column
    for (const [status, statusLeads] of Object.entries(leadsByStatus)) {
      if (statusLeads.some(l => l.id === overId)) {
        newStatus = status as LeadStatus;
        break;
      }
    }

    // If not dropped on a lead, check if dropped in empty column area
    if (!newStatus && (["novo", "em_contato", "convertido", "perdido"] as LeadStatus[]).includes(overId as LeadStatus)) {
      newStatus = overId as LeadStatus;
    }

    if (!newStatus) return;

    // Find active lead's current status
    const activeLead = leads?.find(l => l.id === activeLeadId);
    if (!activeLead || activeLead.status === newStatus) return;

    // Update the lead status
    handleUpdateStatus(activeLeadId, newStatus);
  };

  // Stats
  const statusStats = {
    novo: leadsByStatus.novo.length,
    em_contato: leadsByStatus.em_contato.length,
    convertido: leadsByStatus.convertido.length,
    perdido: leadsByStatus.perdido.length,
  };

  const totalLeads = leads?.length || 0;
  const conversionRate = totalLeads 
    ? Math.round((statusStats.convertido / totalLeads) * 100) 
    : 0;

  const activeLead = leads?.find(l => l.id === activeId);

  // Status badge component
  const StatusBadge = ({ status }: { status: LeadStatus | null }) => {
    const config = STATUS_CONFIG[status || "novo"];
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
          <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-[#25D366]" />
            WhatsApp Leads
          </h1>
          <p className="text-sm text-muted-foreground">
            Arraste os cards entre colunas para atualizar o status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {conversionRate}% conversão
          </Badge>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Clock className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Urgência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="urgente">🔥 Urgente</SelectItem>
            <SelectItem value="proxima_semana">📅 Próxima semana</SelectItem>
            <SelectItem value="proximo_mes">🗓️ Próximo mês</SelectItem>
            <SelectItem value="apenas_informacao">💬 Só informações</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSource} onValueChange={setSelectedSource}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {uniqueSources.map((source) => (
              <SelectItem key={source} value={source!}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">7 dias</SelectItem>
            <SelectItem value="30days">30 dias</SelectItem>
            <SelectItem value="90days">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[280px] flex-1">
              <Skeleton className="h-[400px] rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
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
                getServiceName={getServiceName}
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
                      <div className="flex items-center gap-1 mt-1">
                        <Sparkles className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {getServiceName(activeLead.service_interest)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Lead Detail Modal */}
      <Dialog open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              Detalhes do Lead
            </DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Nome</p>
                <p className="font-medium">{selectedLead.client_name}</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Serviço de Interesse</p>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-gold" />
                  <p className="font-medium">{getServiceName(selectedLead.service_interest)}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Urgência</p>
                <p className="font-medium">
                  {URGENCY_LABELS[selectedLead.urgency || ""] || selectedLead.urgency || "—"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Select
                  value={selectedLead.status || "novo"}
                  onValueChange={(v) => handleUpdateStatus(selectedLead.id, v as LeadStatus)}
                >
                  <SelectTrigger className="w-full">
                    <StatusBadge status={selectedLead.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        <StatusBadge status={status} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Origem</p>
                  <Badge variant="secondary">{selectedLead.utm_source || "Direto"}</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Página</p>
                  <p className="text-sm truncate">{selectedLead.page_path}</p>
                </div>
              </div>

              {selectedLead.utm_campaign && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Campanha</p>
                  <Badge variant="outline">{selectedLead.utm_campaign}</Badge>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Capturado em</p>
                <p className="font-medium">
                  {format(new Date(selectedLead.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {isAdmin && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setLeadToDelete(selectedLead)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Lead
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!leadToDelete} onOpenChange={(o) => !o && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead de "{leadToDelete?.client_name}"? 
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
    </div>
  );
}
