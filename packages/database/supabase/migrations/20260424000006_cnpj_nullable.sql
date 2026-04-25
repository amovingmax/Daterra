-- =========================================================
-- CNPJ opcional (preenchido apenas quando fornecedor for ativado)
-- =========================================================
-- Motivação: o scraper do feitopotiguar.com.br não tem CNPJ dos
-- fornecedores. Precisamos importá-los como inativos e o admin
-- preenche o CNPJ antes de ativar pra venda.

alter table public.suppliers alter column cnpj drop not null;

-- A check constraint original exigia CNPJ; agora permite null.
alter table public.suppliers drop constraint if exists suppliers_cnpj_check;
alter table public.suppliers
  add constraint suppliers_cnpj_check
  check (cnpj is null or cnpj ~ '^\d{14}$');

-- Constraint funcional: fornecedor ativo OBRIGATORIAMENTE tem CNPJ.
alter table public.suppliers
  add constraint suppliers_active_requires_cnpj
  check (not is_active or cnpj is not null);
