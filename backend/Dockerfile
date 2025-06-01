# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Instalar dependencias sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements desde la estructura del monorepo
COPY app/requirements.txt ./

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir \
    torch==2.0.1+cpu \
    torchvision==0.15.2+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Copiar aplicación y modelos
COPY app/ ./app/
COPY models/ ./models/

# Variables para Render
ENV PORT=10000
ENV PYTHONUNBUFFERED=1
ENV MODEL_PATH=models/best.pt

EXPOSE 10000

# Comando optimizado para Render
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:$PORT --workers 1 --worker-class uvicorn.workers.UvicornWorker --timeout 120 --max-requests 100 app.main:app"]
