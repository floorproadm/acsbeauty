import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2, Upload } from "lucide-react";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import slugify from "slugify";
import { toast } from "sonner";

interface Props {
  postId: string | null;
  onClose: () => void;
}

const empty = {
  title: "", slug: "", excerpt: "", content: "", cover_image_url: "",
  status: "draft" as "draft" | "published",
  audience: "both" as "public" | "portal" | "both",
  language: "pt" as "pt" | "en",
  category_id: null as string | null,
  related_service_id: null as string | null,
  author_id: null as string | null,
  seo_title: "", seo_description: "", og_image_url: "",
  published_at: null as string | null,
};

export function BlogPostEditor({ postId, onClose }: Props) {
  const [post, setPost] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["blog-post", postId],
    queryFn: async () => {
      if (!postId) return null;
      const { data, error } = await supabase.from("blog_posts").select("*").eq("id", postId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });

  useEffect(() => { if (existing) setPost(existing); }, [existing]);

  const { data: categories } = useQuery({
    queryKey: ["blog-categories-all"],
    queryFn: async () => (await supabase.from("blog_categories").select("*").order("display_order")).data || [],
  });
  const { data: services } = useQuery({
    queryKey: ["services-pick"],
    queryFn: async () => (await supabase.from("services").select("id,name").order("name")).data || [],
  });
  const { data: team } = useQuery({
    queryKey: ["team-pick"],
    queryFn: async () => (await supabase.from("team_members").select("id,name").order("name")).data || [],
  });

  const setField = (k: string, v: any) => setPost((p: any) => ({ ...p, [k]: v }));

  const onTitleChange = (v: string) => {
    setPost((p: any) => ({
      ...p,
      title: v,
      slug: !postId && !p.slug ? slugify(v, { lower: true, strict: true }) : p.slug || slugify(v, { lower: true, strict: true }),
    }));
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `blog/covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("gallery").upload(path, file);
    if (error) { toast.error("Erro ao enviar"); setUploading(false); return; }
    const { data } = supabase.storage.from("gallery").getPublicUrl(path);
    setField("cover_image_url", data.publicUrl);
    setUploading(false);
  };

  const save = async () => {
    if (!post.title || !post.slug) { toast.error("Título e slug obrigatórios"); return; }
    setSaving(true);
    const payload: any = {
      title: post.title,
      slug: slugify(post.slug, { lower: true, strict: true }),
      excerpt: post.excerpt || null,
      content: post.content || "",
      cover_image_url: post.cover_image_url || null,
      status: post.status,
      audience: post.audience,
      language: post.language,
      category_id: post.category_id || null,
      related_service_id: post.related_service_id || null,
      author_id: post.author_id || null,
      seo_title: post.seo_title || null,
      seo_description: post.seo_description || null,
      og_image_url: post.og_image_url || null,
      published_at: post.status === "published"
        ? (post.published_at || new Date().toISOString())
        : post.published_at,
    };

    let error;
    if (postId) {
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", postId));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Post salvo");
    onClose();
  };

  if (postId && isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onClose} className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-4">
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={post.title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Como cuidar do cabelo no inverno" />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={post.slug} onChange={(e) => setField("slug", e.target.value)} placeholder="cuidar-cabelo-inverno" />
              <p className="text-xs text-muted-foreground mt-1">URL: /blog/{post.slug || "..."}</p>
            </div>
            <div>
              <Label>Resumo</Label>
              <Textarea value={post.excerpt || ""} onChange={(e) => setField("excerpt", e.target.value)} rows={2} placeholder="Resumo curto que aparece em listagens e SEO" />
            </div>
          </Card>

          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <RichTextEditor value={post.content} onChange={(v) => setField("content", v)} />
            </TabsContent>
            <TabsContent value="seo" className="space-y-3">
              <Card className="p-4 space-y-3">
                <div>
                  <Label>SEO Title <span className="text-xs text-muted-foreground">({(post.seo_title || "").length}/60)</span></Label>
                  <Input value={post.seo_title || ""} onChange={(e) => setField("seo_title", e.target.value)} maxLength={70} />
                </div>
                <div>
                  <Label>Meta description <span className="text-xs text-muted-foreground">({(post.seo_description || "").length}/160)</span></Label>
                  <Textarea value={post.seo_description || ""} onChange={(e) => setField("seo_description", e.target.value)} rows={3} maxLength={200} />
                </div>
                <div>
                  <Label>OG Image URL</Label>
                  <Input value={post.og_image_url || ""} onChange={(e) => setField("og_image_url", e.target.value)} placeholder="https://..." />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="pub">Publicado</Label>
              <Switch id="pub" checked={post.status === "published"} onCheckedChange={(c) => setField("status", c ? "published" : "draft")} />
            </div>
            <div>
              <Label>Audiência</Label>
              <Select value={post.audience} onValueChange={(v) => setField("audience", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Site público</SelectItem>
                  <SelectItem value="portal">Apenas Portal</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Idioma</Label>
              <Select value={post.language} onValueChange={(v) => setField("language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={post.category_id || "none"} onValueChange={(v) => setField("category_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem categoria</SelectItem>
                  {(categories || []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name_pt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Serviço relacionado (CTA)</Label>
              <Select value={post.related_service_id || "none"} onValueChange={(v) => setField("related_service_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nenhum</SelectItem>
                  {(services || []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Autor</Label>
              <Select value={post.author_id || "none"} onValueChange={(v) => setField("author_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nenhum</SelectItem>
                  {(team || []).map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <Label>Capa</Label>
            {post.cover_image_url && (
              <img src={post.cover_image_url} alt="" className="w-full aspect-video object-cover rounded-md" />
            )}
            <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-3 cursor-pointer hover:bg-muted/30 text-sm">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {post.cover_image_url ? "Trocar capa" : "Enviar capa"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }} />
            </label>
          </Card>
        </div>
      </div>
    </div>
  );
}
