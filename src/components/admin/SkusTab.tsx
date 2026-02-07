import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layers, Package, Pencil, Sparkles } from "lucide-react";
import { VariationsModal } from "./VariationsModal";
import { SkusModal } from "./SkusModal";

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

export function SkusTab() {
  const [variationsService, setVariationsService] = useState<ServiceWithCounts | null>(null);
  const [skusService, setSkusService] = useState<ServiceWithCounts | null>(null);

  // Fetch services with variation and SKU counts
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["admin-services-with-sku-counts"],
    queryFn: async () => {
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, category, duration_minutes, price, is_active")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (servicesError) throw servicesError;

      const { data: variationsData, error: variationsError } = await supabase
        .from("service_variations")
        .select("service_id");

      if (variationsError) throw variationsError;

      const { data: skusData, error: skusError } = await supabase
        .from("service_skus")
        .select("service_id");

      if (skusError) throw skusError;

      const variationCounts: Record<string, number> = {};
      variationsData?.forEach((v) => {
        variationCounts[v.service_id] = (variationCounts[v.service_id] || 0) + 1;
      });

      const skuCounts: Record<string, number> = {};
      skusData?.forEach((s) => {
        skuCounts[s.service_id] = (skuCounts[s.service_id] || 0) + 1;
      });

      return servicesData.map((service) => ({
        ...service,
        variations_count: variationCounts[service.id] || 0,
        skus_count: skuCounts[service.id] || 0,
      })) as ServiceWithCounts[];
    },
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
            Técnicas & Opções
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalVariations} técnicas • {totalSkus} opções cadastradas
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Gestão de Técnicas e Opções:</strong> Use os botões de edição para gerenciar 
          técnicas (ex: Com Henna, Sem Linha) e opções (duração/preço específicos) de cada serviço.
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
            Crie serviços na aba "Serviços" para começar a mapear técnicas e opções.
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
                      <TableHead className="text-center">Técnicas</TableHead>
                      <TableHead className="text-center">Opções</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={service.variations_count > 0 ? "bg-blue-50 text-blue-700" : ""}
                          >
                            {service.variations_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={service.skus_count > 0 ? "bg-purple-50 text-purple-700" : ""}
                          >
                            {service.skus_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={service.is_active ? "default" : "secondary"}>
                            {service.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setVariationsService(service)}
                              title="Gerenciar Técnicas"
                            >
                              <Layers className="w-4 h-4 mr-1" />
                              Técnicas
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSkusService(service)}
                              title="Gerenciar Opções"
                            >
                              <Package className="w-4 h-4 mr-1" />
                              Opções
                            </Button>
                          </div>
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

      {/* Variations Modal */}
      {variationsService && (
        <VariationsModal
          open={!!variationsService}
          onOpenChange={(open) => !open && setVariationsService(null)}
          serviceId={variationsService.id}
          serviceName={variationsService.name}
        />
      )}

      {/* SKUs Modal */}
      {skusService && (
        <SkusModal
          open={!!skusService}
          onOpenChange={(open) => !open && setSkusService(null)}
          serviceId={skusService.id}
          serviceName={skusService.name}
        />
      )}
    </div>
  );
}
