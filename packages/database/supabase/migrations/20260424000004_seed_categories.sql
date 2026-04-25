-- =========================================================
-- Seed: categorias do programa Feito Potiguar
-- =========================================================

insert into public.categories (slug, label, icon, parent_slug, sort_order) values
  ('alimentos-naturais',    'Alimentos Naturais',     '🥜', null, 10),
  ('alimentos-prontos',     'Alimentos Prontos',      '🍽️', null, 20),
  ('bebidas',               'Bebidas',                '🍷', null, 30),
  ('conservas',             'Conservas',              '🥫', null, 40),
  ('doces-e-temperos',      'Doces e Temperos',       '🍯', null, 50),
  ('origem-animal',         'Origem Animal',          '🧀', null, 60),
  ('bares-e-restaurantes',  'Bares e Restaurantes',   '🍴', null, 70),
  ('hospedagem',            'Hospedagem',             '🏨', null, 80)
on conflict (slug) do nothing;

insert into public.categories (slug, label, parent_slug, sort_order) values
  ('granolas',              'Granolas',               'alimentos-naturais', 1),
  ('castanhas',             'Castanhas',              'alimentos-naturais', 2),
  ('farinhas',              'Farinhas',               'alimentos-naturais', 3),

  ('queijos',               'Queijos',                'origem-animal', 1),
  ('iogurtes',              'Iogurtes',               'origem-animal', 2),
  ('carnes',                'Carnes',                 'origem-animal', 3),
  ('mel',                   'Mel',                    'origem-animal', 4),

  ('geleias',               'Geleias',                'doces-e-temperos', 1),
  ('doces',                 'Doces',                  'doces-e-temperos', 2),
  ('rapaduras',             'Rapaduras',              'doces-e-temperos', 3),
  ('pimentas',              'Pimentas',               'doces-e-temperos', 4),

  ('sucos',                 'Sucos',                  'bebidas', 1),
  ('cervejas-artesanais',   'Cervejas artesanais',    'bebidas', 2),
  ('cachacas',              'Cachaças',               'bebidas', 3),
  ('cafe',                  'Café',                   'bebidas', 4),

  ('picles',                'Picles',                 'conservas', 1),
  ('compotas',              'Compotas',               'conservas', 2),

  ('tapiocas',              'Tapiocas',               'alimentos-prontos', 1),
  ('pratos-congelados',     'Pratos prontos congelados', 'alimentos-prontos', 2)
on conflict (slug) do nothing;
