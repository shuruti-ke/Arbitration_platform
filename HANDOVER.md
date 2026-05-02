# Platform Handover Document

**Last updated:** 2026-05-02  
**Platform name:** Rafiki Arbitration  
**Public URL:** https://arbitration-platform.vercel.app  
**Repository:** https://github.com/shuruti-ke/Arbitration_platform

---

## Current Live Deployment

| Layer | Provider | URL / Address | Notes |
|---|---|---|---|
| Frontend | Vercel | https://arbitration-platform.vercel.app | Production alias for the React app |
| Backend API | OVH VPS | https://vps-5968ce23.vps.ovh.us | Vercel rewrites `/api/*` here |
| Backend host IP | OVH VPS-2 | 135.148.120.31 | Ubuntu 24.04 reinstall completed 2026-05-02 |
| Database | Neon Postgres | `DATABASE_URL` in `.env.oracle` on OVH | Production data store |
| Video provider | Daily.co | Embedded Daily rooms | Jitsi fallback removed |
| AI provider | OpenAI / configured fallbacks | API keys in backend env | Used by AI draft award and intelligence features |

`vercel.json` currently rewrites:

```json
"/api/:path*" -> "https://vps-5968ce23.vps.ovh.us/api/:path*"
```

---

## 2026-05-02 Update Summary

### Infrastructure
- Migrated the live backend route away from the old Oracle VM to the new OVH VPS.
- New OVH VPS details:
  - **Plan:** VPS-2
  - **Location:** US-EAST-VA / Virginia
  - **vCPU:** 6
  - **RAM:** 12 GB
  - **Storage:** 100 GB NVMe
  - **OS:** Ubuntu 24.04
  - **IPv4:** `135.148.120.31`
  - **Hostname:** `vps-5968ce23.vps.ovh.us`
  - **SSH user:** `ubuntu`
- Backend app directory on OVH:
  - `/home/ubuntu/arbitration-platform`
- PM2 process:
  - `arbitration-backend`
- Backend should be managed from the app directory:

```bash
cd /home/ubuntu/arbitration-platform
pm2 status
pm2 logs arbitration-backend --lines 80
pm2 restart arbitration-backend
```

### Frontend and Branding
- Login page now uses the name **Rafiki Arbitration**.
- Login hero text was replaced with the Lady Justice image:
  - `frontend/public/login-justice.jpg`
- Added login tagline:
  - `An advanced AI enabled arbitration platform using RafikiAi`
- Removed:
  - `Your role is detected automatically from your credentials.`
- Production deploy completed and aliased to:
  - https://arbitration-platform.vercel.app

### Hearings and Video
- Replaced Jitsi/JaaS with embedded Daily.co meeting rooms.
- Jitsi fallback was removed from backend and frontend.
- Vercel headers now allow Daily camera, microphone, display capture, frames, websocket, media, and API connections.
- Daily meeting joins are embedded in the platform so users can access the platform while in a meeting.
- Daily room creation enables:
  - private rooms
  - cloud recording
  - transcription storage where supported by the Daily account
  - live captions UI
  - screen sharing
  - chat
  - prejoin disabled
  - camera/microphone initially allowed
- Fixed Daily joins for old/expired hearing records by ensuring token and room expiry are always pushed into the future.

### Database and Migrations
- Neon remains the production database.
- Migration runner added/updated:
  - `scripts/run-migrations.js`
- Current migration list:
  - `scripts/migrate-security-tables.sql`
  - `scripts/migrate-tax-and-settings.sql`
  - `scripts/migrate-ai-award-drafts.sql`
- AI award drafts table added:

```sql
ai_award_drafts (
  id,
  draft_id,
  case_id,
  arbitrator_id,
  prompt_version,
  source_snapshot_hash,
  draft_text,
  draft_json,
  status,
  created_at,
  reviewed_at
)
```

- Indexes added:
  - `idx_ai_award_drafts_case_arbitrator`
  - `idx_ai_award_drafts_snapshot`
- The migration runner requires `DATABASE_URL` and loads `.env.oracle`.

