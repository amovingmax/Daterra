-- =========================================================
-- price_cents opcional em produtos (preenchido pelo fornecedor antes de ativar)
-- =========================================================
-- Mesmo padrão do CNPJ: importer do scraper traz produtos sem preço,
-- e o supplier admin define o valor antes de ativar pra venda.

alter table public.products alter column price_cents drop not null;

alter table public.products drop constraint if exists products_price_cents_check;
alter table public.products
  add constraint products_price_cents_check
  check (price_cents is null or price_cents > 0);

alter table public.products
  add constraint products_active_requires_price
  check (not is_active or price_cents is not null);
