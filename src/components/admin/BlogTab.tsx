import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, ExternalLink, Eye } from "lucide-react";
import { BlogPostEditor } from "./BlogPostEditor";
import { BlogCategoriesManager } from "./BlogCategoriesManager";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";

export function BlogTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, category:blog_categories(name_pt)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post excluído");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });

  const togglePublish = useMutation({
    mutationFn: async (p: any) => {
      const newStatus = p.status === "published" ? "draft" : "published";
      const { error } = await supabase
        .from("blog_posts")
        .update({
          status: newStatus,
          published_at: newStatus === "published" ? (p.published_at || new Date().toISOString()) : p.published_at,
        })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });

  if (editingId !== null) {
    return (
      <BlogPostEditor
        postId={editingId === "new" ? null : editingId}
        onClose={() => {
          setEditingId(null);
          qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
        }}
      />
    );
  }

  const filtered = (posts || []).filter((p: any) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Tabs defaultValue="posts" className="space-y-4">
      <TabsList>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="categories">Categorias</TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Blog</h2>
            <p className="text-sm text-muted-foreground">Gerencie os posts publicados em /blog e no Portal.</p>
          </div>
          <Button onClick={() => setEditingId("new")} className="gap-2">
            <Plus className="w-4 h-4" /> Novo post
          </Button>
        </div>

        <Input placeholder="Buscar por título..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Audiência</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum post ainda. Clique em "Novo post" para começar.</TableCell></TableRow>
              ) : filtered.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "published" ? "default" : "secondary"}>
                      {p.status === "published" ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {p.audience === "public" ? "Público" : p.audience === "portal" ? "Portal" : "Ambos"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.category?.name_pt || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(p.updated_at), "dd/MM/yy")}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => togglePublish.mutate(p)} title={p.status === "published" ? "Despublicar" : "Publicar"}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {p.status === "published" && (
                      <Button size="icon" variant="ghost" asChild title="Ver">
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(p.id)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir este post?")) delMut.mutate(p.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>

      <TabsContent value="categories">
        <BlogCategoriesManager />
      </TabsContent>
    </Tabs>
  );
}
