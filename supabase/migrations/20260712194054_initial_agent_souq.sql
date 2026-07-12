-- Agent Souq initial schema
-- PostgreSQL / Supabase Auth, Storage, RLS and public RPC contract.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.user_role as enum ('member', 'creator', 'admin');
create type public.agent_status as enum ('draft', 'published', 'archived');
create type public.price_type as enum ('free', 'one_time', 'subscription');
create type public.moderation_status as enum ('approved', 'pending', 'rejected');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create function private.is_https_url(value text)
returns boolean
language sql
immutable
strict
set search_path = ''
as $$
  select value ~ '^https://[^[:space:]]+$' and length(value) <= 2000;
$$;

create function private.all_https_urls(values text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(private.is_https_url(value)), true)
  from unnest(coalesce(values, '{}'::text[])) as value;
$$;

create function private.text_array_is_clean(values text[], max_items integer default 12)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    coalesce(cardinality(values), 0) <= max_items
    and not exists (
      select 1
      from unnest(coalesce(values, '{}'::text[])) as value
      where value <> lower(btrim(value))
         or length(value) < 1
         or length(value) > 40
    )
    and cardinality(coalesce(values, '{}'::text[])) = (
      select count(distinct value)
      from unnest(coalesce(values, '{}'::text[])) as value
    );
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique,
  full_name text not null,
  bio text,
  avatar_url text,
  website_url text,
  role public.user_role not null default 'member',
  is_verified boolean not null default false,
  onboarding_completed boolean not null default false,
  is_suspended boolean not null default false,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username::text ~ '^[a-z0-9_]{3,30}$'),
  constraint profiles_full_name_length check (char_length(btrim(full_name)) between 2 and 80),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500),
  constraint profiles_avatar_https check (avatar_url is null or private.is_https_url(avatar_url)),
  constraint profiles_website_https check (website_url is null or private.is_https_url(website_url)),
  constraint profiles_suspension_consistent check (
    (is_suspended and suspended_at is not null)
    or (not is_suspended and suspended_at is null)
  )
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text not null default '',
  icon text not null default 'sparkles',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint categories_name_length check (char_length(btrim(name)) between 2 and 60),
  constraint categories_description_length check (char_length(description) <= 500),
  constraint categories_icon_length check (char_length(icon) between 1 and 40)
);

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete restrict,
  category_id uuid references public.categories(id) on delete restrict,
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  instructions text not null default '',
  tags text[] not null default '{}',
  capabilities text[] not null default '{}',
  price_type public.price_type not null default 'free',
  price_cents integer not null default 0,
  currency text not null default 'USD',
  thumbnail_url text,
  gallery_urls text[] not null default '{}',
  demo_url text,
  version text not null default '1.0.0',
  status public.agent_status not null default 'draft',
  moderation_status public.moderation_status not null default 'approved',
  moderation_notes text,
  is_featured boolean not null default false,
  featured_rank smallint,
  average_rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  favorite_count integer not null default 0,
  install_count integer not null default 0,
  view_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(tagline, '') || ' ' || coalesce(description, ''))
  ) stored,
  constraint agents_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 80),
  constraint agents_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint agents_tagline_length check (char_length(tagline) <= 160),
  constraint agents_description_length check (char_length(description) <= 10000),
  constraint agents_instructions_length check (char_length(instructions) <= 10000),
  constraint agents_tags_clean check (private.text_array_is_clean(tags, 12)),
  constraint agents_capabilities_clean check (private.text_array_is_clean(capabilities, 12)),
  constraint agents_price_valid check (
    (price_type = 'free' and price_cents = 0)
    or (price_type in ('one_time', 'subscription') and price_cents between 1 and 10000000)
  ),
  constraint agents_currency_supported check (currency = 'USD'),
  constraint agents_thumbnail_https check (thumbnail_url is null or private.is_https_url(thumbnail_url)),
  constraint agents_gallery_https check (cardinality(gallery_urls) <= 5 and private.all_https_urls(gallery_urls)),
  constraint agents_demo_https check (demo_url is null or private.is_https_url(demo_url)),
  constraint agents_version_format check (version ~ '^\d+\.\d+\.\d+$'),
  constraint agents_counters_nonnegative check (
    review_count >= 0 and favorite_count >= 0 and install_count >= 0 and view_count >= 0
  ),
  constraint agents_rating_valid check (average_rating between 0 and 5),
  constraint agents_featured_rank_valid check (
    (is_featured and featured_rank is not null and featured_rank >= 0)
    or (not is_featured and featured_rank is null)
  ),
  constraint agents_published_complete check (
    status <> 'published'
    or (
      char_length(btrim(name)) between 3 and 80
      and char_length(btrim(tagline)) between 10 and 160
      and char_length(btrim(description)) between 80 and 10000
      and char_length(btrim(instructions)) between 20 and 10000
      and category_id is not null
      and cardinality(tags) between 1 and 12
      and cardinality(capabilities) between 1 and 12
      and (thumbnail_url is not null or cardinality(gallery_urls) > 0)
    )
  ),
  constraint agents_published_at_consistent check (status <> 'published' or published_at is not null)
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, agent_id)
);

