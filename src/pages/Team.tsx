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

          {/* Team photo - full width */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full mt-8 relative"
          >
            <img
              src={teamHeroImg}
              alt="ACS Beauty Team"
              className="w-full h-auto object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </motion.div>
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
                            <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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
