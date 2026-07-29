# Orientações do repositório

## Contexto

- Este repositório contém a loja virtual da Art & Design.
- A interface e as mensagens para clientes devem permanecer em português do Brasil.
- O GitHub é a fonte de verdade; o Lovable é um editor complementar.

## Ambiente e dependências

- Use Node.js 22 ou superior e npm.
- Não adicione `bun.lockb`, `yarn.lock` ou outro gerenciador sem decisão explícita.
- Preserve o `package-lock.json` sincronizado com o `package.json`.
- Antes de entregar, execute `npm run check`.

## Código e testes

- Prefira alterações pequenas, tipadas e cobertas por testes de comportamento.
- Não introduza novos `any`; os existentes são dívida técnica sinalizada pelo lint.
- Atualize ou crie testes quando uma regra de negócio mudar.
- Não edite manualmente componentes gerados sem necessidade.
- `supabase/functions/mcp/index.ts` é gerado a partir de `src/lib/mcp/`.
- O gerador MCP fica desativado no Windows devido a um problema de caminhos do SDK
  0.25; use Linux, WSL ou Lovable para regenerar o arquivo.

## Supabase e pagamentos

- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY`, tokens do Mercado Pago ou segredos de
  webhook em código cliente, logs, testes ou arquivos versionados.
- Variáveis `VITE_*` são públicas por definição.
- Trate migrations publicadas como append-only; crie uma nova migration para
  correções em vez de alterar o histórico aplicado.
- Preserve as políticas RLS e recalcule valores sensíveis do checkout no servidor.
- Mudanças em checkout, webhook ou status de pedidos exigem testes direcionados e
  revisão de segurança.

## Git e GitHub

- Trabalhe em branch própria e abra pull request para a `main`.
- Use commits pequenos no padrão Conventional Commits.
- O autor dos commits deve ser `Ramon Santos Pereira`, associado à conta
  `Ramonspe`.
- Não adicione trailers `Co-authored-by` de IA, Claude, Lovable ou bots.
- Não force push em branches compartilhadas, exceto em uma manutenção de histórico
  explicitamente autorizada e protegida por backup.
- Enquanto uma branch estiver aberta, evite alterações concorrentes nos mesmos
  arquivos pelo Lovable.