create table public.installations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  entitlement_source text not null default 'free',
  installed_at timestamptz not null default now(),
  primary key (user_id, agent_id),
  constraint installations_entitlement_source check (
    entitlement_source in ('free', 'purchase', 'subscription', 'admin_grant')
  )
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, user_id),
  constraint reviews_rating_valid check (rating between 1 and 5),
  constraint reviews_title_length check (char_length(btrim(title)) between 3 and 100),
  constraint reviews_body_length check (char_length(btrim(body)) between 20 and 2000)
);

create table public.recently_viewed (
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  last_viewed_at timestamptz not null default now(),
  last_counted_at timestamptz not null default now(),
  primary key (user_id, agent_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_reason_length check (char_length(btrim(reason)) between 3 and 80),
  constraint reports_details_length check (details is null or char_length(details) <= 2000)
);

create index profiles_creator_lookup_idx on public.profiles (username) where role in ('creator', 'admin') and not is_suspended;
create index categories_public_sort_idx on public.categories (sort_order, name) where is_active;
create index agents_public_popular_idx on public.agents (install_count desc, id) where status = 'published' and moderation_status = 'approved';
create index agents_public_newest_idx on public.agents (published_at desc, id) where status = 'published' and moderation_status = 'approved';
create index agents_public_rating_idx on public.agents (average_rating desc, id) where status = 'published' and moderation_status = 'approved';
create index agents_public_price_idx on public.agents (price_cents, id) where status = 'published' and moderation_status = 'approved';
create index agents_featured_rank_idx on public.agents (featured_rank, id) where is_featured and status = 'published' and moderation_status = 'approved';
create index agents_category_public_idx on public.agents (category_id, install_count desc, id) where status = 'published' and moderation_status = 'approved';
create index agents_creator_updated_idx on public.agents (creator_id, updated_at desc, id);
create index agents_search_document_idx on public.agents using gin (search_document);
create index agents_tags_idx on public.agents using gin (tags);
create index agents_capabilities_idx on public.agents using gin (capabilities);
create index favorites_agent_idx on public.favorites (agent_id);
create index installations_agent_idx on public.installations (agent_id);
create index reviews_agent_created_idx on public.reviews (agent_id, created_at desc, id);
create index recently_viewed_user_time_idx on public.recently_viewed (user_id, last_viewed_at desc);
create index reports_status_created_idx on public.reports (status, created_at desc);

create function private.profile_can_create(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = profile_id
      and role in ('creator', 'admin')
      and onboarding_completed
      and not is_suspended
  );
$$;

create function private.profile_is_unsuspended(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = profile_id and not is_suspended
  );
$$;

create function private.profile_is_active_member(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = profile_id
      and onboarding_completed
      and not is_suspended
  );
$$;

create function private.is_agent_public(agent_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.agents as agent
    join public.categories as category on category.id = agent.category_id
    join public.profiles as creator on creator.id = agent.creator_id
    where agent.id = agent_id
      and agent.status = 'published'
      and agent.moderation_status = 'approved'
      and category.is_active
      and not creator.is_suspended
      and creator.role in ('creator', 'admin')
  );
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function private.set_updated_at();
create trigger agents_set_updated_at before update on public.agents
for each row execute function private.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function private.set_updated_at();
create trigger reports_set_updated_at before update on public.reports
for each row execute function private.set_updated_at();

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
begin
  base_username := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), 'member'), '[^a-z0-9_]+', '_', 'g'));
  base_username := left(trim(both '_' from base_username), 20);
  if length(base_username) < 3 then
    base_username := 'member';
  end if;

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    left(base_username || '_' || left(replace(new.id::text, '-', ''), 7), 30),
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Agent Souq member'), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create function private.guard_profile_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.id := old.id;
    new.role := old.role;
    new.is_verified := old.is_verified;
    new.is_suspended := old.is_suspended;
    new.suspended_at := old.suspended_at;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_system_fields
