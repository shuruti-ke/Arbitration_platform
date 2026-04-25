# Security Review Baseline

## Authentication

- `JWT_SECRET` is mandatory at startup and must not use the historical default.
- Access tokens expire through `JWT_EXPIRES_IN`; refresh tokens expire after 7 days.
- Login is rate-limited by email and IP address.
- Protected routes require `Authorization: Bearer` or the HttpOnly `access_token` cookie.
- `/api/auth/me` rejects stale tokens whose user no longer exists or is inactive.

## Authorization

- Admin-only operations include users, AI models, rules, metrics, intelligence reports, and operator status.
- Secretariat operations include case/hearing/document administration where route roles allow it.
- Counsel and party access must remain case-scoped for documents and case data.

## Production Data Safety

- Production refuses to start when the database is unavailable.
- User, audit, consent, and hearing workflows fail loudly in production instead of silently relying on memory-only state.
- `/api/ready` is the deployment gate and must return 200 before traffic is considered healthy.

## Remaining Security Work

- Rotate the historical admin password and remove credentials from git history.
- Move login rate limiting to a shared persistent store if more than one backend instance is introduced.
- Add automated BOLA regression tests for case, document, hearing, and payment ownership.
- Add external error tracking with PII scrubbing before sending payloads outside the platform.
