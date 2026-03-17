import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MessageCircle, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
}

const WHATSAPP_BASE = "https://wa.me/";

function buildWhatsAppUrl(phone: string, name: string, isPt: boolean) {
  const digits = phone.replace(/\D/g, "");
  const msg = isPt
    ? `Olá ${name}! Vi seu perfil na ACS Beauty e gostaria de agendar um horário.`
    : `Hi ${name}! I saw your profile at ACS Beauty and would like to book an appointment.`;
  return `${WHATSAPP_BASE}${digits}?text=${encodeURIComponent(msg)}`;
}

/** Display "Ane" instead of "Ane Caroline" */
function displayName(name: string) {
  if (name.toLowerCase().startsWith("ane caroline")) return "Ane";
  return name;
}

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero text + team photo */}
        <section className="pt-28 md:pt-36 pb-8 md:pb-12">
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

            {/* Team photo between text and cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-md mx-auto mt-8 rounded-2xl overflow-hidden"
            >
              <img
                src={teamHeroImg}
                alt="ACS Beauty Team"
                className="w-full h-auto object-cover"
              />
            </motion.div>
          </div>
        </section>

        {/* Team Members — Compact WhatsApp Cards (no avatars) */}
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-xl">
            {isLoading ? (
              <div className="text-center text-muted-foreground">{t("team.loading")}</div>
            ) : (
              <div className="flex flex-col gap-3">
                {members.map((member, idx) => {
                  const name = displayName(member.name);
                  const whatsappUrl = member.phone
                    ? buildWhatsAppUrl(member.phone, name, isPt)
                    : null;

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                    >
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300 group"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">
                              {name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.role}
                            </p>
                          </div>
                          <div className="shrink-0 w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors">
                            <Phone className="w-4 h-4 text-[#25D366]" />
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">
                              {name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.role}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-20 bg-secondary/40">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="font-serif text-2xl md:text-3xl font-light text-foreground mb-3">
                {t("team.values_title")}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {t("team.values_subtitle")}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { icon: "✨", title: t("team.value_excellence"), desc: t("team.value_excellence_desc") },
                { icon: "💛", title: t("team.value_care"), desc: t("team.value_care_desc") },
                { icon: "🌿", title: t("team.value_naturalness"), desc: t("team.value_naturalness_desc") },
              ].map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-card transition-shadow duration-300"
                >
                  <span className="text-2xl mb-3 block">{v.icon}</span>
                  <h3 className="font-serif text-lg font-medium text-foreground mb-2">
                    {v.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {v.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
