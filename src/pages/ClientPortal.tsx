import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Calendar,
  Star,
  User,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Edit2,
  Phone,
  CalendarDays,
  ArrowUpRight,
  Bell,
  Gift,
  Scissors,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import acsLogo from "@/assets/acs-logo.png";
import founderImg from "@/assets/founder.jpg";
import teamHero from "@/assets/team-hero.jpg";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientProfile {
  id: string;
  name: string;
  phone: string | null;
  birthday: string | null;
  email?: string | null;
}

interface Booking {
  id: string;
  start_time: string;
  status: string;
  total_price: number | null;
  notes: string | null;
  service_id: string | null;
  services?: { name: string } | null;
}

interface PointTransaction {
  id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
}

type Tab = "home" | "book" | "select-service" | "points" | "profile";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  hero_image_url: string | null;
  category: string | null;
  category_slug: string | null;
  is_active: boolean | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function statusColor(status: string) {
  switch (status) {
    case "confirmed": return "text-green-600 bg-green-50";
    case "completed": return "text-blue-600 bg-blue-50";
    case "cancelled": return "text-red-500 bg-red-50";
    default: return "text-yellow-600 bg-yellow-50";
  }
}

function statusLabel(status: string, isPt: boolean) {
  const map: Record<string, [string, string]> = {
    confirmed:  ["Confirmado", "Confirmed"],
    completed:  ["Concluído",  "Completed"],
    cancelled:  ["Cancelado",  "Cancelled"],
    pending:    ["Pendente",   "Pending"],
  };
  return (map[status] ?? ["Pendente", "Pending"])[isPt ? 0 : 1];
}

