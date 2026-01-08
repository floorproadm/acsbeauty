import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Instagram, Phone, Mail, Tag, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ClientsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
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
    updateTags.mutate({ id: clientId, tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const filteredClients = clients?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instagram?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients?.length || 0} clientes cadastrados</p>
        </div>
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
              className="bg-card rounded-xl border border-border p-4 shadow-soft"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Client Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{client.name}</h3>
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
                        className={`text-xs ${getTagColor(tag)} ${editingTags === client.id ? 'pr-1' : ''}`}
                      >
                        {tag}
                        {editingTags === client.id && (
                          <button
                            onClick={() => handleRemoveTag(client.id, client.tags || [], tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                    
                    {editingTags === client.id ? (
                      <div className="flex items-center gap-2">
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
                        onClick={() => setEditingTags(client.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Created date */}
                <div className="text-xs text-muted-foreground">
                  Cliente desde {format(new Date(client.created_at), "MMM yyyy", { locale: ptBR })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
