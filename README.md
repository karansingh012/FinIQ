# FinIQ

**Making Financial & Policy Literacy Accessible to Everyone**

FinIQ is a runnable academic full-stack application: React/Vite + Java 17/Spring Boot + PostgreSQL + Python/FastAPI. It includes a public website, authenticated learner workspace, assessment and lesson quizzes, persistent learning activity, scheme discovery, source retrieval, English/Hindi interface controls, and role-protected administration and institution analytics.

The earlier project at `/Users/karansingh/FinIq` is preserved. This implementation is in the current `FINIQ` workspace. It does not rely on the old frontend's simulated data.

## Start with Docker

Install Docker Desktop/Engine with Compose, and ensure it is running. On a fresh checkout:

```bash
python3 scripts/configure.py --admin-email your-admin@example.com
docker compose up -d --build
docker compose ps
```

`configure.py` creates a private, ignored `.env` containing newly generated database, JWT and optional administrator secrets. It refuses to overwrite an existing `.env`. To configure manually, copy `.env.example` to `.env` and replace the placeholders. The email above is an example; use your chosen administrator email. No default administrator password is shipped. Retrieve the generated `ADMIN_PASSWORD` from your local `.env` without committing or sharing the file.

Open **http://localhost:8088**. Register a learner in the UI, or sign in as the configured administrator. The first API startup runs Flyway migrations and seeds educational content. The first image build needs network access and can take several minutes.

```bash
# Start individual infrastructure/services if needed
docker compose up -d database ml
docker compose up -d backend frontend
# Inspect readiness and logs
docker compose ps
docker compose logs --tail=80 backend
# Stop while retaining database contents
docker compose down
```

Only the frontend is exposed, on loopback. PostgreSQL uses a persistent named volume. **Do not add `-v` to `docker compose down` unless intentionally deleting this stack's database.** Optional developer port mappings are in `docker-compose.dev.yml` (`5433`, `8081`, `8002`, all loopback). Compose uses its own database, distinct from the native development database.

## Native development

Prerequisites: Java 17, Maven 3.9+, Node 20.19+/22+, Python 3.11+, and PostgreSQL 17 or a compatible local installation. This workspace also has ignored local Java 17/Maven tools under `.tools`; the helpers use them when available. New checkouts should install prerequisites normally. No service requires a paid API key.

```bash
# Run once; skip configure if .env already exists
python3 scripts/configure.py --admin-email your-admin@example.com
npm --prefix frontend ci
python3 -m venv ml-service/.venv
ml-service/.venv/bin/python -m pip install -r ml-service/requirements.txt
python3 scripts/local-database.py start
```

Start these in three terminals from the repository root:

```bash
python3 scripts/run-local.py ml
python3 scripts/run-local.py backend
python3 scripts/run-local.py frontend
```

- Frontend: http://localhost:5173
- Java API: http://localhost:8080/api/v1
- Java readiness: http://localhost:8080/actuator/health
- Swagger: http://localhost:8080/docs
- Python health and typed API docs: http://localhost:8001/health and http://localhost:8001/docs

The isolated database helper stores data in `.runtime/postgres` and uses the host/port from `DATABASE_URL` (generated configuration: `127.0.0.1:55432`). It will not manage a remote database. Set `PG_BIN` if the matching PostgreSQL tools are not on PATH. Stop each foreground application with Ctrl+C, and stop only the workspace database with `python3 scripts/local-database.py stop`.

The helpers load `.env` without executing it as shell code and preserve explicit environment overrides. For an existing PostgreSQL installation, create your own database/role, edit `DATABASE_URL`, `DB_USER`, and `DB_PASSWORD`, and skip the database helper. The API applies migrations automatically. Vite proxies `/api` to Java; `API_PROXY_TARGET` changes that development proxy. `VITE_API_URL` is the optional browser API URL, never a secret.

## Demonstration walkthrough

1. Register with a name, email, password of at least ten characters, language, occupation, region, education and consent.
2. Complete the seven-question knowledge check. Java calculates and persists the score; Python returns a labelled baseline classification.
3. Open a suggested lesson, save it, mark it complete and submit its quiz. Check the progress screen and saved resources. Refresh the browser: records remain in PostgreSQL.
4. Search schemes for `PPF` or `NPS`, open a detail page, and follow the official information link. The four seed records are clearly marked demonstration records.
5. Ask “What is the difference between PPF and NPS?” or “बचत और पेंशन के बारे में बताएं”. Review retrieved passages and their links. Unsupported questions produce a clear no-match response.
6. Change the UI language to Hindi; the preference is saved to your account. Policy and lesson source text stays in its original language.
7. Sign in as the configured platform admin. Use Administration to manage lessons, topics, schemes, documents, assessments, questions, answer options, institutions, memberships, roles and contact status. Audit logs are read-only.
8. To test institutional access, register an additional account, assign `INSTITUTION_ADMIN`, create an institution, and add memberships for that administrator and the intended learners. Sign in again after the role change (old tokens are revoked). Institution analytics includes only those learners. Refresh support indicators to persist heuristic risk scores.

The editor uses actual related-record IDs; create a topic before its lessons, an assessment before its questions, and questions before answer options. Each question requires at least two options and exactly one correct answer. Incomplete assessments are unavailable to learners. Questions/options in attempted assessments are protected against edits; create another assessment version for changes. The primary onboarding assessment cannot be archived. Content deletion is generally archival, and foreign keys protect historical data.

