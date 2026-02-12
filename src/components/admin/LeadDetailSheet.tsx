import { useState } from "react";
import { useQuery, useQueryClient, QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Mail,
  Instagram,
  MessageCircle,
  Trash2,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  StickyNote,
  Send,
  ArrowRightCircle,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type LeadStatus = "novo" | "em_contato" | "convertido" | "perdido";
type LeadSource = "quiz" | "contact";

interface UnifiedLead {
  id: string;
  source: LeadSource;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  client_instagram: string | null;
  status: LeadStatus;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string;
  quiz_name?: string;
  quiz_result?: string;
  answers?: unknown;
  completed_at?: string | null;
  service_interest?: string | null;
  service_name?: string;
  urgency?: string | null;
  page_path?: string;
  message?: string | null;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; icon: React.ElementType }> = {
  novo: { label: "Novo", color: "text-blue-600", icon: UserPlus },
  em_contato: { label: "Em Contato", color: "text-amber-600", icon: Clock },
  convertido: { label: "Convertido", color: "text-green-600", icon: CheckCircle2 },
  perdido: { label: "Perdido", color: "text-red-600", icon: XCircle },
};

const ACTIVITY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  status_change: { label: "Status alterado", icon: ArrowRightCircle },
  note_added: { label: "Nota adicionada", icon: StickyNote },
  converted_to_client: { label: "Convertido para cliente", icon: UserPlus },
  created: { label: "Lead capturado", icon: Sparkles },
};

