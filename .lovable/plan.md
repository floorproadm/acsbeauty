

## Importar Serviços do TopStudios para o ACS Beauty OS

### Serviços a adicionar

Da imagem do TopStudios, estes são os serviços listados. "Corte Feminino" já existe no banco.

| Serviço | Categoria | Slug | Duração (default) | Preço (default) |
|---|---|---|---|---|
| Botox Capilar | Cabelo | botox-capilar | 120min | 0 |
| Escova | Cabelo | escova | 45min | 0 |
| Highlights | Cabelo | highlights | 180min | 0 |
| Manutenção Mega Hair | Cabelo | manutencao-mega-hair | 180min | 0 |
| Maquiagem | Cabelo | maquiagem | 60min | 0 |
| Penteado | Cabelo | penteado | 60min | 0 |
| Progressiva | Cabelo | progressiva | 120min | 0 |
| Tintura | Cabelo | tintura | 120min | 0 |
| Tratamento Capilar | Cabelo | tratamento-capilar | 90min | 0 |

**Nota:** Preços ficam em $0 (placeholder) pois são ocultos no frontend público. A Ane ajusta depois no admin. Durações são estimativas razoáveis que também podem ser ajustadas.

### Como funciona

1. **Migration SQL** — INSERT dos 9 novos serviços na tabela `services` com `category = 'Cabelo'`, `category_slug = 'cabelo'`, `status = 'entry'`, `is_active = true`
2. Cada serviço recebe um `slug` único para roteamento SEO
3. Após inserir, os serviços aparecem automaticamente na aba Serviços do admin, agrupados sob "Cabelo"
4. A Ane pode então editar preços, durações e adicionar Técnicas/Opções via o admin

### Arquivos alterados
- **Database migration** — INSERT de 9 serviços novos

