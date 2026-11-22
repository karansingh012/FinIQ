# FinIQ and n8n Cloud

## Account and verification status

The owner is signed in to **karan9839**, observed online on the Pro plan at
`https://karan9839.app.n8n.cloud`. n8n is not installed or hosted in FinIQ's containers.
Live catalogue workflow: [3jXzf6aswc83R5KZ](https://karan9839.app.n8n.cloud/workflow/3jXzf6aswc83R5KZ).
Manually executed successfully against the public FinIQ API on 22 November 2026,
then published. Schedule: `30 2 * * *` in explicit `Etc/UTC` (08:00 IST daily).
The first clock-triggered execution is still pending; manual execution of its schedule
branch passed. Execution payload retention is disabled.

Report draft: [LdTlfQF6Y6UiyJ7y](https://karan9839.app.n8n.cloud/workflow/LdTlfQF6Y6UiyJ7y).
Imported with the verified production API URLs and execution payload retention disabled.
It remains unpublished pending owner entry of Custom Auth and Header Auth credentials,
followed by positive/negative webhook tests. No protected webhook success is claimed.
Repository JSON exports remain inactive by default for safe import.

## Audited application APIs

Paths below are actual existing controller mappings, relative to the public origin:

| API | Access and use |
|---|---|
| `GET /api/v1/lessons?size=1` | Public; catalogue availability and lesson count |
| `POST /api/v1/auth/login` | JSON email/password; returns a one-hour JWT |
| `GET /api/v1/admin/analytics?days=7` | Platform administrator; aggregate activity report |
| `GET /api/v1/institution/analytics?days=7` | Institution administrator; assigned cohort only |
| `POST /api/v1/auth/register` | Learner registration; **not** an outbound webhook |
| `POST /api/v1/assessments/{id}/submit` | Authenticated quiz submission; **not** an outbound webhook |

There is no existing registration-event publisher, quiz-event publisher, machine
API key, notification subscription or inactivity-recipient API. The deployment
does not claim those integrations exist. Welcome emails, individual reminders and
instant quiz notifications require additional event/consent design and an authorized
mail credential. Polling user profiles and emailing learners is not enabled.

## Prepared workflows

1. **Daily catalogue availability** (`catalogue-availability.json`): manual trigger
   and daily 08:00 Asia/Kolkata schedule → public lesson API → validated count/status.
   This checks the public application/API/database path; it is not an ML check.
2. **Authenticated activity report** (`activity-report.json`): manual or authenticated
   webhook request → stored login credential → existing analytics API → only the
   five numerical aggregate fields returned. Region, occupation, risk rows, user IDs,
   emails and login tokens are not included in the final response.

The workflow nodes use the verified origin `https://finiq-public.onrender.com`.
No n8n variable is required. JSON contains no credential ID or secret. Import it
through the editor or paste its nodes into a new workflow; when pasting nodes,
apply the documented workflow settings separately before execution.

## Credentials and privacy

Create credentials in **n8n Credentials**, not Code or Set nodes:

- **FinIQ login**: HTTP Request Custom Auth. Its credential JSON supplies a `body`
  containing the `email` and `password` fields required by the existing login API.
  Select it on `Sign in with stored credential`. A dedicated reporting account is
  preferable. Current platform-admin credentials have broad app access; they are
  not a read-only scope. For a cohort-only account, change the existing analytics
  path to `/api/v1/institution/analytics?days=7` and assign only that cohort.
- **FinIQ report webhook**: Header Auth, header name `X-FinIQ-Webhook-Key`, value a
  separately generated random secret. Select it on `Authenticated report request`.
  Do not reuse a JWT signing secret, database password or login password.

Keep TLS verification enabled and restrict credential usage to the verified FinIQ
origin. Do not follow redirects to a different origin while sending credentials.
JWT values flow only in memory to the next API request. Workflows disable saved
success/error/manual execution data and per-node execution progress because login
responses contain tokens and full analytics responses contain cohort details.
Do not pin these outputs or turn execution-data saving back on. Disable unnecessary
payload logging in any downstream integration.

References: [HTTP credentials](https://docs.n8n.io/integrations/builtin/credentials/httprequest/),
[authenticated webhook nodes](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/).

## Webhook URLs

Configured path: `finiq-activity-report`.

- Expected test URL: `https://karan9839.app.n8n.cloud/webhook-test/finiq-activity-report`
- Expected production URL: `https://karan9839.app.n8n.cloud/webhook/finiq-activity-report`

These are planned URLs, not verified live endpoints. Confirm the exact values in
the imported Webhook node before use. The test URL works only while listening;
the production URL is registered after publishing. The webhook accepts POST and
returns the last node's sanitized report. It does not take an arbitrary API URL or
user identity from callers.

`scripts/request-n8n-report.py` is an HTTPS-only caller for this webhook. Supply
`N8N_REPORT_WEBHOOK_URL` and `N8N_REPORT_WEBHOOK_KEY` through the calling environment's
secret manager. It sends no learner data, follows no redirects, and prints only the
validated aggregate result. The script is not scheduled outside n8n.

## Live test and activation checklist

1. Verify the public app and configure the exact origin.
2. Create/select the credentials in n8n. Do not send passwords in chat.
3. Run catalogue verification manually and inspect the successful response.
4. Start listening on the report test webhook. Call without a key and with an
   incorrect key: neither may execute the analytics flow successfully.
5. Call with the correct key. Confirm a successful n8n execution and only the allowed
   aggregate fields in the HTTP response. Confirm credentials never appear in output.
6. Publish only after these tests pass. Repeat the authorization checks against the
   production webhook URL. Test the schedule and timezone before leaving it enabled.
7. Keep a record of actual workflow IDs, execution IDs, URLs and test results here.

No email credential or approved report destination has been configured. These
workflows do not claim to send email or retain a historical activity-report archive.

## Troubleshooting

- Wrong API host: update the HTTPS node URLs and credential allowed domain together; never point Cloud at localhost.
- 401 on login: verify the credential's JSON body and account status privately.
- 403 on analytics: account role or institution membership is insufficient.
- 404 on webhook: check path, test-listening state and published workflow state.
- 401/403 on webhook: select the correct Header Auth credential and exact header.
- Cold start timeout: retry after the Render instance wakes; avoid frequent polling.
- Changing credentials: update the n8n credential record and the authorized caller's
  secret store, then retest. Keep unrelated workflows and credentials unchanged.
