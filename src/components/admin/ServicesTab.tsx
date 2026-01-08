import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Clock, DollarSign } from "lucide-react";

type ServiceStatus = "entry" | "upsell" | "premium" | "inactive";

const statusConfig: Record<ServiceStatus, { label: string; color: string; description: string }> = {
  entry: { label: "Entrada", color: "bg-green-100 text-green-700", description: "Disponível para novos clientes" },
  upsell: { label: "Upsell", color: "bg-blue-100 text-blue-700", description: "Oferecido após serviços de entrada" },
  premium: { label: "Premium", color: "bg-purple-100 text-purple-700", description: "Requer desbloqueio admin" },
  inactive: { label: "Inativo", color: "bg-gray-100 text-gray-500", description: "Não visível para clientes" },
};

export function ServicesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<typeof services[0]> }) => {
      const { error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast({ title: "Serviço atualizado!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const cycleStatus = (currentStatus: ServiceStatus | null) => {
    const order: ServiceStatus[] = ["entry", "upsell", "premium", "inactive"];
    const currentIndex = order.indexOf(currentStatus || "entry");
    return order[(currentIndex + 1) % order.length];
  };

  const groupedServices = services?.reduce((acc, service) => {
    const category = service.category || "Outros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            {services?.filter(s => s.is_active).length || 0} serviços ativos
          </p>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <Badge variant="outline" className={`${config.color} text-xs`}>
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">{config.description}</span>
          </div>
        ))}
      </div>

      {/* Services List by Category */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !services?.length ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum serviço cadastrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedServices || {}).map(([category, categoryServices]) => (
            <div key={category}>
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-gold" />
                {category}
              </h2>
              <div className="space-y-3">
                {categoryServices?.map((service) => {
                  const status = statusConfig[service.status as ServiceStatus] || statusConfig.entry;
                  
                  return (
                    <div
                      key={service.id}
                      className={`bg-card rounded-xl border border-border p-4 shadow-soft ${
                        !service.is_active ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Service Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{service.name}</h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-0"
                              onClick={() => updateService.mutate({
                                id: service.id,
                                updates: { status: cycleStatus(service.status as ServiceStatus) }
                              })}
                            >
                              <Badge variant="outline" className={`${status.color} text-xs cursor-pointer hover:opacity-80`}>
                                {status.label}
                              </Badge>
                            </Button>
                          </div>
                          
                          {service.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {service.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {service.duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${service.price}
                              {service.promo_price && (
                                <span className="text-rose-gold ml-1">(promo: ${service.promo_price})</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Toggle Active */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {service.is_active ? "Ativo" : "Inativo"}
                          </span>
                          <Switch
                            checked={service.is_active || false}
                            onCheckedChange={(checked) => 
                              updateService.mutate({ id: service.id, updates: { is_active: checked } })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
