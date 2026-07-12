# Contributing

## Local workflow

1. Use Node.js 22 and install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Run the polished read-only showcase with `NEXT_PUBLIC_DEMO_MODE=true`, or start Supabase locally and use the values printed by `npm run db:start`.
4. Create database changes as migrations under `supabase/migrations` and keep Row Level Security and explicit grants in the same migration.
5. Run `npm run verify` before opening a pull request.

## Engineering conventions

- Keep TypeScript strict and avoid `any`.
- Keep Server Components as the default; move client boundaries down to the smallest interactive component.
- Put authorization in the data/action layer, not only in layouts or Proxy.
- Do not trust client-provided ownership IDs.
- Include loading, empty, error, success, mobile, and keyboard behavior for new flows.
- Do not commit `.env` files, service-role keys, generated credentials, `.next`, coverage, or local Supabase state.

Pull requests should describe the user outcome, validation performed, database and environment changes, and screenshots for visible UI changes.
