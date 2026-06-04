import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  post: any;
  categoryName?: string;
  authorName?: string;
  serviceName?: string;
  readingMinutes?: number;
}

export function BlogPostPreview({ open, onOpenChange, post, categoryName, authorName, serviceName, readingMinutes }: Props) {
  const words = (post.content || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const minutes = readingMinutes || Math.max(1, Math.ceil(words / 200));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-5 pb-2 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-sm font-normal text-muted-foreground">Pré-visualização — como o post vai aparecer no site</DialogTitle>
        </DialogHeader>

        <article className="pb-10">
          {post.cover_image_url && (
            <div className="aspect-[16/7] w-full overflow-hidden bg-muted">
              <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="px-6 md:px-10 mt-8 max-w-3xl mx-auto">
            {categoryName && (
              <p className="text-xs tracking-[0.3em] uppercase text-bronze mb-3">{categoryName}</p>
            )}
            <h1 className="font-editorial italic text-3xl md:text-5xl leading-tight mb-4">
              {post.title || "Título do post"}
            </h1>
            {post.excerpt && <p className="text-base md:text-lg text-muted-foreground mb-6">{post.excerpt}</p>}

            <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground border-y py-3 mb-8">
              {authorName && <span>Por {authorName}</span>}
              <span>{format(new Date(), "dd MMM yyyy")}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {minutes} min</span>
            </div>

            {post.content ? (
              <div
                className="prose prose-lg max-w-none prose-headings:font-editorial prose-headings:italic prose-a:text-bronze"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : (
              <p className="text-muted-foreground italic">O corpo do post aparecerá aqui.</p>
            )}

            {serviceName && (
              <div className="mt-12 p-6 md:p-8 rounded-lg bg-cream/50 border text-center">
                <p className="text-xs tracking-[0.2em] uppercase text-bronze mb-2">Pronta para experimentar?</p>
                <h3 className="font-editorial italic text-2xl mb-4">{serviceName}</h3>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm">
                  <Calendar className="w-4 h-4" /> Agendar agora
                </div>
              </div>
            )}
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
}
