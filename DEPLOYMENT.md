# FinIQ deployment

## Status — 22 November 2026

Repository audited at `cca92b6623df2f89ebf87fe46d3f259adc821dc5`.
Deployment work is on `codex/public-deployment-n8n`.
Render workspace: **My Workspace** (`tea-d2veuh95pdvs73bc80ag`), confirmed by the owner.
Public URL: **https://finiq-public.onrender.com**.
Render service: `srv-dc19jrvf3r2c73c2rfdg` (Singapore, Free).
Initial deployment `dep-dc19js7f3r2c73c2rhe0` reached **live** on 22 November 2026.
HTTPS readiness and the complete public smoke test passed: registration, login,
assessments, non-fallback ML classification, lesson completion, quiz, bookmarks,
progress, recommendations, schemes, sourced retrieval and admin access denial.
A new Render PostgreSQL 17 database, `finiq-public-db`, has been created in Singapore.
Its free plan expires **22 December 2026 at 12:56 IST**. Migrate to a non-expiring
database or approve an upgrade before then; this is a time-limited public demonstration.
A fresh deployment (`dep-dc19nk1ksfps7389l3e0`) also reached live. The same public
synthetic learner then logged in successfully and retained the completed lesson,
verifying external PostgreSQL persistence across application replacement.

The existing local Compose installation and its PostgreSQL volume remain separate.
There is no automatic migration of existing local users or learning data to the public database.

## Hosting design

`deploy/render/Dockerfile` packages the existing frontend, Java API and Python inference
service in one Render Docker web service. Nginx is the only listener exposed externally.
Java listens on loopback port 8080; Python listens on loopback port 8001. n8n remains
exclusively in the owner's n8n Cloud account.

The deployment launcher waits for both application services, forwards termination
signals and exits if any child process dies. Render can then restart the instance.
The default public port is 10000; Render's `PORT` overrides it. `/healthz` proxies the
existing Java readiness endpoint, including database connectivity. Container health
also checks Python. No UI or application business logic is replaced.

The initial deployment uses separate Render Free PostgreSQL 17 over the private network.
A dedicated Neon Free project remains the preferred non-expiring free replacement.
Do not put PostgreSQL data inside Render's ephemeral web-service filesystem.

Current provider constraints, checked 22 November 2026:

