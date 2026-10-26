#!/usr/bin/env python3
"""Exercise a running stack with an isolated synthetic learner. No secrets are printed."""
import json,os,secrets,sys,urllib.request,urllib.error
from pathlib import Path
base=(sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8080').rstrip('/')+'/api/v1'
root=Path(__file__).resolve().parents[1]
email='qa-'+secrets.token_hex(5)+'@example.test';password=secrets.token_urlsafe(24)
def request(method,path,data=None,token=None):
 headers={'Content-Type':'application/json'}
 if token: headers['Authorization']='Bearer '+token
 req=urllib.request.Request(base+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers=headers)
 with urllib.request.urlopen(req,timeout=20) as response:return json.load(response)
session=request('POST','/auth/register',dict(name='Demo Learner',email=email,password=password,language='en',occupation='Student',region='Demo region',education='Undergraduate',consent=True))
token=session['token']
request('POST','/auth/login',dict(email=email,password=password))
assessment=request('GET','/assessments/1',token=token)
answers={str(q['id']):q['options'][0]['id'] for q in assessment['questions']}
result=request('POST','/assessments/1/submit',{'answers':answers},token)
assert 'fallback' not in result['method'],result['method']
request('POST','/lessons/1/visit',{},token)
request('POST','/lessons/1/complete',{},token)
request('PUT','/lessons/1/bookmark',{},token)
quiz=request('GET','/assessments/2',token=token)
request('POST','/assessments/2/submit',{'answers':{str(q['id']):q['options'][0]['id'] for q in quiz['questions']}},token)
progress=request('GET','/progress',token=token);assert progress['completed']==1
assert request('GET','/recommendations',token=token)['items']
assert request('GET','/schemes?q=PPF')['total']>0
response=request('POST','/search',{'question':'PPF savings','language':'en'},token);assert response['sources'];assert response['method']=='tfidf-retrieval-v1'
try: request('GET','/admin/resources/users',token=token);raise AssertionError('Unauthorized access')
except urllib.error.HTTPError as error: assert error.code==403
private=root/'.runtime/qa-account.json';private.parent.mkdir(exist_ok=True)
private.write_text(json.dumps({'email':email,'password':password,'token':token,'base':base}));os.chmod(private,0o600)
print('PASS: registration, login, assessment, classification, lesson completion, quiz, bookmarks, progress, recommendations, schemes, sourced retrieval, admin denial.')
print('Synthetic learner credentials saved privately in .runtime/qa-account.json; no fabricated history was inserted.')
