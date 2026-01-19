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
  Phone,
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
  Sparkles,
  Calendar,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const URGENCY_LABELS: Record<string, string> = {
  urgente: "🔥 Urgente (próximos dias)",
  proxima_semana: "📅 Próxima semana",
  proximo_mes: "🗓️ Próximo mês",
  apenas_informacao: "💬 Só quer informações",
};

const ITEMS_PER_PAGE = 20;

export function WhatsAppLeadsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<WhatsAppLead | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<WhatsAppLead | null>(null);
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
    // Search filter
    const searchMatch =
      !searchQuery ||
      lead.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getServiceName(lead.service_interest).toLowerCase().includes(searchQuery.toLowerCase());

    // Urgency filter
    const urgencyMatch = selectedUrgency === "all" || lead.urgency === selectedUrgency;

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

    return searchMatch && urgencyMatch && sourceMatch && periodMatch && statusMatch;
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

  // Bulk delete leads (admin only)
  const handleBulkDelete = async () => {
    if (!isAdmin || selectedLeadIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("whatsapp_clicks")
        .delete()
        .in("id", Array.from(selectedLeadIds));
      
      if (error) throw error;
      
      toast.success(`${selectedLeadIds.size} leads excluídos com sucesso`);
      setSelectedLeadIds(new Set());
      setShowBulkDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-leads"] });
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
            {filteredLeads?.length || 0} leads capturados pelo drawer do WhatsApp
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
                isActive ? "ring-2 ring-[#25D366]" : ""
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
        <Card className="bg-gradient-to-br from-[#25D366]/10 to-[#25D366]/5 border-[#25D366]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#25D366]/20">
                <CheckCircle2 className="w-5 h-5 text-[#25D366]" />
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
            placeholder="Buscar por nome ou serviço..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={selectedUrgency}
          onValueChange={(v) => {
            setSelectedUrgency(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Clock className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Urgência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Urgências</SelectItem>
            <SelectItem value="urgente">🔥 Urgente</SelectItem>
            <SelectItem value="proxima_semana">📅 Próxima semana</SelectItem>
            <SelectItem value="proximo_mes">🗓️ Próximo mês</SelectItem>
            <SelectItem value="apenas_informacao">💬 Só informações</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedSource}
          onValueChange={(v) => {
            setSelectedSource(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <Globe className="w-4 h-4 mr-2" />
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
          <SelectTrigger className="w-full sm:w-[140px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="90days">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {isAdmin && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allOnPageSelected}
                    onCheckedChange={toggleAllOnPage}
                    aria-label="Selecionar todos"
                    className={someOnPageSelected ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                </TableHead>
              )}
              <TableHead>Nome</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Urgência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {isAdmin && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : paginatedLeads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-muted-foreground">
                  Nenhum lead encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads?.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLead(lead)}
                >
                  {isAdmin && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeadIds.has(lead.id)}
                        onCheckedChange={() => toggleLeadSelection(lead.id)}
                        aria-label={`Selecionar ${lead.client_name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {lead.client_name || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm">{getServiceName(lead.service_interest)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {URGENCY_LABELS[lead.urgency || ""] || lead.urgency || "—"}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={lead.status || "novo"}
                      onValueChange={(v) => handleUpdateStatus(lead.id, v as LeadStatus)}
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <StatusBadge status={lead.status} />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={status} />
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {lead.utm_source || "Direto"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(lead.created_at), "dd/MM/yy HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLead(lead);
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
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
              {/* Name */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Nome</p>
                <p className="font-medium">{selectedLead.client_name}</p>
              </div>

              {/* Service */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Serviço de Interesse</p>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-gold" />
                  <p className="font-medium">{getServiceName(selectedLead.service_interest)}</p>
                </div>
              </div>

              {/* Urgency */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Urgência</p>
                <p className="font-medium">
                  {URGENCY_LABELS[selectedLead.urgency || ""] || selectedLead.urgency || "—"}
                </p>
              </div>

              {/* Status */}
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
                        <div className="flex items-center gap-2">
                          <StatusBadge status={status} />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Meta info */}
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

              {/* UTM Campaign if exists */}
              {selectedLead.utm_campaign && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Campanha</p>
                  <Badge variant="outline">{selectedLead.utm_campaign}</Badge>
                </div>
              )}

              {/* Date */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Capturado em</p>
                <p className="font-medium">
                  {format(new Date(selectedLead.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {/* Delete button (admin only) */}
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
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
