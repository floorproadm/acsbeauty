
# Renomear "SKUs" para "Opções" na UI do Admin

## Objetivo
Substituir todas as ocorrências do termo "SKU" por "Opção" na interface administrativa, mantendo os nomes das tabelas no banco de dados (`service_skus`) inalterados.

## Arquivos a Modificar

### 1. AdminLayout.tsx (menu lateral)
- Linha 65: `{ id: "skus", label: "SKUs", icon: Layers }` -> `"Opções"`

### 2. SkusTab.tsx (aba principal)
- Linha 93: Título "Variações & SKUs" -> "Técnicas & Opções"  
- Linha 96: Contador "SKUs cadastrados" -> "Opções cadastradas"
- Linha 104-105: Texto explicativo sobre gestão
- Linha 121: Empty state "SKUs"
- Linha 139: Header da tabela "SKUs" -> "Opções"
- Linha 186-187: Botão "SKUs" -> "Opções"

### 3. SkusModal.tsx (modal de CRUD)
- Linha 277: Título "SKUs: {serviceName}" -> "Opções: {serviceName}"
- Linha 287: Form header "Editar SKU" / "Novo SKU" -> "Editar Opção" / "Nova Opção"
- Linha 296: Label "Nome do SKU" -> "Nome da Opção"
- Linha 317: Label "Variação" -> "Técnica"
- Linha 328: Placeholder "Sem variação" -> "Sem técnica"
- Linha 386-387: Botão "Novo SKU" -> "Nova Opção"
- Linha 400-401: Empty state "Nenhum SKU cadastrado" -> "Nenhuma opção cadastrada"
- Linha 162: Toast "SKU criado" -> "Opção criada"
- Linha 188: Toast "SKU atualizado" -> "Opção atualizada"
- Linha 205: Toast "SKU excluído" -> "Opção excluída"
- Linha 494: Alert title "Excluir SKU?" -> "Excluir Opção?"

### 4. VariationsModal.tsx (renomear "Variação" -> "Técnica")
- Linha 100: Toast "Variação criada" -> "Técnica criada"
- Linha 121: Toast "Variação atualizada" -> "Técnica atualizada"
- Linha 138: Toast "Variação excluída" -> "Técnica excluída"
- Linha 201: Título "Variações: {serviceName}" -> "Técnicas: {serviceName}"
- Linha 215: Botão "Nova Variação" -> "Nova Técnica"
- Linha 222: Label "Nome da Variação" -> "Nome da Técnica"
- Linha 261: Empty state "Nenhuma variação cadastrada" -> "Nenhuma técnica cadastrada"
- Linha 263: Descrição exemplos
- Linha 359: Alert title "Excluir Variação?" -> "Excluir Técnica?"
- Linha 361: Alert description sobre SKUs -> "Opções vinculadas a esta técnica..."

## Resumo das Mudanças de Terminologia

| Termo Técnico (DB)       | Termo na UI (Novo)  |
|--------------------------|---------------------|
| `service_variations`     | **Técnicas**        |
| `service_skus`           | **Opções**          |
| Variação                 | Técnica             |
| SKU                      | Opção               |

## O que NÃO muda
- Nomes das tabelas no banco: `service_variations`, `service_skus`
- Query keys do React Query
- Nomes de variáveis e interfaces no código TypeScript
- IDs dos tabs (mantém `skus` internamente)
- Nenhum impacto no fluxo de booking ou em páginas públicas

## Risco
**Zero** - Mudança puramente cosmética, sem alteração de lógica ou banco de dados.
