## Integração Mercado Pago (Checkout Pro) + remoção do frete grátis

### Parte 1 — Pagamentos via Mercado Pago

**Fluxo escolhido:** Checkout Pro (redirect). Cliente finaliza no site do Mercado Pago e volta para `/pedido/sucesso` ou `/pedido/cancelado`. Métodos: Pix, Cartão (até 3x sem juros) e Boleto.

**Credenciais necessárias** (você vai gerar em mercadopago.com.br → Suas integrações → Criar aplicação):
- `MERCADOPAGO_ACCESS_TOKEN` (começa com `APP_USR-...` em produção ou `TEST-...` em testes)
- `MERCADOPAGO_WEBHOOK_SECRET` (gerado na aba Webhooks da aplicação, usado para validar assinatura)

Vou pedir esses dois via o formulário seguro de secrets depois que você aprovar o plano.

**Banco de dados — migração nova em `orders`:**
- `mp_preference_id text` — ID da preferência criada
- `mp_payment_id text` — ID do pagamento após aprovação
- `paid_at timestamptz`
- Ampliar valores aceitos em `status` para: `aguardando_pagamento`, `pago`, `falhou`, `cancelado`

**Edge Functions (Lovable Cloud):**
1. `create-mp-preference` — recebe carrinho + dados do cliente + frete, grava `orders` com `status='aguardando_pagamento'`, cria a preferência no Mercado Pago com:
   - `items` (produtos do carrinho)
   - `payer` (nome, e-mail, CPF, endereço)
   - `payment_methods.installments: 3`, `default_installments: 1` (até 3x sem juros)
   - `payment_methods.excluded_payment_types`: nenhum (libera Pix/cartão/boleto)
   - `back_urls` para `/pedido/sucesso` e `/pedido/cancelado`
   - `auto_return: 'approved'`
   - `notification_url` apontando para a função de webhook
   - `external_reference` = `order_id`
   - Retorna `init_point` (URL de redirect)
2. `mp-webhook` — recebe notificações `payment.created/updated`, valida assinatura `x-signature`, busca o pagamento na API do MP, atualiza `orders` (`status`, `mp_payment_id`, `paid_at`).

Ambas com `verify_jwt = false` (webhook precisa ser público; create-preference é chamado do front com validação de payload via Zod).

**Frontend:**
- `src/pages/Checkout.tsx`: substituir o registro local por chamada a `create-mp-preference` via `supabase.functions.invoke`, e redirecionar `window.location = init_point`. Remover seleção manual de método (o MP mostra todos) ou manter só como informativo.
- Novas páginas `src/pages/OrderSuccess.tsx` e `src/pages/OrderCancel.tsx`, rotas adicionadas em `src/App.tsx` (`/pedido/sucesso`, `/pedido/cancelado`). Sucesso lê `external_reference` da query e mostra resumo do pedido.
- `src/pages/Account.tsx`: exibir o `status` traduzido (Aguardando pagamento / Pago / Cancelado).

### Parte 2 — Remoção do frete grátis (R$ 199)

Remover toda a lógica e UI da promoção:
- Deletar `src/lib/freeShipping.ts`.
- `src/lib/shipping.ts`: remover qualquer ramo que zera frete por subtotal.
- `src/pages/Cart.tsx` e `src/pages/Checkout.tsx`: remover banners, `Progress` e mensagens "Faltam R$XX..." / "FRETE GRÁTIS / Grande SP".
- `src/components/layout/Header.tsx`: remover/substituir o banner topo que anuncia frete grátis.
- `src/data/contact.ts` e demais textos: remover menções a R$ 199 / frete grátis.

### Parte 3 — Verificação

Após implementação:
- Testar fluxo em modo sandbox do MP (com `TEST-` token) usando cartões de teste do MP.
- Conferir que o webhook atualiza o pedido (`supabase--edge_function_logs`).
- Conferir que nenhum componente ainda referencia frete grátis (`rg "frete grátis|199|freeShipping"`).

### Observações importantes

- "Até 3x sem juros" no Checkout Pro do MP exige que **você (vendedor) absorva o custo do parcelamento** na configuração da sua conta Mercado Pago (Cobranças → Parcelamento sem juros). A função envia `installments: 3`; o "sem juros" é configurado uma vez na sua conta MP — vou te lembrar disso na entrega.
- Para ativar produção, basta trocar o `MERCADOPAGO_ACCESS_TOKEN` de teste pelo de produção (mesmo nome de secret).
- Mercado Pago não tem connector nativo na Lovable, por isso usamos BYOK via secrets — é o caminho oficial e seguro.

### Arquivos tocados (resumo)

- Novos: `supabase/functions/create-mp-preference/index.ts`, `supabase/functions/mp-webhook/index.ts`, `supabase/migrations/<novo>.sql`, `src/pages/OrderSuccess.tsx`, `src/pages/OrderCancel.tsx`
- Editados: `src/pages/Checkout.tsx`, `src/pages/Cart.tsx`, `src/pages/Account.tsx`, `src/App.tsx`, `src/components/layout/Header.tsx`, `src/lib/shipping.ts`, `src/data/contact.ts`
- Removidos: `src/lib/freeShipping.ts`
