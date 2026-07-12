begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(18);

-- Member context.
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  (select count(*) from public.agents where id = '30000000-0000-4000-8000-000000000008'),
  0::bigint,
  'a member cannot read another creator draft'
);

select is(
  (select count(*) from public.favorites),
  2::bigint,
  'a member reads only their own favorites'
);

select is(
  public.install_free_agent('30000000-0000-4000-8000-000000000001'),
  true,
  'installing a public free agent succeeds'
);

select is(
  public.install_free_agent('30000000-0000-4000-8000-000000000001'),
  true,
  'repeating a free install remains successful'
);

select is(
  (
    select count(*)
    from public.installations
    where agent_id = '30000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'repeated installation leaves exactly one entitlement'
);

select throws_ok(
  $$select public.install_free_agent('30000000-0000-4000-8000-000000000002')$$,
  '42501',
  'only public free agents can be installed',
  'a paid listing cannot use the free-install RPC'
);

select throws_ok(
  $$select public.upsert_review(
    '30000000-0000-4000-8000-000000000002',
    5,
    'Not installed',
    'This review must be rejected because no entitlement exists.'
  )$$,
  '42501',
  'install the agent before reviewing it',
  'a member cannot review an uninstalled listing'
);

select lives_ok(
  $$insert into public.reports (reporter_id, agent_id, reason, details)
    values (
      '10000000-0000-4000-8000-000000000003',
      '30000000-0000-4000-8000-000000000001',
      'rls test report',
      'A transaction-scoped report used to verify private ownership.'
    )$$,
  'an active member can report a public listing'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values (
      'agent-media',
      '10000000-0000-4000-8000-000000000003/member-test.png',
      '10000000-0000-4000-8000-000000000003'
    )$$,
  '42501',
  null,
  'a non-creator cannot write listing media'
);

-- Second creator context.
reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  (select count(*) from public.agents where id = '30000000-0000-4000-8000-000000000008'),
  0::bigint,
  'a creator cannot read another creator draft'
);

select is(
  (
    with changed as (
      update public.agents
      set tagline = 'An unauthorized cross-owner edit that must never be applied.'
      where id = '30000000-0000-4000-8000-000000000008'
      returning id
    )
    select count(*) from changed
  ),
  0::bigint,
  'a creator cannot update another creator draft'
);

select is(
  (select count(*) from public.reports where reason = 'rls test report'),
  0::bigint,
  'another user cannot read a private report'
);

select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values (
      'agent-media',
      '10000000-0000-4000-8000-000000000002/creator-test.png',
      '10000000-0000-4000-8000-000000000002'
    )$$,
  'an active creator can write within their own media path'
);

-- Listing owner context.
reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  (select count(*) from public.agents where id = '30000000-0000-4000-8000-000000000008'),
  1::bigint,
  'a creator can read their own draft'
);

select throws_ok(
  $$select public.upsert_review(
    '30000000-0000-4000-8000-000000000001',
    5,
    'Self review',
    'A creator must never be able to review their own listing.'
  )$$,
  '42501',
  'creators cannot review their own agents',
  'a creator cannot review their own listing'
);

select is(
  (
    with changed as (
      update public.profiles
      set full_name = 'Unauthorized profile edit'
      where id = '10000000-0000-4000-8000-000000000002'
      returning id
    )
    select count(*) from changed
  ),
  0::bigint,
  'a creator cannot update another profile'
);

-- A stale JWT cannot bypass a later database suspension.
reset role;
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
  $$select public.toggle_favorite('30000000-0000-4000-8000-000000000007')$$,
  '42501',
  'active onboarding is required',
  'a suspended user cannot mutate favorites through an RPC'
);

select throws_ok(
  $$insert into public.favorites (user_id, agent_id)
    values (
      '10000000-0000-4000-8000-000000000003',
      '30000000-0000-4000-8000-000000000007'
    )$$,
  '42501',
  null,
  'a suspended user cannot bypass the RPC through direct table access'
);

reset role;
select * from finish();
rollback;
