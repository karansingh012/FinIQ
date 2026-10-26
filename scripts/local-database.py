#!/usr/bin/env python3
"""Manage only this workspace's isolated local PostgreSQL cluster."""
import os,sys,subprocess
from urllib.parse import urlparse
from local_env import ROOT,environment,executable
env=environment();parsed=urlparse(env['DATABASE_URL'].removeprefix('jdbc:'));port=str(parsed.port or 5432)
if parsed.hostname not in ['localhost','127.0.0.1']:raise SystemExit('This helper only manages a loopback database. Use your server administrator for remote databases.')
runtime=ROOT/'.runtime';runtime.mkdir(exist_ok=True);data=runtime/'postgres'
command=sys.argv[1] if len(sys.argv)>1 else ''
if command=='stop':raise SystemExit(subprocess.call([executable('pg_ctl'),'-D',str(data),'stop','-m','fast']))
if command!='start':raise SystemExit('Usage: python3 scripts/local-database.py start|stop')
if not (data/'PG_VERSION').exists():
    password_file=runtime/'pg-password';password_file.write_text(env['DB_PASSWORD']);os.chmod(password_file,0o600)
    try:subprocess.run([executable('initdb'),'-D',str(data),'-U',env['DB_USER'],'--pwfile='+str(password_file),'--auth=scram-sha-256'],check=True)
    finally:password_file.unlink(missing_ok=True)
status=subprocess.run([executable('pg_ctl'),'-D',str(data),'status'],capture_output=True)
if status.returncode:subprocess.run([executable('pg_ctl'),'-D',str(data),'-l',str(runtime/'postgres.log'),'-o',f'-p {int(port)} -h 127.0.0.1','start'],check=True)
env['PGPASSWORD']=env['DB_PASSWORD']
result=subprocess.run([executable('createdb'),'-h','127.0.0.1','-p',port,'-U',env['DB_USER'],parsed.path.lstrip('/')],env=env,capture_output=True,text=True)
if result.returncode and 'already exists' not in result.stderr:raise SystemExit(result.stderr)
print('Workspace PostgreSQL is ready on loopback port '+port+'.')
