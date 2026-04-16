import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { UserCheck, DollarSign, Star, RefreshCw } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

interface StaffMetrics {
  staffName: string;
  totalBookings: number;
  totalRevenue: number;
  avgTicket: number;
  returnRate: number;
  topServices: { name: string; count: number }[];
}

export function StaffPerformanceWidget() {
  const today = new Date();
  // Last 3 months for meaningful data
  const periodStart = startOfMonth(subMonths(today, 2)).toISOString();
  const periodEnd = endOfMonth(today).toISOString();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["staff-performance", periodStart],
    queryFn: async () => {
      // Get all confirmed/completed bookings with staff info
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("id, total_price, status, client_id, staff_id, service_id, services(name), staff_profiles(name)")
        .gte("start_time", periodStart)
        .lte("start_time", periodEnd)
        .in("status", ["confirmed", "completed"]);

      if (error) throw error;
      if (!bookings?.length) return [];

      // Group by staff
      const staffMap: Record<string, {
        name: string;
        bookings: typeof bookings;
        clientIds: Set<string>;
        repeatClientIds: Set<string>;
        serviceCounts: Record<string, number>;
      }> = {};

      for (const b of bookings) {
        const staffId = b.staff_id || "unassigned";
        const staffName = (b.staff_profiles as any)?.name || "Sem profissional";

        if (!staffMap[staffId]) {
          staffMap[staffId] = {
            name: staffName,
            bookings: [],
            clientIds: new Set(),
            repeatClientIds: new Set(),
            serviceCounts: {},
          };
        }

        const entry = staffMap[staffId];
        entry.bookings.push(b);

        if (b.client_id) {
          if (entry.clientIds.has(b.client_id)) {
            entry.repeatClientIds.add(b.client_id);
          }
          entry.clientIds.add(b.client_id);
        }

        const svcName = (b.services as any)?.name || "Outro";
        entry.serviceCounts[svcName] = (entry.serviceCounts[svcName] || 0) + 1;
      }

      const result: StaffMetrics[] = Object.entries(staffMap)
        .filter(([id]) => id !== "unassigned")
        .map(([, data]) => {
          const totalRevenue = data.bookings.reduce((s, b) => s + (Number(b.total_price) || 0), 0);
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
            avgTicket: totalBookings > 0 ? totalRevenue / totalBookings : 0,
            returnRate,
            topServices,
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      return result;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-soft p-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  if (!metrics?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="bg-card rounded-xl border border-border shadow-soft"
    >
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-rose-gold" />
          Performance por Profissional
          <span className="text-xs text-muted-foreground font-normal ml-1">Últimos 3 meses</span>
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {metrics.map((staff, idx) => (
          <motion.div
            key={staff.staffName}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-muted/50 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{staff.staffName}</h3>
              <span className="text-xs text-muted-foreground">{staff.totalBookings} bookings</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Ticket Médio</span>
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
                  <DollarSign className="w-3 h-3 text-rose-gold" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Receita</span>
                </div>
                <p className="text-lg font-bold">${staff.totalRevenue.toFixed(0)}</p>
              </div>
            </div>

            {staff.topServices.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Star className="w-3 h-3 text-amber-500 shrink-0" />
                {staff.topServices.map((svc) => (
                  <span
                    key={svc.name}
                    className="text-[11px] bg-background border border-border px-2 py-0.5 rounded-full"
                  >
                    {svc.name} ({svc.count})
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
