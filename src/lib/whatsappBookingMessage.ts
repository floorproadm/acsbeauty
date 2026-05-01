import { format, parseISO } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

// ACS Studio WhatsApp number (US). Memory: contact = (732) 915-3430
const ACS_WA_NUMBER = "17329153430";

interface BuildMessageParams {
  bookingId: string;
  clientName: string;
  serviceName: string;
  staffName?: string | null;
  startTime: string; // ISO string
  language: "pt" | "en";
}

/**
 * Builds a pre-filled wa.me URL with a closing-style booking message.
 * Affirmation > question (psychology of sales).
 */
export function buildWhatsAppBookingUrl(params: BuildMessageParams): string {
  const { bookingId, clientName, serviceName, staffName, startTime, language } = params;

  const locale = language === "pt" ? ptBR : enUS;
  const dateLabel =
    language === "pt"
      ? format(parseISO(startTime), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale })
      : format(parseISO(startTime), "EEEE, MMMM dd 'at' h:mm a", { locale });

  const code = bookingId.slice(0, 8).toUpperCase();

  const lines =
    language === "pt"
      ? [
          `Oi!`,
          ``,
          `Acabei de reservar esse horario no site:`,
          ``,
          `Cliente: ${clientName}`,
          `Servico: ${serviceName}`,
          staffName ? `Com: ${staffName}` : null,
          `Quando: ${dateLabel}`,
          ``,
          `Quero garantir esse horario!`,
          ``,
          `(codigo: ${code})`,
        ]
      : [
          `Hi!`,
          ``,
          `I just reserved this time slot on the website:`,
          ``,
          `Client: ${clientName}`,
          `Service: ${serviceName}`,
          staffName ? `With: ${staffName}` : null,
          `When: ${dateLabel}`,
          ``,
          `I want to lock in this time!`,
          ``,
          `(code: ${code})`,
        ];

  const text = lines.filter(Boolean).join("\n");
  return `https://wa.me/${ACS_WA_NUMBER}?text=${encodeURIComponent(text)}`;
}
