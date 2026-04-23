# Platform Handover Document

**Last updated:** 2026-04-23
**Platform:** Nairobi Centre for International Arbitration (NCIA) Case Management System
**Repository:** https://github.com/shuruti-ke/Arbitration_platform

---

## Live Deployment

| Layer | Provider | URL / Address |
|---|---|---|
| Frontend | Vercel | https://arbitration-platform.vercel.app |
| Backend API | Oracle Cloud (Always Free) | http://152.70.201.154:3000 |
| Database | Neon (Serverless Postgres) | See `.env.oracle` on VM |
| API proxy | Vercel rewrites (`vercel.json`) | `/api/*` → Oracle VM |

---

## Infrastructure

### Oracle VM (Backend)
- **Instance:** VM.Standard.E2.1.Micro — 1 OCPU, 1 GB RAM (Always Free)
- **OS:** Oracle Linux
- **User:** `opc`
- **Home dir:** `/home/opc/arbitration-platform/`
- **Node.js:** v20.20.2 via NVM (`source /home/opc/.nvm/nvm.sh`)
- **Process manager:** PM2 (process ID 0, name `arbitration-backend`)
- **Entry point:** `src/index.js`
- **Env file:** `/home/opc/arbitration-platform/.env.oracle`

> **No git on VM.** Deploy by SCP'ing changed files directly, then restart PM2.

### SSH Access
- **Key file:** `C:\Users\shuru\Downloads\ssh-key-2026-04-14 (1).key`
- **Connect:**
  ```bash
  ssh -i "C:\Users\shuru\Downloads\ssh-key-2026-04-14 (1).key" -o StrictHostKeyChecking=no opc@152.70.201.154
  ```
- **SCP a file:**
  ```bash
  scp -i "C:\Users\shuru\Downloads\ssh-key-2026-04-14 (1).key" -o StrictHostKeyChecking=no src/index.js opc@152.70.201.154:/home/opc/arbitration-platform/src/index.js
  ```
- **Restart backend:**
  ```bash
  ssh -i "C:\Users\shuru\Downloads\ssh-key-2026-04-14 (1).key" -o StrictHostKeyChecking=no opc@152.70.201.154 "source /home/opc/.nvm/nvm.sh && pm2 restart arbitration-backend && pm2 status"
  ```

### Frontend Deploy
Push to `main` on GitHub — Vercel auto-deploys on every push. No manual step needed.

---

## Backend Environment Variables (`.env.oracle`)

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | 256-bit random hex — server refuses to start without it |
| `DATABASE_URL` | Neon Postgres connection string |
| `CORS_ORIGIN` | `https://arbitration-platform.vercel.app` |
| `OPENAI_API_KEY` | Primary AI provider |
| `QWEN_API_KEY` | Fallback AI (DashScope/Alibaba) |
| `NVIDIA_API_KEY` | Second fallback AI |
| `NODE_ENV` | `production` |

---

## Architecture

### Roles

| Role | Access |
|---|---|
| `admin` | Full access — user management, case assignment, payments, reports |
| `secretariat` | Case management, hearings, documents |
| `arbitrator` | Assigned cases only, hearings, documents, payments |
| `counsel` | Party/counsel cases only, documents |

### Key Workflows
1. **Case intake** → claimant submits → secretariat reviews → admin assigns arbitrator
2. **Payment** → admin issues invoice → arbitrator uploads proof → admin approves → case activates
3. **Hearings** → secretariat schedules → Jitsi video link generated → parties join
4. **Awards** → arbitrator drafts → hash stored in DB (`award_hashes` table) for tamper verification
5. **Compliance** → gap map checks platform workflows vs Kenya Arb Act Cap. 49; arbitrability check calls AI for legal analysis

### Authentication
- Tokens stored in `localStorage`, sent as `Authorization: Bearer` header on every request
- HttpOnly cookies also set (bonus layer; Vercel proxy does not reliably forward them)
- Access token: 1-hour expiry; refresh token: 7 days
- Token blacklist persisted in `token_blacklist` table (Neon DB) — survives restarts
- **Rate limit:** 5 failed logins per email/IP per 15 minutes → 429

---

## Database (Neon Postgres)

Key tables:

| Table | Purpose |
|---|---|
| `cases` | All arbitration cases |
| `users` | Platform users with roles |
| `documents` | Case documents (base64 stored in DB) |
| `payments` | Payment lifecycle: invoiced → proof_uploaded → paid |
| `hearings` | Scheduled hearings |
| `token_blacklist` | Revoked JWT tokens (SHA-256 hashed) |
| `award_hashes` | Tamper-evident award verification hashes |
| `case_agreements` | Signed arbitration agreements |

Security migration already applied: `scripts/migrate-security-tables.sql`

---

## Security Hardening (Pentest Remediations — 2026-04)

All 16 of 19 pentest findings remediated. F-017 is pending.

