
# Consolidar Leads e Clientes em uma Única Aba CRM

## Visão Geral
Unificar as abas **Leads**, **Clientes** e **WhatsApp** em uma única aba chamada **"Contatos"** ou **"CRM"** com navegação interna por sub-abas. Isso cria um funil visual completo desde o primeiro contato até a conversão em cliente fidelizado.

## Arquitetura Proposta

```text
┌─────────────────────────────────────────────────────────────┐
│  Sidebar                                                    │
│  ┌───────────────┐                                          │
│  │ Dashboard     │                                          │
│  │ Agendamentos  │                                          │
│  │ ─────────────  │                                          │
│  │ 👥 CRM        │  ← Nova aba unificada (ícone Users)      │
│  │ ─────────────  │                                          │
│  │ Tarefas       │                                          │
│  │ Serviços      │                                          │
│  │ Opções        │                                          │
│  │ Quizzes       │                                          │
│  └───────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

## Nova Aba CRM - Layout Interno

```text
┌─────────────────────────────────────────────────────────────┐
│  CRM                                                        │
│  Gerencie todo o ciclo de vida dos seus contatos            │
│                                                             │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ Leads Quiz   │ WhatsApp     │ Clientes     │  ← Sub-tabs│
│  └──────────────┴──────────────┴──────────────┘            │
│                                                             │
│  [ Conteúdo da sub-aba selecionada ]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sub-abas:
1. **Leads Quiz** - Leads vindos de respostas de quiz (atual `LeadsTab`)
2. **WhatsApp** - Leads vindos do drawer WhatsApp (atual `WhatsAppLeadsTab`)
3. **Clientes** - Clientes convertidos/cadastrados (atual `ClientsTab`)

## Arquivos a Modificar

### 1. Novo Componente: `CRMTab.tsx`
- Container que agrupa as 3 sub-abas
- Usa componente `Tabs` do Radix UI para navegação interna
- Mantém estado da sub-aba ativa
- Renderiza condicionalmente o conteúdo existente

### 2. AdminLayout.tsx
**Remover do sidebar:**
- `leads` (Leads)
- `clients` (Clientes)  
- `whatsapp` (WhatsApp)

**Adicionar:**
- `crm` (CRM) com ícone `Users` ou `UserCheck`

### 3. Admin.tsx
**Remover cases:**
- `leads` → `LeadsTab`
- `clients` → `ClientsTab`
- `whatsapp` → `WhatsAppLeadsTab`

**Adicionar case:**
- `crm` → `CRMTab`

### 4. Ajustes nos componentes filhos
- `LeadsTab`, `ClientsTab`, `WhatsAppLeadsTab` continuam existindo
- Remover o cabeçalho `<h1>` de cada um (ficará no CRMTab)
- Manter toda a lógica e UI interna intacta

## Fluxo de Conversão Visual

A ordem das sub-abas representa o funil de vendas:
```text
Lead Quiz → Lead WhatsApp → Cliente
   (Frio)      (Morno)       (Quente/Convertido)
```

## Benefícios
- **Menos itens no sidebar** - Interface mais limpa
- **Funil visual** - Mostra progressão natural do contato
- **Navegação contextual** - Tudo relacionado a contatos em um lugar
- **Sem perda de funcionalidade** - Todas as features atuais preservadas

## Código Proposto

### CRMTab.tsx (Novo)
```tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadsTab } from "./LeadsTab";
import { ClientsTab } from "./ClientsTab";
import { WhatsAppLeadsTab } from "./WhatsAppLeadsTab";
import { Users, MessageCircle, UserCheck } from "lucide-react";

export function CRMTab() {
  const [activeSubTab, setActiveSubTab] = useState("leads");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">CRM</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie leads e clientes em um só lugar
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="leads" className="gap-2">
            <UserCheck className="w-4 h-4" />
            Leads Quiz
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-6">
          <LeadsTab />
        </TabsContent>
        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppLeadsTab />
        </TabsContent>
        <TabsContent value="clients" className="mt-6">
          <ClientsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### AdminLayout.tsx (Alterações)
```tsx
// Antes:
{ id: "clients", label: "Clientes", icon: Users },
{ id: "leads", label: "Leads", icon: UserCheck },
{ id: "whatsapp", label: "WhatsApp", icon: Megaphone },

// Depois:
{ id: "crm", label: "CRM", icon: Users },
```

## Escopo Técnico

| Item | Ação |
|------|------|
| `CRMTab.tsx` | Criar novo componente |
| `AdminLayout.tsx` | Substituir 3 itens por 1 |
| `Admin.tsx` | Substituir 3 cases por 1 |
| `LeadsTab.tsx` | Remover header (h1) redundante |
| `ClientsTab.tsx` | Remover header (h1) redundante |
| `WhatsAppLeadsTab.tsx` | Remover header (h1) redundante |
| `AdminTab` type | Remover `leads`, `clients`, `whatsapp`; adicionar `crm` |

## Risco
**Baixo** - Mudança puramente organizacional na UI. Não afeta lógica de negócio, banco de dados ou fluxo de booking.