before update on public.profiles
for each row execute function private.guard_profile_system_fields();

create function private.guard_agent_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if current_user in ('authenticated', 'anon') then
      if (select auth.uid()) is null then
        raise exception 'authentication required' using errcode = '42501';
      end if;
      new.creator_id := (select auth.uid());
      new.status := 'draft';
      new.moderation_status := 'approved';
      new.moderation_notes := null;
      new.is_featured := false;
      new.featured_rank := null;
      new.average_rating := 0;
      new.review_count := 0;
      new.favorite_count := 0;
      new.install_count := 0;
      new.view_count := 0;
      new.published_at := null;
    elsif new.status = 'published' and new.published_at is null then
      new.published_at := now();
    end if;
  elsif current_user in ('authenticated', 'anon') then
    new.creator_id := old.creator_id;
    new.status := old.status;
    new.moderation_status := old.moderation_status;
    new.moderation_notes := old.moderation_notes;
    new.is_featured := old.is_featured;
    new.featured_rank := old.featured_rank;
    new.average_rating := old.average_rating;
    new.review_count := old.review_count;
    new.favorite_count := old.favorite_count;
    new.install_count := old.install_count;
    new.view_count := old.view_count;
    new.published_at := old.published_at;
  elsif old.published_at is not null and new.published_at is distinct from old.published_at then
    -- First publication is an immutable business timestamp, even to privileged
    -- listing-state functions. Administrative SQL can change it explicitly only
    -- by disabling this trigger.
    new.published_at := old.published_at;
  elsif new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger agents_guard_system_fields
before insert or update on public.agents
for each row execute function private.guard_agent_system_fields();

create function private.assert_review_eligible()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  owner_id uuid;
  listing_status public.agent_status;
  listing_moderation public.moderation_status;
begin
  select creator_id, status, moderation_status
  into owner_id, listing_status, listing_moderation
  from public.agents
  where id = new.agent_id;

  if owner_id is null
    or listing_status <> 'published'
    or listing_moderation <> 'approved'
    or not private.is_agent_public(new.agent_id) then
    raise exception 'only public agents can be reviewed' using errcode = '42501';
  end if;
  if owner_id = new.user_id then
    raise exception 'creators cannot review their own agents' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.installations
    where user_id = new.user_id and agent_id = new.agent_id
  ) then
    raise exception 'install the agent before reviewing it' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger reviews_assert_eligible
before insert or update of agent_id, user_id on public.reviews
for each row execute function private.assert_review_eligible();

create function private.refresh_agent_favorite_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare target_id uuid := coalesce(new.agent_id, old.agent_id);
begin
  update public.agents
  set favorite_count = (select count(*) from public.favorites where agent_id = target_id)
  where id = target_id;
  return coalesce(new, old);
end;
$$;

create function private.refresh_agent_install_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare target_id uuid := coalesce(new.agent_id, old.agent_id);
begin
  update public.agents
  set install_count = (select count(*) from public.installations where agent_id = target_id)
  where id = target_id;
  return coalesce(new, old);
