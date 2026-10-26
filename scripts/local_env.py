"""Shared local launcher configuration. Values are never echoed."""
import os,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def environment():
    env=os.environ.copy()
    path=ROOT/'.env'
    if not path.exists(): raise SystemExit('Run python3 scripts/configure.py first, or copy and configure .env.example.')
    for line in path.read_text().splitlines():
        line=line.strip()
        if line and not line.startswith('#') and '=' in line:
            key,value=line.split('=',1)
            env.setdefault(key.strip(),value.strip().strip('"').strip("'"))
    java=list((ROOT/'.tools').glob('jdk-17*/Contents/Home'))
    if java: env.setdefault('JAVA_HOME',str(java[0]))
    return env

def executable(name):
    if name=='mvn':
        local=next((ROOT/'.tools').glob('apache-maven-*/bin/mvn'),None)
        if local:return str(local)
    if name in ['initdb','pg_ctl','createdb']:
        explicit=os.environ.get('PG_BIN')
        if explicit and (Path(explicit)/name).exists():return str(Path(explicit)/name)
        existing=ROOT/'.runtime/postgres/PG_VERSION'
        if existing.exists():
            path=Path('/opt/homebrew/opt')/('postgresql@'+existing.read_text().strip())/'bin'/name
            if path.exists():return str(path)
    found=shutil.which(name)
    if not found:raise SystemExit(f'{name} is required. Install it and put it on PATH (or set PG_BIN for PostgreSQL).')
    return found
