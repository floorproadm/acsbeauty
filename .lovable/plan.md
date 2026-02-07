
# Simplificar Seleção de Serviço no WhatsApp Drawer

## Objetivo
Substituir o dropdown de serviços específicos por cards visuais com apenas as 3 categorias principais: Cabelo, Sobrancelha e Unhas.

## Mudanças

### WhatsAppDrawer.tsx

**Remover**:
- Query ao banco de dados (`useQuery` para services)
- Lógica de agrupamento por categoria (`servicesByCategory`)
- Componente `Select` com todas as opções

**Adicionar**:
- Constante com as 3 categorias:
```typescript
const SERVICE_CATEGORIES = [
  { value: "cabelo", label: "Cabelo", emoji: "✂️" },
  { value: "sobrancelha", label: "Sobrancelha", emoji: "👁️" },
  { value: "unhas", label: "Unhas", emoji: "💅" },
];
```

**Substituir Step 2**:
- Usar cards clicáveis (mesmo estilo do passo 3 de urgência)
- Visual consistente com o restante do drawer

### Layout do Passo 2 (novo)

```text
┌──────────────────────────────────────┐
│  Qual serviço você procura?          │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ ✂️  Cabelo                     │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ 👁️  Sobrancelha                │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ 💅  Unhas                      │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Impacto nos Dados

- `service_interest` salvará a categoria (`cabelo`, `sobrancelha`, `unhas`) em vez do ID do serviço específico
- Mensagem do WhatsApp e `message` no banco usarão o label amigável ("Cabelo", "Sobrancelha", "Unhas")

### Benefícios

- Remove dependência do banco de dados (query desnecessária)
- Drawer abre mais rápido (sem loading de serviços)
- UX mais limpa e consistente
- Menos decisões para o usuário neste momento (detalhes ficam para /book)
