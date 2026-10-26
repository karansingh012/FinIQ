FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && useradd -r -u 10001 -m finiq
COPY app ./app
USER finiq
EXPOSE 8001
HEALTHCHECK --interval=20s --start-period=20s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')"
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8001"]
