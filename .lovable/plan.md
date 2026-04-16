

# Review Request Page — ACS Beauty Studio

## Overview
Criar uma página `/review` inspirada no modelo do AXO OS, adaptada para o contexto de beleza/estética do ACS Beauty Studio. A página será enviada para clientes após serviços concluídos, incentivando reviews no Google e compartilhamento de fotos.

## Estrutura da Página (5 seções)

### 1. Hero — Agradecimento pessoal
- Badge "Serviço Concluído" com estética editorial (Playfair Display)
- Título: "Obrigada por Escolher o ACS Beauty Studio"
- Nota pessoal da Ane Caroline com tom emocional e foto/avatar
- Paleta nude/champagne/bronze do brand

### 2. Cards de Plataformas
- **Google** (destaque principal com badge "Preferred") — link direto para review
- **Instagram** — tag @acsbeautystudio para stories/posts
- Layout 2 colunas no desktop, stack no mobile

### 3. Passo a Passo — Como deixar um review no Google
- 4 steps visuais numerados com ícones
- Instruções claras e simples

### 4. Gerador de Draft de Review
- Dropdowns: Tipo de Serviço (Hair, Brows, Nails) e Destaque (Qualidade, Ambiente, Atendimento, Transformação)
- Campos opcionais: Nome e Cidade
- Preview em tempo real do texto gerado
- Botões: "Copiar Texto" + "Abrir Google Review"
- Templates em inglês (mercado US)

### 5. Compartilhe Suas Fotos
- Card WhatsApp — enviar before & after para o número do estúdio
- Card Instagram — tag @acsbeautystudio
- Seção final com CTA para contato direto (telefone/texto)

## Adaptações vs AXO OS
| AXO OS | ACS Beauty |
|--------|------------|
| Flooring services | Hair, Brows, Nails |
| Eduardo (founder) | Ane Caroline (founder) |
| Houzz/Facebook | Instagram (mais relevante para beauty) |
| Referral program link | Link para /portal ou /onboarding |
| English only | Bilíngue PT/EN via LanguageContext |

## Implementação Técnica

### Arquivo novo
- `src/pages/ReviewRequest.tsx` — página completa, sem dependência de banco

### Rota
- Adicionar `/review` no `App.tsx` (pública, sem auth)

### Configurações
- `GOOGLE_REVIEW_URL` — link direto do Google Business Profile do ACS
- `INSTAGRAM_HANDLE` — @acsbeautystudio  
- `PHONE` — (732) 915-3430
- ScrollReveal com IntersectionObserver (mesmo pattern do AXO)
- Bilíngue com `useLanguage()` hook

### Sem mudanças no banco de dados
Página 100% estática/client-side, sem tabelas novas.

## Pergunta necessária
Preciso do link direto do Google Review do ACS Beauty Studio (formato `https://g.page/r/...`). Se não tiver, posso deixar um placeholder configurável.

