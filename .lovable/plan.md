

# Unificar Leads em Interface Única com Filtro por Origem

## Visão Geral

Criar um componente **UnifiedLeadsTab** que consolida `LeadsTab` e `WhatsAppLeadsTab` em uma única interface, eliminando redundância e oferecendo:
- Toggle entre visualização **Tabela** e **Board (Kanban)**
- Filtro por **Origem**: Quiz, WhatsApp, ou Todos
- Nome da aba: **"Captação"** (mais intuitivo que "Lead Capture")

## Arquitetura de Dados

As duas tabelas (`quiz_responses` e `whatsapp_clicks`) serão consultadas e normalizadas em uma interface comum:

```text
┌─────────────────────────────────────────────────────────────┐
│  Interface Unificada de Leads                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ quiz_responses          whatsapp_clicks              │   │
│  │ - client_name           - client_name               │   │
│  │ - client_phone          - (via drawer ou vazio)     │   │
│  │ - client_email          - (via drawer ou vazio)     │   │
│  │ - status                - status                    │   │
│  │ - utm_source            - utm_source                │   │
│  │ - created_at            - created_at                │   │
│  │                                                      │   │
│  │ Campos específicos:     Campos específicos:          │   │
│  │ - quiz_id, answers      - service_interest          │   │
│  │ - quiz_results          - urgency                    │   │
│  │ - client_instagram      - page_path                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│              Normalizado para UnifiedLead                   │
└─────────────────────────────────────────────────────────────┘
```

## Estrutura do Componente Unificado

```text
┌─────────────────────────────────────────────────────────────┐
│  CRM                                                        │
│  ├─ [Captação]  [Clientes]   ← Sub-abas simplificadas      │
│  │                                                          │
│  │  ┌──────────────────────────────────────────────────┐   │
│  │  │ Pipeline Stats: Novo | Em Contato | Convertido...│   │
│  │  └──────────────────────────────────────────────────┘   │
│  │                                                          │
│  │  ┌─────────────────────────────────────────────────────┐│
│  │  │ 🔍 Busca  | Origem ▼ | Período ▼ | Status ▼        ││
│  │  │           | Quiz     |           |                  ││
│  │  │           | WhatsApp |           |     [📋] [📊]   ││
│  │  │           | Todos    |           |     Table  Board ││
│  │  └─────────────────────────────────────────────────────┘│
│  │                                                          │
│  │  [ Conteúdo em Tabela ou Kanban baseado no toggle ]     │
│  │                                                          │
│  └──────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

## Interface Unificada de Lead

```typescript
interface UnifiedLead {
  id: string;
  source: "quiz" | "whatsapp";  // Identificador de origem
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  client_instagram: string | null;
  status: LeadStatus;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string;
  
  // Campos específicos de Quiz
  quiz_name?: string;
  quiz_result?: string;
  answers?: unknown;
  
