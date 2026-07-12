# Security policy

## Supported versions

Security fixes are applied to the latest commit on `main`. Agent Souq is currently pre-1.0 and does not maintain security branches for older snapshots.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private vulnerability reporting for this repository. Include the affected route or database object, reproduction steps, impact, and any suggested mitigation.

Please do not include production credentials, access tokens, personal data, or customer records in a report. Rotate any credential that may have been exposed before sharing diagnostic details.

## Security model

- Supabase Row Level Security is the primary data authorization boundary.
- Server Actions repeat authentication and ownership checks close to each mutation.
- Browser code receives only the Supabase publishable key. A service-role key is neither required nor accepted by this application.
- Creator-owned storage paths are isolated by the authenticated user ID.
- Demo mode is read-only and never simulates persistence.
- Input is validated with Zod before it reaches business logic, with database constraints as a second boundary.

Run `npm run verify` and the local Supabase reset before proposing a security-sensitive change.
