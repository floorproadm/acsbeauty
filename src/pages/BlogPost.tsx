import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ["public-blog-post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*, category:blog_categories(name_pt,slug), author:team_members(name), service:services(id,name,slug)")
        .eq("slug", slug!)
        .eq("status", "published")
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (post?.slug) {
      supabase.rpc("increment_post_views", { _slug: post.slug });
    }
  }, [post?.slug]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 pb-20 text-center">
          <p className="text-muted-foreground mb-4">Post não encontrado.</p>
          <Button variant="outline" onClick={() => navigate("/blog")}>Voltar ao blog</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const seoTitle = post.seo_title || post.title;
  const seoDesc = post.seo_description || post.excerpt || "";
  const ogImg = post.og_image_url || post.cover_image_url;
  const url = `https://acsbeautystudio.com/blog/${post.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{seoTitle}</title>
        {seoDesc && <meta name="description" content={seoDesc} />}
        <link rel="canonical" href={url} />
        <meta property="og:title" content={seoTitle} />
        {seoDesc && <meta property="og:description" content={seoDesc} />}
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        {ogImg && <meta property="og:image" content={ogImg} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          image: ogImg ? [ogImg] : undefined,
          datePublished: post.published_at,
          dateModified: post.updated_at,
          author: post.author ? { "@type": "Person", name: post.author.name } : { "@type": "Organization", name: "ACS Beauty" },
          publisher: { "@type": "Organization", name: "ACS Beauty", logo: { "@type": "ImageObject", url: "https://acsbeautystudio.com/og-image.png" } },
          description: seoDesc,
          mainEntityOfPage: url,
        })}</script>
      </Helmet>

      <Header />

      <article className="pt-28 pb-20">
        {post.cover_image_url && (
          <div className="aspect-[16/7] w-full overflow-hidden bg-muted">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="container mx-auto max-w-3xl px-6 mt-10">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Blog
          </Link>

          {post.category && (
            <p className="text-xs tracking-[0.3em] uppercase text-bronze mb-3">{post.category.name_pt}</p>
          )}
          <h1 className="font-editorial italic text-4xl md:text-5xl leading-tight mb-4">{post.title}</h1>
          {post.excerpt && <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>}

          <div className="flex items-center gap-4 text-sm text-muted-foreground border-y py-4 mb-8">
            {post.author && <span>Por {post.author.name}</span>}
            {post.published_at && <span>{format(new Date(post.published_at), "dd MMM yyyy")}</span>}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.reading_minutes} min</span>
          </div>

          <div
            className="prose prose-lg max-w-none prose-headings:font-editorial prose-headings:italic prose-a:text-bronze"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.service && (
            <div className="mt-12 p-6 md:p-8 rounded-lg bg-cream/50 border text-center">
              <p className="text-xs tracking-[0.2em] uppercase text-bronze mb-2">Pronta para experimentar?</p>
              <h3 className="font-editorial italic text-2xl mb-4">{post.service.name}</h3>
              <Button asChild className="gap-2">
                <Link to="/portal"><Calendar className="w-4 h-4" /> Agendar agora</Link>
              </Button>
            </div>
          )}
        </div>
      </article>

      <Footer />
    </div>
  );
}
