
Objetivo: fazer a hero da página `/hub` realmente parecer mais próxima da mulher.

Diagnóstico rápido:
- Hoje a imagem só está sendo reposicionada com `objectPosition`, mas isso não “aproxima” de verdade.
- Para o efeito que você pediu, precisa aplicar zoom/crop real na imagem, não só mudar o enquadramento.

Implementação proposta:
1. Ajustar `src/pages/Links.tsx` na hero image.
2. Manter o container atual, mas aumentar visualmente a foto com escala (`transform: scale(...)`) para aproximar mais o rosto/corpo.
3. Refinar junto o `object-position` para centralizar melhor a mulher depois do zoom e evitar:
   - espaço vazio excessivo no topo
   - corte ruim na cabeça
   - logo cobrindo áreas importantes
4. Preservar o restante do layout do `/hub` como está hoje: logo, gradiente, botões e animações.

Ajuste técnico que pretendo fazer:
- Trocar a abordagem de “só mexer no `objectPosition`” por uma combinação de:
  - `object-cover`
  - escala maior na imagem
  - novo `objectPosition` calibrado para mobile
- O ajuste será feito no bloco:
  - `src/pages/Links.tsx`
  - seção da hero (`aneHero`)

Resultado esperado:
- a mulher fica visualmente mais próxima
- menos “respiro” vazio no topo
- enquadramento mais parecido com o que você vem marcando nos prints
- página continua elegante, sem exagerar no zoom

Validação depois da implementação:
- conferir no viewport mobile do `/hub`
- confirmar que a mulher ocupa mais da área visível
- confirmar que o rosto não foi cortado e que o logo continua equilibrado

Arquivo a alterar:
- `src/pages/Links.tsx`
