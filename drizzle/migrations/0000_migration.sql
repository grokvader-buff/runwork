create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'New chat',
  agent text not null default 'brain-zero',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default '',
  body text not null default '',
  reflection text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  prompt text not null,
  path text not null,
  created_at timestamptz not null default now()
);
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  created_at timestamptz not null default now()
);
create table public.shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  title text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.threads, public.journal_entries, public.images, public.usage_events, public.shares to authenticated;
grant all on public.threads, public.journal_entries, public.images, public.usage_events, public.shares to service_role;
alter table public.threads enable row level security;
alter table public.journal_entries enable row level security;
alter table public.images enable row level security;
alter table public.usage_events enable row level security;
alter table public.shares enable row level security;
create policy "own threads" on public.threads for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own journal" on public.journal_entries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own images" on public.images for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own usage" on public.usage_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own shares" on public.shares for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.get_share(share_id uuid)
returns table (id uuid, kind text, title text, payload jsonb, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.kind, s.title, s.payload, s.created_at from public.shares s where s.id = share_id;
$$;
grant execute on function public.get_share(uuid) to anon, authenticated;

create policy "users read own images" on storage.objects for select to authenticated using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users upload own images" on storage.objects for insert to authenticated with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own images" on storage.objects for delete to authenticated using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);