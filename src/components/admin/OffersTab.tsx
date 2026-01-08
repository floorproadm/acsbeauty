import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tag, Copy, Sparkles, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type OfferType = "entry_offer" | "package_offer" | "consultation_offer";

const typeConfig: Record<OfferType, { label: string; color: string }> = {
  entry_offer: { label: "Entrada", color: "bg-green-100 text-green-700" },
  package_offer: { label: "Pacote", color: "bg-blue-100 text-blue-700" },
  consultation_offer: { label: "Consulta", color: "bg-purple-100 text-purple-700" },
};

export function OffersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: offers, isLoading } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, services(name), packages(name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateOffer = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("offers")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      toast({ title: "Oferta atualizada!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const cloneOffer = useMutation({
    mutationFn: async (offer: typeof offers[0]) => {
      const { id, created_at, updated_at, services, packages, ...rest } = offer;
      const { error } = await supabase
        .from("offers")
        .insert({
          ...rest,
          name: `${offer.name} (cópia)`,
          active: false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      toast({ title: "Oferta clonada!" });
    },
    onError: () => {
      toast({ title: "Erro ao clonar", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Ofertas</h1>
          <p className="text-sm text-muted-foreground">
            {offers?.filter(o => o.active).length || 0} ofertas ativas
          </p>
        </div>
      </div>

      {/* Offers List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : !offers?.length ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma oferta cadastrada</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => {
            const type = typeConfig[offer.type as OfferType];
            const isExpired = offer.end_at && new Date(offer.end_at) < new Date();
            const isScheduled = offer.start_at && new Date(offer.start_at) > new Date();

            return (
              <div
                key={offer.id}
                className={`bg-card rounded-xl border border-border p-5 shadow-soft ${
                  !offer.active || isExpired ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Offer Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{offer.name}</h3>
                      <Badge variant="outline" className={`${type?.color} text-xs`}>
                        {type?.label}
                      </Badge>
                      {isExpired && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 text-xs">
                          Expirada
                        </Badge>
                      )}
                      {isScheduled && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 text-xs">
                          Agendada
                        </Badge>
                      )}
                    </div>
                    
                    {offer.headline && (
                      <p className="font-medium text-rose-gold mb-1">{offer.headline}</p>
                    )}
                    
                    {offer.body && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {offer.body}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      {offer.price_display && (
                        <span className="font-bold text-lg">{offer.price_display}</span>
                      )}
                      
                      {offer.services?.name && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Sparkles className="w-3 h-3" />
                          {offer.services.name}
                        </span>
                      )}
                      
                      {offer.packages?.name && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Tag className="w-3 h-3" />
                          {offer.packages.name}
                        </span>
                      )}
                      
                      {offer.limit_spots && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {offer.limit_spots} vagas
                        </span>
                      )}
                      
                      {(offer.start_at || offer.end_at) && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {offer.start_at && format(new Date(offer.start_at), "dd/MM", { locale: ptBR })}
                          {offer.start_at && offer.end_at && " - "}
                          {offer.end_at && format(new Date(offer.end_at), "dd/MM", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cloneOffer.mutate(offer)}
                      disabled={cloneOffer.isPending}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Clonar
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {offer.active ? "Ativa" : "Inativa"}
                      </span>
                      <Switch
                        checked={offer.active || false}
                        onCheckedChange={(checked) =>
                          updateOffer.mutate({ id: offer.id, updates: { active: checked } })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
