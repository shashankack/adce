# Slim ADCE ML image for free tiers (Render, etc.)
# Uses hashing embedder by default — MiniLM extras are NOT installed.
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ADCE_EMBEDDER=hashing \
    PORT=8000

COPY pyproject.toml README.md ./
COPY adce_ml ./adce_ml

RUN pip install --no-cache-dir -U pip \
 && pip install --no-cache-dir .

EXPOSE 8000

# Render sets $PORT; local default 8000
CMD ["sh", "-c", "uvicorn adce_ml.server:app --host 0.0.0.0 --port ${PORT:-8000}"]