## Tests and builds

With the native database and Python service running:

```bash
python3 scripts/test-backend.py
npm --prefix frontend test
npm --prefix frontend run build
cd ml-service
.venv/bin/python -m pytest -q
```

The backend helper creates a **separate** test database derived from `DATABASE_URL` with `_test` appended. Override `TEST_DATABASE_URL` if needed; it must not equal the application database. The suite performs real HTTP calls through Spring Security, real PostgreSQL migrations/repositories, and live Java→Python integration. It creates isolated synthetic records and checks registration, login, validation, server-side scoring, history ownership, completion idempotency, bookmarks, recommendations, search, admin CRUD, institution isolation, risk scoring, reset-token reuse rejection and logout revocation. Mockito tests cover invalid-answer rejection; the classifier fallback test deliberately uses an unreachable ML address.

For a plain Maven setup with the necessary environment variables exported:

```bash
mvn -f backend/pom.xml test
mvn -f backend/pom.xml package -DskipTests
```

The second command only packages; it does not claim to run tests. Docker images package this way because tests require external test services. Test before building deployment images.

A repeatable smoke check against an already running stack:

```bash
python3 scripts/smoke.py http://localhost:8080  # native Java API
python3 scripts/smoke.py http://localhost:8088  # Compose through Nginx
```

This creates a synthetic learner through the public API and performs real activity. Credentials are written only to ignored `.runtime/qa-account.json`; no fake historical analytics are inserted. See `docs/verification.md` for the actual verification record and remaining limits.

## Password reset

Native generated configuration uses `RESET_MODE=development`. Request a reset in the UI, then open the corresponding private `.runtime/reset-mail/<user-id>.txt` on the server to obtain the link. Tokens are not returned in API responses, are stored hashed in PostgreSQL, expire after 30 minutes and are single-use. Resetting a password revokes previous access tokens.

Compose defaults to disabled delivery. Configure `COMPOSE_RESET_MODE=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `MAIL_FROM` to enable real email. For native production use `RESET_MODE=smtp`. Use HTTPS and an authorized sending domain. Never use development reset files in a public deployment. Live SMTP delivery requires your provider configuration and is not claimed as tested.

## Structure

```text
FINIQ/
├── frontend/               React routes, components, dictionaries, CSS, tests, Nginx
├── backend/
│   ├── src/main/java/com/finiq/
│   │   ├── auth/ security/ config/ domain/ common/
│   │   ├── lesson/ assessment/ progress/ search/ prediction/
│   │   └── admin/ analytics/ contact/
│   ├── src/main/resources/db/migration/  Flyway schema, catalogue and timestamps
│   └── src/test/java/com/finiq/           Integration and service tests
├── ml-service/             FastAPI schemas, baseline services, pytest, training notes
├── scripts/                Configuration, service/database launchers, smoke tests
├── docs/                   Architecture, provenance, deployment and verification
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── README.md
```

## Model and data limitations

- No reliable labelled learner dataset was provided. Knowledge classification, recommendations and disengagement scoring are **documented baselines**, not validated trained models. No accuracy or impact figures are invented. The training gate is documented in `ml-service/training/README.md`.
- Search uses TF-IDF lexical retrieval with limited Hindi keyword expansion, plus a Java keyword fallback if Python is unavailable. It is not a general conversational LLM or embedding-based semantic search. No LLM provider is configured; retrieved source passages are the functional no-paid-API mode.
- Thirteen introductory lessons and four sourced demonstration schemes are seeded. Some category filters correctly return no results. There is no live government feed, individual eligibility engine, automatic translation of official terms, or guaranteed benefit calculation.
- Navigation, forms and key learner labels support English/Hindi. Source content and some explanatory/admin text remain English. No claim of a fully translated policy corpus is made.
- Time spent is not guessed from open tabs. Achievement awards and dates persist once earned from lessons, attempts and streak milestones. Risk refresh handles up to 500 learners per call; it is intended for an academic cohort, not unbounded production scale.
- This is a working academic application and a production-oriented foundation, not a security-audited public financial service. Read `docs/deployment.md` for AWS, TLS, SMTP, trusted-proxy rate limiting, backup and operational requirements.

## Troubleshooting

- **Docker daemon unavailable:** start Docker Desktop/Engine and retry `docker compose up -d --build`.
- **Package download failures:** check network access to Docker Hub, PyPI and Maven Central; retry the build. Do not replace required libraries with mocks.
- **API health DOWN:** inspect database connectivity. Optional SMTP health checking is disabled unless explicitly enabled. Java must reach PostgreSQL before startup completes.
- **401 after an hour or role change:** sign in again. Logout/password/role changes invalidate existing tokens.
- **Empty institutional analytics:** assign both the administrator and learners to the same institution. Scope cannot be bypassed by a URL parameter.
- **Assessment unavailable:** finish its options and correct-answer configuration. Do not edit existing Flyway migrations after they have run; add a new migration.
- **Port already used:** stop the conflicting service or choose a different port and update the proxy/origin consistently. Compose and native stacks have separate databases.
- **Frontend error after dependency changes:** restart Vite and reload the tab. The application includes an error boundary so unexpected rendering errors do not silently appear as a blank page.
