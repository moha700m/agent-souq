# Agent Souq — MVP acceptance criteria

These criteria define the release boundary. “Configured mode” means valid Supabase URL and publishable-key variables are present. “Demo mode” means the explicit or safe local read-only fallback is active.

## Public experience

- **PUB-01 — Landing:** Given any visitor opens `/`, the page presents a clear marketplace value proposition, featured agents, popular categories, and working links to marketplace, authentication, and creator entry points.
- **PUB-02 — Marketplace:** Given a visitor opens `/agents`, published and approved listings are shown in responsive cards with price, category, creator, rating, and meaningful empty/loading/error states.
- **PUB-03 — Shareable filters:** When a visitor searches, chooses a category or price type, changes sort, or changes page, the selection is represented by validated URL query parameters and can be shared or refreshed.
- **PUB-04 — Search coverage:** Keyword search matches relevant listing name, tagline, description, tags, capabilities, category, or creator fields without exposing drafts or unapproved listings.
- **PUB-05 — Stable order:** Given two listings have equal primary sort values, repeated requests return a deterministic order using a unique tie-breaker.
- **PUB-06 — Invalid query:** When query text exceeds 100 characters, an enum is invalid, or pagination is out of bounds, the API returns HTTP 400 with normalized JSON and the page presents a recoverable error.
- **PUB-07 — Pagination clamp:** When a requested page is beyond the final page, results resolve to the final valid page instead of returning an internally inconsistent count.
- **PUB-08 — Detail:** A valid published listing route displays its media, content, capabilities, instructions, version, pricing, aggregate counts, reviews, creator link, and related agents; an unknown or non-public slug returns a not-found state.
- **PUB-09 — Visual fallback:** A valid HTTPS cover or gallery image renders as media; if it fails at runtime, an accessible branded fallback replaces it without a broken-image control.
- **PUB-10 — Gallery:** Up to five listing gallery visuals are reachable and keyboard-accessible on the detail page.
- **PUB-11 — Creator profile:** A public creator route displays creator identity and only that creator's published, approved listings; members without creator access do not have a public creator storefront.
- **PUB-12 — SEO:** Public pages provide meaningful title/description metadata, robots rules, sitemap entries, social-preview metadata, and a language declaration.

## Authentication and onboarding

- **AUTH-01 — Sign-up validation:** Sign-up requires a valid email, full name of 2–80 characters, and matching 10–128 character passwords containing lower-case, upper-case, and numeric characters.
- **AUTH-02 — Sign-up privacy:** Sign-up confirmation does not reveal whether the submitted email already exists.
- **AUTH-03 — Sign-in:** Valid credentials create a persistent Supabase session; invalid credentials return a generic email-or-password error.
- **AUTH-04 — Safe return path:** A protected-route sign-in round trip can return to a same-origin relative path, while scheme-relative paths, backslashes, control characters, and external URLs fall back to `/dashboard`.
- **AUTH-05 — Protected routes:** An unauthenticated request to `/dashboard`, `/creator`, or `/onboarding` redirects to sign-in with its safe return path; protected responses are marked private and non-cacheable.
- **AUTH-06 — Password reset privacy:** The reset request always displays a generic result; a valid recovery callback allows a strong new password to be saved.
- **AUTH-07 — Sign-out:** Signing out clears the active session and returns to a public route.
- **AUTH-08 — Onboarding:** A newly authenticated user must choose a valid unique username and full name before using protected product flows; a completed user does not re-enter onboarding unintentionally.
- **AUTH-09 — Profile recovery:** If Auth contains a valid user but the profile row is missing, a safe unique member profile is created before protected profile data is used.

## Member workspace

- **MEM-01 — Profile:** A member can update only their own username, name, biography, HTTPS avatar URL, and HTTPS website URL; validation errors remain associated with the relevant fields.
- **MEM-02 — Favorites:** An authenticated member can favorite and unfavorite a public listing, immediately see the resulting state, and find favorites in the saved dashboard; another member's favorites are unreadable.
- **MEM-03 — Recent views:** Opening a public listing as an authenticated non-owner records or refreshes one recent-view record and increments view analytics according to the database deduplication rule; anonymous browsing stores no user history.
- **MEM-04 — Free install:** Installing a published free agent creates an installation owned by the authenticated member and makes it appear in their library.
- **MEM-05 — Idempotent install:** Repeating installation of the same free agent returns success and leaves exactly one installation; it never removes an existing installation.
- **MEM-06 — Paid boundary:** A one-time or subscription listing cannot create an installation through the free-install operation and presents a clear unavailable/coming-soon purchase action.
- **MEM-07 — Review eligibility:** A member can create or update one 1–5 star review only after installing the agent and cannot review their own listing.
- **MEM-08 — Review management:** The author can edit or delete their review from the product UI; other users cannot update or delete it.
- **MEM-09 — Dashboard states:** Saved, recent, library, reviews, and profile views have useful loading, empty, error, and success feedback and do not expose another user's private rows.

