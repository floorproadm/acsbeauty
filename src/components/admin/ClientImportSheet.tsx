import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Loader2, FileSpreadsheet, AlertCircle } from "lucide-react";

interface ClientImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedClient {
  name: string;
  phone?: string;
  email?: string;
  instagram?: string;
}

const COLUMN_MAP: Record<string, keyof ParsedClient> = {
  nome: "name",
  name: "name",
  telefone: "phone",
  phone: "phone",
  celular: "phone",
  email: "email",
  "e-mail": "email",
  instagram: "instagram",
  insta: "instagram",
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const sep = text.includes(";") ? ";" : ",";
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) =>
    line.split(sep).map((cell) => cell.trim().replace(/^"|"$/g, ""))
  );
  return { headers, rows };
}

export function ClientImportSheet({ open, onOpenChange }: ClientImportSheetProps) {
  const [parsed, setParsed] = useState<ParsedClient[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFile = (file: File) => {
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);

      const mapping: Record<number, keyof ParsedClient> = {};
      headers.forEach((h, i) => {
        const key = COLUMN_MAP[h.toLowerCase()];
        if (key) mapping[i] = key;
      });

      if (!Object.values(mapping).includes("name")) {
        setError("Coluna 'nome' não encontrada. Verifique o cabeçalho do CSV.");
        setParsed(null);
        return;
      }

      const clients: ParsedClient[] = rows
        .map((row) => {
          const client: any = {};
          Object.entries(mapping).forEach(([idx, key]) => {
            const val = row[Number(idx)];
            if (val) client[key] = val;
          });
          return client as ParsedClient;
        })
        .filter((c) => c.name?.trim());

      if (clients.length === 0) {
        setError("Nenhum cliente válido encontrado no arquivo.");
        setParsed(null);
        return;
      }

      setParsed(clients);
    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async (clients: ParsedClient[]) => {
      const payload = clients.map((c) => ({
        name: c.name.trim(),
        phone: c.phone?.trim() || null,
        email: c.email?.trim() || null,
        instagram: c.instagram?.trim() || null,
      }));
      const { error } = await supabase.from("clients").insert(payload);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      toast({ title: `${count} clientes importados com sucesso!` });
      setParsed(null);
      setFileName("");
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao importar clientes", variant: "destructive" });
    },
  });

  const reset = () => {
    setParsed(null);
    setFileName("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!parsed ? (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Selecionar arquivo CSV</p>
                <p className="text-xs text-muted-foreground mt-1">nome, telefone, email, instagram</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                <FileSpreadsheet className="w-4 h-4 inline mr-1" />
                {fileName} — <strong>{parsed.length}</strong> clientes encontrados
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.slice(0, 5).map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{c.name}</TableCell>
                        <TableCell className="text-xs">{c.phone || "—"}</TableCell>
                        <TableCell className="text-xs truncate max-w-[120px]">{c.email || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {parsed.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... e mais {parsed.length - 5} clientes
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  disabled={importMutation.isPending}
                  onClick={() => importMutation.mutate(parsed)}
                >
                  {importMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Importar {parsed.length}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
