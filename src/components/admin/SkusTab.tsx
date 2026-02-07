import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layers, Package, Eye, Sparkles, Clock, DollarSign } from "lucide-react";

interface ServiceWithCounts {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean | null;
  variations_count: number;
  skus_count: number;
}

interface Variation {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

interface Sku {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  promo_price: number | null;
  is_active: boolean;
  sort_order: number;
  variation_id: string | null;
  variation_name: string | null;
}

export function SkusTab() {
  const [selectedService, setSelectedService] = useState<ServiceWithCounts | null>(null);

  // Fetch services with variation and SKU counts
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["admin-services-with-sku-counts"],
    queryFn: async () => {
      // First get all services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, category, duration_minutes, price, is_active")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (servicesError) throw servicesError;

      // Get variation counts per service
      const { data: variationsData, error: variationsError } = await supabase
        .from("service_variations")
        .select("service_id");

      if (variationsError) throw variationsError;

      // Get SKU counts per service
      const { data: skusData, error: skusError } = await supabase
        .from("service_skus")
        .select("service_id");

      if (skusError) throw skusError;

      // Count variations per service
      const variationCounts: Record<string, number> = {};
      variationsData?.forEach((v) => {
        variationCounts[v.service_id] = (variationCounts[v.service_id] || 0) + 1;
      });

      // Count SKUs per service
      const skuCounts: Record<string, number> = {};
      skusData?.forEach((s) => {
        skuCounts[s.service_id] = (skuCounts[s.service_id] || 0) + 1;
      });

      // Merge counts into services
      return servicesData.map((service) => ({
        ...service,
        variations_count: variationCounts[service.id] || 0,
        skus_count: skuCounts[service.id] || 0,
      })) as ServiceWithCounts[];
    },
  });

  // Fetch variations for selected service
  const { data: variations, isLoading: isLoadingVariations } = useQuery({
    queryKey: ["service-variations", selectedService?.id],
    queryFn: async () => {
      if (!selectedService) return [];
      
      const { data, error } = await supabase
        .from("service_variations")
        .select("id, name, sort_order, is_active")
        .eq("service_id", selectedService.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Variation[];
    },
    enabled: !!selectedService,
  });

  // Fetch SKUs for selected service
  const { data: skus, isLoading: isLoadingSkus } = useQuery({
    queryKey: ["service-skus", selectedService?.id],
    queryFn: async () => {
      if (!selectedService) return [];
      
      const { data, error } = await supabase
        .from("service_skus")
        .select(`
          id, 
          name, 
          duration_minutes, 
          price, 
          promo_price, 
          is_active, 
          sort_order,
          variation_id,
          service_variations (name)
        `)
        .eq("service_id", selectedService.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      
      return data.map((sku) => ({
        ...sku,
        variation_name: sku.service_variations?.name || null,
      })) as Sku[];
    },
    enabled: !!selectedService,
  });

  const totalVariations = services?.reduce((acc, s) => acc + s.variations_count, 0) || 0;
  const totalSkus = services?.reduce((acc, s) => acc + s.skus_count, 0) || 0;

  const groupedByCategory = services?.reduce((acc, service) => {
    const category = service.category || "Outros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, ServiceWithCounts[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-rose-gold" />
            Variações & SKUs
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalVariations} variações • {totalSkus} SKUs cadastrados
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-amber-50 text-amber-700 border-amber-200">
          <Eye className="w-3 h-3 mr-1" />
          Somente Leitura (Fase 1)
        </Badge>
      </div>

      {/* Info Banner */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Fase 1 - Foundation:</strong> Esta aba exibe o mapeamento de variações e SKUs por serviço. 
          O gerenciamento (criar/editar) será habilitado na Fase 2.
        </p>
      </div>

      {/* Services List */}
      {isLoadingServices ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !services?.length ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Nenhum serviço cadastrado</p>
          <p className="text-sm text-muted-foreground">
            Crie serviços na aba "Serviços" para começar a mapear variações e SKUs.
          </p>
        </div>
      ) : totalVariations === 0 && totalSkus === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-2">Nenhuma Variação/SKU Cadastrado</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            O sistema está pronto para suportar variações e SKUs. 
            Na Fase 2, você poderá criar variações (ex: "Com Henna", "Com Linha") 
            e SKUs (ex: "30min - $35") para cada serviço.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCategory || {}).map(([category, categoryServices]) => (
            <div key={category}>
              <h2 className="font-semibold text-lg flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-rose-gold" />
                {category}
              </h2>
              
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead className="text-center">Variações</TableHead>
                      <TableHead className="text-center">SKUs</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={service.variations_count > 0 ? "bg-blue-50 text-blue-700" : ""}>
                            {service.variations_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={service.skus_count > 0 ? "bg-purple-50 text-purple-700" : ""}>
                            {service.skus_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={service.is_active ? "default" : "secondary"}>
                            {service.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedService(service)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal (Read-Only) */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-gold" />
              {selectedService?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Service Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Default: {selectedService?.duration_minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Default: ${selectedService?.price}
                </span>
                <Badge variant="outline">{selectedService?.category}</Badge>
              </div>
            </div>

            {/* Variations Section */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Variações ({variations?.length || 0})
              </h3>
              
              {isLoadingVariations ? (
                <Skeleton className="h-20 w-full" />
              ) : !variations?.length ? (
                <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma variação cadastrada para este serviço.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {variations.map((variation) => (
                    <div
                      key={variation.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6">
                          #{variation.sort_order}
                        </span>
                        <span className="font-medium">{variation.name}</span>
                      </div>
                      <Badge variant={variation.is_active ? "default" : "secondary"}>
                        {variation.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SKUs Section */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                SKUs ({skus?.length || 0})
              </h3>
              
              {isLoadingSkus ? (
                <Skeleton className="h-20 w-full" />
              ) : !skus?.length ? (
                <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    Nenhum SKU cadastrado para este serviço.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {skus.map((sku) => (
                    <div
                      key={sku.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{sku.name}</span>
                          {sku.variation_name && (
                            <Badge variant="outline" className="text-xs">
                              {sku.variation_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {sku.duration_minutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${sku.price || "-"}
                            {sku.promo_price && (
                              <span className="text-rose-gold ml-1">
                                (promo: ${sku.promo_price})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <Badge variant={sku.is_active ? "default" : "secondary"}>
                        {sku.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