  // Campos específicos de WhatsApp
  service_interest?: string;
  service_name?: string;
  urgency?: string;
  page_path?: string;
}
```

## Arquivos a Modificar/Criar

### 1. Criar: `UnifiedLeadsTab.tsx`
- Novo componente que substitui `LeadsTab` e `WhatsAppLeadsTab`
- Contém toda a lógica de fetch, filtros, e renderização
- Toggle entre TableView e KanbanView
- Filtro por origem (Quiz / WhatsApp / Todos)

### 2. Modificar: `CRMTab.tsx`
- Remover sub-aba "Leads Quiz"
- Remover sub-aba "WhatsApp"
- Adicionar sub-aba **"Captação"** (UnifiedLeadsTab)
- Manter sub-aba "Clientes"
- Simplificar para apenas 2 sub-abas

### 3. Reutilizar componentes existentes:
- `LeadCard` do WhatsAppLeadsTab (para Kanban)
- `KanbanColumn` do WhatsAppLeadsTab
- Tabela do LeadsTab
- Pipeline stats cards (já existente)

### 4. Manter (sem alterações):
- `LeadsTab.tsx` - arquivo mantido mas não usado (pode remover depois)
- `WhatsAppLeadsTab.tsx` - arquivo mantido mas não usado (pode remover depois)
- `ClientsTab.tsx` - continua como está

## Funcionalidades Consolidadas

| Feature | Implementação |
|---------|---------------|
| Busca unificada | Busca em nome, telefone, email, serviço |
| Filtro por Origem | Dropdown: Todos, Quiz, WhatsApp |
| Filtro por Período | Hoje, 7 dias, 30 dias, 90 dias, Todos |
| Filtro por Status | Novo, Em Contato, Convertido, Perdido, Todos |
| Toggle de View | Tabela (default) ou Kanban Board |
| Pipeline Stats | Cards clicáveis com contagem por status |
| Taxa de Conversão | Mostra % de leads convertidos |
| Export CSV | Exporta leads filtrados com origem identificada |
| Drag-and-drop | Disponível na view Kanban |
| Bulk Delete | Seleção múltipla na view Tabela |
| Lead Details | Modal com informações específicas por origem |

## Detalhes Técnicos

### Queries Paralelas
```typescript
const { data: quizLeads } = useQuery({
  queryKey: ["quiz-leads"],
  queryFn: () => supabase
    .from("quiz_responses")
    .select("*, quizzes(name), quiz_results(title)")
    .order("created_at", { ascending: false })
});

const { data: whatsappLeads } = useQuery({
  queryKey: ["whatsapp-leads"],
  queryFn: () => supabase
    .from("whatsapp_clicks")
    .select("*")
    .not("client_name", "is", null)
    .order("created_at", { ascending: false })
});

// Normaliza e combina
const allLeads = useMemo(() => {
  const normalized: UnifiedLead[] = [];
  
  quizLeads?.forEach(l => normalized.push({
    id: l.id,
    source: "quiz",
    client_name: l.client_name,
    // ... mapear campos
  }));
  
  whatsappLeads?.forEach(l => normalized.push({
    id: l.id,
    source: "whatsapp",
    client_name: l.client_name,
    // ... mapear campos
  }));
  
  return normalized.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}, [quizLeads, whatsappLeads]);
```

### Badge de Origem
```typescript
const SourceBadge = ({ source }: { source: "quiz" | "whatsapp" }) => (
  <Badge variant="outline" className={
    source === "quiz" 
      ? "bg-purple-50 text-purple-700 border-purple-200" 
      : "bg-green-50 text-green-700 border-green-200"
  }>
    {source === "quiz" ? "📝 Quiz" : "💬 WhatsApp"}
  </Badge>
);
```

## Nova Estrutura do CRMTab

```tsx
<Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
  <TabsList className="grid w-full max-w-xs grid-cols-2">
    <TabsTrigger value="captacao" className="gap-2">
      <UserPlus className="w-4 h-4" />
      Captação
    </TabsTrigger>
    <TabsTrigger value="clients" className="gap-2">
      <Users className="w-4 h-4" />
      Clientes
    </TabsTrigger>
  </TabsList>

  <TabsContent value="captacao">
    <UnifiedLeadsTab />
  </TabsContent>
  <TabsContent value="clients">
    <ClientsTab />
  </TabsContent>
</Tabs>
```

## Benefícios

1. **Elimina redundância** - Uma única interface para todos os leads
2. **Visão unificada do funil** - Pipeline consolidado de todas as fontes
3. **Flexibilidade de visualização** - Usuário escolhe Tabela ou Board
4. **Filtragem poderosa** - Facilita análise por origem
5. **Métricas consolidadas** - Taxa de conversão global e por origem
6. **UX simplificada** - Menos cliques para acessar leads

## Risco
**Baixo** - Não altera estrutura do banco de dados. Apenas consolida UI existente.

