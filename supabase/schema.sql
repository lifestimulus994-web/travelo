-- Travelo admin panel schema. Re-run safely any time (idempotent).
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/okohkazadppiwbwqbygq/sql

-- ============ site_content (hero / about / contact / footer editable blocks) ============
create table if not exists site_content (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

drop policy if exists "site_content_public_read" on site_content;
create policy "site_content_public_read" on site_content
  for select using (true);

drop policy if exists "site_content_auth_insert" on site_content;
create policy "site_content_auth_insert" on site_content
  for insert to authenticated with check (true);

drop policy if exists "site_content_auth_update" on site_content;
create policy "site_content_auth_update" on site_content
  for update to authenticated using (true) with check (true);

drop policy if exists "site_content_auth_delete" on site_content;
create policy "site_content_auth_delete" on site_content
  for delete to authenticated using (true);

-- seed default content (won't overwrite if admin already edited it)
insert into site_content (key, value) values
  ('hero_title_line1', 'მოგზაურობა, რომელიც'),
  ('hero_title_gold', 'შეუფერხებლად'),
  ('hero_title_line2', 'იწყება'),
  ('hero_subtitle', 'Travelo გიგეგმავთ მოგზაურობას თავიდან ბოლომდე — ავიაბილეთი, სასტუმრო, ტრანსფერი და დაზღვევა ერთ ადგილას, ერთი WhatsApp შეტყობინებით.'),
  ('hero_bg', 'images/hero-bg.jpg'),
  ('about_title', 'თბილისში დაფუძნებული სააგენტო, რომელსაც ათასობით მოგზაური მიჰყვება'),
  ('about_text', 'Travelo გთავაზობთ სრულ სამოგზაურო სერვისს — ტურისტული პაკეტებიდან და ავიაბილეთებიდან სასტუმროს დაჯავშნამდე, ტრანსფერამდე და სამოგზაურო დაზღვევამდე. ჩვენი გუნდი პასუხისმგებლობით უდგება ყოველ დეტალს, რომ თქვენ მხოლოდ მოგზაურობით დარჩეთ დაკავებული.'),
  ('about_image', 'images/dest-greece.jpg'),
  ('phone_number', '+995595171727'),
  ('phone_display', '595 17 17 27'),
  ('whatsapp_number', '995595171727'),
  ('contact_address', 'სარაჯიშვილი N1, თბილისი, საქართველო, 0167'),
  ('contact_email', 'info@travelo.ge'),
  ('footer_text', 'Travelo — თქვენი სამოგზაურო პარტნიორი. ტურისტული პაკეტები, ავიაბილეთები, სასტუმროები, ტრანსფერი და სამოგზაურო დაზღვევა ერთ სააგენტოში.')
on conflict (key) do nothing;

-- ============ routes (მარშრუტები) ============
create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  badge text,
  price_text text,
  description text,
  cover_image text,
  photos jsonb not null default '[]'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table routes enable row level security;

drop policy if exists "routes_public_read" on routes;
create policy "routes_public_read" on routes
  for select using (true);

drop policy if exists "routes_auth_insert" on routes;
create policy "routes_auth_insert" on routes
  for insert to authenticated with check (true);

drop policy if exists "routes_auth_update" on routes;
create policy "routes_auth_update" on routes
  for update to authenticated using (true) with check (true);

drop policy if exists "routes_auth_delete" on routes;
create policy "routes_auth_delete" on routes
  for delete to authenticated using (true);

-- ============ storage bucket for uploaded photos ============
insert into storage.buckets (id, name, public)
  values ('site-images', 'site-images', true)
  on conflict (id) do nothing;

drop policy if exists "site_images_public_read" on storage.objects;
create policy "site_images_public_read" on storage.objects
  for select using (bucket_id = 'site-images');

drop policy if exists "site_images_auth_insert" on storage.objects;
create policy "site_images_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-images');

drop policy if exists "site_images_auth_update" on storage.objects;
create policy "site_images_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'site-images');

drop policy if exists "site_images_auth_delete" on storage.objects;
create policy "site_images_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'site-images');
