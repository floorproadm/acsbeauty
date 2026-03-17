

## Plano: Serviços clicáveis com dupla ação

### Ideia
Ao clicar em cada serviço (Highlights, Hair Extensions, Brazilian Keratin), duas coisas acontecem:
1. Abre o WhatsApp da Ane com mensagem pré-pronta sobre aquele serviço específico
2. Opcionalmente, um link para `/services` fica disponível como ação secundária

### Recomendação
Fazer as duas ações ao mesmo tempo (navegar + abrir WhatsApp) pode confundir o usuário. Sugiro:
- **Ação principal (clique):** Abre WhatsApp com mensagem personalizada por serviço (ex: "Olá Ane! Tenho interesse em Highlights. Gostaria de saber mais!")
- **Ação secundária:** Adicionar um pequeno texto/link abaixo da lista tipo "Ver todos os serviços →" que leva para `/services`

### Mudanças em `src/pages/AneCaroline.tsx`

1. Transformar cada item de serviço em um `<a>` clicável que abre WhatsApp com mensagem pré-pronta específica do serviço
2. Adicionar um link "Ver todos os serviços" abaixo da lista que navega para `/services` usando React Router
3. Cada serviço envia mensagem tipo: `"Olá Ane! Vi seu perfil e tenho interesse em {serviço}. Gostaria de saber mais e agendar!"`

### Estrutura visual
- Cada item ganha `cursor-pointer` e hover sutil
- Abaixo dos 3 serviços, antes do botão "Entrar em contato", um link discreto para `/services`
- Mantém o design atual, apenas torna os itens interativos

