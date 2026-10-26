from pydantic import BaseModel, Field
class Classification(BaseModel):
    score: float = Field(ge=0, le=100)
class Risk(BaseModel):
    days_since_activity: int = Field(ge=0, le=36500)
    completion_rate: float = Field(ge=0, le=1)
    quiz_participation: float = Field(ge=0, le=1)
    active_days_14: int = Field(ge=0, le=14)
class Candidate(BaseModel):
    id: int
    title: str
    topic: str
    difficulty: str
class Recommendation(BaseModel):
    level: str
    weak_topics: list[str] = Field(default_factory=list)
    preferences: str = Field(default='', max_length=500)
    lessons: list[Candidate] = Field(max_length=500)
class Document(BaseModel):
    id: str
    title: str
    content: str
    url: str
class Retrieval(BaseModel):
    query: str = Field(min_length=2, max_length=1000)
    language: str = Field(pattern='^(en|hi)$', default='en')
    documents: list[Document] = Field(max_length=1000)

class ClassificationResult(BaseModel):
    level: str
    method: str
class RiskResult(BaseModel):
    score: float = Field(ge=0, le=100)
    category: str
    method: str
class RecommendationItem(BaseModel):
    lessonId: int
    reason: str
class RecommendationResult(BaseModel):
    items: list[RecommendationItem]
    method: str
class Source(BaseModel):
    id: str
    title: str
    excerpt: str
    url: str
    relevance: float
class RetrievalResult(BaseModel):
    sources: list[Source]
    method: str
