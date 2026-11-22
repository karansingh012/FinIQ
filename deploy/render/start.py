"""Run the unchanged FinIQ services together; only Nginx is public."""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import urllib.request
import urllib.parse


def backend_environment(source):
    env = dict(source, PORT="8080", SERVER_ADDRESS="127.0.0.1", ML_URL="http://127.0.0.1:8001")
    if source.get("POSTGRES_CONNECTION_URI"):
        uri = urllib.parse.urlparse(source["POSTGRES_CONNECTION_URI"])
        if uri.scheme not in ("postgres", "postgresql") or not uri.hostname or not uri.username or not uri.password or not uri.path.strip("/"):
            raise ValueError("Invalid managed PostgreSQL configuration")
        host = f"[{uri.hostname}]" if ":" in uri.hostname else uri.hostname
        env["DATABASE_URL"] = f"jdbc:postgresql://{host}:{uri.port or 5432}{uri.path}"
        if uri.query:
            env["DATABASE_URL"] += "?" + uri.query
        env["DB_USER"] = urllib.parse.unquote(uri.username)
        env["DB_PASSWORD"] = urllib.parse.unquote(uri.password)
        env.pop("POSTGRES_CONNECTION_URI", None)
    if not env.get("FRONTEND_URL") and source.get("RENDER_EXTERNAL_URL"):
        env["FRONTEND_URL"] = source["RENDER_EXTERNAL_URL"]
    return env


def health():
    for url, expected in [("http://127.0.0.1:8001/health", "ok"),
                          ("http://127.0.0.1:8080/actuator/health", "UP")]:
        with urllib.request.urlopen(url, timeout=3) as response:
            if json.load(response).get("status") != expected:
                raise RuntimeError("Service not ready")


def main():
    if "--health" in sys.argv:
        health()
        return
    port = int(os.environ.get("PORT", "10000"))
    if not 1024 <= port <= 65535 or port in (8001, 8080):
        raise ValueError("PORT must be a non-privileged frontend port other than 8001/8080")
    if os.environ.get("RESET_MODE", "disabled") == "development":
        raise ValueError("Development password reset delivery cannot be used in deployment")
    Path("/tmp/nginx.conf").write_text(Path("/app/nginx.conf").read_text().replace("__PORT__", str(port)))
    children = []
    stopping = False

    def stop(*_):
        nonlocal stopping
        stopping = True

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    try:
        children.append(subprocess.Popen([sys.executable, "-m", "uvicorn", "app.main:app",
                                          "--host", "127.0.0.1", "--port", "8001", "--no-access-log"]))
        env = backend_environment(os.environ)
        children.append(subprocess.Popen(["java", "-Xmx192m", "-XX:MaxMetaspaceSize=128m",
                                          "-XX:ReservedCodeCacheSize=48m", "-Xss512k",
                                          "-jar", "/app/api.jar"], env=env))
        deadline = time.monotonic() + 600
        while not stopping:
            if any(child.poll() is not None for child in children):
                raise RuntimeError("A FinIQ service exited during startup")
            try:
                health()
                break
            except Exception:
                if time.monotonic() >= deadline:
                    raise RuntimeError("FinIQ readiness deadline exceeded") from None
                time.sleep(1)
        if not stopping:
            children.append(subprocess.Popen(["nginx", "-c", "/tmp/nginx.conf", "-g", "daemon off;"]))
        while not stopping:
            if any(child.poll() is not None for child in children):
                raise RuntimeError("A FinIQ service exited; restarting the whole instance is required")
            time.sleep(1)
    finally:
        for child in children:
            if child.poll() is None:
                child.terminate()
        for child in children:
            try:
                child.wait(timeout=10)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()


if __name__ == "__main__":
    main()
