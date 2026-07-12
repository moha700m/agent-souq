# Agent Souq

Agent Souq is a polished marketplace for discovering, publishing, saving, installing, and reviewing focused AI agents. It ships with a complete public catalogue, member workspace, creator studio, Supabase-backed identity and authorization, and a truthful read-only showcase mode that works without cloud credentials.

The MVP deliberately installs free agents only. One-time and subscription offers are visible for market validation, but the UI never creates a paid entitlement before payments and verified webhooks exist.

## Stack

- Next.js 16 App Router, React 19, and strict TypeScript
- Tailwind CSS 4, Radix primitives, CVA, Lucide, Geist, and `next-themes`
- Supabase Auth, PostgreSQL, Row Level Security, RPCs, and Storage
- Zod validation and Server Actions
- Vitest, Testing Library, Supabase CLI, and GitHub Actions
- Standalone Node.js output and a non-root multi-stage Docker image

## What is included

- Premium responsive landing page, categories, featured listings, dark mode, and SEO metadata
- Marketplace search, category/pricing filters, stable sorting, pagination, loading, empty, error, and not-found states
- Agent detail pages with real visual media, gallery fallback, ratings, reviews, related listings, and creator storefronts
- Email/password sign-up and sign-in, session refresh, sign-out, password recovery, callbacks, and protected routes
- Required onboarding and missing-profile recovery
- Member profile, saved agents, recent history, installed free-agent library, and review management
- Creator activation, draft creation/edit/delete, publish validation, return-to-draft, archive, preview, and aggregate analytics
- Reproducible schema, RLS, storage policies, deterministic seed data, API handlers, security headers, tests, and CI
- Admin-ready roles, reports, moderation and featured fields, with payment-ready boundaries documented separately

## Quick start: read-only showcase

Requirements: Node.js 22.12 or newer and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The example environment enables demo mode. Open [http://localhost:3000](http://localhost:3000). The catalogue and dashboards use curated fixtures; account mutations clearly report that demo mode is read-only.

## Full local setup with Supabase

Docker is required for the local Supabase stack.

```bash
npm ci
npm run db:start
npm run db:reset
```

Copy `.env.example` to `.env.local`, then replace its values with the API URL and publishable/anon key printed by `npm run db:start`:

```text
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable or anon key>
NEXT_PUBLIC_DEMO_MODE=false
```

Start the application:

```bash
npm run dev
```

Local seed accounts all use password `AgentSouq1!`:

| Role | Email |
| --- | --- |
| Verified creator | `creator@agentsouq.local` |
| Verified creator | `studio@agentsouq.local` |
| Member | `member@agentsouq.local` |

These accounts are development fixtures only. Never copy `supabase/seed.sql` data into production.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical site and Auth callback origin |
| `NEXT_PUBLIC_SUPABASE_URL` | Configured mode | Supabase project or local API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Configured mode | Browser-safe publishable key; legacy anon key is also accepted |
| `NEXT_PUBLIC_DEMO_MODE` | Yes | `true` for the read-only showcase, `false` for Supabase persistence |

Do not add a service-role key. Every `NEXT_PUBLIC_` value is visible to browsers. Partial credentials or missing production credentials fail explicitly instead of silently showing demo data.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run strict TypeScript checking |
| `npm test` | Run the Vitest suite once |
| `npm run test:coverage` | Run tests with coverage |
| `npm run verify` | Lint, type-check, test, and build |
| `npm run db:start` | Start local Supabase |
| `npm run db:reset` | Reapply migrations and seed data |
| `npm run db:test` | Run pgTAP cross-user RLS and RPC tests |
| `npm run db:stop` | Stop local Supabase |

## Architecture

Public and authenticated pages are Server Components by default. Small Client Components own forms, themes, safe image failure behavior, and action feedback. Server Actions parse intent with Zod, resolve the verified Supabase subject, and call the data layer or narrow RPC. PostgreSQL is the final authorization boundary: RLS, explicit grants, constraints, and triggers protect ownership and system-maintained fields.

```text
Browser UI → Next.js routes/actions → validation and auth → data services
                                                    → Supabase RLS/RPC/Auth/Storage
```

The runtime data adapter has three explicit modes:

- `demo`: curated read-only data with visible disclosure
- `supabase`: persistent Auth, Postgres, RPC, and Storage behavior
- `misconfigured`: safe service failure; never fake production data

See [product definition](docs/PRODUCT.md), [acceptance criteria](docs/ACCEPTANCE_CRITERIA.md), and [architecture](docs/ARCHITECTURE.md) for the complete boundaries and rationale.

## Database summary

- `profiles`: public creator/reviewer identity plus private role and onboarding state
- `categories`: controlled marketplace taxonomy
- `agents`: creator-owned content, lifecycle, moderation, featured rank, pricing, search document, and aggregate counters
- `favorites`: private unique saved relationships
- `installations`: private unique entitlements; the MVP RPC admits published free listings only
- `reviews`: one eligible review per user/listing after installation; self-review is blocked
- `recently_viewed`: private deduplicated view history
- `reports`: admin-ready report intake
- `storage.objects`: public reads and authenticated creator-path writes for `agent-media`

The initial migration also provides stable full-text search, lifecycle RPCs, idempotent free install, counter triggers, immutable first-publication timestamps, explicit table/function grants, and RLS on every exposed application table.

## Security notes

- Owner, creator, reviewer, and member IDs come from verified server claims, never form input.
- Supabase publishable keys are safe to expose only because every reachable object has least-privilege grants and RLS.
- Creator ownership, role, moderation, verification, featured state, publication timestamp, and counters are database-controlled.
- Password and Auth responses avoid account enumeration, and return paths reject external or ambiguous URLs.
- External media and profile URLs must use HTTPS; uploaded listing media is size/type/path constrained.
- Protected responses are private and non-cacheable. Standard headers prevent framing, MIME sniffing, opener access, and unnecessary device permissions.

Read [SECURITY.md](SECURITY.md) before changing identity, RLS, RPC, storage, or lifecycle code.

## Deployment

Vercel plus a hosted Supabase project is the recommended path. Any Node.js 22 host can run the generated standalone server, and the included `Dockerfile` builds a non-root image with a health check.

See [deployment instructions](docs/DEPLOYMENT.md) for production Auth redirects, migration steps, container build arguments, and post-deploy checks.

## Known MVP limits

- Agent execution, prompt proxying, provider secrets, usage metering, and model billing are outside this marketplace MVP.
- Paid listings are discoverable, but checkout, subscriptions, refunds, payouts, and paid entitlements are intentionally not simulated.
- Report intake and moderation fields are present; a full admin console and audit trail are the next platform increment.
- The interface ships in English. Components, logical layout, and data boundaries are prepared for future Arabic/RTL localization.
- External HTTPS image URLs are supported alongside Supabase Storage; an upload manager can be added without changing listing ownership.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Run `npm run verify` and a local `npm run db:reset` before proposing security-sensitive changes.
