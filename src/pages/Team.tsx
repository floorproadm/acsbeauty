import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import teamHeroImg from "@/assets/team-hero.jpg";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  specialties: string[];
  image_url: string | null;
  instagram: string | null;
  phone: string | null;
  badge_label: string | null;
  badge_value: string | null;
  sort_order: number;
  page_url: string | null;
}

const WHATSAPP_BASE = "https://wa.me/";

function buildWhatsAppUrl(phone: string, name: string, isPt: boolean) {
  const digits = phone.replace(/\D/g, "");
  const msg = isPt
    ? `Olá ${name}! Vi seu perfil na ACS Beauty e gostaria de agendar um horário.`
    : `Hi ${name}! I saw your profile at ACS Beauty and would like to book an appointment.`;
  return `${WHATSAPP_BASE}${digits}?text=${encodeURIComponent(msg)}`;
}

function displayName(name: string) {
  if (name.toLowerCase().startsWith("ane caroline")) return "Ane";
  return name;
}

function isFounder(member: TeamMember) {
  return member.name.toLowerCase().startsWith("ane caroline");
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function Team() {
  const { language, t } = useLanguage();
  const isPt = language === "pt";

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const founder = members.find(isFounder);
  const others = members.filter((m) => !isFounder(m));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero */}
        <section className="pt-28 md:pt-36 pb-0">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-2xl mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-secondary/80 px-4 py-1.5 rounded-full mb-6"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium tracking-[0.15em] uppercase text-primary">
                  {t("team.badge")}
                </span>
              </motion.div>
              <h1 className="font-serif text-4xl md:text-6xl font-light tracking-tight mb-5 text-foreground">
                {t("team.title_prefix")}{" "}
                <span className="text-gradient-gold font-normal">{t("team.title_highlight")}</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
                {t("team.description")}
              </p>
            </motion.div>
          </div>

          {/* Team photo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full mt-8 relative"
          >
            <img src={teamHeroImg} alt="ACS Beauty Team" className="w-full h-auto object-cover" />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
          </motion.div>
        </section>

        {/* Welcome */}
        <section className="py-6 text-center">
          <p className="text-base font-medium text-foreground">{isPt ? "Bem-vinda!" : "Welcome!"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isPt ? "Toque nos ícones para interagir." : "Tap the icons to interact."}
          </p>
        </section>

        {/* Members */}
        <section className="pb-10 md:pb-16">
          <div className="container mx-auto px-4 md:px-6 max-w-xl">
            {isLoading ? (
              <div className="text-center text-muted-foreground">{t("team.loading")}</div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Founder highlight card */}
                {founder && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-3"
                  >
                    <Link
                      to={founder.page_url || "/ane-caroline"}
                      className="flex-1 min-w-0 p-5 rounded-2xl bg-gradient-to-br from-rose-gold/10 via-champagne/30 to-card border border-rose-gold/30 hover:shadow-card hover:border-rose-gold/50 active:scale-[0.98] transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-rose-gold" />
                        <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-rose-gold">
                          {t("team.founder_label")}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-foreground truncate">
                        {displayName(founder.name)} Caroline
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs text-rose-gold mt-1 group-hover:gap-2 transition-all">
                        {t("team.founder_cta")}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>

                    {founder.phone && (
                      <a
                        href={buildWhatsAppUrl(founder.phone, displayName(founder.name), isPt)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center hover:bg-[#25D366]/20 active:scale-95 transition-all duration-200"
                        aria-label="WhatsApp"
                      >
                        <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                      </a>
                    )}
                  </motion.div>
                )}

                {/* Other members */}
                {others.map((member, idx) => {
                  const name = displayName(member.name);
                  const whatsappUrl = member.phone ? buildWhatsAppUrl(member.phone, name, isPt) : null;

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: (idx + 1) * 0.08 }}
                      className="flex items-center gap-3"
                    >
                      {member.page_url ? (
                        <Link
                          to={member.page_url}
                          className="flex-1 min-w-0 p-4 rounded-2xl bg-card border border-border hover:shadow-card active:scale-[0.98] transition-all duration-300"
                        >
                          <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                        </Link>
                      ) : (
                        <div className="flex-1 min-w-0 p-4 rounded-2xl bg-card border border-border">
                          <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                        </div>
                      )}

                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center hover:bg-[#25D366]/20 active:scale-95 transition-all duration-200"
                          aria-label="WhatsApp"
                        >
                          <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                        </a>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Bridge to /about */}
        <section className="py-12 md:py-16 px-4 md:px-6 bg-secondary/40">
          <div className="container mx-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link
                to="/about"
                className="group block bg-card border border-border rounded-2xl p-6 md:p-7 hover:shadow-card hover:border-rose-gold/40 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-rose-gold/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-rose-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
                      {t("team.bridge_title")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{t("team.bridge_description")}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-gold group-hover:gap-2.5 transition-all">
                      {t("team.bridge_cta")}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
