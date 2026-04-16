# Arbitration Platform — Handover Document

## Overview

A private arbitration case management platform operated by a law firm. It manages the full lifecycle of arbitration proceedings — from filing a Request for Arbitration through to award — with role-based access for all participants.

**Live URL:** https://arbitration-platform.vercel.app
**Backend:** http://152.70.201.154:3000 (Oracle Cloud VM)
**GitHub:** https://github.com/shuruti-ke/Arbitration_platform

---

## Architecture

```
Browser (Vercel)          Oracle Cloud VM (port 3000)         Oracle Autonomous DB
React + MUI     ──HTTPS──▶  Node.js HTTP server    ──TCP──▶  Users, Cases, Hearings,
(static build               (PM2, no Express)                 Documents, Audit Logs
 committed to git)
```

- **Frontend:** React 18 + Material UI. Built locally (`npm run build` in `frontend/`), committed to `frontend/build/`, served as static files by Vercel.
- **Backend:** Plain Node.js `http` module (no Express). Single file entry point `src/index.js`. Runs under PM2 on Oracle Linux.
- **Database:** Oracle Autonomous Database (oracledb v6, Thin mode). Connection config in `.env.oracle`.
- **Video:** Jitsi as a Service (JaaS) via 8x8.vc. RS256 JWT tokens generated per-user on join.
- **Email:** Gmail SMTP via Nodemailer (`myplatformai@gmail.com`).

---

## User Roles

| Role | Access |
|------|--------|
| **admin** | Full access — users, cases, documents, settings, analytics |
| **secretariat** | Create/manage cases, coordinate hearings and documents, create users |
| **arbitrator** | Review assigned cases, conduct hearings, issue awards |
| **counsel** | Represent client, file submissions and evidence |
| **party** | View own case, upload documents, attend hearings |

Admins and secretariat can create users via the **Users** page. A welcome email is automatically sent to new users with their credentials.

---

## Server Details

**Host:** Oracle Cloud Infrastructure (OCI) — Always Free tier
**IP:** 152.70.201.154
**OS:** Oracle Linux
**User:** `opc`
**Project directory:** `/home/opc/arbitration-platform`
**Process manager:** PM2

### SSH Access
```bash
ssh opc@152.70.201.154
```

### PM2 Commands
```bash
pm2 status                              # check if running
pm2 logs arbitration-platform          # live logs
pm2 logs arbitration-platform --lines 50 --nostream   # last 50 lines
pm2 restart arbitration-platform       # restart
pm2 start src/index.js --name arbitration-platform   # start after reboot
pm2 save                               # persist across reboots
```

---

## Environment Variables

File: `/home/opc/arbitration-platform/.env.oracle`

| Variable | Description |
|----------|-------------|
| `DB_USER` | Oracle DB username |
| `DB_PASSWORD` | Oracle DB password |
| `DB_CONNECTION_STRING` | Oracle connection string |
| `JWT_SECRET` | JWT signing secret |
| `EMAIL_USER` | `myplatformai@gmail.com` |
| `EMAIL_PASS` | Gmail App Password (named "Arbitration") |
| `JAAS_APP_ID` | JaaS App ID (`vpaas-magic-cookie-.../fd148e`) |
| `JAAS_API_KEY_ID` | JaaS API Key ID |
| `JAAS_PRIVATE_KEY` | RSA private key (base64-encoded PEM) |
| `GROQ_API_KEY` | Groq AI API key (optional) |
| `GEMINI_API_KEY` | Gemini AI API key (fallback, optional) |

---

## Deployment

### ⚠️ Do NOT use `git pull` on the server — it hangs the Oracle DB connection.

### Backend Deployment (per file)
```bash
cd ~/arbitration-platform
curl -fsSL https://raw.githubusercontent.com/shuruti-ke/Arbitration_platform/main/src/index.js -o src/index.js
curl -fsSL https://raw.githubusercontent.com/shuruti-ke/Arbitration_platform/main/src/services/<filename>.js -o src/services/<filename>.js
pm2 restart arbitration-platform
```