| ID | Finding | Status |
|---|---|---|
| F-001 | JWT_SECRET enforcement | ✅ Done — server exits if missing/default |
| F-002 | Login rate limiting | ✅ Done — 5 attempts/15 min per email+IP |
| F-003 | CORS wildcard | ✅ Done — `CORS_ORIGIN` required at startup |
| F-004 | Token blacklist on logout | ✅ Done — persisted to DB |
| F-005 | Unauthenticated endpoints | ✅ Done — auth added to 9 routes |
| F-006 | BOLA on documents | ✅ Done — party/counsel participant check |
| F-007 | AI error detail leak | ✅ Done — stripped from 500 responses |
| F-008 | Weak password policy | ✅ Done — 12-char minimum |
| F-009 | Milestone auth bypass | ✅ Done — arbitrator must be assigned to case |
| F-010 | Missing CSP header | ✅ Done — Content-Security-Policy on all responses |
| F-011 | Award hash volatility | ✅ Done — hashes persisted to DB |
| F-012 | Unbounded list queries | ✅ Done — LIMIT/OFFSET on all list endpoints |
| F-013 | JWT in localStorage | ✅ Done — Bearer header used; cookies as bonus layer |
| F-014 | Input validation | ✅ Already compliant |
| F-015 | Health endpoint info leak | ✅ Done — unauthenticated gets `{"status":"OK"}` only |
| F-016 | File type validation | ✅ Done — magic-byte check via `file-type` |
| F-017 | Admin credentials in git history | ⚠️ PENDING — run `git filter-repo`, rotate admin password |

---

## Planned Infrastructure Upgrade

`ignore/retry-create-instance.ps1` polls OCI to claim a **VM.Standard.A1.Flex** Always Free instance (4 OCPUs / 24 GB ARM). When it succeeds:

1. Provision Node.js + NVM + PM2 on new instance
2. Copy `.env.oracle` to new VM
3. SCP all source files
4. Update `vercel.json` rewrite destination to new IP
5. Verify health endpoint, then decommission E2.1.Micro

---

## Platform Pages

| Page | Route | Roles | Description |
|---|---|---|---|
| Dashboard | `/` | All | Role-tailored summary, payment/case stats |
| Cases | `/cases` | All | Case list, create, submit |
| Documents | `/documents` | All | Upload, AI analysis, extract text |
| Hearings | `/hearings` | All | Schedule, join via Jitsi |
| Compliance | `/compliance` | All | Gap map, legal sources, AI arbitrability check |
| Payments | `/payments` | Admin, Arbitrator | Invoice, proof upload, approve |
| Intelligence | `/intelligence` | Admin, Secretariat, Arbitrator | AI case analysis, admin reports |
| IP Arbitration | `/ip-arbitration` | Admin, Secretariat, Arbitrator, Counsel | IP-specific workflows |
| Court Filing | `/court-filing` | Admin, Secretariat, Arbitrator, Counsel | Compliance check for court submissions |
| Training | `/training` | All | AI-generated training modules + exam |
| Users | `/users` | Admin | Manage users, roles, passwords |
| Analytics | `/analytics` | All | Case and platform analytics |

---

## Common Operations

### Deploy a backend change
```bash
# 1. Edit src/index.js (or other src file) locally
# 2. SCP to VM
scp -i "C:\Users\shuru\Downloads\ssh-key-2026-04-14 (1).key" -o StrictHostKeyChecking=no src/index.js opc@152.70.201.154:/home/opc/arbitration-platform/src/index.js

# 3. Restart
ssh -i "C:\Users\shuru\Downloads\ssh-key-2026-04-14 (1).key" -o StrictHostKeyChecking=no opc@152.70.201.154 "source /home/opc/.nvm/nvm.sh && pm2 restart arbitration-backend"
```

### Check backend logs
```bash
ssh -i "C:\Users\shuru\Downloads\ssh-key-2026-04-14 (1).key" -o StrictHostKeyChecking=no opc@152.70.201.154 "source /home/opc/.nvm/nvm.sh && pm2 logs arbitration-backend --lines 50"
```

### Deploy frontend
```bash
git push origin main   # Vercel auto-deploys in ~1 minute
```

### Rotate JWT_SECRET
```bash
# Generate new secret locally
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update on VM (replace NEW_VALUE)
ssh -i "C:\Users\shuru\Downloads\ssh-key-2026-04-14 (1).key" -o StrictHostKeyChecking=no opc@152.70.201.154 \
  "sed -i 's/^JWT_SECRET=.*/JWT_SECRET=NEW_VALUE/' /home/opc/arbitration-platform/.env.oracle && source /home/opc/.nvm/nvm.sh && pm2 restart arbitration-backend"
```

### Check VM health
```bash
curl https://arbitration-platform.vercel.app/api/health
# Expected: {"status":"OK"}
```
