from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .schemas import Classification, Risk, Recommendation, Retrieval

def classify(r: Classification):
    return {'level': 'Advanced' if r.score >= 80 else 'Intermediate' if r.score >= 50 else 'Beginner', 'method': 'score-threshold-baseline-v1'}

def risk(r: Risk):
    score = round(100 * (0.45 * min(r.days_since_activity / 14, 1) + 0.25 * (1-r.completion_rate) + 0.15 * (1-r.quiz_participation) + 0.15 * (1-r.active_days_14/14)), 1)
    return {'score': score, 'category': 'High' if score >= 65 else 'Medium' if score >= 35 else 'Low', 'method': 'engagement-heuristic-v1'}

def recommend(r: Recommendation):
    def rank(lesson):
        weak = lesson.topic in r.weak_topics
        preferred = lesson.topic.lower() in r.preferences.lower()
        appropriate = lesson.difficulty == r.level or r.level == 'Unassessed' and lesson.difficulty == 'Beginner'
        return (3*weak + 2*appropriate + preferred, -lesson.id)
    results=[]
    for lesson in sorted(r.lessons, key=rank, reverse=True)[:4]:
        reason = 'Practice a topic from your assessment' if lesson.topic in r.weak_topics else 'Matches your topic preferences' if lesson.topic.lower() in r.preferences.lower() else 'Build on your current knowledge level'
        results.append({'lessonId': lesson.id, 'reason': reason})
    return {'items': results, 'method': 'content-rules-baseline-v1'}

def retrieve(r: Retrieval):
    # Lexical TF-IDF, not embedding-based semantic search or generated advice.
    synonyms={'छात्र':'student education', 'पेंशन':'pension retirement NPS', 'बचत':'savings PPF', 'बीमा':'insurance', 'दस्तावेज':'documents', 'बजट':'budget', 'धोखाधड़ी':'scam fraud', 'कर':'tax', 'लड़की':'Sukanya girl child'}
    query=r.query
    for hindi, english in synonyms.items():
        if hindi in query: query += ' '+english
    if not r.documents: return {'sources': [], 'method':'tfidf-retrieval-v1'}
    texts=[d.title+' '+d.content for d in r.documents]
    try:
        vectorizer=TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True, stop_words='english')
        matrix=vectorizer.fit_transform(texts)
        scores=cosine_similarity(vectorizer.transform([query]),matrix)[0]
    except ValueError: return {'sources': [], 'method':'tfidf-retrieval-v1'}
    ranked=sorted(zip(r.documents,scores),key=lambda v:v[1],reverse=True)
    return {'sources':[{'id':d.id,'title':d.title,'excerpt':d.content[:650],'url':d.url,'relevance':round(float(s),3)} for d,s in ranked[:3] if s>=0.06], 'method':'tfidf-retrieval-v1'}
