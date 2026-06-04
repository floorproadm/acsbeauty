import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { format } from "date-fns";
import { Clock } from "lucide-react";

export default function Blog() {
  const { data: posts } = useQuery({
    queryKey: ["public-blog-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id,slug,title,excerpt,cover_image_url,published_at,reading_minutes,category:blog_categories(name_pt,slug)")
        .eq("status", "published")
        .in("audience", ["public", "both"])
        .order("published_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Blog ACS Beauty — Dicas de cabelo, sobrancelhas e unhas</title>
        <meta name="description" content="Conteúdo editorial da ACS Beauty: cuidados capilares, tendências de beleza, dicas de cuidado e bastidores do estúdio em Newark." />
        <link rel="canonical" href="https://acsbeautystudio.com/blog" />
        <meta property="og:title" content="Blog ACS Beauty" />
        <meta property="og:description" content="Conteúdo editorial sobre beleza, cabelo, sobrancelhas e unhas." />
        <meta property="og:url" content="https://acsbeautystudio.com/blog" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Header />

      <section className="pt-32 pb-12 px-6 container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-bronze mb-3">ACS Journal</p>
          <h1 className="font-editorial text-4xl md:text-6xl italic mb-4">Blog</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Dicas, tendências e bastidores da ACS Beauty.</p>
        </div>

        {!posts || posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Em breve novos artigos.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((p: any) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                <article>
                  {p.cover_image_url ? (
                    <div className="aspect-[4/3] overflow-hidden rounded-md bg-muted mb-4">
                      <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-muted rounded-md mb-4" />
                  )}
                  {p.category && (
                    <p className="text-xs tracking-[0.2em] uppercase text-bronze mb-2">{p.category.name_pt}</p>
                  )}
                  <h2 className="font-editorial text-2xl mb-2 group-hover:text-bronze transition-colors">{p.title}</h2>
                  {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.excerpt}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {p.published_at && <span>{format(new Date(p.published_at), "dd MMM yyyy")}</span>}
                    {p.reading_minutes && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.reading_minutes} min</span>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
