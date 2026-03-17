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

export default function Team() {
  const { t } = useLanguage();

  const values = [
    { icon: "✨", title: t("team.value_excellence"), desc: t("team.value_excellence_desc") },
    { icon: "💛", title: t("team.value_care"), desc: t("team.value_care_desc") },
    { icon: "🌿", title: t("team.value_naturalness"), desc: t("team.value_naturalness_desc") },
  ];

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
        <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden">
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

        {/* Team Members */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            {isLoading ? (
              <div className="text-center text-muted-foreground">{t("team.loading")}</div>
            ) : (
              <div className="space-y-24 max-w-5xl mx-auto">
                {members.map((member, idx) => {
                  const img = getImage(member);
                  const isEven = idx % 2 === 1;

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${isEven ? "md:direction-rtl" : ""}`}>
                        {/* Image */}
                        <motion.div
                          initial={{ opacity: 0, x: isEven ? 40 : -40 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: 0.1 }}
                          className={`relative group ${isEven ? "md:order-2" : ""}`}
                        >
                          <div className="absolute -inset-3 bg-gradient-gold rounded-3xl opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500 blur-sm" />
                          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-elevated">
                            {img ? (
                              <img
                                src={img}
                                alt={member.name}
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <span className="text-sm text-muted-foreground">{t("team.photo_placeholder")}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent" />
                          </div>

                          {member.badge_label && member.badge_value && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.5, delay: 0.5 }}
                              className="absolute -bottom-4 -right-4 md:-right-6 bg-card border border-border rounded-xl px-4 py-3 shadow-card"
                            >
                              <p className="text-xs text-muted-foreground">{member.badge_label}</p>
                              <p className="text-sm font-medium text-foreground">{member.badge_value}</p>
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Info */}
                        <motion.div
                          initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: 0.2 }}
                          className={`flex flex-col ${isEven ? "md:order-1" : ""}`}
                        >
                          <span className="text-xs font-medium tracking-[0.2em] uppercase text-primary mb-3">
                            {member.role}
                          </span>
                          <h2 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-4">
                            {member.name}
                          </h2>
                          <div className="w-12 h-px bg-primary/40 mb-6" />
                          {member.bio && (
                            <p className="text-muted-foreground leading-relaxed mb-8">
                              {member.bio}
                            </p>
                          )}

                          {member.specialties?.length > 0 && (
                            <div className="mb-8">
                              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-3">
                                {t("team.specialties")}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {member.specialties.map((s, i) => (
                                  <motion.span
                                    key={s}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                                    className="text-xs bg-secondary border border-border px-3.5 py-1.5 rounded-full text-foreground/80"
                                  >
                                    {s}
                                  </motion.span>
                                ))}
                              </div>
                            </div>
                          )}

                          {member.phone && (
                            <motion.a
                              href={`tel:${member.phone}`}
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.6 }}
                              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group/link"
                            >
                              <Phone className="w-4 h-4" />
                              <span className="border-b border-transparent group-hover/link:border-primary/40 transition-colors">
                                {member.phone}
                              </span>
                            </motion.a>
                          )}
                        </motion.div>
                      </div>
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
              {values.map((v, i) => (
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
