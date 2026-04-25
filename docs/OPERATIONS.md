# Operations Runbook

## Production Principles

- Production must start with a live database connection. Memory-backed behavior is only allowed in development.
- `/api/health` is public and intentionally minimal.
- `/api/ready` is public and returns `503` when the database is not connected.
- `/api/ops/status` is admin-only and returns runtime, database, and configuration checks.
- Backend logs are JSON lines with a request ID. Do not log passwords, tokens, cookies, secrets, or authorization headers.

## Deploy Checklist

1. Run `npm ci`.
2. Run `npm run test:ci`.
3. Run `npm run migrate` with the production `DATABASE_URL`.
4. Build the frontend with `cd frontend && npm ci && npm run build`.
5. Deploy backend files to `/home/opc/arbitration-platform/`.
6. Restart exactly one PM2 process:
   ```bash
   source /home/opc/.nvm/nvm.sh
   pm2 delete arbitration-backend || true
   pm2 start src/index.js --name arbitration-backend --cwd /home/opc/arbitration-platform
   pm2 save
   ```
7. Verify:
   ```bash
   curl -f http://152.70.201.154:3000/api/ready
   curl -f https://arbitration-platform.vercel.app/api/health
   ```

## Rollback

1. Keep a timestamped copy of every deployed backend file before overwriting it.
2. If `/api/ready` fails after deploy, restore the previous file set.
3. Restart PM2 and verify `/api/ready`.
4. For frontend failures, promote the previous Vercel deployment.

## Monitoring

- Poll `/api/ready` every minute from an external monitor.
- Alert on any non-2xx response, response time over 5 seconds, or repeated restarts in PM2.
- Check `pm2 logs arbitration-backend --lines 100` for JSON entries with `level:"error"`.

## Backup And Recovery

- Neon automated backups must be enabled on the project.
- Before risky migrations, take a Neon branch or snapshot.
- Store a secure copy of `.env.oracle` outside the VM.
- Recovery order: restore Neon, restore `.env.oracle`, deploy backend files, run migrations, restart PM2, verify `/api/ready`.

## Data Retention

- Audit events should be retained for at least 5 years unless a stricter institutional policy applies.
- Token blacklist rows can be purged after `expires_at`.
- Case documents, awards, consents, and payment records should not be deleted without an administrator action and an audit entry.
