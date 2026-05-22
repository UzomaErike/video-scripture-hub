
create table public.book_covers (
  book_slug text primary key,
  image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.book_covers enable row level security;

create policy "anyone can view book covers" on public.book_covers
  for select to anon, authenticated using (true);

create policy "admins can insert book covers" on public.book_covers
  for insert to authenticated with check (has_role(auth.uid(), 'admin'));

create policy "admins can update book covers" on public.book_covers
  for update to authenticated using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));

create policy "admins can delete book covers" on public.book_covers
  for delete to authenticated using (has_role(auth.uid(), 'admin'));

create trigger book_covers_touch_updated_at before update on public.book_covers
  for each row execute function touch_updated_at();

insert into storage.buckets (id, name, public) values ('book-covers','book-covers', true)
  on conflict (id) do nothing;

create policy "public read book-covers" on storage.objects
  for select using (bucket_id = 'book-covers');

create policy "admins upload book-covers" on storage.objects
  for insert to authenticated with check (bucket_id = 'book-covers' and has_role(auth.uid(),'admin'));

create policy "admins update book-covers" on storage.objects
  for update to authenticated using (bucket_id = 'book-covers' and has_role(auth.uid(),'admin'));

create policy "admins delete book-covers" on storage.objects
  for delete to authenticated using (bucket_id = 'book-covers' and has_role(auth.uid(),'admin'));
