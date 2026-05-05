## Problema

Após o login, todas as requisições ao catálogo retornam **403 — `permission denied for function has_role`**. As políticas de RLS de `categories`, `products`, `product_variants`, `shipping_rates` e `orders` chamam a função `public.has_role(...)`, mas os papéis `anon` e `authenticated` não têm permissão de `EXECUTE` nela. Como toda a avaliação da policy falha, o PostgREST devolve 403 e o site mostra "Nenhum produto encontrado". O painel admin também fica vazio pelo mesmo motivo.

Isso é um problema de **GRANT** na função, não de RLS nem de dados — os 12 produtos e 7 categorias continuam no banco.

## Correção (1 migração SQL)

Conceder execução da função aos papéis anônimo e autenticado:

```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  TO anon, authenticated;
```

Isso restaura imediatamente:
- Listagem pública de categorias, produtos e fretes
- Visibilidade do admin (CRUD de produtos/categorias/fretes/pedidos)
- Histórico de pedidos do cliente em `/conta`

Nenhuma alteração de código de frontend é necessária — as queries já estão corretas.

## Verificação após aplicar

1. Recarregar `/produtos` (deslogado) → 12 produtos aparecem
2. Logar como `reginaldo@artpersonalizados.com` → menu **Admin** disponível
3. Em `/admin/produtos` → lista completa com botões editar/excluir/novo
