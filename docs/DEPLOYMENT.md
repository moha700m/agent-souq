# Deployment guide

Agent Souq can run on any Node.js 22 host. Vercel is the shortest path for the Next.js application, while Supabase provides managed Postgres, Auth, and Storage. Neither is required for the read-only showcase mode.

## Production Supabase

1. Create a Supabase project and link the local CLI with `npx supabase link --project-ref <project-ref>`.
2. Review the SQL in `supabase/migrations`, then apply it with `npx supabase db push`.
3. Configure the production site URL and the allowed redirect URLs in Supabase Auth. Include:
   - `https://your-domain.example/auth/callback`
   - `https://your-domain.example/auth/confirm`
4. Configure a production SMTP provider before inviting real users. Supabase's default email service is intended for development and is rate limited.
5. Keep the service-role key out of this app. The application is designed to use the publishable key with RLS.

The seed file is for local development. Do not run `supabase/seed.sql` against production.

## Application environment

Set these variables in the hosting platform:

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_DEMO_MODE=false
```

All variables prefixed with `NEXT_PUBLIC_` are visible to browsers. Never place a service-role key or another secret in one of them.

## Vercel

Import the GitHub repository, select the Next.js preset, add the four environment variables, and deploy. Use the same variables for Preview when testing real authentication, and add the preview callback domain to the Supabase redirect allow-list.

## Container deployment

The multi-stage `Dockerfile` produces a non-root standalone Next.js image:

```bash
docker build -t agent-souq .
docker run --rm -p 3000:3000 \
  --env-file .env.production \
  agent-souq
```

`NEXT_PUBLIC_*` values are compiled into the browser bundle. The default image above is therefore a demo image. For a configured production image, provide the public values while building as well as at runtime:

```bash
docker build -t agent-souq \
  --build-arg NEXT_PUBLIC_SITE_URL=https://your-domain.example \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
  --build-arg NEXT_PUBLIC_DEMO_MODE=false \
  .
```

The image health check calls `/api/health`. Terminate TLS at the hosting load balancer and forward the original host and protocol headers.

## Post-deploy checks

- Confirm `/api/health` reports a healthy application mode.
- Open the landing page, marketplace, and a seeded or production listing.
- Complete sign-up, email confirmation, onboarding, sign-out, and sign-in.
- Verify a member can favorite and install a free agent, but cannot mutate another user's records.
- Verify a creator can create, edit, publish, return to draft, and archive only their own listings.
- Check browser console and server logs for errors, then run the Supabase database advisors.
