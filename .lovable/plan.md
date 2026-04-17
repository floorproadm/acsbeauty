
## Consolidar serviços duplicados de Highlights

Encontrei dois serviços que parecem ser o mesmo:

| Serviço | Técnicas | Opções (SKUs) | Agendamentos |
|---|---|---|---|
| **Highlights** (`highlights`) | 0 | 0 | 0 |
| **Highlights Técnicas** (`highlights-tecnicas`) | 0 | 3 (Clássico, Balayage, Money Piece) | 0 |

Como nenhum tem agendamentos vinculados, é seguro consolidar.

### Plano

**1. Mover as 3 opções para o serviço "Highlights"**
Reatribuir os SKUs (Clássico, Balayage, Money Piece) do serviço duplicado para o serviço principal `Highlights`.

**2. Excluir o serviço duplicado "Highlights Técnicas"**
Após mover as opções, remover o serviço `highlights-tecnicas` do banco.

**Resultado final:**
```text
Highlights (180min)
├─ Highlights Clássico (180min)
├─ Balayage (240min)
└─ Money Piece (120min)
```

### Detalhes técnicos

- Migration SQL única e additiva:
  - `UPDATE service_skus SET service_id = 'ef3be501...' WHERE service_id = '0f234a0d...'`
  - `DELETE FROM services WHERE id = '0f234a0d...'`
- Nenhuma alteração de UI necessária — `ServicesTab` já agrupa SKUs corretamente.
- Sem impacto em bookings (0 registros).
- Slug `highlights-tecnicas` libera o caminho público duplicado em `/servicos/cabelo/`.

### Confirmação antes de aplicar

Quer também que eu **consolide outros serviços duplicados** que possam existir (ex: outros pares "X" + "X Técnicas")? Posso verificar e incluir no mesmo plano se quiser.