### Frontend Deployment
The frontend build must be done locally and committed to git. Vercel serves the committed `frontend/build/` directly.

```bash
# On local machine:
cd frontend
npm run build
cd ..
git add frontend/build
git commit -m "Rebuild frontend"
git push origin main
# Vercel auto-deploys on push
```

---

## Key Source Files

### Backend
| File | Purpose |
|------|---------|
| `src/index.js` | Main HTTP server — all API routes |
| `src/services/oracle-database-service.js` | Oracle DB connection, table init, `_addColumnSafe` |
| `src/services/user-service.js` | User CRUD, role management, `_safeUser` normalization |
| `src/services/auth-service.js` | Login, JWT issue/verify, logout |
| `src/services/hearing-service.js` | Hearing scheduling, JaaS JWT generation |
| `src/services/email-service.js` | Welcome email via Gmail SMTP |
| `src/config/app-config.js` | All configuration (DB, JWT, JaaS, email) |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/App.js` | Routes |
| `frontend/src/context/AuthContext.js` | Auth state, `hasRole` |
| `frontend/src/components/Navigation.js` | Top nav bar |
| `frontend/src/pages/Dashboard.js` | Role-based welcome panel |
| `frontend/src/pages/Cases.js` | Case list + 4-step creation wizard |
| `frontend/src/pages/CaseDetail.js` | Case overview, documents, hearings, audit |
| `frontend/src/pages/Hearings.js` | All hearings, schedule, join via JaaS |
| `frontend/src/pages/Users.js` | User management (admin/secretariat only) |
| `frontend/src/services/api.js` | All API calls (axios) |

---

## Database Tables

| Table | Contents |
|-------|----------|
| `USERS` | All platform users |
| `CASES` | Arbitration cases with NCIA-compliance fields |
| `PARTIES` | Claimants/respondents linked to cases |
| `CASE_COUNSEL` | Counsel linked to cases |
| `CASE_MILESTONES` | Timeline milestones per case |
| `DOCUMENTS` | Uploaded documents with metadata |
| `HEARINGS` | Scheduled hearings with JaaS room info |
| `AUDIT_LOGS` | Full audit trail of all actions |
| `CONSENTS` | AI/data processing consent records |

New columns are added safely using `_addColumnSafe()` which catches `ORA-01430` (column already exists).

---

## Default Admin Account

| Field | Value |
|-------|-------|
| Email | `admin@arbitration.platform` |
| Role | `admin` |
| Password | *(set at first deployment)* |

---

## Video Conferencing (JaaS)

- Provider: 8x8 JaaS (https://jaas.8x8.vc)
- Room URL format: `https://8x8.vc/{JAAS_APP_ID}/{roomName}?jwt={token}`
- JWT signed with RS256 using the private key in `.env.oracle`
- Moderator role granted to: `admin`, `secretariat`, `arbitrator`
- Rooms are auto-named: `arb-{caseId}-{hearingId}`

---

## Email Service

- Provider: Gmail SMTP (`smtp.gmail.com:587`)
- Sent from: `myplatformai@gmail.com`
- BCC on every welcome email: `myplatformai@gmail.com`
- Trigger: new user creation via `POST /api/auth/register`
- Gmail App Password name: **"Arbitration"**

---

## After a Server Reboot

```bash
ssh opc@152.70.201.154
cd ~/arbitration-platform
pm2 start src/index.js --name arbitration-platform
pm2 save
```

---

## Known Issues / Notes

- **`git pull` hangs** the Oracle DB — always use `curl` to deploy individual files
- **Oracle column names** are returned in UPPERCASE — `_safeUser()` normalizes them to camelCase
- **Frontend build** must be committed to git — Vercel does not run `react-scripts build`
- **Server reboots** lose PM2 process unless `pm2 save` was run — always run `pm2 save` after starting
