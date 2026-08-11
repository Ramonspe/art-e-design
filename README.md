# Art & Design

Aplicação web da Art & Design para catálogo de produtos personalizados, carrinho,
autenticação, área do cliente, administração e checkout com Mercado Pago.

## Tecnologias

- React 18, TypeScript e Vite
- Tailwind CSS e shadcn/ui
- Supabase Auth, Postgres, Storage e Edge Functions
- Mercado Pago Checkout Pro
- Vitest e Testing Library
- MCP da Lovable para consulta de produtos e pedidos

## Pré-requisitos

- Node.js 22 ou mais recente
- npm 10 ou mais recente
- Supabase CLI para desenvolver ou publicar Edge Functions localmente

O projeto usa exclusivamente npm. O `package-lock.json` é a fonte de verdade das
dependências.

## Configuração local

```bash
git clone https://github.com/Ramonspe/art-e-design.git
cd art-e-design
npm ci
cp .env.example .env
npm run dev
```

No PowerShell, copie o arquivo de ambiente com:

```powershell
Copy-Item .env.example .env
```

Preencha o `.env` local com as configurações públicas do projeto Supabase:

| Variável | Uso |
| --- | --- |
| `VITE_SUPABASE_PROJECT_ID` | Identificador público do projeto |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável usada pelo navegador |
| `VITE_SUPABASE_URL` | URL pública da API Supabase |

Variáveis com prefixo `VITE_` são incorporadas ao bundle do navegador e nunca
devem conter segredos.

## Segredos do servidor

As Edge Functions usam variáveis configuradas no Supabase/Lovable Cloud, não no
`.env` do frontend:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `SITE_URL` (URL pública final da loja, usada no retorno do pagamento)
- `RESEND_API_KEY` (chave do Resend para e-mails transacionais)
- `RESEND_FROM_EMAIL` (remetente verificado no Resend, por exemplo `pedidos@seudominio.com.br`)
- `SUPERFRETE_TOKEN` (token do ambiente de Sandbox ou Produção)
- `SUPERFRETE_BASE_URL` (`https://sandbox.superfrete.com` nos testes e `https://api.superfrete.com` em produção)
- `SUPERFRETE_ORIGIN_POSTAL_CODE` (CEP de origem com oito dígitos)
- `SUPERFRETE_USER_AGENT` (nome, versão e e-mail técnico da loja)
- `SUPERFRETE_SERVICES` (opcional; padrão `1,2,17,3,33`)
- `SUPERFRETE_USE_INSURANCE` (opcional; use `false` para não cotar seguro)
- `SUPERFRETE_SENDER_NAME`, `SUPERFRETE_SENDER_ADDRESS`, `SUPERFRETE_SENDER_NUMBER`, `SUPERFRETE_SENDER_DISTRICT`, `SUPERFRETE_SENDER_CITY`, `SUPERFRETE_SENDER_STATE` e `SUPERFRETE_SENDER_DOCUMENT` (dados do remetente da etiqueta)
- `SUPERFRETE_SENDER_COMPLEMENT` (opcional)

Nunca registre valores reais dessas variáveis no Git.

## Conta do cliente

Os consentimentos para atualizações de pedidos e para promoções são registrados
separadamente no perfil. O checkout de um usuário autenticado atualiza os dados
do perfil e o endereço padrão para reutilização em compras futuras.

O menu do perfil separa **Minha conta** (`/conta`) de **Meus pedidos**
(`/meus-pedidos`), abrindo ao passar o mouse no desktop e ao tocar no ícone
em dispositivos móveis. No painel administrativo, apenas pedidos com status
`cancelado` podem ser excluídos, pela Edge Function `delete-cancelled-order`.
Ao publicar uma alteração dessa função, publique também as Edge Functions no
Lovable Cloud; o deploy do frontend no Cloudflare Pages não publica funções.
Os pedidos do painel administrativo são exibidos em tabela e mostram os dados
completos ao selecionar **Detalhes**; a notificação de item adicionado aparece
no canto inferior esquerdo e pode ser fechada manualmente.

## Frete pela SuperFrete

O frete é cotado no checkout pela Edge Function `quote-superfrete`. O navegador
nunca recebe o token da SuperFrete: ele envia apenas o CEP e os itens do carrinho,
e o servidor valida produtos, estoque, peso e dimensões antes de cotar.

Todo produto ativo deve ter peso em quilogramas e altura, largura e comprimento
em centímetros cadastrados no painel administrativo. Após o Mercado Pago aprovar
o pedido, o webhook cria uma etiqueta pendente na SuperFrete. A emissão/pagamento
da etiqueta é feita no painel da SuperFrete com o saldo ou cartão da loja.

Antes de publicar, aplique a migration mais recente, configure os segredos no
Supabase e valide uma compra completa usando `SUPERFRETE_BASE_URL` apontando para
o Sandbox. Etiquetas do Sandbox não podem ser postadas.

## Notificações de pedidos

O protocolo exibido para o cliente é o número do pedido. A loja envia e-mails na
criação do pedido, na aprovação do pagamento e a cada mudança de status feita
no painel administrativo. Para habilitar o envio em produção, configure
`RESEND_API_KEY` e `RESEND_FROM_EMAIL` como segredos das Edge Functions. Sem
essas variáveis, o pedido continua funcionando, mas o envio de e-mails é pulado.

Após clicar em pagar, o cliente é direcionado ao Mercado Pago e retorna para a
tela de acompanhamento do pedido. O carrinho só é limpo quando o webhook
confirma o pagamento como aprovado; antes disso, a tela informa que a confirmação
está pendente e exibe o protocolo.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o servidor local na porta 8080 |
| `npm run lint` | Executa as regras de qualidade do código |
| `npm run typecheck` | Valida os tipos TypeScript |
| `npm test` | Executa os testes uma vez |
| `npm run test:watch` | Executa os testes em modo interativo |
| `npm run build` | Gera o bundle de produção em `dist/` |
| `npm run check` | Executa lint, tipos, testes e build |

## Estrutura

```text
src/
  components/       componentes compartilhados e shadcn/ui
  contexts/         autenticação e carrinho
  data/             catálogo e dados institucionais
  integrations/     clientes Supabase e Lovable
  lib/              regras de negócio e servidor MCP
  pages/            páginas e fluxos da aplicação
supabase/
  functions/        Edge Functions, checkout, webhook e MCP
  migrations/       histórico versionado do banco de dados
```

`supabase/functions/mcp/index.ts` é gerado a partir de `src/lib/mcp/`. Não edite
o arquivo gerado manualmente. Devido a uma incompatibilidade do gerador MCP
0.25 com caminhos absolutos do Windows, a geração automática fica desativada no
Windows e continua ativa nos builds Linux e no Lovable.

## Fluxo de desenvolvimento

1. Atualize a `main`.
2. Crie uma branch curta para uma única entrega.
3. Execute `npm run check`.
4. Revise o diff e abra um pull request.
5. Faça merge na `main` somente depois da CI.

O GitHub é a fonte de verdade. O Lovable sincroniza a branch padrão; portanto,
evite editar os mesmos arquivos simultaneamente no Lovable e em uma branch
local.

Consulte também o [AGENTS.md](./AGENTS.md) para as convenções usadas pelo Codex.