## Creator studio

- **CRT-01 — Activation:** An onboarded member can explicitly become a creator; non-onboarded users cannot activate creator access.
- **CRT-02 — Create draft:** A creator can create an owned draft even when publish-only fields are incomplete; ownership is derived from the session, not request input.
- **CRT-03 — Edit ownership:** A creator can edit their own draft or published listing but cannot edit another creator's listing or an archived listing.
- **CRT-04 — Field validation:** Listing input enforces bounded name, slug, tagline, description, instructions, category, unique tags/capabilities, pricing, semantic version, HTTPS URLs, and at most five gallery images on both server and database boundaries.
- **CRT-05 — Publish validation:** Publication fails with actionable field errors unless all required content is complete, pricing is coherent, and at least one cover or gallery visual exists.
- **CRT-06 — Publish ownership:** A successful publish operation targets only an owned draft, changes it to published, and sets its initial publication time on the database; client input cannot choose that timestamp.
- **CRT-07 — Publication timestamp:** Editing or re-publishing a listing does not silently replace its original publication timestamp.
- **CRT-08 — Visibility:** A listing is publicly discoverable only when its lifecycle state is published and moderation state is approved.
- **CRT-09 — Return to draft:** The owner can return a published listing to draft, after which it disappears from public catalogue and detail queries.
- **CRT-10 — Archive:** The owner can archive an eligible listing; it becomes non-public and cannot be edited through normal creator mutation paths.
- **CRT-11 — Analytics:** The creator overview shows aggregate listing, published, view, favorite, install, and review counts derived from owned listings; users cannot directly write counter columns.
- **CRT-12 — Preview:** The studio provides a useful preview for unpublished content and a working public link after publication.

## Data, permissions, and security

- **SEC-01 — Server identity:** No mutation accepts or trusts a client-provided owner, creator, reviewer, or member ID; every private operation derives identity from verified server claims.
- **SEC-02 — RLS:** Row-level security is enabled on all user-owned, creator-owned, review, interaction, report, and storage objects with explicit least-privilege policies.
- **SEC-03 — Profile privacy:** Public profile reads expose storefront-safe fields only; role, onboarding state, suspension details, and moderation notes are not anonymously selectable.
- **SEC-04 — System fields:** Publication timestamps, moderation fields, verification, ownership, and aggregate counters cannot be directly set by ordinary authenticated clients.
- **SEC-05 — Input constraints:** Database constraints reject invalid pricing, unsafe URL schemes, dirty/duplicate arrays, invalid status combinations, and out-of-range reviews even if application validation is bypassed.
- **SEC-06 — Storage ownership:** Listing media writes are scoped to an authenticated creator's own path and accepted content limits; public media reads do not grant listing mutation rights.
- **SEC-07 — Errors:** Database and authentication details are normalized into user-safe errors; stack traces, SQL, service keys, and account-enumeration signals are absent from client responses.
- **SEC-08 — Security headers:** Responses disable MIME sniffing and framing, use a strict referrer policy, isolate the opener, and disable unnecessary browser permissions.
- **SEC-09 — Secrets:** No secret or local environment file is committed; browser bundles receive only public Supabase and site variables.
- **SEC-10 — Authorization tests:** Automated tests prove representative cross-user listing, favorite, installation, review, profile, and report operations are denied.

## Runtime, quality, and UX

- **OPS-01 — Reproducible database:** Starting local Supabase and running the documented reset command applies migrations and deterministic seed data without manual SQL edits.
- **OPS-02 — Honest demo:** Without credentials in local development, the app renders representative marketplace and dashboard content with a visible read-only indication; mutations explain that persistence is disabled.
- **OPS-03 — Misconfiguration:** Partial credentials or missing production credentials produce an explicit configuration failure and never silently fall back to fake production data.
- **OPS-04 — Responsive:** Landing, marketplace, detail, authentication, dashboard, and creator forms remain usable at 320 px width and at desktop breakpoints without horizontal page overflow.
- **OPS-05 — Accessibility:** Interactive controls have accessible names, forms have programmatically associated labels and errors, focus is visible, dialogs/menus are keyboard operable, semantic landmarks are valid, and informative images have alternatives.
- **OPS-06 — Motion and theme:** Theme controls remain keyboard-accessible and color contrast is usable in supported themes; motion respects reduced-motion preferences.
- **OPS-07 — Working actions:** Every visible control either completes its flow, is disabled with a reason, or is labelled coming soon; no primary action is a dead placeholder.
- **OPS-08 — Verification:** `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` all exit successfully on the supported Node version.
- **OPS-09 — Critical tests:** Tests cover validation, safe redirects, marketplace API failures, interaction idempotency, visual fallback, pricing display, and database authorization contracts.
- **OPS-10 — Documentation:** Setup, environment variables, demo/configured behavior, migrations, seed users, verification commands, security model, known limits, and deployment steps are documented without credentials.
