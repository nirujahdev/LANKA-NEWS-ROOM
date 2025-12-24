## Cron setup
- Create two Vercel Cron jobs:
  - `*/10 * * * *` → `GET /api/cron/ingest` with header `x-cron-secret: $CRON_SECRET`.
  - `*/10 * * * *` offset by 2-3 minutes → `GET /api/cron/process` with the same header.
- Use project env vars from `env.local.example` in Vercel (Prod + Preview).

## Secrets
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `CRON_SECRET`.
- Rotate `CRON_SECRET` and update Vercel + any external schedulers together.

## Monitoring
- Cron routes return counts: ingest → `totalFetched/totalInserted`; process → `processed/summariesTriggered`.
- Add Vercel Log Drains or observability (Logtail/Datadog) to watch for 5xx and zero-processed events.
- Alert if:
  - Ingest inserts = 0 for >3 consecutive runs.
  - Process `processed=0` but `needs_embedding` rows exist.
  - Summaries repeatedly `needs_review=true`.

## Backfill / reruns
- To re-run embeddings/clustering for stuck rows, set `needs_embedding=true` on target `articles`.
- To force re-summarize a cluster, delete its row in `summaries` (or set `needs_review=true`) then run `/api/cron/process`.

