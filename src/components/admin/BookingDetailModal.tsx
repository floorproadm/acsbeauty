import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone, Mail, Calendar, Clock, DollarSign, FileText, User, CheckCircle, XCircle, RefreshCw, UserX } from "lucide-react";

interface BookingDetailModalProps {
  booking: {
    id: string;
    client_name: string;
    client_email: string;
    client_phone?: string | null;
    start_time: string;
    end_time: string;
    status: string;
    notes?: string | null;
    total_price?: number | null;
    services?: { name: string; duration_minutes?: number } | null;
    packages?: { name: string } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
  onNoShow?: (id: string) => void;
  onReschedule?: (booking: any) => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  requested: { label: "Aguardando", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-700" },
  completed: { label: "Concluído", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  no_show: { label: "Não compareceu", color: "bg-gray-100 text-gray-700" },
};

export function BookingDetailModal({ booking, open, onOpenChange, onConfirm, onCancel, onComplete, onNoShow, onReschedule }: BookingDetailModalProps) {
  if (!booking) return null;

  const status = statusLabels[booking.status] || statusLabels.requested;

  const handleWhatsApp = () => {
    if (booking.client_phone) {
      const phone = booking.client_phone.replace(/\D/g, "");
      window.open(`https://wa.me/1${phone}`, "_blank");
    }
  };

  const handleAction = (action: ((id: string) => void) | ((b: any) => void) | undefined, arg?: any) => {
    if (!action) return;
    action(arg ?? booking.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Detalhes do Agendamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{booking.client_name}</h3>
            
            <div className="space-y-2">
              {booking.client_phone && (
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-3 w-full p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-left"
                >
                  <Phone className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{booking.client_phone}</span>
                  <Badge variant="outline" className="ml-auto text-xs">WhatsApp</Badge>
                </button>
              )}
              
              <a
                href={`mailto:${booking.client_email}`}
                className="flex items-center gap-3 w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{booking.client_email}</span>
              </a>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data
              </span>
              <span className="text-sm font-medium">
                {format(new Date(booking.start_time), "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horário
              </span>
              <span className="text-sm font-medium">
                {format(new Date(booking.start_time), "HH:mm")} - {format(new Date(booking.end_time), "HH:mm")}
              </span>
            </div>

            {(booking.services?.name || booking.packages?.name) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Serviço</span>
                <span className="text-sm font-medium text-primary">
                  {booking.services?.name || booking.packages?.name}
                </span>
              </div>
            )}

            {booking.total_price && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor
                </span>
                <span className="text-sm font-bold">
                  ${booking.total_price.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="space-y-2 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Observações
              </span>
              <p className="text-sm bg-muted p-3 rounded-lg">{booking.notes}</p>
            </div>
          )}

          {/* Status-specific actions */}
          <div className="space-y-2 pt-4 border-t border-border">
            {booking.status === "requested" && (
              <div className="flex gap-2">
                <Button onClick={() => handleAction(onConfirm)} className="flex-1 gap-1">
                  <CheckCircle className="w-4 h-4" />Confirmar
                </Button>
                <Button variant="outline" onClick={() => handleAction(onCancel)} className="flex-1 gap-1 text-destructive">
                  <XCircle className="w-4 h-4" />Cancelar
                </Button>
              </div>
            )}

            {booking.status === "confirmed" && (
              <>
                <div className="flex gap-2">
                  <Button onClick={() => handleAction(onReschedule, booking)} variant="outline" className="flex-1 gap-1">
                    <RefreshCw className="w-4 h-4" />Remarcar
                  </Button>
                  <Button onClick={() => handleAction(onComplete)} className="flex-1 gap-1">
                    <CheckCircle className="w-4 h-4" />Concluir
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleAction(onNoShow)} className="flex-1 gap-1 text-muted-foreground">
                    <UserX className="w-4 h-4" />Não compareceu
                  </Button>
                  <Button variant="outline" onClick={() => handleAction(onCancel)} className="flex-1 gap-1 text-destructive">
                    <XCircle className="w-4 h-4" />Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* General actions */}
          <div className="flex gap-2">
            {booking.client_phone && (
              <Button onClick={handleWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
                <Phone className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
