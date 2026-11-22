FROM node:22-alpine AS web
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM maven:3.9.11-eclipse-temurin-17 AS api
WORKDIR /build
COPY backend/pom.xml ./
COPY backend/src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B package -DskipTests

FROM eclipse-temurin:17-jre AS java
FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends nginx ca-certificates \
    && rm -rf /var/lib/apt/lists/* && useradd --uid 10001 --create-home finiq
COPY --from=java /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="/opt/java/openjdk/bin:${PATH}" PYTHONUNBUFFERED=1 OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1
WORKDIR /app
COPY ml-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY ml-service/app ./app
COPY --from=api /build/target/finiq-api-1.0.0.jar ./api.jar
COPY --from=web /build/dist /app/web
COPY deploy/render/start.py deploy/render/nginx.conf ./
USER finiq
EXPOSE 10000
HEALTHCHECK --interval=30s --start-period=120s --timeout=10s CMD python /app/start.py --health
CMD ["python", "/app/start.py"]
