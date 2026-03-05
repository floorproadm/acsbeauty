import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import founderImg from "@/assets/founder.jpg";

const team = [
  {
    name: "Ana Carolina",
    role: "Fundadora & Brow Artist",
    image: founderImg,
    specialties: ["Design de Sobrancelha", "Brow Lamination", "Henna Brows"],
  },
];

export default function Team() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero */}
        <section className="pt-28 md:pt-32 pb-12 md:pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-foreground">
                Nossa Equipe
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Profissionais apaixonadas por beleza, dedicadas a entregar resultados excepcionais.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Team Grid */}
        <section className="pb-16 md:pb-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl">
              {team.map((member, idx) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group"
                >
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-muted/50">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                        <span className="text-sm font-light tracking-wider uppercase">Foto</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.specialties.map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
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
