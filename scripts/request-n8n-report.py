#!/usr/bin/env python3
"""Request a private aggregate report without printing credentials or error bodies."""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def main():
    url = os.environ.get("N8N_REPORT_WEBHOOK_URL", "")
    key = os.environ.get("N8N_REPORT_WEBHOOK_KEY", "")
    parsed = urllib.parse.urlparse(url)
    if (parsed.scheme != "https" or parsed.hostname != "karan9839.app.n8n.cloud"
            or parsed.username or parsed.password or parsed.query or parsed.fragment
            or parsed.port not in (None, 443)
            or parsed.path not in ("/webhook/finiq-activity-report", "/webhook-test/finiq-activity-report")):
        raise ValueError("Use the verified HTTPS report webhook URL for karan9839")
    if len(key) < 32 or "\n" in key or "\r" in key:
        raise ValueError("Set the private webhook credential in the environment")
    req = urllib.request.Request(url, data=b"{}", method="POST", headers={
        "Content-Type": "application/json", "X-FinIQ-Webhook-Key": key})
    with urllib.request.build_opener(NoRedirect).open(req, timeout=150) as response:
        report = json.loads(response.read(16384))
    if isinstance(report, list) and len(report) == 1:
        report = report[0]
    fields = ("learners", "activeLearners", "completions", "averageScore", "completionRate")
    if not isinstance(report, dict) or any(type(report.get(k)) not in (int, float) for k in fields):
        raise ValueError("Webhook did not return the expected aggregate report")
    print(json.dumps({k: report[k] for k in fields}, allow_nan=False))


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        print(f"Webhook returned HTTP {exc.code}; response body withheld.", file=sys.stderr)
        sys.exit(1)
    except Exception:
        print("Report request failed. Check private configuration, connectivity and workflow status.", file=sys.stderr)
        sys.exit(1)
