# backend/Dockerfile

# --- OPCIÓN 1: Para CPU (más sencillo) ---
FROM python:3.9-slim-buster as builder
WORKDIR /app
COPY app/requirements.txt ./app/
# Primero instala el resto de dependencias de requirements.txt
# Luego instala torch y torchvision de manera específica para CPU
RUN pip install --no-cache-dir -r app/requirements.txt && \
    pip install --no-cache-dir torch==2.7.0 torchvision==0.22.0 --index-url https://download.pytorch.org/whl/cpu
FROM python:3.9-slim-buster
WORKDIR /app
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    # Puedes añadir otras librerías comunes de OpenCV si el error persiste, como:
    # libsm6 \
    # libxrender1 \
    # libfontconfig1 \
    # libxext6 \
    # libgtk2.0-0 \
    && rm -rf /var/lib/apt/lists/* # Limpia el caché de apt para reducir el tamaño de la imagen
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin/ /usr/local/bin/     
COPY app/ ./app/
COPY models/ ./models/
EXPOSE 8000
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]


# --- OPCIÓN 2: Para GPU (más complejo, requiere drivers NVIDIA en el host y Docker con soporte CUDA) ---
# Descomenta este bloque y comenta el anterior si necesitas GPU
# FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04 as builder
# ENV DEBIAN_FRONTEND=noninteractive
# RUN apt-get update && apt-get install -y python3.9 python3-pip curl && \
#     apt-get clean && rm -rf /var/lib/apt/lists/*
# RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.9 1
# RUN update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 1
# WORKDIR /app
# COPY app/requirements.txt ./app/
# # Ajusta la URL de PyTorch si usas una versión diferente de CUDA o CPU
# RUN pip install --no-cache-dir -r app/requirements.txt \
#     && pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118 \
#     && echo "Dependencias GPU instaladas."

# FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04
# ENV DEBIAN_FRONTEND=noninteractive
# RUN apt-get update && apt-get install -y python3.9 && apt-get clean && rm -rf /var/lib/apt/lists/*
# RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.9 1
# WORKDIR /app
# COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
# COPY app/ ./app/
# COPY models/ ./models/
# EXPOSE 8000
# CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]
