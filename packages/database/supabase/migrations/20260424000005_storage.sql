-- =========================================================
-- Storage buckets para fotos
-- =========================================================

insert into storage.buckets (id, name, public)
values
  ('avatars',         'avatars',         true),
  ('supplier-logos',  'supplier-logos',  true),
  ('supplier-covers', 'supplier-covers', true),
  ('product-photos',  'product-photos',  true),
  ('review-photos',   'review-photos',   true)
on conflict (id) do nothing;

-- Políticas Storage
-- avatars: dono escreve, mundo lê
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_owner_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- product-photos: membros do fornecedor escrevem; mundo lê
create policy "product_photos_public_read" on storage.objects
  for select using (bucket_id = 'product-photos');

create policy "product_photos_supplier_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-photos'
    and exists (
      select 1 from public.supplier_users
      where supplier_users.user_id = auth.uid()
        and supplier_users.supplier_id::text = (storage.foldername(name))[1]
    )
  );

create policy "product_photos_supplier_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-photos'
    and exists (
      select 1 from public.supplier_users
      where supplier_users.user_id = auth.uid()
        and supplier_users.supplier_id::text = (storage.foldername(name))[1]
    )
  );

create policy "product_photos_supplier_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-photos'
    and exists (
      select 1 from public.supplier_users
      where supplier_users.user_id = auth.uid()
        and supplier_users.supplier_id::text = (storage.foldername(name))[1]
    )
  );

-- supplier-logos / supplier-covers: mesmas regras de product-photos
create policy "supplier_logos_public_read" on storage.objects
  for select using (bucket_id = 'supplier-logos');

create policy "supplier_logos_member_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'supplier-logos'
    and exists (
      select 1 from public.supplier_users
      where supplier_users.user_id = auth.uid()
        and supplier_users.supplier_id::text = (storage.foldername(name))[1]
    )
  );

create policy "supplier_covers_public_read" on storage.objects
  for select using (bucket_id = 'supplier-covers');

create policy "supplier_covers_member_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'supplier-covers'
    and exists (
      select 1 from public.supplier_users
      where supplier_users.user_id = auth.uid()
        and supplier_users.supplier_id::text = (storage.foldername(name))[1]
    )
  );

-- review-photos: cliente que fez a review pode subir
create policy "review_photos_public_read" on storage.objects
  for select using (bucket_id = 'review-photos');

create policy "review_photos_owner_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
