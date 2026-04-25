-- =========================================================
-- products.is_active passa a ser default FALSE
-- =========================================================
-- Motivo: produtos importados pelo scraper começam sem preço (null).
-- Como temos a constraint products_active_requires_price (ativo precisa
-- ter preço), o default true geraria erro no INSERT do importer.
--
-- Importante: isso não afeta linhas existentes — o default só vale para
-- INSERTs futuros que não especifiquem is_active.

alter table public.products alter column is_active set default false;
