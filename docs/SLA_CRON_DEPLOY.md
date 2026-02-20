# SLA Alerts Scheduler Deployment

Last updated: 2026-02-14

This guide configures automatic SLA alert execution for:

- `POST /api/cron/sla-alerts` (multi-tenant scheduler endpoint)
- `POST /api/service/sla/alerts/run` (manual tenant trigger from dashboard)

## 1) Environment Variables

Set one of these secrets on your deployment platform:

- `SLA_ALERTS_CRON_SECRET` (recommended)
- `CRON_SECRET` (fallback)

The cron endpoint accepts:

- `Authorization: Bearer <secret>`
- or `x-cron-key: <secret>`

## 2) Vercel Cron (Recommended)

Project includes `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sla-alerts",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Steps:

1. Add env var `SLA_ALERTS_CRON_SECRET` in Vercel project settings.
2. Deploy.
3. Verify cron run in Vercel logs for `/api/cron/sla-alerts`.

Notes:

- Default schedule is every 15 minutes.
- To test without creating notifications, call:
  - `POST /api/cron/sla-alerts?dryRun=true`

## 3) GitHub Actions Fallback

Workflow included:

- `.github/workflows/sla-alerts-cron.yml`

Required repository secrets:

- `SLA_CRON_URL`
  - example: `https://your-domain.com/api/cron/sla-alerts`
- `SLA_CRON_SECRET`
  - same value as `SLA_ALERTS_CRON_SECRET` on app

Manual dry-run:

1. Open Actions -> `SLA Alerts Cron`.
2. `Run workflow` with `dry_run=true`.

## 4) Validation Checklist

1. Call endpoint manually:
   - `curl -X POST -H "Authorization: Bearer <secret>" https://<domain>/api/cron/sla-alerts?dryRun=true`
2. Check response includes:
   - `summary.tenants`
   - `summary.targetTickets`
   - `summary.notificationsWouldCreate`
3. Run without `dryRun` and confirm:
   - notifications created for breached/at-risk tickets
   - no duplicate spam within cooldown window

## 5) Operations

- Recommended schedule: every 15 minutes.
- If notification volume is high, increase interval to 30 minutes.
- Use `tenantId` query for targeted re-run:
  - `/api/cron/sla-alerts?tenantId=<tenant-id>`
