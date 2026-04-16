import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { UserCheck, DollarSign, RefreshCw, Star, Users, Trophy, CalendarClock } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type PeriodOption = "1m" | "3m" | "6m" | "12m";

interface StaffMetrics {
  staffName: string;
  totalBookings: number;
  totalRevenue: number;
  avgTicket: number;
  returnRate: number;
  uniqueClients: number;
  upcomingBookings: number;
  topServices: { name: string; count: number }[];
}

const PERIOD_LABELS: Record<PeriodOption, string> = {
  "1m": "Último mês",
  "3m": "3 meses",
  "6m": "6 meses",
  "12m": "12 meses",
};

const MEDALS = ["🥇", "🥈", "🥉"];

export function TeamPerformanceSubTab() {
  const [period, setPeriod] = useState<PeriodOption>("3m");

  const monthsBack = period === "1m" ? 0 : period === "3m" ? 2 : period === "6m" ? 5 : 11;
  const today = new Date();
  const periodStart = startOfMonth(subMonths(today, monthsBack)).toISOString();
  const periodEnd = endOfMonth(today).toISOString();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["staff-performance", periodStart],
    queryFn: async () => {
      // Fetch ALL bookings (any status except cancelled)
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("id, total_price, status, client_id, staff_id, service_id, start_time, services(name), staff_profiles(name)")
        .gte("start_time", periodStart)
        .lte("start_time", periodEnd)
        .in("status", ["requested", "confirmed", "completed"]);

      if (error) throw error;
      if (!bookings?.length) return [];

      const now = new Date().toISOString();

      const staffMap: Record<string, {
        name: string;
        bookings: typeof bookings;
        clientIds: Set<string>;
        repeatClientIds: Set<string>;
        serviceCounts: Record<string, number>;
        upcomingCount: number;
      }> = {};

      for (const b of bookings) {
        const staffId = b.staff_id || "unassigned";
        const staffName = (b.staff_profiles as any)?.name || "Sem profissional atribuído";

        if (!staffMap[staffId]) {
          staffMap[staffId] = {
            name: staffName,
            bookings: [],
            clientIds: new Set(),
            repeatClientIds: new Set(),
            serviceCounts: {},
            upcomingCount: 0,
          };
        }

        const entry = staffMap[staffId];
        entry.bookings.push(b);

        if (b.start_time > now && (b.status === "requested" || b.status === "confirmed")) {
          entry.upcomingCount++;
        }

        if (b.client_id) {
          if (entry.clientIds.has(b.client_id)) {
            entry.repeatClientIds.add(b.client_id);
          }
          entry.clientIds.add(b.client_id);
        }

        const svcName = (b.services as any)?.name || "Outro";
        entry.serviceCounts[svcName] = (entry.serviceCounts[svcName] || 0) + 1;
      }

      return Object.entries(staffMap)
        .map(([, data]) => {
          const completedOrConfirmed = data.bookings.filter(b => b.status === "confirmed" || b.status === "completed");
          const totalRevenue = completedOrConfirmed.reduce((s, b) => s + (Number(b.total_price) || 0), 0);
          const totalBookings = data.bookings.length;
          const uniqueClients = data.clientIds.size;
          const returnRate = uniqueClients > 0 ? (data.repeatClientIds.size / uniqueClients) * 100 : 0;
          const topServices = Object.entries(data.serviceCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

          return {
            staffName: data.name,
            totalBookings,
            totalRevenue,
            avgTicket: completedOrConfirmed.length > 0 ? totalRevenue / completedOrConfirmed.length : 0,
            returnRate,
            uniqueClients,
            upcomingBookings: data.upcomingCount,
            topServices,
          } as StaffMetrics;
        })
        .sort((a, b) => b.totalBookings - a.totalBookings);
    },
  });

  const chartData = metrics?.map((m) => ({
    name: m.staffName.split(" ")[0],
    receita: Math.round(m.totalRevenue),
    bookings: m.totalBookings,
  })) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </div>
    );
  }

  const isEmpty = !metrics?.length;

  const periodLabel = `${format(new Date(periodStart), "MMM yyyy", { locale: ptBR })} — ${format(today, "MMM yyyy", { locale: ptBR })}`;

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Performance por Profissional
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
        </div>
        <div className="flex gap-1.5">
          {(Object.keys(PERIOD_LABELS) as PeriodOption[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="text-xs px-3"
            >
              {PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum agendamento neste período.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Os relatórios aparecerão automaticamente quando houver bookings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Revenue Chart */}
          {chartData.length > 1 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground mb-4">Receita por Profissional</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`$${value}`, "Receita"]}
                      />
                      <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Cards */}
          <div className="grid gap-4">
            {metrics!.map((staff, idx) => (
              <motion.div
                key={staff.staffName}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        {idx < 3 && <span className="text-lg">{MEDALS[idx]}</span>}
                        {staff.staffName}
                      </h4>
                      <div className="flex items-center gap-2">
                        {staff.upcomingBookings > 0 && (
                          <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" />
                            {staff.upcomingBookings} agendados
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{staff.totalBookings} total</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Receita</span>
                        </div>
                        <p className="text-lg font-bold">${staff.totalRevenue.toFixed(0)}</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="w-3 h-3 text-rose-gold" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Ticket</span>
                        </div>
                        <p className="text-lg font-bold">${staff.avgTicket.toFixed(0)}</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <RefreshCw className="w-3 h-3 text-blue-600" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Retorno</span>
                        </div>
                        <p className="text-lg font-bold">{staff.returnRate.toFixed(0)}%</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="w-3 h-3 text-violet-600" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Clientes</span>
                        </div>
                        <p className="text-lg font-bold">{staff.uniqueClients}</p>
                      </div>
                    </div>

                    {staff.topServices.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Star className="w-3 h-3 text-amber-500 shrink-0" />
                        {staff.topServices.map((svc) => (
                          <span
                            key={svc.name}
                            className="text-[11px] bg-muted border border-border px-2 py-0.5 rounded-full"
                          >
                            {svc.name} ({svc.count})
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
