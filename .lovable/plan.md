

## Adicionar suporte a vídeo nos serviços

A Ane vai poder anexar um vídeo curto em cada serviço (igual ela faz no Notion), e os clientes verão o vídeo na página pública do serviço, junto com a foto.

### O que vamos adicionar

**1. Banco de dados** — nova coluna `hero_video_url` (text, nullable) na tabela `services`. Aditiva, sem afetar nada existente.

**2. Admin → Editar Serviço**
- Novo campo "Vídeo do Serviço" abaixo do campo "Foto do Serviço"
- Componente `ServiceVideoUpload` (espelha o `ServiceImageUpload`):
  - Drag-and-drop ou clique para enviar
  - Aceita MP4, MOV, WebM até **50MB** (limite seguro para web)
  - Preview inline com player nativo (`<video controls muted>`)
  - Botão para trocar/remover
  - Validação de tipo e tamanho
- Upload vai para o bucket `service-images` (já público, já aceita qualquer mime). Ficam organizados em prefixo `videos/` para clareza.

**3. Página pública do serviço** (`/servicos/:categoria/:slug`)
- Se o serviço tem vídeo: o hero exibe o **vídeo** no lugar da foto (com `controls`, `playsInline`, `preload="metadata"`, opção de poster usando `hero_image_url` como thumbnail enquanto carrega)
- Se só tem foto: comportamento atual (foto)
- Se tem ambos: vídeo no hero + foto pode ficar como poster do player
- Aspect-ratio mantido (4:3 mobile / square desktop) para não quebrar layout

**4. Onde mais o vídeo aparece**
- **Card de categoria** (`/servicos/cabelo` etc): mantém só foto/ícone — vídeo só na página de detalhe (evita autoplay em listas)
- **Portal do cliente** (seleção de serviços): mantém só foto — manter leve
- **Admin → lista de serviços**: badge sutil "🎬" ao lado do nome quando tem vídeo, para a Ane saber rapidamente quais já têm

### Detalhes técnicos

- Migration aditiva: `ALTER TABLE services ADD COLUMN hero_video_url TEXT;`
- Reutiliza bucket `service-images` (público, sem mime restriction confirmado)
- Sem migração de dados — colunas novas começam null
- `ServiceVideoUpload.tsx` novo componente, `ServiceImageUpload.tsx` intocado
- `ServicesTab.tsx`: adicionar campo no form + estado + select query inclui `hero_video_url`
- `ServiceDetail.tsx`: condicional render vídeo > imagem no hero

### Considerações

- **Tamanho 50MB**: vídeos curtos de salão (10-30s em vertical, comprimidos pelo iPhone) tipicamente ficam 5-25MB. 50MB cobre com folga sem deixar a página pesada.
- **Sem autoplay**: para boa UX e respeitar políticas de browsers, o vídeo aparece com botão de play (não toca sozinho).
- **Mobile-friendly**: `playsInline` evita que iOS abra em tela cheia automaticamente.

