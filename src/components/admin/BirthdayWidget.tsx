import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Cake, MessageCircle } from "lucide-react";
import { format, addDays, isSameDay, parseISO, setYear } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  birthday: string | null;
}

interface BirthdayWidgetProps {
  onNavigateToClients?: () => void;
}

export function BirthdayWidget({ onNavigateToClients }: BirthdayWidgetProps) {
  const today = new Date();
  const nextWeek = addDays(today, 7);

  const { data: upcomingBirthdays, isLoading } = useQuery({
    queryKey: ["admin-upcoming-birthdays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone, birthday")
        .not("birthday", "is", null);

      if (error) throw error;

      // Filter clients with birthdays in the next 7 days
      const filtered = (data as Client[]).filter((client) => {
        if (!client.birthday) return false;

        const bday = parseISO(client.birthday);
        const thisYearBday = setYear(bday, today.getFullYear());

        // Check if birthday falls within today and next 7 days
        return thisYearBday >= today && thisYearBday <= nextWeek;
      });

      // Sort by upcoming date
      return filtered.sort((a, b) => {
        const bdayA = setYear(parseISO(a.birthday!), today.getFullYear());
        const bdayB = setYear(parseISO(b.birthday!), today.getFullYear());
        return bdayA.getTime() - bdayB.getTime();
      });
    },
  });

  const openWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(
      `Olá ${name}! 🎂 A equipe ACS Beauty deseja um Feliz Aniversário! Temos uma surpresa especial para você. Quando podemos agendar seu próximo atendimento?`
    );
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("1")
      ? cleanPhone
      : `1${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
  };

  const getBirthdayLabel = (birthday: string) => {
    const bday = parseISO(birthday);
    const thisYearBday = setYear(bday, today.getFullYear());

    if (isSameDay(thisYearBday, today)) {
      return "Hoje! 🎉";
    }

    return format(thisYearBday, "dd/MM", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-soft">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-soft">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Cake className="w-4 h-4 text-rose-gold" />
          Aniversariantes da Semana
        </h2>
        {onNavigateToClients && (
          <Button variant="ghost" size="sm" onClick={onNavigateToClients}>
            Ver clientes
          </Button>
        )}
      </div>

      <div className="p-4">
        {!upcomingBirthdays || upcomingBirthdays.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhum aniversariante nos próximos 7 dias
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingBirthdays.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-rose-light/50 to-transparent rounded-lg border border-rose-gold/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-gold/10 flex items-center justify-center">
                    <Cake className="w-5 h-5 text-rose-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{client.name}</p>
                    <p className="text-xs text-rose-gold font-semibold">
                      {getBirthdayLabel(client.birthday!)}
                    </p>
                  </div>
                </div>

                {client.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => openWhatsApp(client.phone!, client.name)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Parabenizar</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
