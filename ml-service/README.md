# FinIQ inference service
Python 3.11+: `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt` then `.venv/bin/uvicorn app.main:app --port 8001`. Tests: `.venv/bin/python -m pytest`.

`/docs` provides typed schemas. `/classify`: score 0–100; <50 Beginner, 50–<80 Intermediate, >=80 Advanced. Sensitive demographic traits are deliberately not used to assign ability.

`/recommend`: uncompleted lesson candidates, knowledge level, weak topics and optional topic preferences. Ranking: weak topic +3, matching difficulty +2, preferred topic +1; ties use lesson ID. No collaborative-filtering claim.

`/risk`: days_since_activity (0–36500), completion_rate and quiz_participation (0–1), active_days_14 (0–14). Score = 100 × [0.45×min(days/14,1) + 0.25×(1−completion) + 0.15×(1−quiz) + 0.15×(1−activeDays/14)]. Low <35, Medium 35–<65, High >=65. These are support indicators, not validated predictions.

`/retrieve`: query, en/hi language, source documents. TF-IDF lexical similarity with small Hindi keyword expansion; threshold 0.06; returns up to three excerpts. This is retrieval, not embedding-based semantic understanding or LLM generation. There is no paid API requirement. No model is retrained on startup. Service is private on the Compose network; expose only through the Java API.