end;
$$;

create function private.refresh_agent_review_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare target_id uuid := coalesce(new.agent_id, old.agent_id);
begin
  update public.agents
  set
    review_count = (select count(*) from public.reviews where agent_id = target_id),
    average_rating = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where agent_id = target_id), 0)
  where id = target_id;
  return coalesce(new, old);
end;
$$;

create trigger favorites_refresh_count
after insert or delete on public.favorites
for each row execute function private.refresh_agent_favorite_count();
create trigger installations_refresh_count
after insert or delete on public.installations
for each row execute function private.refresh_agent_install_count();
create trigger reviews_refresh_stats
after insert or update of rating or delete on public.reviews
for each row execute function private.refresh_agent_review_stats();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.agents enable row level security;
alter table public.favorites enable row level security;
alter table public.installations enable row level security;
alter table public.reviews enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.reports enable row level security;

create policy profiles_public_creators_read
on public.profiles for select
to anon, authenticated
using (
  (role in ('creator', 'admin') and not is_suspended)
  or ((select auth.uid()) = id)
);

create policy profiles_owner_update
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
  and private.profile_is_unsuspended((select auth.uid()))
);

create policy profiles_owner_insert_recovery
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id and role = 'member' and not is_verified and not is_suspended);

create policy categories_public_read
on public.categories for select
to anon, authenticated
using (is_active);

create policy agents_public_or_owner_read
on public.agents for select
to anon, authenticated
using (
  private.is_agent_public(id)
  or ((select auth.uid()) = creator_id)
);

create policy agents_creator_insert
on public.agents for insert
to authenticated
with check (
  (select auth.uid()) = creator_id
  and status = 'draft'
  and private.profile_can_create((select auth.uid()))
);

create policy agents_creator_update
on public.agents for update
to authenticated
using (
  (select auth.uid()) = creator_id
  and status <> 'archived'
  and private.profile_can_create((select auth.uid()))
)
with check ((select auth.uid()) = creator_id and status <> 'archived');

create policy agents_creator_delete_draft
on public.agents for delete
to authenticated
using (
  (select auth.uid()) = creator_id
  and status = 'draft'
  and private.profile_can_create((select auth.uid()))
);

create policy favorites_owner_read
on public.favorites for select
to authenticated
using ((select auth.uid()) = user_id);
create policy favorites_owner_insert
on public.favorites for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and private.profile_is_active_member((select auth.uid()))
  and private.is_agent_public(agent_id)
);
create policy favorites_owner_delete
on public.favorites for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and private.profile_is_active_member((select auth.uid()))
);

create policy installations_owner_read
on public.installations for select
to authenticated
using ((select auth.uid()) = user_id);

create policy reviews_public_or_owner_read
on public.reviews for select
to anon, authenticated
using (
  (select auth.uid()) = user_id
  or private.is_agent_public(agent_id)
);
create policy reviews_owner_delete
on public.reviews for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and private.profile_is_active_member((select auth.uid()))
);

create policy recently_viewed_owner_read
on public.recently_viewed for select
to authenticated
using ((select auth.uid()) = user_id);

create policy reports_owner_insert
on public.reports for insert
to authenticated
with check (
  (select auth.uid()) = reporter_id
  and private.profile_is_active_member((select auth.uid()))
  and private.is_agent_public(agent_id)
  and status = 'open'
);
create policy reports_owner_read
on public.reports for select
to authenticated
using ((select auth.uid()) = reporter_id);

revoke all on table public.profiles, public.categories, public.agents, public.favorites,
  public.installations, public.reviews, public.recently_viewed, public.reports
from anon, authenticated;

grant select (id, username, full_name, bio, avatar_url, website_url, is_verified, created_at)
on public.profiles to anon;
grant select (id, username, full_name, bio, avatar_url, website_url, is_verified, created_at, updated_at)
on public.profiles to authenticated;
grant insert (id, username, full_name) on public.profiles to authenticated;
grant update (username, full_name, bio, avatar_url, website_url, onboarding_completed)
on public.profiles to authenticated;

