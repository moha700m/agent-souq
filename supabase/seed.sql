-- Deterministic local development accounts.
-- Password for every account: AgentSouq1!

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'creator@agentsouq.local',
    extensions.crypt('AgentSouq1!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Maya Chen"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'studio@agentsouq.local',
    extensions.crypt('AgentSouq1!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Omar Haddad"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'member@agentsouq.local',
    extensions.crypt('AgentSouq1!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alex Morgan"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '11000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '{"sub":"10000000-0000-4000-8000-000000000001","email":"creator@agentsouq.local","email_verified":true,"phone_verified":false}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '{"sub":"10000000-0000-4000-8000-000000000002","email":"studio@agentsouq.local","email_verified":true,"phone_verified":false}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    '11000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    '{"sub":"10000000-0000-4000-8000-000000000003","email":"member@agentsouq.local","email_verified":true,"phone_verified":false}',
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do nothing;

update public.profiles
set
  username = 'mayachen',
  full_name = 'Maya Chen',
  bio = 'Product engineer building calm, reviewable AI workflows for software teams.',
  website_url = 'https://example.com/maya',
  role = 'creator',
  is_verified = true,
  onboarding_completed = true
where id = '10000000-0000-4000-8000-000000000001';

update public.profiles
set
  username = 'omarbuilds',
  full_name = 'Omar Haddad',
  bio = 'Automation specialist helping operations teams replace fragile busywork.',
  website_url = 'https://example.com/omar',
  role = 'creator',
  is_verified = true,
  onboarding_completed = true
where id = '10000000-0000-4000-8000-000000000002';

update public.profiles
set
  username = 'alexmorgan',
  full_name = 'Alex Morgan',
  bio = 'Curious operator testing practical agents for everyday knowledge work.',
  role = 'member',
  onboarding_completed = true
where id = '10000000-0000-4000-8000-000000000003';

insert into public.categories (id, slug, name, description, icon, sort_order)
values
  ('20000000-0000-4000-8000-000000000001', 'coding', 'Coding', 'Build, review, debug, and document software with focused agents.', 'code-2', 10),
  ('20000000-0000-4000-8000-000000000002', 'business', 'Business', 'Turn strategy and operations questions into useful, reviewable outputs.', 'briefcase-business', 20),
  ('20000000-0000-4000-8000-000000000003', 'marketing', 'Marketing', 'Plan campaigns, clarify positioning, and produce channel-ready briefs.', 'megaphone', 30),
  ('20000000-0000-4000-8000-000000000004', 'research', 'Research', 'Structure evidence, compare sources, and surface uncertainty.', 'search', 40),
  ('20000000-0000-4000-8000-000000000005', 'customer-support', 'Customer Support', 'Triage issues and draft consistent, empathetic customer responses.', 'headphones', 50),
  ('20000000-0000-4000-8000-000000000006', 'automation', 'Automation', 'Map dependable workflows with clear triggers and safeguards.', 'workflow', 60),
  ('20000000-0000-4000-8000-000000000007', 'productivity', 'Productivity', 'Plan priorities, meetings, and personal knowledge work.', 'gauge', 70)
on conflict (id) do update
set slug = excluded.slug,
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order;

insert into public.agents (
  id,
  creator_id,
  category_id,
  slug,
  name,
  tagline,
  description,
  instructions,
  tags,
  capabilities,
  price_type,
  price_cents,
  thumbnail_url,
  gallery_urls,
  demo_url,
  version,
  status,
  moderation_status,
  view_count,
  published_at
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'code-review-copilot',
    'Code Review Copilot',
    'Find risky changes and explain the smallest useful fix before merge.',
    'Code Review Copilot reviews a focused diff for correctness, security, maintainability, and testing gaps. It explains why each finding matters and separates blocking issues from optional polish so engineering teams can act with confidence.',
    'Paste the relevant diff and include the language, expected behavior, constraints, and test context. Review every high-risk recommendation before changing production code.',
    array['code-review', 'security', 'typescript'],
    array['diff analysis', 'risk ranking', 'test suggestions'],
    'free',
    0,
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    array[
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80'
    ],
    'https://example.com/agents/code-review-copilot',
    '1.3.0',
    'published',
    'approved',
    1284,
    '2026-01-12T09:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    'launch-narrative',
    'Launch Narrative',
    'Turn product context into sharp positioning and a channel-ready launch brief.',
    'Launch Narrative helps product marketing teams move from scattered notes to a coherent launch story. It identifies the audience, core tension, differentiated value, proof points, objections, and a practical rollout brief without inventing unsupported claims.',
    'Share the product context, target audience, customer evidence, competitive alternatives, launch goal, and any claims that require legal or factual review.',
    array['launch', 'messaging', 'positioning'],
    array['audience framing', 'message hierarchy', 'launch brief'],
    'one_time',
    2900,
    'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
    array['https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80'],
    null,
    '1.1.0',
    'published',
    'approved',
    912,
    '2026-02-04T09:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'decision-brief',
    'Decision Brief',
    'Convert messy options into a concise decision record with visible tradeoffs.',
    'Decision Brief structures a business decision without hiding uncertainty. It separates facts, assumptions, constraints, alternatives, reversible choices, and unresolved risks before producing a concise recommendation for accountable human review.',
    'Describe the decision owner, deadline, options, evidence, constraints, stakeholders, and what would make the decision easy to reverse or costly to change.',
    array['decisions', 'operations', 'strategy'],
    array['option comparison', 'risk framing', 'decision record'],
    'subscription',
    1900,
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    array['https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80'],
    null,
    '2.0.0',
    'published',
    'approved',
    741,
    '2026-03-08T09:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000004',
    'research-scout',
    'Research Scout',
    'Map a research question, compare evidence, and flag uncertainty clearly.',
    'Research Scout turns an open question into a disciplined research plan and synthesis. It records source quality, conflicting evidence, confidence levels, and unanswered questions so the output remains useful without pretending to replace expert verification.',
    'Provide the research question, intended decision, acceptable sources, date range, geography, and any claims that need primary-source verification.',
    array['evidence', 'research', 'synthesis'],
    array['research planning', 'source synthesis', 'uncertainty flags'],
    'free',
    0,
    'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=80',
    array['https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1600&q=80'],
    null,
    '1.4.2',
    'published',
    'approved',
    1108,
    '2026-04-10T09:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000005',
    'support-desk',
    'Support Desk',
    'Draft consistent, empathetic answers grounded in your support policy.',
    'Support Desk classifies incoming customer issues, identifies missing context, drafts a response aligned with supplied policy, and recommends escalation when an answer could affect billing, security, privacy, or account access.',
    'Provide the customer message, relevant account context without secrets, current support policy, product behavior, tone guidance, and escalation boundaries.',
    array['customer-support', 'support', 'triage'],
    array['escalation guidance', 'response drafting', 'ticket triage'],
    'subscription',
    1200,
    'https://images.unsplash.com/photo-1556761175-b413da4e38f71?auto=format&fit=crop&w=1200&q=80',
    array['https://images.unsplash.com/photo-1556761175-b413da4e38f71?auto=format&fit=crop&w=1600&q=80'],
    null,
    '1.0.1',
    'published',
    'approved',
    688,
    '2026-05-02T09:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000006',
    'flow-architect',
    'Flow Architect',
    'Design reliable automations with clear triggers, safeguards, and recovery paths.',
    'Flow Architect translates an operational process into an implementation-ready automation map. It names triggers, inputs, branches, permissions, failure handling, observability, ownership, and manual recovery steps before any workflow is deployed.',
    'Describe the current process, systems involved, data sensitivity, expected volume, failure tolerance, owners, and which steps must retain human approval.',
    array['automation', 'operations', 'workflows'],
    array['failure handling', 'implementation specs', 'workflow mapping'],
    'one_time',
    3900,
    'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?auto=format&fit=crop&w=1200&q=80',
    array['https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?auto=format&fit=crop&w=1600&q=80'],
    null,
    '1.2.0',
    'published',
    'approved',
    804,
    '2026-05-21T09:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000007',
    'focus-pilot',
    'Focus Pilot',
    'Turn competing priorities into a realistic plan you can actually finish.',
    'Focus Pilot helps an individual or small team choose what matters now. It converts commitments, deadlines, capacity, and uncertainty into a bounded weekly plan with explicit tradeoffs and a small number of observable outcomes.',
    'List current commitments, deadlines, available hours, dependencies, energy constraints, and the outcomes that would make the period successful.',
    array['focus', 'planning', 'priorities'],
    array['priority setting', 'task breakdown', 'weekly planning'],
    'free',
    0,
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80',
    array['https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1600&q=80'],
    null,
    '1.0.0',
    'published',
    'approved',
    522,
    '2026-06-01T09:00:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'api-contract-guard',
    'API Contract Guard',
    '',
    '',
    '',
    array[]::text[],
    array[]::text[],
    'free',
    0,
    null,
    array[]::text[],
    null,
    '0.1.0',
    'draft',
    'approved',
    0,
    null
  )
on conflict (id) do update
set name = excluded.name,
    tagline = excluded.tagline,
    description = excluded.description,
    instructions = excluded.instructions,
    category_id = excluded.category_id,
    tags = excluded.tags,
    capabilities = excluded.capabilities,
    price_type = excluded.price_type,
    price_cents = excluded.price_cents,
    thumbnail_url = excluded.thumbnail_url,
    gallery_urls = excluded.gallery_urls,
    demo_url = excluded.demo_url,
    version = excluded.version,
    status = excluded.status,
    moderation_status = excluded.moderation_status,
    view_count = excluded.view_count,
    published_at = excluded.published_at;

update public.agents
set
  is_featured = id in (
    '30000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000007'
  ),
  featured_rank = case id
    when '30000000-0000-4000-8000-000000000001' then 1
    when '30000000-0000-4000-8000-000000000004' then 2
    when '30000000-0000-4000-8000-000000000007' then 3
    else null
  end;

insert into public.favorites (user_id, agent_id, created_at)
values
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', '2026-06-10T09:00:00Z'),
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000004', '2026-06-11T09:00:00Z'),
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000007', '2026-06-12T09:00:00Z')
on conflict (user_id, agent_id) do nothing;

-- Only free listings are installed in seed data. Paid entitlements remain for a
-- future verified checkout or subscription webhook.
insert into public.installations (user_id, agent_id, entitlement_source, installed_at)
values
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'free', '2026-06-10T10:00:00Z'),
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000004', 'free', '2026-06-11T10:00:00Z'),
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000007', 'free', '2026-06-12T10:00:00Z')
on conflict (user_id, agent_id) do nothing;

insert into public.reviews (id, user_id, agent_id, rating, title, body, created_at, updated_at)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    5,
    'Focused findings we could act on',
    'The risk ranking was clear, and every blocking finding included a practical explanation for the smallest safe change.',
    '2026-06-13T09:00:00Z',
    '2026-06-13T09:00:00Z'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000004',
    4,
    'Strong structure for an ambiguous question',
    'It separated evidence from assumptions and made the remaining research gaps easy to assign to the right teammate.',
    '2026-06-14T09:00:00Z',
    '2026-06-14T09:00:00Z'
  )
on conflict (agent_id, user_id) do update
set rating = excluded.rating,
    title = excluded.title,
    body = excluded.body,
    updated_at = excluded.updated_at;

insert into public.recently_viewed (user_id, agent_id, last_viewed_at, last_counted_at)
values
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', '2026-06-16T10:00:00Z', '2026-06-16T10:00:00Z'),
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000004', '2026-06-16T09:00:00Z', '2026-06-16T09:00:00Z'),
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000007', '2026-06-15T09:00:00Z', '2026-06-15T09:00:00Z')
on conflict (user_id, agent_id) do update
set last_viewed_at = excluded.last_viewed_at,
    last_counted_at = excluded.last_counted_at;
