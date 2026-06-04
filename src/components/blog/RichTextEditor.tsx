import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, List, ListOrdered, Quote, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo, Code,
} from "lucide-react";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-bronze underline" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg my-4 max-w-full" } }),
      Placeholder.configure({ placeholder: placeholder || "Escreva seu post..." }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3",
      },
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const uploadImage = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("gallery").upload(path, file);
    if (error) { toast.error("Erro ao enviar imagem"); return; }
    const { data } = supabase.storage.from("gallery").getPublicUrl(path);
    editor.chain().focus().setImage({ src: data.publicUrl }).run();
  };

  const Btn = ({ onClick, active, children, title }: any) => (
    <Button type="button" size="sm" variant={active ? "default" : "ghost"} onClick={onClick} title={title} className="h-8 w-8 p-0">
      {children}
    </Button>
  );

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2"><Heading2 className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3"><Heading3 className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista"><List className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numerada"><ListOrdered className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citação"><Quote className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Código"><Code className="w-4 h-4" /></Btn>
        <Btn onClick={addLink} active={editor.isActive("link")} title="Link"><LinkIcon className="w-4 h-4" /></Btn>
        <Btn onClick={() => fileInputRef.current?.click()} title="Imagem"><ImageIcon className="w-4 h-4" /></Btn>
        <div className="ml-auto flex gap-1">
          <Btn onClick={() => editor.chain().focus().undo().run()} title="Desfazer"><Undo className="w-4 h-4" /></Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} title="Refazer"><Redo className="w-4 h-4" /></Btn>
        </div>
      </div>
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
      />
    </div>
  );
}
