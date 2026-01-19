import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, TrendingUp, MousePointer, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ["#D4A574", "#B8956E", "#9C7D5D", "#806650", "#654F40"];

export function WhatsAppAnalyticsTab() {
  // Total clicks
  const { data: totalClicks, isLoading: loadingTotal } = useQuery({
    queryKey: ["whatsapp-total-clicks"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("whatsapp_clicks")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Clicks last 7 days
  const { data: last7DaysClicks, isLoading: loading7Days } = useQuery({
    queryKey: ["whatsapp-7days-clicks"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { count, error } = await supabase
        .from("whatsapp_clicks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Today's clicks
  const { data: todayClicks, isLoading: loadingToday } = useQuery({
    queryKey: ["whatsapp-today-clicks"],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();
      const { count, error } = await supabase
        .from("whatsapp_clicks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart)
        .lte("created_at", todayEnd);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Daily clicks for chart (last 14 days)
  const { data: dailyData, isLoading: loadingDaily } = useQuery({
    queryKey: ["whatsapp-daily-clicks"],
    queryFn: async () => {
      const fourteenDaysAgo = subDays(new Date(), 14).toISOString();
      const { data, error } = await supabase
        .from("whatsapp_clicks")
        .select("created_at")
        .gte("created_at", fourteenDaysAgo)
        .order("created_at", { ascending: true });
      
      if (error) throw error;

      // Group by day
      const grouped: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        grouped[date] = 0;
      }

      data?.forEach((click) => {
        const date = format(new Date(click.created_at), "yyyy-MM-dd");
        if (grouped[date] !== undefined) {
          grouped[date]++;
        }
      });

      return Object.entries(grouped).map(([date, clicks]) => ({
        date: format(new Date(date), "dd/MM", { locale: ptBR }),
        clicks,
      }));
    },
  });

  // Clicks by page
  const { data: pageData, isLoading: loadingPages } = useQuery({
    queryKey: ["whatsapp-page-clicks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_clicks")
        .select("page_path");
      
      if (error) throw error;

      const grouped: Record<string, number> = {};
      data?.forEach((click) => {
        const path = click.page_path || "Desconhecido";
        grouped[path] = (grouped[path] || 0) + 1;
      });

      return Object.entries(grouped)
        .map(([name, value]) => ({ name: name === "/" ? "Home" : name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
  });

  // Clicks by UTM source
  const { data: utmData, isLoading: loadingUtm } = useQuery({
    queryKey: ["whatsapp-utm-clicks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_clicks")
        .select("utm_source, utm_campaign");
      
      if (error) throw error;

      const grouped: Record<string, number> = {};
      data?.forEach((click) => {
        const source = click.utm_source || "Direto";
        grouped[source] = (grouped[source] || 0) + 1;
      });

      return Object.entries(grouped)
        .map(([source, clicks]) => ({ source, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-[#25D366]" />
          Analytics do WhatsApp
        </h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe os cliques no botão do WhatsApp
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-soft">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#25D366]/10 rounded-lg">
              <MousePointer className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Cliques</p>
              {loadingTotal ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{totalClicks}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-soft">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-gold/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-rose-gold" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
              {loading7Days ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{last7DaysClicks}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-soft">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hoje</p>
              {loadingToday ? (
                <Skeleton className="h-7 w-8" />
              ) : (
                <p className="text-2xl font-bold">{todayClicks}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Clicks Chart */}
        <div className="bg-card rounded-xl border border-border shadow-soft p-4">
          <h2 className="font-semibold mb-4">Cliques por Dia (14 dias)</h2>
          {loadingDaily ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#25D366" 
                  fill="#25D366" 
                  fillOpacity={0.2}
                  name="Cliques"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Clicks by Page */}
        <div className="bg-card rounded-xl border border-border shadow-soft p-4">
          <h2 className="font-semibold mb-4">Cliques por Página</h2>
          {loadingPages ? (
            <Skeleton className="h-64 w-full" />
          ) : pageData?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-16">
              Nenhum dado ainda
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pageData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* UTM Sources */}
        <div className="bg-card rounded-xl border border-border shadow-soft p-4 lg:col-span-2">
          <h2 className="font-semibold mb-4">Cliques por Fonte (UTM)</h2>
          {loadingUtm ? (
            <Skeleton className="h-48 w-full" />
          ) : utmData?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">
              Nenhum dado de UTM ainda
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={utmData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="source" 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="clicks" fill="#25D366" radius={[0, 4, 4, 0]} name="Cliques" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