grant select on public.categories to anon, authenticated;
grant select (
  id, creator_id, category_id, slug, name, tagline, description, instructions,
  tags, capabilities, price_type, price_cents, currency, thumbnail_url,
  gallery_urls, demo_url, version, status, moderation_status, is_featured,
  featured_rank, average_rating,
  review_count, favorite_count, install_count, view_count, published_at,
  created_at, updated_at
) on public.agents to anon, authenticated;
grant insert (
  slug, name, tagline, description, instructions, category_id, tags,
  capabilities, price_type, price_cents, currency, thumbnail_url,
  gallery_urls, demo_url, version
) on public.agents to authenticated;
grant update (
  slug, name, tagline, description, instructions, category_id, tags,
  capabilities, price_type, price_cents, currency, thumbnail_url,
  gallery_urls, demo_url, version
) on public.agents to authenticated;
grant delete on public.agents to authenticated;

grant select, insert, delete on public.favorites to authenticated;
grant select on public.installations to authenticated;
grant select (id, agent_id, rating, title, body, created_at, updated_at)
on public.reviews to anon, authenticated;
grant delete on public.reviews to authenticated;
grant select on public.recently_viewed to authenticated;
grant select, insert (reporter_id, agent_id, reason, details) on public.reports to authenticated;

create function public.become_creator()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  update public.profiles
  set role = case when role = 'admin' then role else 'creator' end
  where id = v_user_id and onboarding_completed and not is_suspended;
  if not found then
    raise exception 'complete onboarding before activating creator access' using errcode = '42501';
  end if;
end;
$$;

