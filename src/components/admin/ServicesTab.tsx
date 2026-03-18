import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Layers } from "lucide-react";
import { SkusTab } from "./SkusTab";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Clock, DollarSign, Pencil, Plus } from "lucide-react";

type ServiceStatus = "entry" | "upsell" | "premium" | "inactive";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  price: number;
  promo_price: number | null;
  base_price: number | null;
  status: ServiceStatus | null;
  is_active: boolean | null;
}

const CATEGORIES = ["Cabelo", "Sobrancelhas", "Unhas"];

const statusConfig: Record<ServiceStatus, { label: string; color: string; description: string }> = {
  entry: { label: "Entrada", color: "bg-green-100 text-green-700", description: "Disponível para novos clientes" },
  upsell: { label: "Upsell", color: "bg-blue-100 text-blue-700", description: "Oferecido após serviços de entrada" },
  premium: { label: "Premium", color: "bg-purple-100 text-purple-700", description: "Requer desbloqueio admin" },
  inactive: { label: "Inativo", color: "bg-gray-100 text-gray-500", description: "Não visível para clientes" },
};

const defaultFormData = {
  name: "",
  description: "",
  category: "Cabelo",
  duration_minutes: 60,
  price: 0,
  promo_price: "",
  status: "entry" as ServiceStatus,
};

function ServicesListTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Service[];
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Service> }) => {
      const { error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast({ title: "Serviço atualizado!" });
      setEditingService(null);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const createService = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("services")
        .insert({
          name: data.name,
          slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          description: data.description || null,
          category: data.category,
          category_slug: data.category ? data.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null,
          duration_minutes: data.duration_minutes,
          price: data.price,
          promo_price: data.promo_price ? Number(data.promo_price) : null,
          status: data.status,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast({ title: "Serviço criado!" });
      setIsCreating(false);
      setFormData(defaultFormData);
    },
    onError: () => {
      toast({ title: "Erro ao criar", variant: "destructive" });
    },
  });

  const cycleStatus = (currentStatus: ServiceStatus | null) => {
    const order: ServiceStatus[] = ["entry", "upsell", "premium", "inactive"];
    const currentIndex = order.indexOf(currentStatus || "entry");
    return order[(currentIndex + 1) % order.length];
  };

  const openEditModal = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description || "",
      category: service.category || "Cabelo",
      duration_minutes: service.duration_minutes,
      price: service.price,
      promo_price: service.promo_price?.toString() || "",
      status: service.status || "entry",
    });
    setEditingService(service);
  };

  const openCreateModal = (category?: string) => {
    setFormData({ ...defaultFormData, category: category || "Cabelo" });
    setIsCreating(true);
  };

  const handleSaveEdit = () => {
    if (!editingService) return;
    updateService.mutate({
      id: editingService.id,
      updates: {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        promo_price: formData.promo_price ? Number(formData.promo_price) : null,
        status: formData.status,
      },
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.price) {
      toast({ title: "Nome e preço são obrigatórios", variant: "destructive" });
      return;
    }
    createService.mutate(formData);
  };

  const groupedServices = services?.reduce((acc, service) => {
    const category = service.category || "Outros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const ServiceFormModal = ({ isOpen, onClose, title, onSave, isPending }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onSave: () => void;
    isPending: boolean;
  }) => (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (min)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ServiceStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço ($)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo_price">Preço Promo ($)</Label>
              <Input
                id="promo_price"
                type="number"
                placeholder="Opcional"
                value={formData.promo_price}
                onChange={(e) => setFormData({ ...formData, promo_price: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={onSave} disabled={isPending}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {services?.filter(s => s.is_active).length || 0} serviços ativos
        </p>
        <Button onClick={() => openCreateModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      {/* Edit Modal */}
      <ServiceFormModal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        title="Editar Serviço"
        onSave={handleSaveEdit}
        isPending={updateService.isPending}
      />

      {/* Create Modal */}
      <ServiceFormModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Novo Serviço"
        onSave={handleCreate}
        isPending={createService.isPending}
      />

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
          <p className="text-muted-foreground mb-4">Nenhum serviço cadastrado</p>
          <Button onClick={() => openCreateModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Criar primeiro serviço
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map((category) => {
            const categoryServices = groupedServices?.[category] || [];
            
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-gold" />
                    {category}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({categoryServices.length})
                    </span>
                  </h2>
                  <Button size="sm" variant="ghost" onClick={() => openCreateModal(category)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                {categoryServices.length === 0 ? (
                  <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">Nenhum serviço nesta categoria</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryServices.map((service) => {
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

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                              <Button size="sm" variant="outline" onClick={() => openEditModal(service)}>
                                <Pencil className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              <div className="flex items-center gap-2">
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ServicesTab() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">Serviços</h1>
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="w-full max-w-sm mx-auto grid grid-cols-2">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="options" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Opções
          </TabsTrigger>
        </TabsList>
        <TabsContent value="services">
          <ServicesListTab />
        </TabsContent>
        <TabsContent value="options">
          <SkusTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