function SourceBadge({ source }: { source: LeadSource }) {
  const config = {
    quiz: { className: "bg-purple-50 text-purple-700 border-purple-200 text-xs", label: "📝 Quiz" },
    contact: { className: "bg-green-50 text-green-700 border-green-200 text-xs", label: "💬 Contato" },
  };
  const { className, label } = config[source];
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

interface LeadDetailSheetProps {
  lead: UnifiedLead | null;
  onClose: () => void;
  isAdmin: boolean;
  isDeleting: boolean;
  onUpdateStatus: (lead: UnifiedLead, status: LeadStatus) => void;
  onDelete: (lead: UnifiedLead) => void;
  queryClient: QueryClient;
}

export function LeadDetailSheet({
  lead,
  onClose,
  isAdmin,
  isDeleting,
  onUpdateStatus,
  onDelete,
  queryClient,
}: LeadDetailSheetProps) {
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Fetch notes for the selected lead
  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ["lead-notes", lead?.id],
    enabled: !!lead,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", lead!.id)
        .eq("lead_source", lead!.source)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch activities for the selected lead
  const { data: activities, refetch: refetchActivities } = useQuery({
    queryKey: ["lead-activities", lead?.id],
    enabled: !!lead,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", lead!.id)
        .eq("lead_source", lead!.source)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Check if already a client
  const { data: existingClient } = useQuery({
    queryKey: ["lead-existing-client", lead?.client_email, lead?.client_phone],
    enabled: !!lead && (!!lead.client_email || !!lead.client_phone),
    queryFn: async () => {
      let query = supabase.from("clients").select("id, name").limit(1);
      if (lead!.client_email) {
        query = query.eq("email", lead!.client_email);
      } else if (lead!.client_phone) {
        query = query.eq("phone", lead!.client_phone);
      }
      const { data } = await query.maybeSingle();
      return data;
    },
  });

  const handleAddNote = async () => {
    if (!lead || !noteText.trim()) return;
    setIsSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("lead_notes").insert({
        lead_id: lead.id,
        lead_source: lead.source,
        content: noteText.trim(),
        created_by: user.id,
      });
      if (error) throw error;

      // Log activity
      await supabase.from("lead_activities").insert({
        lead_id: lead.id,
        lead_source: lead.source,
        action: "note_added",
        details: { preview: noteText.trim().substring(0, 100) },
        created_by: user.id,
      });

      setNoteText("");
      refetchNotes();
      refetchActivities();
      toast.success("Nota adicionada");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar nota");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleConvertToClient = async () => {
    if (!lead) return;
    setIsConverting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create client
      const { data: newClient, error } = await supabase.from("clients").insert({
        name: lead.client_name || "Lead Convertido",
        phone: lead.client_phone,
        email: lead.client_email,
        instagram: lead.client_instagram,
        tags: ["lead-convertido"],
      }).select("id").single();
      if (error) throw error;

      // Update lead status to converted
      onUpdateStatus(lead, "convertido");

      // Link client_id on the source table
      if (lead.source === "quiz") {
        await supabase.from("quiz_responses").update({ client_id: newClient.id }).eq("id", lead.id);
      } else {
        await supabase.from("contact_submissions").update({ client_id: newClient.id }).eq("id", lead.id);
      }

      // Log activity
      await supabase.from("lead_activities").insert({
        lead_id: lead.id,
        lead_source: lead.source,
        action: "converted_to_client",
        details: { client_id: newClient.id },
        created_by: user.id,
      });

      refetchActivities();
      queryClient.invalidateQueries({ queryKey: ["lead-existing-client"] });
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success("Lead convertido para cliente com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao converter lead");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Sheet open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="font-serif text-xl flex items-center gap-2">
            {lead?.client_name || "Lead Anônimo"}
            {lead && <SourceBadge source={lead.source} />}
          </SheetTitle>
        </SheetHeader>

        {lead && (
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-5">
              {/* Convert to Client Button */}
              {!existingClient ? (
                <Button
                  variant="outline"
                  className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={handleConvertToClient}
                  disabled={isConverting}
                >
                  <UserPlus className="w-4 h-4" />
                  {isConverting ? "Convertendo..." : "Converter para Cliente"}
                </Button>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Já é cliente: <strong>{existingClient.name}</strong></span>
                </div>
              )}

              {/* Status Selector */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</h4>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => {
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;
                    const isActive = lead.status === status;
                    return (
                      <Button
                        key={status}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={`gap-1.5 ${isActive ? "" : config.color}`}
                        onClick={() => onUpdateStatus(lead, status)}
                      >
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contato</h4>
                <div className="grid gap-2">
                  {lead.client_phone && (
                    <>
                      <a
                        href={`tel:${lead.client_phone}`}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                      >
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {lead.client_phone}
                      </a>
                      <a
                        href={`https://wa.me/${lead.client_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Olá ${lead.client_name || ""}! Gostaria de falar com você.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors text-sm font-medium"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Enviar WhatsApp
                      </a>
                    </>
                  )}
                  {lead.client_email && (
                    <a
                      href={`mailto:${lead.client_email}`}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {lead.client_email}
                    </a>
                  )}
                  {lead.client_instagram && (
                    <a
                      href={`https://instagram.com/${lead.client_instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                      <Instagram className="w-4 h-4 text-muted-foreground" />
                      @{lead.client_instagram.replace("@", "")}
                    </a>
                  )}
                </div>
              </div>

              {/* Source-specific Info */}
              {lead.source === "quiz" && (lead.quiz_name || lead.quiz_result) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quiz</h4>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    {lead.quiz_name && <p className="text-sm font-medium">{lead.quiz_name}</p>}
                    {lead.quiz_result && (
                      <p className="text-sm text-muted-foreground">
                        Resultado: <span className="text-foreground">{lead.quiz_result}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {lead.source === "contact" && (
                <>
                  {lead.service_name && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Serviço de Interesse</h4>
                      <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <p className="font-medium">{lead.service_name}</p>
                      </div>
                    </div>
                  )}
                  {lead.message && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mensagem</h4>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(lead.utm_source || lead.utm_campaign) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Origem</h4>
                  <div className="flex flex-wrap gap-2">
                    {lead.utm_source && <Badge variant="outline" className="text-xs">Source: {lead.utm_source}</Badge>}
                    {lead.utm_campaign && <Badge variant="outline" className="text-xs">Campaign: {lead.utm_campaign}</Badge>}
                  </div>
                </div>
              )}

              <Separator />

              {/* Notes Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" />
                  Notas
                </h4>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Adicionar uma nota..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleAddNote();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 flex-shrink-0 self-end"
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || isSavingNote}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {notes && notes.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Activity Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Histórico
                </h4>
                <div className="space-y-0">
                  {/* Creation event (always shown) */}
                  <div className="flex gap-3 pb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Lead capturado</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {activities && activities.length > 0 && (
                    [...activities].reverse().map((activity, idx) => {
                      const cfg = ACTIVITY_LABELS[activity.action] || { label: activity.action, icon: Clock };
                      const ActivityIcon = cfg.icon;
                      const details = activity.details as Record<string, string> | null;

                      return (
                        <div key={activity.id} className="flex gap-3 pb-3">
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <ActivityIcon className="w-3 h-3 text-muted-foreground" />
                            </div>
                            {idx < activities.length - 1 && (
                              <div className="w-px flex-1 bg-border mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{cfg.label}</p>
                            {details?.preview && (
                              <p className="text-xs text-muted-foreground truncate">{details.preview}</p>
                            )}
                            {details?.from && details?.to && (
                              <p className="text-xs text-muted-foreground">
                                {details.from} → {details.to}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Timestamp + Delete */}
              <div className="pt-4 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Capturado em:{" "}
                  {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(lead)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
