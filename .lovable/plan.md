

# Fix: Step inicial do Book.tsx

## Bug
Linha 96 de `src/pages/Book.tsx`:
```typescript
const [step, setStep] = useState<"service" | "sku" | "date" | "time" | "form">(
  isCalendarFlow ? "date" : serviceParam ? "date" : "date"
);
```
Todas as branches resolvem para `"date"`. Sem params, o user vê seleção de data sem serviço.

## Fix
Alterar linha 96 para:
```typescript
const [step, setStep] = useState<"service" | "sku" | "date" | "time" | "form">(
  isCalendarFlow ? "date" : serviceParam ? "sku" : "service"
);
```

- Sem params → `"service"` (seleção de serviço)
- `serviceParam` presente → `"sku"` (verificar variations/SKUs)
- `isCalendarFlow` → `"date"` (direto para calendário)

**Arquivo:** `src/pages/Book.tsx`, linha 96. Mudança de uma linha.

