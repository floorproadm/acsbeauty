import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, TrendingUp, CheckCircle2, Clock, Banknote } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const METHOD_LABELS: Record<string, string> = {
  local: "Local",
  cash: "Dinheiro",
  zelle: "Zelle",
  venmo: "Venmo",
  online: "Online",
  card: "Cartão",
  at_location: "Presencial",
};

interface PaymentExportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: any[];
  periodLabel: string;
  totalExpected: number;
  totalReceived: number;
  totalPending: number;
}

function extractPaymentMethod(notes: string | null): string | null {
  if (!notes) return null;
  if (notes.includes("At Location") || notes.includes("at_location")) return "at_location";
  if (notes.includes("By App") || notes.includes("by_app")) return "online";
  return null;
}

function getDisplayMethod(booking: any): string | null {
  return booking.payment_method || extractPaymentMethod(booking.notes);
}

export function PaymentExportSheet({
  open,
  onOpenChange,
  bookings,
  periodLabel,
  totalExpected,
  totalReceived,
  totalPending,
}: PaymentExportSheetProps) {
  // Breakdown by method
  const methodBreakdown: Record<string, { count: number; total: number }> = {};
  bookings.forEach((b) => {
    const method = getDisplayMethod(b);
    if (method) {
      if (!methodBreakdown[method]) methodBreakdown[method] = { count: 0, total: 0 };
      methodBreakdown[method].count += 1;
      methodBreakdown[method].total += b.total_price ?? 0;
    }
  });

  const paidCount = bookings.filter(
    (b) => b.payment_method || (b.status === "completed" && extractPaymentMethod(b.notes))
  ).length;
  const totalCount = bookings.length;

  const handleDownloadCSV = () => {
    const headers = ["Cliente", "Serviço", "Data", "Horário", "Valor", "Status", "Método"];
    const rows = bookings.map((b) => {
      const start = new Date(b.start_time);
      const method = getDisplayMethod(b);
      return [
        b.client_name,
        b.services?.name ?? "",
        format(start, "dd/MM/yyyy"),
        format(start, "HH:mm"),
        b.total_price?.toFixed(2) ?? "0.00",
        b.status === "no_show" ? "No-show" : method ? "Pago" : "Pendente",
        method ? METHOD_LABELS[method] ?? method : "",
      ];
    });

    const csvContent =
      "\uFEFF" +
      [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagamentos-${periodLabel.toLowerCase().replace(/\s/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="font-serif text-lg">
            Relatório — {periodLabel}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Resumo financeiro do período selecionado
          </SheetDescription>
        </SheetHeader>

        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Esperado</p>
            <p className="text-lg font-bold">${totalExpected.toFixed(0)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-500" />
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="text-lg font-bold text-green-600">${totalReceived.toFixed(0)}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            <p className="text-xs text-muted-foreground">Pendente</p>
            <p className="text-lg font-bold text-amber-600">${totalPending.toFixed(0)}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>{totalCount} agendamentos</span>
          <span>{paidCount} pagos</span>
        </div>

        <Separator className="my-4" />

        {/* Method breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Por método de pagamento
          </p>
          {Object.keys(methodBreakdown).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
          ) : (
            Object.entries(methodBreakdown)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([method, data]) => (
                <div key={method} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm">{METHOD_LABELS[method] ?? method}</span>
                    <span className="text-xs text-muted-foreground">({data.count})</span>
                  </div>
                  <span className="text-sm font-semibold">${data.total.toFixed(0)}</span>
                </div>
              ))
          )}
        </div>

        <Separator className="my-4" />

        {/* Download */}
        <Button onClick={handleDownloadCSV} className="w-full gap-2" variant="default">
          <Download className="w-4 h-4" />
          Baixar CSV
        </Button>
      </SheetContent>
    </Sheet>
  );
}
