import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus, ExternalLink, Copy, TrendingUp } from "lucide-react";

type CampaignStatus = "draft" | "active" | "paused" | "completed";

const statusConfig: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-700" },
  active: { label: "Ativa", color: "bg-green-100 text-green-700" },
  paused: { label: "Pausada", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Concluída", color: "bg-blue-100 text-blue-700" },
};

export function CampaignsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    channel: "instagram",
    utm_campaign: "",
    budget: "",
    primary_kpi: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("campaigns")
        .insert({
          name: newCampaign.name,
          channel: newCampaign.channel,
          utm_campaign: newCampaign.utm_campaign || null,
          budget: newCampaign.budget ? parseFloat(newCampaign.budget) : null,
          primary_kpi: newCampaign.primary_kpi || null,
          status: "draft",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      toast({ title: "Campanha criada!" });
      setIsDialogOpen(false);
      setNewCampaign({ name: "", channel: "instagram", utm_campaign: "", budget: "", primary_kpi: "" });
    },
    onError: () => {
      toast({ title: "Erro ao criar campanha", variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CampaignStatus }) => {
      const { error } = await supabase
        .from("campaigns")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-active-campaigns"] });
      toast({ title: "Status atualizado!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const copyTrackingUrl = (campaign: typeof campaigns[0]) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/services?utm_source=${campaign.channel}&utm_medium=social&utm_campaign=${campaign.utm_campaign || campaign.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Campanhas</h1>
          <p className="text-sm text-muted-foreground">
            {campaigns?.filter(c => c.status === "active").length || 0} campanhas ativas
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Nome da Campanha</Label>
                <Input
                  id="name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Ex: Promoção Verão 2024"
                />
              </div>
              
              <div>
                <Label htmlFor="channel">Canal</Label>
                <Select
                  value={newCampaign.channel}
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, channel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="referral">Indicação</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="utm">UTM Campaign (para tracking)</Label>
                <Input
                  id="utm"
                  value={newCampaign.utm_campaign}
                  onChange={(e) => setNewCampaign({ ...newCampaign, utm_campaign: e.target.value })}
                  placeholder="Ex: verao2024"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Orçamento ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="kpi">KPI Principal</Label>
                  <Input
                    id="kpi"
                    value={newCampaign.primary_kpi}
                    onChange={(e) => setNewCampaign({ ...newCampaign, primary_kpi: e.target.value })}
                    placeholder="Ex: bookings"
                  />
                </div>
              </div>
              
              <Button
                onClick={() => createCampaign.mutate()}
                disabled={!newCampaign.name || createCampaign.isPending}
                className="w-full"
              >
                Criar Campanha
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : !campaigns?.length ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Nenhuma campanha cadastrada</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Campanha
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const status = statusConfig[campaign.status as CampaignStatus] || statusConfig.draft;

            return (
              <div
                key={campaign.id}
                className="bg-card rounded-xl border border-border p-5 shadow-soft"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Campaign Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      <Badge variant="outline" className={`${status.color} text-xs`}>
                        {status.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {campaign.channel}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {campaign.utm_campaign && (
                        <span className="flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          UTM: {campaign.utm_campaign}
                        </span>
                      )}
                      {campaign.budget && (
                        <span className="flex items-center gap-1">
                          💰 ${campaign.budget}
                        </span>
                      )}
                      {campaign.primary_kpi && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          KPI: {campaign.primary_kpi}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyTrackingUrl(campaign)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Link
                    </Button>
                    
                    <Select
                      value={campaign.status || "draft"}
                      onValueChange={(value) => updateStatus.mutate({ id: campaign.id, status: value as CampaignStatus })}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="paused">Pausada</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
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
