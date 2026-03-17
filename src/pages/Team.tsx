import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Phone, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import founderImg from "@/assets/founder.jpg";

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

const ADDRESS = "375 Chestnut St, 3rd Floor, Suite 3B, Newark, NJ";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;

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

  const getImage = (member: TeamMember) => {
    if (member.image_url) return member.image_url;
    if (member.name.toLowerCase().includes("ane")) return founderImg;
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero */}
        <section className="relative pt-28 md:pt-36 pb-12 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-60" />
          <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-gold/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-nude-dark/10 blur-3xl" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
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
                className="inline-flex items-center gap-2 bg-secondary px-4 py-1.5 rounded-full mb-6"
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
        </section>

        {/* Team Members — Compact WhatsApp Cards */}
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-xl">
            {isLoading ? (
              <div className="text-center text-muted-foreground">{t("team.loading")}</div>
            ) : (
              <div className="flex flex-col gap-3">
                {members.map((member, idx) => {
                  const img = getImage(member);
                  const whatsappUrl = member.phone
                    ? buildWhatsAppUrl(member.phone, member.name.split(" ")[0], isPt)
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
                          <TeamAvatar img={img} name={member.name} />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">
                              {member.name}
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
                          <TeamAvatar img={img} name={member.name} />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">
                              {member.name}
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

function TeamAvatar({ img, name }: { img: string | null; name: string }) {
  if (img) {
    return (
      <img
        src={img}
        alt={name}
        className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-border"
      />
    );
  }
  return (
    <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center shrink-0 border-2 border-border">
      <span className="text-sm font-medium text-primary">
        {name.charAt(0)}
      </span>
    </div>
  );
}
