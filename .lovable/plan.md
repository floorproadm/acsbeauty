

## Plano: Adicionar botão de criar cliente + importação de lista

### O que muda

1. **Botão "Novo Cliente"** no header da aba Clientes — abre o `ClientEditModal` existente em modo criação (sem `client` preenchido), inserindo diretamente na tabela `clients`.

2. **Botão "Importar"** — abre um Sheet/Dialog com upload de CSV. O admin faz upload de um arquivo `.csv` com colunas (nome, telefone, email, instagram) e o sistema insere em lote na tabela `clients`.

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/admin/ClientsTab.tsx` | Adicionar botões "+ Novo" e "Importar" no header; estado para modal de criação e sheet de importação |
| `src/components/admin/ClientEditModal.tsx` | Ajustar para aceitar `client: null` como modo criação (INSERT ao invés de UPDATE) |
| `src/components/admin/ClientImportSheet.tsx` | Criar — Sheet com upload CSV, preview da tabela, validação e inserção em lote |

### Detalhes

**Novo Cliente**
- Reutiliza o `ClientEditModal` passando `client={null}` 
- Modal detecta `client === null` → muda título para "Novo Cliente", esconde botão deletar, faz `INSERT` ao invés de `UPDATE`
- Campos: nome (obrigatório), telefone, email, instagram, aniversário

**Importação CSV**
- Sheet lateral com área de drag-and-drop ou botão de upload
- Aceita `.csv` com separador `,` ou `;`
- Colunas esperadas: `nome`, `telefone`, `email`, `instagram` (mapeamento flexível por header)
- Preview com tabela mostrando primeiras 5 linhas antes de confirmar
- Inserção em lote via `supabase.from("clients").insert([...])` 
- Feedback: "X clientes importados com sucesso"
- Tratamento de duplicatas: skip se telefone já existe (opcional)

**UI no header (mobile-first)**
- Dois botões compactos ao lado do contador: ícone `+` (novo) e ícone `Upload` (importar)
- Padrão visual igual ao botão `+` da aba Pagamentos

