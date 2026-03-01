# ============================================================================
# SECTION: AgenticAlpha Dockerfile
# ============================================================================

FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt certifi

# Copy backend code
COPY config.py api.py main.py ./
COPY agents/ agents/
COPY core/ core/
COPY simulation/ simulation/
COPY llm/ llm/
COPY data/ data/

# Copy pre-built frontend
COPY frontend/dist/ frontend/dist/

# Copy .env
COPY .env .env

EXPOSE 8080

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8080"]
