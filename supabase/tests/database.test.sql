begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(24);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'categories', 'categories table exists');
select has_table('public', 'agents', 'agents table exists');
select has_table('public', 'favorites', 'favorites table exists');
select has_table('public', 'installations', 'installations table exists');
select has_table('public', 'reviews', 'reviews table exists');
select has_table('public', 'recently_viewed', 'recently viewed table exists');
select has_table('public', 'reports', 'reports table exists');

select has_function(
  'public',
  'install_free_agent',
  array['uuid'],
  'idempotent install RPC exists'
);
select has_function(
  'private',
  'is_agent_public',
  array['uuid'],
  'canonical public visibility predicate exists'
);

select is(
  (
    select count(*)
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name = 'profiles'
      and grantee = 'anon'
      and privilege_type = 'SELECT'
      and column_name in ('role', 'onboarding_completed', 'is_suspended', 'suspended_at')
  ),
  0::bigint,
  'anon cannot select profile authorization or suspension columns'
);

set local role anon;
select is((select count(*) from public.agents), 7::bigint, 'anon sees only seven public seed agents');
select is((select count(*) from public.profiles), 2::bigint, 'anon sees creator storefronts, not members');
select is(
  (
    select total_count
    from public.search_agent_ids(null, null, null, 'popular', 12, 999)
    limit 1
  ),
  7::bigint,
  'search sentinel preserves total count beyond the final page'
);
select is(
  (
    select count(*)
    from public.list_public_reviews('30000000-0000-4000-8000-000000000001')
  ),
  1::bigint,
  'public review RPC exposes a safe member reviewer card'
);
reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;
select throws_ok(
  $$
    insert into public.agents (slug, name, price_type, price_cents)
    values ('member-owned-agent', 'Member owned agent', 'free', 0)
  $$,
  '42501',
  'new row violates row-level security policy for table "agents"',
  'a member cannot create a listing by supplying a browser request'
);
reset role;

delete from public.installations
where user_id = '10000000-0000-4000-8000-000000000003'
  and agent_id = '30000000-0000-4000-8000-000000000001';
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;
select public.install_free_agent('30000000-0000-4000-8000-000000000001');
select public.install_free_agent('30000000-0000-4000-8000-000000000001');
select is(
  (
    select count(*)
    from public.installations
    where user_id = '10000000-0000-4000-8000-000000000003'
      and agent_id = '30000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'repeated install calls create one entitlement'
);
reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;
select is((select count(*) from public.agents), 8::bigint, 'creator sees public agents and their own draft');
reset role;

create temporary table original_publication_time as
select published_at
from public.agents
where id = '30000000-0000-4000-8000-000000000001';
update public.agents
set published_at = published_at + interval '1 day'
where id = '30000000-0000-4000-8000-000000000001';
select is(
  (
    select published_at
    from public.agents
    where id = '30000000-0000-4000-8000-000000000001'
  ),
  (select published_at from original_publication_time),
  'first publication timestamp is database-owned and immutable'
);

update public.profiles
set is_suspended = true, suspended_at = now()
where id = '10000000-0000-4000-8000-000000000003';
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;
select throws_ok(
  $$ select public.install_free_agent('30000000-0000-4000-8000-000000000004') $$,
  '42501',
  'active onboarding is required',
  'a stale JWT cannot mutate data after suspension'
);
reset role;
update public.profiles
set is_suspended = false, suspended_at = null
where id = '10000000-0000-4000-8000-000000000003';

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;
select throws_ok(
  $$ select public.delete_my_review('40000000-0000-4000-8000-000000000001') $$,
  'P0002',
  'review was not found',
  'a creator cannot delete another user review'
);
reset role;

set local role anon;
select is(
  (select count(*) from public.agents where is_featured),
  3::bigint,
  'three public seed listings are featured'
);
reset role;

select is(
  (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and policyname like 'agent_media_owner_%'
  ),
  3::bigint,
  'storage has creator-scoped insert, update, and delete policies'
);

select is(
  (
    select count(*)
    from auth.identities
    where provider = 'email' and provider_id = user_id::text
  ),
  3::bigint,
  'seed email identities use the current provider_id contract'
);

select * from finish();
rollback;
