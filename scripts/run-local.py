#!/usr/bin/env python3
"""Run one service in the foreground. Ctrl+C stops that service."""
import os,sys
from local_env import ROOT,environment,executable
env=environment();service=sys.argv[1] if len(sys.argv)>1 else ''
if service=='backend':command=[executable('mvn'),'spring-boot:run'];cwd=ROOT/'backend'
elif service=='ml':
    python=ROOT/'ml-service/.venv'/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
    command=[str(python),'-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8001'];cwd=ROOT/'ml-service'
elif service=='frontend':command=[executable('npm'),'run','dev','--','--host','localhost'];cwd=ROOT/'frontend'
else:raise SystemExit('Usage: python3 scripts/run-local.py backend|ml|frontend. Database: python3 scripts/local-database.py start')
os.chdir(cwd);os.execvpe(command[0],command,env)