### Backend Fixes and Hardening
- Fixed Neon named-parameter conversion so PostgreSQL casts like `::text[]` are not broken.
- `/api/auth/me` now handles stale/deleted-user tokens without throwing avoidable 500s.
- User creation no longer reports success when the production DB insert fails.
- Admin seeding startup race was addressed.
- Comprehensive/system tests were hardened so request failures can fail the test process instead of being logged as a false pass.
- Payment rendering guard added so missing case data does not crash the frontend.

### Arbitrator Workspace
- Arbitrator dashboard was converted from a mostly static landing page into a more actionable workspace.
- Added proceeding command center, case controls, quick actions, hearing actions, award pack access, and AI draft award entry points.
- Fixed `GavelIcon is not defined` crash.
- Improved case overview UX:
  - stronger hierarchy
  - case progress
  - clearer financial/date details
  - better action sections
  - better empty states
  - clearer AI Draft Award label

### AI Draft Award
- Added arbitrator-only AI draft award flow.
- Route is case-specific:
  - `/api/cases/:caseId/ai-award-draft`
- Only the assigned arbitrator should see and generate the draft.
- Purpose: assist the arbitrator in preparing the actual arbitral award. The draft is advisory and must be independently reviewed, edited, and adopted by the arbitrator.
- Requires an AI provider key in backend env. If no provider is configured, the UI shows `No AI provider configured`.

---

## Backend Environment Variables

Production env lives on the OVH server in:

```bash
/home/ubuntu/arbitration-platform/.env.oracle
```

Do not commit secret values. Required/important keys include:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Backend port, normally `3000` |
| `JWT_SECRET` | Required signing secret |
| `DATABASE_URL` | Neon Postgres connection string |
| `CORS_ORIGIN` | `https://arbitration-platform.vercel.app` |
| `OPENAI_API_KEY` | Primary AI provider |
| `QWEN_API_KEY` | Optional AI fallback |
| `NVIDIA_API_KEY` | Optional AI fallback |
| `DAILY_API_KEY` | Daily.co REST API key |
| `DAILY_DOMAIN` | Daily domain, for example `rafikihr.daily.co` |
| `DAILY_AUTO_RECORD` | Daily recording behavior flag |
| `DAILY_AUTO_TRANSCRIBE` | Daily transcription behavior flag |
| `DAILY_CLOSE_TAB_ON_EXIT` | Daily exit behavior flag |

Known Daily env check on OVH showed these keys present:

```bash
DAILY_API_KEY=set
DAILY_DOMAIN=set
DAILY_AUTO_RECORD=set
DAILY_AUTO_TRANSCRIBE=set
DAILY_CLOSE_TAB_ON_EXIT=set
```

---

## Database

### Production Database
- Provider: Neon Serverless Postgres
- Connection: `DATABASE_URL` in OVH `.env.oracle`
- Backend DB service: `src/services/neon-database-service.js`

### Key Tables

| Table | Purpose |
|---|---|
| `users` | Platform users and roles |
| `cases` | Arbitration matters |
| `parties` | Case parties |
| `case_counsel` | Counsel assignments |
| `documents` | Case document records |
| `hearings` | Hearing records |
| `hearing_participants` | Join/participant tracking |
| `payments` | Invoice/proof/payment workflow |
| `token_blacklist` | Revoked JWT token hashes |
| `award_hashes` | Tamper-evident award verification hashes |
| `case_agreements` | Arbitration agreement records |
| `tax_settings` | Tax/payment settings |
| `ai_award_drafts` | Arbitrator-only AI draft award records |

### Run Migrations

From the backend app directory on OVH:

```bash
cd /home/ubuntu/arbitration-platform
node scripts/run-migrations.js
pm2 restart arbitration-backend
```

---

## Architecture

### Roles

| Role | Access |
|---|---|
| `admin` | Full access, users, case assignment, payments, reports |
| `secretariat` | Case management, hearings, documents |
| `arbitrator` | Assigned cases, hearings, documents, awards, AI draft award |
| `counsel` | Party/counsel cases and documents |
| `party` | Own cases, documents, hearings where allowed |

### Key Workflows

1. Case intake -> claimant submits -> secretariat/admin review -> arbitrator assignment.
2. Payments -> invoice/proof/approval workflow.
3. Hearings -> scheduled in platform -> Daily room created/joined inside platform.
4. Evidence/documents -> uploaded and tied to case records.
5. AI draft award -> assigned arbitrator generates advisory award draft from case materials.
6. Award pack -> arbitrator prepares final award artifacts.
7. Audit/timeline -> case actions visible in case tabs.

