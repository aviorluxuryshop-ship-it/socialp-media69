-- StudyFlow — ilk şema.
-- Tek tablo (records) + özel depolama kovası (uploads). Her satır yalnızca sahibine görünür (RLS).
-- Supabase SQL editöründe veya `supabase db push` ile uygulanır.

create table if not exists public.records (
  user_id     uuid   not null default auth.uid() references auth.users (id) on delete cascade,
  id          text   not null check (char_length(id) between 1 and 80),
  kind        text   not null check (kind in ('profile','note','upload','summary','card','exam','attempt','task','session','chat','event','video')),
  data        jsonb  not null default '{}'::jsonb check (octet_length(data::text) <= 4000000),
  created_at  bigint not null,
  updated_at  bigint not null,
  primary key (user_id, id)
);

create index if not exists records_user_kind_updated_idx on public.records (user_id, kind, updated_at desc);

alter table public.records enable row level security;
alter table public.records force row level security;

-- İstemci anonim rolle hiçbir şeye erişemez; giriş yapmış kullanıcı yalnızca kendi satırlarına erişir.
revoke all on public.records from anon;
grant select, insert, update, delete on public.records to authenticated;

drop policy if exists records_select_own on public.records;
drop policy if exists records_insert_own on public.records;
drop policy if exists records_update_own on public.records;
drop policy if exists records_delete_own on public.records;

create policy records_select_own on public.records for select to authenticated using (user_id = auth.uid());
create policy records_insert_own on public.records for insert to authenticated with check (user_id = auth.uid());
create policy records_update_own on public.records for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy records_delete_own on public.records for delete to authenticated using (user_id = auth.uid());

-- Yüklenen dosyalar (PDF / görsel): özel kova, dosya başına boyut ve tür sınırı, yol öneki = kullanıcı kimliği.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', false, 26214400, array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists uploads_select_own on storage.objects;
drop policy if exists uploads_insert_own on storage.objects;
drop policy if exists uploads_update_own on storage.objects;
drop policy if exists uploads_delete_own on storage.objects;

create policy uploads_select_own on storage.objects for select to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy uploads_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy uploads_update_own on storage.objects for update to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy uploads_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
