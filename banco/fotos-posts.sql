-- Execute uma vez no SQL Editor do projeto externo já configurado.
-- Não modifica os posts, comentários ou permissões existentes.
alter table public.posts add column if not exists imagem_url text;

-- Bucket post-images: criar pela API de Storage, NÃO via INSERT em storage.buckets.
-- Público, limite de 5 MB, MIME image/jpeg, image/png e image/webp.
-- Esta política permite anexos sem login, como a comunidade atual.
-- Não permite substituir nem apagar arquivos de outras pessoas.
drop policy if exists "comunidade anexa fotos" on storage.objects;
create policy "comunidade anexa fotos" on storage.objects
for insert to anon, authenticated
with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = 'posts');

drop policy if exists "comunidade le fotos" on storage.objects;
create policy "comunidade le fotos" on storage.objects
for select to anon, authenticated using (bucket_id = 'post-images');