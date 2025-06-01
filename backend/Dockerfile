FROM python:3.9-slim
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY app/requirements.txt ./

# Instalar PyTorch CPU primero
RUN pip install --no-cache-dir \
    torch==2.1.0+cpu \
    torchvision==0.16.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Instalar otras dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar aplicación y modelos
COPY app/ ./app/
COPY models/ ./models/

# Variables de entorno
ENV PORT=10000
ENV PYTHONUNBUFFERED=1
ENV MODEL_PATH=models/best.pt

EXPOSE 10000

# Comando optimizado para Render (recursos limitados)
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:$PORT --workers 1 --worker-class uvicorn.workers.UvicornWorker --timeout 300 --max-requests 50 --preload --worker-tmp-dir /dev/shm app.main:app"]
