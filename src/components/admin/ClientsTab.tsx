import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Users,
  Instagram,
  Phone,
  Mail,
  Tag,
  Plus,
  X,
  Calendar,
  Package,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Pencil,
  Upload,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientEditModal } from "./ClientEditModal";
import { ClientImportSheet } from "./ClientImportSheet";

interface ClientWithRelations {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  tags: string[] | null;
  created_at: string;
  last_visit_at: string | null;
  bookings?: {
    id: string;
    start_time: string;
    status: string;
    total_price: number | null;
    services: { name: string } | null;
    packages: { name: string } | null;
  }[];
}

const PAGE_SIZE = 25;

export function ClientsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: clientsResult, isLoading } = useQuery({
    queryKey: ["admin-clients", page, debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (debouncedSearch.trim()) {
        const s = `%${debouncedSearch.trim()}%`;
        query = query.or(`name.ilike.${s},email.ilike.${s},phone.ilike.${s},instagram.ilike.${s}`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count: count ?? 0 };
    },
  });

  const clients = clientsResult?.data;
  const totalCount = clientsResult?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Fetch selected client with full relations
  const { data: selectedClient, isLoading: isLoadingClient } = useQuery({
    queryKey: ["admin-client-detail", selectedClientId],
    queryFn: async () => {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", selectedClientId!)
        .single();

      if (clientError) throw clientError;

      // Fetch bookings for this client
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, start_time, status, total_price, services(name), packages(name)")
        .eq("client_id", selectedClientId!)
        .order("start_time", { ascending: false });

      if (bookingsError) throw bookingsError;

      return {
        ...clientData,
        bookings: bookingsData,
      } as ClientWithRelations;
    },
    enabled: !!selectedClientId,
  });

  const updateTags = useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { error } = await supabase
        .from("clients")
        .update({ tags })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-detail"] });
      toast({ title: "Tags atualizadas!" });
      setEditingTags(null);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const handleAddTag = (clientId: string, currentTags: string[]) => {
    if (newTag.trim()) {
      updateTags.mutate({ id: clientId, tags: [...currentTags, newTag.trim()] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (clientId: string, currentTags: string[], tagToRemove: string) => {
    updateTags.mutate({ id: clientId, tags: currentTags.filter((t) => t !== tagToRemove) });
  };


  // Client frequency & retention helpers
  const getClientFrequency = (client: any) => {
    const lastVisit = client.last_visit_at;
    if (!lastVisit) return { label: "Novo", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "✨" };
    const days = differenceInDays(new Date(), new Date(lastVisit));
    if (days <= 30) return { label: "Frequente", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "🔥" };
    if (days <= 60) return { label: "Ocasional", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "⏳" };
    if (days <= 90) return { label: "Ausente", color: "bg-orange-100 text-orange-700 border-orange-200", icon: "⚠️" };
    return { label: "Inativo", color: "bg-red-100 text-red-700 border-red-200", icon: "🚨" };
  };

  const getRetentionAlert = (client: any) => {
    if (!client.last_visit_at) return null;
    const days = differenceInDays(new Date(), new Date(client.last_visit_at));
    if (days >= 90) return { days, level: "critical", text: `${days} dias sem visita` };
    if (days >= 60) return { days, level: "warning", text: `${days} dias sem visita` };
    if (days >= 30) return { days, level: "notice", text: `${days} dias sem visita` };
    return null;
  };

  const filteredClients = clients;

  const tagColors: Record<string, string> = {
    vip: "bg-amber-100 text-amber-800 border-amber-200",
    new: "bg-green-100 text-green-800 border-green-200",
    instagram: "bg-pink-100 text-pink-800 border-pink-200",
    recurrent: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const getTagColor = (tag: string) => {
    const lowerTag = tag.toLowerCase();
    return tagColors[lowerTag] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-orange-100 text-orange-800",
    requested: "bg-yellow-100 text-yellow-800",
  };

  const statusLabels: Record<string, string> = {
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
    no_show: "Não compareceu",
    requested: "Solicitado",
  };

  // Calculate client stats
  const getClientStats = (client: ClientWithRelations) => {
    const bookings = client.bookings || [];
    const completedBookings = bookings.filter((b) => b.status === "completed");
    const totalSpent = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const totalBookings = bookings.length;
    const upcomingBookings = bookings.filter(
      (b) => new Date(b.start_time) > new Date() && b.status !== "cancelled"
    ).length;

    return { totalSpent, totalBookings, upcomingBookings, completedBookings: completedBookings.length };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button className="flex-1" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Novo Cliente
          </Button>
          <Button size="icon" variant="outline" className="h-10 w-10 shrink-0" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{totalCount} clientes cadastrados</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email, telefone ou instagram..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Clients List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredClients?.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredClients?.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              className="bg-card rounded-xl border border-border p-4 shadow-soft cursor-pointer hover:border-rose-gold/50 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Client Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold group-hover:text-rose-gold transition-colors">
                      {client.name}
                    </h3>
                    {/* Frequency Badge */}
                    {(() => {
                      const freq = getClientFrequency(client);
                      return (
                        <Badge variant="outline" className={`text-xs ${freq.color}`}>
                          {freq.icon} {freq.label}
                        </Badge>
                      );
                    })()}
                    {/* Retention Alert */}
                    {(() => {
                      const alert = getRetentionAlert(client);
                      if (!alert) return null;
                      return (
                        <span className={`text-xs font-medium ${
                          alert.level === "critical" ? "text-red-600" :
                          alert.level === "warning" ? "text-orange-600" :
                          "text-amber-600"
                        }`}>
                          {alert.text}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </span>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </span>
                    )}
                    {client.instagram && (
                      <span className="flex items-center gap-1">
                        <Instagram className="w-3 h-3" />
                        @{client.instagram.replace("@", "")}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    {client.tags?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`text-xs ${getTagColor(tag)} ${editingTags === client.id ? "pr-1" : ""}`}
                      >
                        {tag}
                        {editingTags === client.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(client.id, client.tags || [], tag);
                            }}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}

                    {editingTags === client.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Nova tag"
                          className="h-7 text-xs w-24"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddTag(client.id, client.tags || []);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => handleAddTag(client.id, client.tags || [])}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => setEditingTags(null)}
                        >
                          OK
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTags(client.id);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground">
                    Cliente desde {format(new Date(client.created_at), "MMM yyyy", { locale: ptBR })}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-rose-gold transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages} ({totalCount} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      {/* Client Detail Modal */}
      <Dialog open={!!selectedClientId} onOpenChange={(open) => !open && setSelectedClientId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {isLoadingClient ? (
            <div className="space-y-4 py-8">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : selectedClient ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl flex items-center gap-3">
                  {selectedClient.name}
                  {selectedClient.tags?.includes("vip") && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">VIP</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 border-b">
                {selectedClient.phone && (
                  <a
                    href={`tel:${selectedClient.phone}`}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Phone className="w-4 h-4 text-rose-gold" />
                    <span className="text-sm">{selectedClient.phone}</span>
                  </a>
                )}
                {selectedClient.email && (
                  <a
                    href={`mailto:${selectedClient.email}`}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Mail className="w-4 h-4 text-rose-gold" />
                    <span className="text-sm truncate">{selectedClient.email}</span>
                  </a>
                )}
                {selectedClient.instagram && (
                  <a
                    href={`https://instagram.com/${selectedClient.instagram.replace("@", "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^http:\/?\/?instagram\.com\//i, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Instagram className="w-4 h-4 text-rose-gold" />
                    <span className="text-sm">@{selectedClient.instagram.replace("@", "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^http:\/?\/?instagram\.com\//i, "")}</span>
                  </a>
                )}
              </div>

              {/* Stats */}
              {(() => {
                const stats = getClientStats(selectedClient);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b">
                    <div className="text-center p-3 rounded-lg bg-rose-light/30">
                      <div className="flex items-center justify-center gap-1 text-rose-gold mb-1">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <p className="text-lg font-bold">${stats.totalSpent.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Total gasto</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <p className="text-lg font-bold">{stats.totalBookings}</p>
                      <p className="text-xs text-muted-foreground">Agendamentos</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <p className="text-lg font-bold">{stats.completedBookings}</p>
                      <p className="text-xs text-muted-foreground">Concluídos</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-50">
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className="text-lg font-bold">{stats.upcomingBookings}</p>
                      <p className="text-xs text-muted-foreground">Próximos</p>
                    </div>
                  </div>
                );
              })()}

              {/* Tags Section */}
              <div className="py-4 border-b">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedClient.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`${getTagColor(tag)} pr-1`}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(selectedClient.id, selectedClient.tags || [], tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Nova tag"
                      className="h-7 text-xs w-24"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddTag(selectedClient.id, selectedClient.tags || []);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => handleAddTag(selectedClient.id, selectedClient.tags || [])}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Booking History */}
              <div className="py-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Histórico de Agendamentos
                </h4>
                {selectedClient.bookings?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum agendamento encontrado
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedClient.bookings?.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              {booking.services?.name || booking.packages?.name || "Serviço"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(booking.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {booking.total_price && (
                            <span className="text-sm font-medium">
                              ${booking.total_price.toFixed(0)}
                            </span>
                          )}
                          <Badge className={`text-xs ${statusColors[booking.status] || "bg-gray-100"}`}>
                            {statusLabels[booking.status] || booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Info + Edit Button */}
              <div className="pt-4 border-t space-y-4">
                <div className="text-xs text-muted-foreground text-center">
                  Cliente desde {format(new Date(selectedClient.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {selectedClient.last_visit_at && (
                    <> • Última visita em {format(new Date(selectedClient.last_visit_at), "dd/MM/yyyy", { locale: ptBR })}</>
                  )}
                </div>

                {/* Edit Button */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar Cliente
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <ClientEditModal
        client={selectedClient}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onDeleted={() => setSelectedClientId(null)}
      />

      {/* Create Modal */}
      <ClientEditModal
        client={null}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
      />

      {/* Import Sheet */}
      <ClientImportSheet open={isImportOpen} onOpenChange={setIsImportOpen} />
    </div>
  );
}
