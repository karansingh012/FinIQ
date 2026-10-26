from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_health(): assert client.get('/health').json()['status']=='ok'
def test_classification_boundaries():
    for score,level in [(0,'Beginner'),(49.9,'Beginner'),(50,'Intermediate'),(79.9,'Intermediate'),(80,'Advanced'),(100,'Advanced')]:
        assert client.post('/classify',json={'score':score}).json()['level']==level
    assert client.post('/classify',json={'score':101}).status_code==422
def test_risk_boundaries():
    low=client.post('/risk',json={'days_since_activity':0,'completion_rate':1,'quiz_participation':1,'active_days_14':14}).json()
    high=client.post('/risk',json={'days_since_activity':60,'completion_rate':0,'quiz_participation':0,'active_days_14':0}).json()
    assert low['score']==0 and low['category']=='Low'
    assert high['score']==100 and high['category']=='High'
    assert client.post('/risk',json={'days_since_activity':-1}).status_code==422
def test_recommend_weak_topic():
    result=client.post('/recommend',json={'level':'Beginner','weak_topics':['Savings'],'lessons':[{'id':1,'title':'Budget','topic':'Budgeting','difficulty':'Beginner'},{'id':2,'title':'Save','topic':'Savings','difficulty':'Beginner'}]}).json()
    assert result['items'][0]['lessonId']==2
def test_retrieval_and_no_answer():
    docs=[{'id':'1','title':'PPF savings','content':'Long term saving account. Verify current rules.','url':'https://www.indiapost.gov.in/banking-services/savings'}]
    assert client.post('/retrieve',json={'query':'PPF','documents':docs}).json()['sources'][0]['id']=='1'
    assert client.post('/retrieve',json={'query':'volcano astronaut','documents':docs}).json()['sources']==[]
    assert client.post('/retrieve',json={'query':'बचत','language':'hi','documents':docs}).json()['sources']