function StatusIcon({ status }: { status: string }) {
  if (status === "confirmed" || status === "completed")
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === "cancelled")
    return <XCircle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-yellow-500" />;
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function HomeTab({
  profile,
  bookings,
  points,
  isPt,
  onTabChange,
}: {
  profile: ClientProfile | null;
  bookings: Booking[];
  points: number;
  isPt: boolean;
  onTabChange: (tab: Tab) => void;
}) {
  const navigate = useNavigate();
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.start_time) > new Date()
  );
  const firstName = profile?.name?.split(" ")[0] ?? "";
  const initials = (profile?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-5 pb-24">
      {/* Greeting header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-semibold text-primary">
            {initials}
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-foreground leading-tight">
              {(() => {
                const nyHour = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })).getHours();
                if (isPt) {
                  if (nyHour >= 5 && nyHour < 12) return `Bom dia, ${firstName}!`;
                  if (nyHour >= 12 && nyHour < 18) return `Boa tarde, ${firstName}!`;
                  return `Boa noite, ${firstName}!`;
                }
                if (nyHour >= 5 && nyHour < 12) return `Good morning, ${firstName}!`;
                if (nyHour >= 12 && nyHour < 18) return `Good afternoon, ${firstName}!`;
                return `Good evening, ${firstName}!`;
              })()}
            </h1>
            <p className="text-muted-foreground text-xs">
              {isPt ? "Como podemos cuidar de você hoje?" : "How can we take care of you today?"}
            </p>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center">
          <Bell className="w-4.5 h-4.5 text-muted-foreground" />
        </button>
      </div>

      {/* Book a service CTA */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        onClick={() => onTabChange("select-service")}
        className="w-full rounded-2xl bg-primary text-primary-foreground p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-base">{isPt ? "Agendar serviço" : "Book a service"}</p>
            <p className="text-primary-foreground/70 text-xs">
              {isPt ? "Escolha seu serviço e profissional" : "Choose your service and professional"}
            </p>
          </div>
        </div>
        <Scissors className="w-5 h-5 opacity-70" />
      </motion.button>

      {/* Quick access cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="grid grid-cols-2 gap-3"
      >
        <button
          onClick={() => navigate("/packages")}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {isPt ? "Pacotes" : "Packages"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isPt ? "Pacotes & benefícios" : "Packages & benefits"}
            </p>
          </div>
        </button>
        <button
          onClick={() => onTabChange("points")}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">ACS Points</p>
            <p className="text-[11px] text-muted-foreground">
              {points > 0
                ? `${points} ${isPt ? "pontos" : "points"}`
                : isPt ? "Acumule pontos" : "Earn points"}
            </p>
          </div>
        </button>
      </motion.div>

      {/* About Us */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.16 }}
      >
        <h2 className="font-serif text-base font-bold text-foreground mb-2">
          {isPt ? "Sobre nós" : "About Us"}
        </h2>
        <div className="rounded-2xl overflow-hidden cursor-pointer" onClick={() => navigate("/team")}>
          <img
            src={teamHero}
            alt="ACS Beauty Team"
            className="w-full h-44 object-cover" style={{ objectPosition: "center 30%" }}
          />
        </div>
      </motion.div>

      {/* Upcoming appointments */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.24 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-base font-bold text-foreground">
            {isPt ? "Próximos agendamentos" : "Upcoming appointments"}
          </h2>
          {upcoming.length > 0 && (
            <button
              onClick={() => onTabChange("book")}
              className="text-xs text-muted-foreground flex items-center gap-0.5"
            >
              {isPt ? "Ver todos" : "View all"}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {upcoming.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl py-10 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/25 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              {isPt ? "Você não tem agendamentos futuros" : "You don't have upcoming appointments"}
            </p>
            <button
              onClick={() => navigate("/book")}
              className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full"
            >
              {isPt ? "Agendar agora" : "Book now"}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.slice(0, 3).map((b) => (
              <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {b.services?.name ?? (isPt ? "Serviço" : "Service")}
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {formatDate(b.start_time)} · {formatTime(b.start_time)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(b.status)}`}>
                    {statusLabel(b.status, isPt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function BookingsTab({ bookings, isPt }: { bookings: Booking[]; isPt: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-serif text-xl font-bold">{isPt ? "Agendamentos" : "Bookings"}</h2>
        <button
          onClick={() => navigate("/book")}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3.5 py-2 rounded-full"
        >
          <Calendar className="w-3.5 h-3.5" />
          {isPt ? "Novo" : "New"}
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {isPt ? "Nenhum agendamento ainda." : "No bookings yet."}
          </p>
          <button
            onClick={() => navigate("/book")}
            className="mt-4 text-sm text-primary font-medium"
          >
            {isPt ? "Fazer primeiro agendamento" : "Book your first appointment"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">
                    {b.services?.name ?? (isPt ? "Serviço" : "Service")}
                  </p>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {formatDate(b.start_time)} · {formatTime(b.start_time)}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(b.status)}`}>
                  {statusLabel(b.status, isPt)}
                </span>
              </div>
              {b.total_price != null && (
                <div className="border-t border-border pt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">{isPt ? "Total" : "Total"}</span>
                  <span className="font-medium">${b.total_price}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PointsTab({
  points,
  transactions,
  isPt,
}: {
  points: number;
  transactions: PointTransaction[];
  isPt: boolean;
}) {
  return (
    <div className="space-y-5 pb-24">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-primary text-primary-foreground p-6 text-center"
      >
        <Star className="w-8 h-8 mx-auto mb-2 opacity-80" />
        <p className="text-5xl font-light mb-1">{points}</p>
        <p className="text-primary-foreground/70 text-sm">ACS Points</p>
        <p className="text-primary-foreground/50 text-xs mt-3">
          {isPt ? "1 ponto = $1 gasto · Resgate em serviços exclusivos" : "1 point = $1 spent · Redeem for exclusive services"}
        </p>
      </motion.div>

      {/* Como funciona */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">{isPt ? "Como funciona" : "How it works"}</p>
        {[
          { icon: "💅", text: isPt ? "Ganhe 1 ponto por $1 gasto em serviços" : "Earn 1 point per $1 spent on services" },
          { icon: "⭐", text: isPt ? "Acumule e resgate por serviços exclusivos" : "Accumulate and redeem for exclusive services" },
          { icon: "🎂", text: isPt ? "Pontos bônus no seu aniversário" : "Bonus points on your birthday" },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <p className="text-muted-foreground text-sm">{text}</p>
          </div>
        ))}
      </div>

      {/* Histórico de transações */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          {isPt ? "Histórico" : "History"}
        </p>
        {transactions.length === 0 ? (
          <div className="text-center py-10">
            <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              {isPt ? "Seus pontos aparecerão aqui após o primeiro agendamento." : "Your points will appear here after your first booking."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t.description ?? (isPt ? "ACS Points" : "ACS Points")}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.created_at)}</p>
                </div>
                <span className={`text-sm font-semibold ${t.points > 0 ? "text-green-600" : "text-red-500"}`}>
                  {t.points > 0 ? "+" : ""}{t.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileTab({
  profile,
  isPt,
  onSignOut,
}: {
  profile: ClientProfile | null;
  isPt: boolean;
  onSignOut: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [birthday, setBirthday] = useState(profile?.birthday ?? "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function save() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("clients")
      .update({ name, birthday: birthday || null })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast({ title: isPt ? "Erro ao salvar" : "Error saving", variant: "destructive" });
    } else {
      toast({ title: isPt ? "Perfil atualizado!" : "Profile updated!" });
      setEditing(false);
    }
  }

  const initials = (profile?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-5 pb-24">
      {/* Avatar + nome */}
      <div className="pt-2 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-3 text-2xl font-semibold text-primary">
          {initials}
        </div>
        <h2 className="font-serif text-xl font-bold">{profile?.name}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">{isPt ? "Meu Perfil" : "My Profile"}</p>
      </div>

      {/* Idioma / Language preference */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="font-medium text-foreground text-sm mb-3">{isPt ? "Idioma preferido" : "Preferred language"}</p>
        <LanguageSelector />
      </div>

      {/* Informações pessoais */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium text-foreground text-sm">{isPt ? "Informações pessoais" : "Personal information"}</p>
          <button onClick={() => setEditing(!editing)} className="p-1.5 rounded-lg hover:bg-muted transition">
            <Edit2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Nome */}
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">{isPt ? "Nome" : "Name"}</p>
              {editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border-b border-primary outline-none pb-0.5 bg-transparent"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">{profile?.name}</p>
              )}
            </div>
          </div>

          {/* Telefone */}
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">{isPt ? "Telefone" : "Phone"}</p>
              <p className="text-sm font-medium text-foreground">{profile?.phone ?? "—"}</p>
            </div>
          </div>

          {/* Data de nascimento */}
          <div className="flex items-center gap-3">
            <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">{isPt ? "Data de nascimento" : "Birth date"}</p>
              {editing ? (
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full text-sm border-b border-primary outline-none pb-0.5 bg-transparent"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {profile?.birthday ? new Date(profile.birthday).toLocaleDateString("pt-BR") : "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        {editing && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 h-10 rounded-xl border border-border text-sm text-muted-foreground"
            >
              {isPt ? "Cancelar" : "Cancel"}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
            >
              {saving ? "..." : (isPt ? "Salvar" : "Save")}
            </button>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={onSignOut}
        className="w-full h-12 rounded-2xl border border-border flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-red-500 hover:border-red-200 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {isPt ? "Sair da conta" : "Sign out"}
      </button>
    </div>
  );
}

// ─── Service Selection Tab ────────────────────────────────────────────────────

function ServiceSelectionTab({
  isPt,
  onBack,
}: {
  isPt: boolean;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loadingSvc, setLoadingSvc] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("services")
        .select("id, name, description, price, duration_minutes, hero_image_url, category, category_slug, is_active")
        .eq("is_active", true)
        .order("category_slug")
        .order("name");
      setServices((data as ServiceItem[]) ?? []);
      setLoadingSvc(false);
    }
    fetch();
  }, []);

  function toggleService(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const categories = [
    { slug: "all", label: isPt ? "Todos" : "All" },
    ...Array.from(new Set(services.map((s) => s.category_slug).filter(Boolean))).map((slug) => ({
      slug: slug!,
      label: services.find((s) => s.category_slug === slug)?.category ?? slug!,
    })),
  ];

  const filtered = services.filter((s) => {
    const matchCategory = activeCategory === "all" || s.category_slug === activeCategory;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  function handleContinue() {
    const ids = Array.from(selected);
    if (ids.length === 1) {
      navigate(`/book?service=${ids[0]}`);
    } else {
      navigate(`/book?services=${ids.join(",")}`);
    }
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2 mb-4">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
          <ArrowUpRight className="w-4 h-4 text-muted-foreground rotate-[225deg]" />
        </button>
        <h2 className="font-serif text-xl font-bold text-foreground">
          {isPt ? "Escolha seu serviço" : "Choose your service"}
        </h2>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isPt ? "Buscar serviços..." : "Search services..."}
          className="w-full h-10 pl-4 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none">
        {categories.map(({ slug, label }) => (
          <button
            key={slug}
            onClick={() => setActiveCategory(slug)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition ${
              activeCategory === slug
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Service cards */}
      {loadingSvc ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-7 h-7 rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">
            {isPt ? "Nenhum serviço encontrado" : "No services found"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((svc) => {
            const isSelected = selected.has(svc.id);
            return (
              <motion.button
                key={svc.id}
                onClick={() => toggleService(svc.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all ${
                  isSelected
                    ? "border-primary shadow-md shadow-primary/10"
                    : "border-border hover:border-primary/20"
                } bg-card`}
              >
                {/* Service image */}
                {svc.hero_image_url && (
                  <div className="relative">
                    <img
                      src={svc.hero_image_url}
                      alt={svc.name}
                      className="w-full h-40 object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                )}
                {!svc.hero_image_url && isSelected && (
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}

                {/* Service info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-base">{svc.name}</h3>
                      {svc.description && (
                        <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">
                          {svc.description}
                        </p>
                      )}
                    </div>
                    {!svc.hero_image_url && isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-2 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                    <span className="text-primary font-semibold text-sm">${svc.price.toFixed(2)}</span>
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      {svc.duration_minutes} min
                    </span>
                    <div className="ml-auto w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Continue button */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-20 left-0 right-0 px-5 z-50"
          >
            <div className="max-w-[480px] mx-auto">
              <button
                onClick={handleContinue}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25"
              >
                <span>{isPt ? "Continuar" : "Continue"}</span>
                <span className="block text-primary-foreground/70 text-xs font-normal mt-0.5">
                  {selected.size} {selected.size === 1
                    ? (isPt ? "serviço selecionado" : "service selected")
                    : (isPt ? "serviços selecionados" : "services selected")}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

const navItems: { id: Tab; icon: typeof Home; labelPt: string; labelEn: string }[] = [
  { id: "home",    icon: Home,     labelPt: "Início",         labelEn: "Home" },
  { id: "book",    icon: Calendar, labelPt: "Agendamentos",   labelEn: "Book" },
  { id: "points",  icon: Star,     labelPt: "ACS Points",     labelEn: "ACS Points" },
  { id: "profile", icon: User,     labelPt: "Perfil",         labelEn: "Profile" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientPortal() {
  const [tab, setTab] = useState<Tab>("home");
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isPt = language === "pt";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Verifica sessão
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    // Verifica se é admin — se for, não deve estar aqui
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .limit(1)
      .maybeSingle();
    if (roleRow) { navigate("/admin"); return; }

    // Pega telefone do metadata (registrado no Auth)
    const phone = session.user.user_metadata?.phone;
    const metaName = session.user.user_metadata?.full_name;

    // Busca perfil na tabela clients pelo telefone
    let clientData: any = null;
    if (phone) {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("phone", phone)
        .maybeSingle();
      clientData = data;
    }

    // Se não achou pelo phone, tenta criar o registro do client
    if (!clientData && phone && metaName) {
      const { data: inserted } = await supabase
        .from("clients")
        .insert({
          name: metaName,
          phone,
          birthday: session.user.user_metadata?.birth_date || null,
        })
        .select()
        .single();
      clientData = inserted;
    }

    // Fallback: cria perfil virtual a partir do metadata
    if (!clientData && metaName) {
      clientData = {
        id: session.user.id,
        name: metaName,
        phone: phone || null,
        birthday: session.user.user_metadata?.birth_date || null,
      };
    }

    if (clientData) {
      setProfile(clientData);

      // Bookings do cliente
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*, services(name)")
        .eq("client_id", clientData.id)
        .order("start_time", { ascending: false })
        .limit(20);
      setBookings((bookingData as Booking[]) ?? []);

      // ACS Points
      const { data: pointsData } = await (supabase as any)
        .from("client_points")
        .select("total_points, redeemed_points")
        .eq("client_id", clientData.id)
        .maybeSingle();
      if (pointsData) {
        setPoints(pointsData.total_points - pointsData.redeemed_points);
      }

      // Transações de pontos
      const { data: txData } = await (supabase as any)
        .from("point_transactions")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setTransactions((txData as PointTransaction[]) ?? []);
    }

    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/auth");
  }

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col max-w-[480px] mx-auto overflow-hidden">
      {/* Header — hidden on home and select-service tabs */}
      {tab !== "home" && tab !== "select-service" && (
        <header className="flex items-center justify-between px-5 pt-10 pb-2 shrink-0">
          <img src={acsLogo} alt="ACS Beauty" className="h-10 w-auto" />
          <LanguageToggle />
        </header>
      )}

      {/* Content */}
      <main className={`flex-1 overflow-y-auto px-5 ${tab === "home" || tab === "select-service" ? "pt-10" : "pt-2"}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "home" && (
              <HomeTab
                profile={profile}
                bookings={bookings}
                points={points}
                isPt={isPt}
                onTabChange={setTab}
              />
            )}
            {tab === "select-service" && (
              <ServiceSelectionTab
                isPt={isPt}
                onBack={() => setTab("home")}
              />
            )}
            {tab === "book" && <BookingsTab bookings={bookings} isPt={isPt} />}
            {tab === "points" && <PointsTab points={points} transactions={transactions} isPt={isPt} />}
            {tab === "profile" && (
              <ProfileTab profile={profile} isPt={isPt} onSignOut={handleSignOut} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation — hidden during service selection */}
      {tab !== "select-service" && (
        <nav className="shrink-0 border-t border-border bg-background backdrop-blur-sm px-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="flex items-center justify-around py-2">
            {navItems.map(({ id, icon: Icon, labelPt, labelEn }) => {
              const active = tab === id || (id === "book" && tab === ("select-service" as Tab));
              return (
                <button
                  key={id}
                  onClick={() => setTab(id === "book" ? "select-service" : id)}
                  className="flex flex-col items-center gap-1 px-3 py-2 relative"
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary/8 rounded-2xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {isPt ? labelPt : labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
