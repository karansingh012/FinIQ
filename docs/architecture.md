# Architecture and API contract

React/Vite → Spring Boot `/api/v1` → PostgreSQL. Java calls private FastAPI HTTP endpoints for inference/retrieval. The browser never accesses the database, Python service or server secrets. Spring Security validates signed, expiring JWTs and checks enabled status/token version against persisted users on every authenticated request. User administration and logout revoke existing tokens.

Controllers handle transport and validation. Services own transactions, scoring, authorization scope and business rules. Spring Data JPA manages account entities and maps catalogue relationships; JdbcTemplate handles relational catalogue operations, complex analytics and append-only activity records using bound parameters. Dynamic administrative identifiers come only from a fixed allowlist. Flyway owns the schema. JDBC and JPA share Spring-managed transactions.

Public: `POST /auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/contact`; `GET /lessons`, `/lessons/{id}`, `/schemes`, `/schemes/{id}`, `/topics`.

Authenticated: `GET/PUT /me`; `POST /auth/logout`; `GET /assessments/{id}`; `POST /assessments/{id}/submit` with `{answers:{questionId:optionId}}`; `GET /attempts/{id}` (owner only); `POST /lessons/{id}/visit`, `/lessons/{id}/complete`, `/schemes/{id}/visit`; `PUT/DELETE /lessons/{id}/bookmark`, `/schemes/{id}/bookmark`; `GET /bookmarks`, `/progress?days=30`, `/recommendations`; `POST /search` with `{question,language}`; `GET /search/history`.

Platform admin: `GET /admin/metadata` returns resource definitions; `GET/POST /admin/resources/{resource}`, `PUT/DELETE /admin/resources/{resource}/{id}`; `GET /admin/analytics`; `POST /admin/risk`. Resources: lessons, topics, schemes, documents, institutions, memberships, assessments, questions, options, users, contacts, audit. Users cannot be created/deleted through the generic editor; register then assign a role. Audit is read-only. Contact management changes status. Content is soft-deleted; referenced questions/options cannot be removed, and attempted assessments cannot be edited in place.

Institution admin: `GET /institution/analytics?days=30`, `POST /institution/risk`. Both restrict learners to institutions to which the requesting administrator belongs. Platform administrators can inspect all learner aggregates. User-level risk output uses learner IDs, not emails or profile details. No institution IDs supplied by the browser override this scope.

Lists return `{items,total,page,size}`; pagination is zero-based and page size is capped at 100. Catalogue accepts `q`, `topic`/`category`, `difficulty`, `region`, `beneficiary`. Admin accepts `q`, `sort=recent|name`. Errors have `{message}` and field validation may add `{fields}`. Swagger: `/docs`, schema: `/v3/api-docs`. ML schema: port 8001 `/docs` in local development.

Dates are stored as timestamptz. Learner daily streak/activity uses Asia/Kolkata; institution trend SQL uses the database timezone. Completion is idempotent; opening a lesson is activity but does not imply completion or measured time spent. Topic performance aggregates actual assessment responses within the selected date window. Overall completion and streak are lifetime/current metrics; trend and assessment history obey the date filter. Goal progress starts at the database week boundary.

Password resets: 256-bit random single-use tokens, SHA-256 hashes in PostgreSQL, 30-minute expiration, row locking on use, revocation of old JWTs. In development only, private files contain links. Production must use SMTP and HTTPS; no reset tokens are returned by APIs. Generic forgot-password responses avoid account enumeration when delivery is configured normally.

No labelled training data was provided. Classification, recommendations and risk are explicit baselines; retrieval is TF-IDF with limited Hindi keyword expansion. Read the ML README for formulas and limitations. LLM and embedding providers are not configured in this build. No generated policy answer or trained-model performance is claimed.