---

## Platform Pages

| Page | Route | Roles | Notes |
|---|---|---|---|
| Dashboard | `/` | All | Role-tailored workspace |
| Cases | `/cases` | All | Case list and creation |
| Case Detail | `/cases/:caseId` | Authorized case users | Overview, parties, counsel, docs, hearings, audit, award pack, AI draft |
| Documents | `/documents` | All | Upload and manage documents |
| Hearings | `/hearings` | All | Schedule/manage/join Daily meetings |
| Payments | `/payments` | Admin, Arbitrator | Invoice and payment proof workflows |
| Intelligence | `/intelligence` | Admin, Secretariat, Arbitrator | AI-assisted analysis |
| Compliance | `/compliance` | All | Compliance/gap map/legal analysis |
| Users | `/users` | Admin | User management |
| Analytics | `/analytics` | All | Platform analytics |
| Login | `/login` | Public | Rafiki Arbitration branded sign-in |

---

## Deployment Operations

### Frontend

Production frontend is deployed through Vercel.

```bash
cd C:\Users\shuru\Documents\AIProjects\Arbitration_Platform
npm run build --prefix frontend
git push origin main
vercel --prod --yes
```

Vercel project:

```bash
vercel ls
vercel env ls
vercel logs
```

### Backend on OVH

Use curl/small-file updates where possible because the VM is sensitive and should not be overloaded by heavy operations.

```bash
ssh -i .\ovh-vps-135-148-120-31_ed25519 ubuntu@135.148.120.31
cd /home/ubuntu/arbitration-platform
pm2 status
pm2 logs arbitration-backend --lines 80
pm2 restart arbitration-backend
```

Health check:

```bash
curl https://arbitration-platform.vercel.app/api/health
```

Expected unauthenticated response:

```json
{"status":"OK"}
```

### Backend Deploy Note

The old handover said there was no git on the VM and to SCP files to Oracle. That is no longer the live deployment path. The live backend is OVH. Prefer small, targeted file transfers or curl-based updates, then restart PM2.

---

## Security and Reliability Notes

- `JWT_SECRET` is required; backend must not run with a default value.
- `CORS_ORIGIN` should remain locked to the Vercel production domain.
- Do not restore production memory fallbacks for DB writes. Production DB failures should fail loudly.
- Keep Neon migrations explicit and committed.
- Keep Daily/Jitsi split clean: Jitsi has been removed from the active hearing flow.
- Keep the Vercel CSP and Permissions-Policy in sync with Daily requirements.
- Monitor PM2 logs after deploys.
- Bundle size remains above CRA recommendations; code splitting is still a future improvement.

### Open Security Item

| ID | Finding | Status |
|---|---|---|
| F-017 | Admin credentials in git history | Pending: run history cleanup and rotate affected credentials |

---

## Recent Commit Log

Latest relevant commits on `main`:

| Commit | Summary |
|---|---|
| `21cc1dc` | Update login branding to Rafiki Arbitration |
| `b007cac` | Replace login headline with justice image |
| `68dcf52` | Allow Daily joins for expired hearing records |
| `69967f9` | Remove Jitsi fallback from hearings |
| `1285d27` | Refine case overview card layout |
| `0bc0a4d` | Implement login and arbitrator UX improvements |
| `d618c7e` | Improve case overview UX |
| `a75df63` | Polish arbitrator workspace UI |
| `98de3af` | Guard payments rendering against missing case data |
| `21ee8c8` | Fix arbitrator dashboard gavel icon import |
| `c77fd33` | Make arbitrator dashboard actionable |
| `2e5a3e0` | Replace Jitsi hearings with Daily dock |
| `2a9f059` | Add arbitrator-only AI draft awards |
| `0f3eac4` | Migrate backend routing to OVH VPS |

---

## Immediate Next Checks

1. Verify `/api/health` through Vercel after every backend restart.
2. Verify login with an arbitrator account.
3. Open an assigned case and confirm the AI Draft Award tab is visible only to the arbitrator.
4. Join a Daily hearing from inside the platform and confirm microphone/camera permissions.
5. Run migrations after any DB schema pull/deploy.
6. Check PM2 logs for 5xx errors after deploys.
