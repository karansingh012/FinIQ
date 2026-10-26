from fastapi import FastAPI
from .schemas import (Classification, Risk, Recommendation, Retrieval, ClassificationResult, RiskResult, RecommendationResult, RetrievalResult)
from . import services
app=FastAPI(title='FinIQ baseline inference',version='1.0.0')
@app.get('/health')
def health(): return {'status':'ok','mode':'transparent-baselines'}
@app.post('/classify', response_model=ClassificationResult)
def classify(request: Classification): return services.classify(request)
@app.post('/risk', response_model=RiskResult)
def risk(request: Risk): return services.risk(request)
@app.post('/recommend', response_model=RecommendationResult)
def recommend(request: Recommendation): return services.recommend(request)
@app.post('/retrieve', response_model=RetrievalResult)
def retrieve(request: Retrieval): return services.retrieve(request)
