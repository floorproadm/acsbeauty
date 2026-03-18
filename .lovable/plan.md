

## Problema

Quando o usuario clica em "Agendar Horario" no home, vai para `/portal`, que redireciona para `/auth` se nao tem sessao. Na pagina `/auth` nao existe nenhum botao ou link para voltar ao site principal — o usuario fica preso.

## Correcao

### Arquivo: `src/pages/Auth.tsx`

Adicionar um botao de voltar (seta ou link "Voltar ao site") no header do card de login, ao lado do logo. Esse botao navega para `/` (home).

- No modo **login**: mostrar botao de voltar ao lado do logo ACS que faz `navigate("/")`
- No modo **register**: o botao de voltar ja existe e muda para login — manter esse comportamento

Implementacao simples: no bloco onde ja tem o `ArrowLeft` condicional para `mode === "register"`, adicionar tambem para `mode === "login"` mas com destino `/` em vez de trocar o mode.

```tsx
// Logica atualizada:
{mode === "register" ? (
  <button onClick={() => setMode("login")} ...>
    <ArrowLeft />
  </button>
) : (
  <button onClick={() => navigate("/")} ...>
    <ArrowLeft />
  </button>
)}
```

Resultado: o usuario sempre consegue voltar — no login volta ao site, no registro volta ao login.

