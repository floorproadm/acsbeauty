

## Plano: Formulário simplificado + convite WhatsApp

### O que muda

1. **Formulário de criação simplificado** — apenas Nome e Telefone (obrigatórios)
2. **Tela de sucesso com botão WhatsApp** — após criar, mostra botão para enviar convite pré-pronto para o cliente completar o cadastro (email, aniversário, senha)

### Fluxo

```text
Admin clica "Novo Cliente"
  → Preenche: Nome, Telefone
  → Clica "Criar"
  → Modal muda para tela de sucesso:
     ✅ "Cliente criado!"
     [📱 Enviar convite via WhatsApp]
     [Fechar]
```

### Mensagem WhatsApp

> Olá {nome}! 👋 Seu cadastro na ACS Beauty foi iniciado. Complete seu perfil para agendar online: {link_registro}

### Arquivo alterado

| Arquivo | Mudança |
|---|---|
| `src/components/admin/ClientEditModal.tsx` | No modo criação: mostrar só Nome + Telefone; após sucesso, renderizar tela com botão WhatsApp (wa.me link) em vez de fechar o modal |

### Detalhes técnicos

- Campos no modo criação: `name` (obrigatório), `phone` (obrigatório). Remover email, instagram e aniversário do formulário de criação
- Modo edição permanece inalterado (todos os campos)
- Estado `showSuccess` + `createdPhone` / `createdName` para montar o link WhatsApp após insert
- Link: `https://wa.me/55{phone}?text={mensagem_encoded}` com URL de registro `https://acsbeauty.lovable.app/auth`
- Botão "Fechar" reseta o estado e fecha o modal