create function public.publish_agent(p_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.agents as agent
  set status = 'published', published_at = coalesce(agent.published_at, now())
  where agent.id = p_agent_id
    and agent.creator_id = v_user_id
    and agent.status <> 'archived'
    and char_length(btrim(agent.name)) between 3 and 80
    and agent.slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(btrim(agent.tagline)) between 10 and 160
    and char_length(btrim(agent.description)) between 80 and 10000
    and char_length(btrim(agent.instructions)) between 20 and 10000
    and agent.category_id is not null
    and cardinality(agent.tags) between 1 and 12
    and cardinality(agent.capabilities) between 1 and 12
    and (agent.thumbnail_url is not null or cardinality(agent.gallery_urls) > 0)
    and exists (
      select 1 from public.categories
      where categories.id = agent.category_id and categories.is_active
    )
    and exists (
      select 1 from public.profiles
      where profiles.id = v_user_id
        and profiles.role in ('creator', 'admin')
        and profiles.onboarding_completed
        and not profiles.is_suspended
    );

  if not found then
    raise exception 'listing is missing publication requirements or is not editable' using errcode = '42501';
  end if;
end;
$$;

create function public.archive_agent(p_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not private.profile_can_create(v_user_id) then
    raise exception 'active creator access is required' using errcode = '42501';
  end if;
  update public.agents
  set status = 'archived'
  where id = p_agent_id and creator_id = v_user_id and status <> 'archived';
  if not found then
    raise exception 'listing is not editable' using errcode = '42501';
  end if;
end;
$$;

create function public.return_agent_to_draft(p_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not private.profile_can_create(v_user_id) then
    raise exception 'active creator access is required' using errcode = '42501';
  end if;
  update public.agents
  set status = 'draft'
  where id = p_agent_id and creator_id = v_user_id and status = 'published';
  if not found then
    raise exception 'published listing was not found' using errcode = '42501';
  end if;
end;
$$;

create function public.toggle_favorite(p_agent_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not private.profile_is_active_member(v_user_id) then
    raise exception 'active onboarding is required' using errcode = '42501';
  end if;
  if not private.is_agent_public(p_agent_id) then
    raise exception 'public agent was not found' using errcode = 'P0002';
  end if;

  delete from public.favorites where user_id = v_user_id and agent_id = p_agent_id;
  if found then
    return false;
  end if;
  insert into public.favorites (user_id, agent_id) values (v_user_id, p_agent_id);
  return true;
end;
$$;

create function public.install_free_agent(p_agent_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not private.profile_is_active_member(v_user_id) then
    raise exception 'active onboarding is required' using errcode = '42501';
  end if;
  if not private.is_agent_public(p_agent_id)
    or not exists (
      select 1 from public.agents
      where id = p_agent_id and price_type = 'free'
    ) then
    raise exception 'only public free agents can be installed' using errcode = '42501';
  end if;

  insert into public.installations (user_id, agent_id, entitlement_source)
  values (v_user_id, p_agent_id, 'free')
  on conflict (user_id, agent_id) do nothing;
  return true;
end;
$$;

create function public.upsert_review(
  p_agent_id uuid,
  p_rating integer,
  p_title text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  review_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not private.profile_is_active_member(v_user_id) then
    raise exception 'active onboarding is required' using errcode = '42501';
  end if;
  if not private.is_agent_public(p_agent_id) then
    raise exception 'public agent was not found' using errcode = 'P0002';
  end if;
  if p_rating not between 1 and 5
    or char_length(btrim(p_title)) not between 3 and 100
    or char_length(btrim(p_body)) not between 20 and 2000 then
    raise exception 'invalid review content' using errcode = '22023';
  end if;

  insert into public.reviews (agent_id, user_id, rating, title, body)
  values (p_agent_id, v_user_id, p_rating, btrim(p_title), btrim(p_body))
  on conflict (agent_id, user_id) do update
  set rating = excluded.rating, title = excluded.title, body = excluded.body
  returning id into review_id;
  return review_id;
end;
$$;

create function public.delete_my_review(p_review_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not private.profile_is_active_member(v_user_id) then
    raise exception 'active onboarding is required' using errcode = '42501';
  end if;
  delete from public.reviews
  where id = p_review_id and user_id = v_user_id;
  if not found then
    raise exception 'review was not found' using errcode = 'P0002';
  end if;
  return true;
end;
$$;

create function public.record_agent_view(p_agent_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  viewed_at timestamptz := clock_timestamp();
  should_count boolean := false;
begin
  -- Anonymous viewing is intentionally not persisted: there is no fingerprinting
  -- cookie or client-provided identity to spoof.
  if v_user_id is null then
    return false;
  end if;
  if not private.profile_is_active_member(v_user_id) then
    return false;
  end if;
  if not private.is_agent_public(p_agent_id)
    or not exists (
      select 1 from public.agents
      where id = p_agent_id and creator_id <> v_user_id
    ) then
    return false;
  end if;

  insert into public.recently_viewed (user_id, agent_id, last_viewed_at, last_counted_at)
  values (v_user_id, p_agent_id, viewed_at, viewed_at)
  on conflict (user_id, agent_id) do update
    set
      last_viewed_at = excluded.last_viewed_at,
      last_counted_at = case
        when public.recently_viewed.last_counted_at <= viewed_at - interval '30 minutes'
          then viewed_at
        else public.recently_viewed.last_counted_at
      end
  returning public.recently_viewed.last_counted_at = viewed_at into should_count;

  if coalesce(should_count, false) then
    update public.agents set view_count = view_count + 1 where id = p_agent_id;
  end if;
  return coalesce(should_count, false);
end;
$$;

create function public.get_my_profile()
returns table (
  id uuid,
  username text,
  full_name text,
  bio text,
  avatar_url text,
  website_url text,
  role public.user_role,
  is_verified boolean,
  onboarding_completed boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where profiles.id = v_user_id and profiles.is_suspended) then
    raise exception 'account is suspended' using errcode = '42501';
  end if;
  return query
  select
    profile.id,
    profile.username::text,
    profile.full_name,
    profile.bio,
    profile.avatar_url,
    profile.website_url,
    profile.role,
    profile.is_verified,
    profile.onboarding_completed,
    profile.created_at,
    profile.updated_at
  from public.profiles as profile
  where profile.id = v_user_id;
end;
$$;

create function public.get_public_creator(p_username text)
returns table (
  id uuid,
  username text,
  full_name text,
  bio text,
  avatar_url text,
  website_url text,
  is_verified boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.id,
    profile.username::text,
    profile.full_name,
    profile.bio,
    profile.avatar_url,
    profile.website_url,
    profile.is_verified,
    profile.created_at
  from public.profiles as profile
  where profile.username = p_username
    and profile.role in ('creator', 'admin')
    and not profile.is_suspended
  limit 1;
$$;

create function public.list_public_reviews(p_agent_id uuid)
returns table (
  id uuid,
  agent_id uuid,
  rating smallint,
  title text,
  body text,
  reviewer_id uuid,
  reviewer_username text,
  reviewer_full_name text,
  reviewer_avatar_url text,
  reviewer_is_verified boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    review.id,
    review.agent_id,
    review.rating,
    review.title,
    review.body,
    reviewer.id,
    reviewer.username::text,
    reviewer.full_name,
    reviewer.avatar_url,
    reviewer.is_verified,
    review.created_at,
    review.updated_at
  from public.reviews as review
  join public.profiles as reviewer on reviewer.id = review.user_id
  join public.agents as agent on agent.id = review.agent_id
  where review.agent_id = p_agent_id
    and private.is_agent_public(agent.id)
    and not reviewer.is_suspended
  order by review.created_at desc, review.id
  limit 50;
$$;

create function public.list_my_reviews()
returns table (
  id uuid,
  agent_id uuid,
  rating smallint,
  title text,
  body text,
  reviewer_id uuid,
  reviewer_username text,
  reviewer_full_name text,
  reviewer_avatar_url text,
  reviewer_is_verified boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  return query
  select
    review.id,
    review.agent_id,
    review.rating,
    review.title,
    review.body,
    reviewer.id,
    reviewer.username::text,
    reviewer.full_name,
    reviewer.avatar_url,
    reviewer.is_verified,
    review.created_at,
    review.updated_at
  from public.reviews as review
  join public.profiles as reviewer on reviewer.id = review.user_id
  where review.user_id = v_user_id
  order by review.updated_at desc, review.id
  limit 50;
end;
$$;

create function public.list_public_categories()
returns table (
  id uuid,
  slug text,
  name text,
  description text,
  icon text,
  agent_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    category.id,
    category.slug,
    category.name,
    category.description,
    category.icon,
    count(agent.id) as agent_count
  from public.categories as category
  left join public.agents as agent
    on agent.category_id = category.id
   and agent.status = 'published'
   and agent.moderation_status = 'approved'
  where category.is_active
  group by category.id
  order by category.sort_order, category.name;
$$;

create function public.search_agent_ids(
  p_query text default null,
  p_category_slug text default null,
  p_price_type text default null,
  p_sort text default 'popular',
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (id uuid, total_count bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_sort not in ('popular', 'newest', 'rating', 'price-low', 'price-high')
    or p_limit not between 1 and 48
    or p_offset not between 0 and 479999
    or p_price_type is not null and p_price_type not in ('free', 'one_time', 'subscription')
    or p_query is not null and char_length(p_query) > 100 then
    raise exception 'invalid search parameters' using errcode = '22023';
  end if;

  return query
  with filtered as (
    select
      agent.id,
      agent.install_count,
      agent.published_at,
      agent.average_rating,
      agent.price_cents
    from public.agents as agent
    join public.categories as category on category.id = agent.category_id
    join public.profiles as creator on creator.id = agent.creator_id
    where agent.status = 'published'
      and agent.moderation_status = 'approved'
      and private.is_agent_public(agent.id)
      and category.is_active
      and (p_category_slug is null or category.slug = p_category_slug)
      and (p_price_type is null or agent.price_type::text = p_price_type)
      and (
        p_query is null
        or btrim(p_query) = ''
        or agent.search_document @@ websearch_to_tsquery('simple', p_query)
        or exists (
          select 1
          from unnest(agent.tags || agent.capabilities) value
          where value ilike '%' || p_query || '%'
        )
        or category.name ilike '%' || p_query || '%'
        or creator.full_name ilike '%' || p_query || '%'
        or creator.username::text ilike '%' || p_query || '%'
      )
  ),
  ranked as (
    select
      filtered.id,
      count(*) over () as total_count,
      row_number() over (
        order by
          case when p_sort = 'popular' then filtered.install_count end desc nulls last,
          case when p_sort = 'newest' then filtered.published_at end desc nulls last,
          case when p_sort = 'rating' then filtered.average_rating end desc nulls last,
          case when p_sort = 'price-low' then filtered.price_cents end asc nulls last,
          case when p_sort = 'price-high' then filtered.price_cents end desc nulls last,
          filtered.id asc
      ) as ordinal
    from filtered
  ),
  page as (
    select ranked.id, ranked.total_count, ranked.ordinal
    from ranked
    where ranked.ordinal > p_offset
      and ranked.ordinal <= p_offset + p_limit
  ),
  aggregate_count as (
    select count(*)::bigint as total_count from filtered
  )
  select result.id, result.total_count
  from (
    select page.id, page.total_count, page.ordinal from page
    union all
    select null::uuid, aggregate_count.total_count, 2147483647::bigint
    from aggregate_count
    where not exists (select 1 from page)
  ) as result
  order by result.ordinal;
end;
$$;

revoke all on function public.become_creator() from public, anon;
revoke all on function public.publish_agent(uuid) from public, anon;
revoke all on function public.archive_agent(uuid) from public, anon;
revoke all on function public.return_agent_to_draft(uuid) from public, anon;
revoke all on function public.toggle_favorite(uuid) from public, anon;
revoke all on function public.install_free_agent(uuid) from public, anon;
revoke all on function public.upsert_review(uuid, integer, text, text) from public, anon;
revoke all on function public.delete_my_review(uuid) from public, anon;
revoke all on function public.record_agent_view(uuid) from public, anon;
revoke all on function public.get_my_profile() from public, anon;
revoke all on function public.get_public_creator(text) from public;
revoke all on function public.list_public_reviews(uuid) from public;
revoke all on function public.list_my_reviews() from public, anon;
revoke all on function public.list_public_categories() from public;
revoke all on function public.search_agent_ids(text, text, text, text, integer, integer) from public;

grant execute on function public.become_creator() to authenticated;
grant execute on function public.publish_agent(uuid) to authenticated;
grant execute on function public.archive_agent(uuid) to authenticated;
grant execute on function public.return_agent_to_draft(uuid) to authenticated;
grant execute on function public.toggle_favorite(uuid) to authenticated;
grant execute on function public.install_free_agent(uuid) to authenticated;
grant execute on function public.upsert_review(uuid, integer, text, text) to authenticated;
grant execute on function public.delete_my_review(uuid) to authenticated;
grant execute on function public.record_agent_view(uuid) to authenticated;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.get_public_creator(text) to anon, authenticated;
grant execute on function public.list_public_reviews(uuid) to anon, authenticated;
grant execute on function public.list_my_reviews() to authenticated;
grant execute on function public.list_public_categories() to anon, authenticated;
grant execute on function public.search_agent_ids(text, text, text, text, integer, integer) to anon, authenticated;

revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.profile_can_create(uuid) to authenticated;
grant execute on function private.profile_is_unsuspended(uuid) to authenticated;
grant execute on function private.profile_is_active_member(uuid) to authenticated;
grant execute on function private.is_agent_public(uuid) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agent-media',
  'agent-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy agent_media_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'agent-media');

create policy agent_media_owner_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'agent-media'
  and private.profile_can_create((select auth.uid()))
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy agent_media_owner_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'agent-media'
  and private.profile_can_create((select auth.uid()))
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'agent-media'
  and private.profile_can_create((select auth.uid()))
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy agent_media_owner_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'agent-media'
  and private.profile_can_create((select auth.uid()))
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
