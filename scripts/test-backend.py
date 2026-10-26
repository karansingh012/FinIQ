#!/usr/bin/env python3
"""Run integration tests against a separate PostgreSQL database and live ML service."""
import subprocess
from urllib.parse import urlparse,urlunparse
from local_env import ROOT,environment,executable
env=environment();main=env['DATABASE_URL'];url=env.get('TEST_DATABASE_URL',main+'_test')
if url==main:raise SystemExit('TEST_DATABASE_URL must differ from DATABASE_URL.')
env['TEST_DATABASE_URL']=url;parsed=urlparse(url.removeprefix('jdbc:'));env['PGPASSWORD']=env['DB_PASSWORD']
result=subprocess.run([executable('createdb'),'-h',parsed.hostname,'-p',str(parsed.port or 5432),'-U',env['DB_USER'],parsed.path.lstrip('/')],env=env,capture_output=True,text=True)
if result.returncode and 'already exists' not in result.stderr:raise SystemExit(result.stderr)
raise SystemExit(subprocess.call([executable('mvn'),'-f',str(ROOT/'backend/pom.xml'),'test'],env=env))
