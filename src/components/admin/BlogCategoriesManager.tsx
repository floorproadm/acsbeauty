import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import slugify from "slugify";

export function BlogCategoriesManager() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState({ name_pt: "", name_en: "" });

  const { data: cats } = useQuery({
    queryKey: ["blog-categories-admin"],
    queryFn: async () => (await supabase.from("blog_categories").select("*").order("display_order")).data || [],
  });

  const add = async () => {
    if (!draft.name_pt) return;
    const { error } = await supabase.from("blog_categories").insert({
      name_pt: draft.name_pt,
      name_en: draft.name_en || draft.name_pt,
      slug: slugify(draft.name_pt, { lower: true, strict: true }),
      display_order: (cats?.length || 0) + 1,
    });
    if (error) { toast.error(error.message); return; }
    setDraft({ name_pt: "", name_en: "" });
    qc.invalidateQueries({ queryKey: ["blog-categories-admin"] });
  };

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("blog_categories").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["blog-categories-admin"] });
  };

  const del = async (id: string) => {
    if (!confirm("Excluir categoria?")) return;
    const { error } = await supabase.from("blog_categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["blog-categories-admin"] });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Nova categoria</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Nome (PT)" value={draft.name_pt} onChange={(e) => setDraft({ ...draft, name_pt: e.target.value })} />
          <Input placeholder="Nome (EN)" value={draft.name_en} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} />
          <Button onClick={add} className="gap-2"><Plus className="w-4 h-4" /> Adicionar</Button>
        </div>
      </Card>

      <div className="space-y-2">
        {(cats || []).map((c: any) => (
          <Card key={c.id} className="p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
            <Input className="flex-1" defaultValue={c.name_pt} onBlur={(e) => e.target.value !== c.name_pt && update(c.id, { name_pt: e.target.value })} />
            <Input className="flex-1" defaultValue={c.name_en} onBlur={(e) => e.target.value !== c.name_en && update(c.id, { name_en: e.target.value })} />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Switch checked={c.is_active} onCheckedChange={(v) => update(c.id, { is_active: v })} />
                <span className="text-muted-foreground">Ativa</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => del(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
