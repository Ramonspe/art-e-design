# Ajustes finais — Logo, WhatsApp e Pagamentos

## 1. Troca da logo

A logo atual é um quadrado dourado com as letras "A&P". Será substituída pela imagem enviada (símbolo entrelaçado em tons de marrom/dourado).

- Copiar `user-uploads://WhatsApp_Image_2026-05-02_at_16.04.44.jpeg` para `src/assets/logo.png`.
- Atualizar `src/components/layout/Header.tsx` (linhas 30-38): trocar o `<div>` "A&P" por `<img src={logo} alt="Art & Personalizados" className="h-12 w-12 object-contain" />`.
- Atualizar `src/components/layout/Footer.tsx` (linha 10): mesma substituição.
- Atualizar `index.html` (favicon e og:image) para apontar para `/logo.png` (também copiar em `public/logo.png`).

## 2. Correção do link do WhatsApp

O número `+55 (11) 9 9286-2300` está correto em `src/data/contact.ts` (`5511992862300`). O problema mais comum com `wa.me` é bloqueio em alguns navegadores/ambientes embutidos e falta de fallback.

Correções:
- Trocar a base do link de `https://wa.me/<num>` para `https://api.whatsapp.com/send?phone=<num>&text=...` em `src/data/contact.ts` (função `waLink`) — formato mais confiável e que funciona dentro de iframes e webviews.
- Padronizar o uso de `waLink()` em todos os pontos que ainda montam o URL na mão:
  - `src/pages/Personalizado.tsx` linhas 42 e 118
- Garantir `target="_blank"` e `rel="noreferrer"` em todos os links (já está, mas será revisado).
- No `WhatsAppFloat`, manter o botão flutuante igual.

## 3. Pagamentos online (Pix, Cartão, Boleto)

A forma recomendada pela Lovable é a **integração nativa de pagamentos via Stripe** (sem precisar criar conta Stripe própria — a Lovable provisiona). O Stripe no Brasil suporta **Cartão, Pix e Boleto** nativamente.

Passos (executados na fase de implementação, após aprovação):

1. Rodar `recommend_payment_provider` para validar elegibilidade do catálogo (gráfica/personalizados é digital+físico — provavelmente recomenda Stripe).
2. Habilitar Stripe via `enable_stripe_payments` (cria ambiente de teste imediatamente; ativação real exige verificação posterior pelo dono do negócio).
3. Cadastrar os produtos atuais no Stripe via `batch_create_product` (espelhando preços da tabela `products`).
4. Criar uma Edge Function `create-checkout` que:
   - recebe o carrinho + dados do cliente + frete já calculado;
   - cria uma `Checkout Session` no Stripe com `payment_method_types: ['card','pix','boleto']`, modo `payment`, success/cancel URLs;
   - antes de redirecionar, grava o pedido em `orders` com `status='aguardando_pagamento'` e guarda o `stripe_session_id`.
5. Criar Edge Function `stripe-webhook` que escuta `checkout.session.completed` / `payment_intent.succeeded` / `.failed` e atualiza o `status` do pedido para `pago` / `falhou`.
6. Atualizar `src/pages/Checkout.tsx`:
   - Manter os 3 métodos visuais (Pix / Cartão / Boleto), mas em vez de só "registrar pedido", chamar a Edge Function e redirecionar para o Stripe Checkout.
   - Manter a opção "concluir manualmente" como fallback se o Stripe ainda estiver em modo teste.
7. Adicionar página `/pedido/sucesso` e `/pedido/cancelado` para retornos do Stripe.
8. Migração SQL: adicionar colunas `stripe_session_id text`, `stripe_payment_intent text`, `paid_at timestamptz` em `orders`, e o status `aguardando_pagamento`/`pago`/`falhou` no enum `order_status`.

### Notas

- Pix e Boleto via Stripe têm fluxo assíncrono — o cliente vê o QR code/boleto na própria página do Stripe; o webhook confirma quando o pagamento cai.
- Para ativar pagamentos **reais** (sair do modo teste), o dono precisará completar a verificação da conta Stripe via painel Lovable Cloud → Pagamentos. Será explicado no momento da entrega.
- Pagamentos exigem plano **Pro ou superior** na Lovable.

## Resumo de arquivos a tocar

- `src/assets/logo.png` (novo), `public/logo.png` (novo)
- `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`
- `index.html`
- `src/data/contact.ts`
- `src/pages/Personalizado.tsx`
- `src/pages/Checkout.tsx`, novas páginas `OrderSuccess.tsx` / `OrderCancel.tsx`
- `src/App.tsx` (novas rotas)
- Nova migração SQL em `supabase/migrations/`
- Novas Edge Functions: `supabase/functions/create-checkout/`, `supabase/functions/stripe-webhook/`