- [Render Free](https://render.com/docs/free): services sleep after 15 idle minutes;
  750 instance hours are shared across the workspace. This workspace already has
  other applications. Free Render PostgreSQL expires after 30 days and is unsuitable
  as this project's permanent database. Free hosting is suitable for a demonstration,
  not guaranteed uninterrupted production availability.
- [Neon Free](https://neon.com/pricing): 1 GB database storage and 100 CU-hours per
  project each month. Monitor quotas and maintain a separate backup.
- TLS is terminated by Render for the assigned `onrender.com` address. A custom
  domain is optional and requires owner-controlled DNS; none has been supplied.

## Render configuration

Create a **new** service, leaving unrelated resources untouched:

| Setting | Value |
|---|---|
| Repository | `https://github.com/karansingh012/FinIQ` |
| Branch | `codex/public-deployment-n8n` |
| Runtime | Docker |
| Dockerfile | `deploy/render/Dockerfile` |
| Build context | repository root (`.`) |
| Plan | Free, subject to the measured capacity below |
| HTTP health check | `/healthz` |
| Auto deploy | On commit, when the Git provider connection supports it |

The committed `render.yaml` Blueprint is the source of truth for managed configuration.
It adopts only the newly created `finiq-public-db`, creates `finiq-public`, wires the
internal connection with `fromDatabase`, and generates JWT/admin secrets in Render.
It does not change any unrelated service. Do not
copy the local `.env` into the image or repository. The root `.dockerignore` excludes
local credentials, databases, tooling and build outputs.

| Variable | Configuration |
|---|---|
| `POSTGRES_CONNECTION_URI` | Blueprint reference to the internal database connection; launcher converts it to JDBC and splits credentials in memory |
| `DATABASE_URL` | `jdbc:postgresql://HOST:5432/DATABASE?sslmode=verify-full&sslrootcert=/etc/ssl/certs/ca-certificates.crt` |
| `DB_USER` | Dedicated database role |
| `DB_PASSWORD` | Database secret, stored in Render |
| `JWT_SECRET` | Independent cryptographically random production secret, at least 32 characters |
| `FRONTEND_URL` | Optional custom HTTPS origin; otherwise the launcher uses Render's `RENDER_EXTERNAL_URL` |
| `RESET_MODE` | `disabled` until a working mail provider is configured; never `development` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial reporting administrator `automation@finiq.invalid` with Render-generated password; remove bootstrap password configuration after secure credential setup |
| `PORT` | `10000` (public Nginx listener) |

`ML_URL` and Java's port/address are set internally by the launcher. They must not
refer to public inference endpoints. Flyway applies existing versioned migrations
at API startup. Never modify applied migration files.

SMTP needs its own authorized provider. Render Free blocks the usual outbound SMTP
ports, so SMTP password reset delivery is not available on this configuration without
a suitable hosting/provider change. Disabled delivery is disclosed, not represented
as working email. No email subscription is purchased automatically.

## Build and verification

```bash
npm --prefix frontend test
(cd ml-service && .venv/bin/python -m pytest -q)
docker build -f deploy/render/Dockerfile -t finiq-render:verification .
```

Verified locally: 10 frontend tests, 5 Python tests, image build, and a separate
PostgreSQL-backed smoke test under **512 MB RAM / 0.5 CPU**. The managed-URI configuration also reached healthy
under **512 MB RAM / 0.1 CPU**. Observed memory after
the smoke test was approximately **378 MiB**, without an OOM kill. This is a small
functional test, not a concurrency or load benchmark. The backend's existing full
JUnit suite has not been rerun for this deployment package.

```bash
python3 scripts/smoke.py https://YOUR-VERIFIED-HOST
```

The smoke test creates a synthetic learner and real test activity. Run it only on
the intended target. It checks login, assessments, classification, lesson completion,
bookmarks, progress, recommendations, schemes, retrieval and administrator denial.
It stores private credentials in ignored `.runtime/qa-account.json`.
The same local synthetic learner successfully logged in after an app-container restart,
and the completed lesson remained in PostgreSQL.

Before reporting success, verify HTTPS without bypassing certificate validation,
website and API responses, ML's non-fallback method, an unauthorized admin request,
and that the same learner's completed lesson remains after an application restart.
Also verify n8n Cloud executions, authenticated webhook rejection and valid calls.

## Redeployment and recovery

Commit and push deployment changes to the configured branch. Watch the resulting
Render deployment to `live`, then repeat readiness and smoke checks. If automatic
deploy is disabled or the service uses an unconnected public Git URL, explicitly
deploy the reviewed commit from Render. Do not trigger a duplicate deploy while an
automatic one is building.

Application restarts must retain the external database connection. A code rollback
does not roll back schema or data. Confirm migration compatibility before rollback.
Back up PostgreSQL with `pg_dump --format=custom` using credentials from a secure
environment or `.pgpass`, keep dumps encrypted outside the application filesystem,
and test restoring into a new database. Never restore over the live database or
remove volumes without explicit owner approval.

## Troubleshooting

- Startup failure: inspect Render runtime logs for the first exception. Confirm JDBC
  syntax, role credentials, TLS trust and network access without logging secrets.
- Cold start: allow the free instance time to wake, then retry. Do not use frequent
  n8n polling to defeat free-tier sleep or exhaust the shared hour quota.
- OOM or slow requests: inspect actual metrics; a paid compute upgrade needs owner
  approval. The local capacity check is not a promise under concurrent load.
- 401: sign in again; existing JWTs expire after one hour and can be revoked.
- 429 during testing: the existing fixed-window limit is shared behind the proxy.
  Avoid rapid login bursts; distributed trusted-proxy rate limiting is still a
  production-hardening task.
- Build audit: the existing frontend dependency tree reported six vulnerabilities
  (three moderate, one high, two critical). Dependencies were not silently upgraded.

See [N8N_SETUP.md](N8N_SETUP.md) for the separate automation configuration.
