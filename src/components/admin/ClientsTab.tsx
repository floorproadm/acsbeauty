import { useState } from "react";
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
  ChevronRight,
  Sparkles,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientEditModal } from "./ClientEditModal";

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

export function ClientsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

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


  const filteredClients = clients?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instagram?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground">{clients?.length || 0} clientes cadastrados</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email, telefone, instagram ou tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold group-hover:text-rose-gold transition-colors">
                      {client.name}
                    </h3>
                    {client.last_visit_at && (
                      <span className="text-xs text-muted-foreground">
                        Última visita: {format(new Date(client.last_visit_at), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    )}
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
                    href={`https://instagram.com/${selectedClient.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Instagram className="w-4 h-4 text-rose-gold" />
                    <span className="text-sm">@{selectedClient.instagram.replace("@", "")}</span>
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
    </div>
  );
}
