#!/usr/bin/env python3
"""Generate private local secrets without replacing existing configuration."""
import argparse,os,secrets
from pathlib import Path
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--admin-email',default='');args=parser.parse_args()
path=root/'.env'
if path.exists():raise SystemExit('.env already exists; it has not been changed.')
values={'DB_USER':'finiq','DB_PASSWORD':secrets.token_urlsafe(32),'JWT_SECRET':secrets.token_urlsafe(48),'DATABASE_URL':'jdbc:postgresql://127.0.0.1:55432/finiq','FRONTEND_URL':'http://localhost:5173','ML_URL':'http://127.0.0.1:8001','RESET_MODE':'development','RESET_DIRECTORY':str(root/'.runtime/reset-mail'),'ADMIN_EMAIL':args.admin_email,'ADMIN_PASSWORD':secrets.token_urlsafe(24) if args.admin_email else '', 'COMPOSE_RESET_MODE':'disabled'}
path.write_text('\n'.join(k+'='+v for k,v in values.items())+'\n');os.chmod(path,0o600)
print('Created private .env. If requested, the generated admin password is stored there; no default password is used.')
