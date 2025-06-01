# backend/app/main.py (versión optimizada para Render)
import os
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .yolo_classifier import YOLOClassifier

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="🎾 Tennis Classifier API",
    description="Demo API para clasificación de tenis con YOLO",
    version="1.0.0",
    docs_url="/docs",  # Swagger disponible en /docs
    redoc_url="/redoc"
)

# CORS permisivo para demo (ajustar en producción)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar por dominios específicos en producción
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Variable global para el modelo
model = None

@app.on_event("startup")
async def startup_event():
    """Cargar modelo al iniciar"""
    global model
    try:
        model_path = os.getenv("MODEL_PATH", "models/best.pt")
        logger.info(f"🔄 Cargando modelo desde: {model_path}")
        
        model = YOLOClassifier(model_path=model_path)
        logger.info("✅ Modelo cargado exitosamente")
        
    except Exception as e:
        logger.error(f"❌ Error al cargar modelo: {e}")
        # No fallar el startup para que el health check funcione

@app.get("/")
async def root():
    """Endpoint raíz con información del servicio"""
    return {
        "service": "Tennis Classifier API",
        "status": "running",
        "version": "1.0.0",
        "model_loaded": model is not None,
        "endpoints": {
            "classify": "POST /classify",
            "health": "GET /health", 
            "docs": "GET /docs"
        }
    }

@app.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    """Clasificar imagen de tenis"""
    
    # Verificar modelo
    if not model:
        raise HTTPException(
            status_code=503, 
            detail="Modelo no disponible. El servicio se está inicializando."
        )
    
    # Validar archivo
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser una imagen (jpg, png, etc.)"
        )
    
    # Limitar tamaño (importante para tier gratuito)
    max_size = 5 * 1024 * 1024  # 5MB
    if hasattr(file, 'size') and file.size and file.size > max_size:
        raise HTTPException(
            status_code=413,
            detail="Imagen muy grande. Máximo 5MB permitido."
        )
    
    try:
        # Procesar imagen
        logger.info(f"🔄 Procesando: {file.filename}")
        image_bytes = await file.read()
        
        # Predicción
        prediction = model.predict(image_bytes)
        
        logger.info(f"✅ Predicción completada para: {file.filename}")
        
        return JSONResponse(content={
            "success": True,
            "filename": file.filename,
            "prediction": prediction,
            "message": "Clasificación completada exitosamente"
        })
        
    except Exception as e:
        logger.error(f"❌ Error en predicción: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando imagen: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check para monitoreo"""
    return {
        "status": "healthy" if model else "starting",
        "model_loaded": model is not None,
        "service": "tennis-classifier-api",
        "timestamp": os.getenv("RENDER_SERVICE")  # Variable de Render
    }

# Endpoint adicional para debug (solo en desarrollo)
@app.get("/debug")
async def debug_info():
    """Información de debug"""
    import psutil
    
    return {
        "environment": os.getenv("ENVIRONMENT", "unknown"),
        "model_path": os.getenv("MODEL_PATH", "unknown"),
        "memory_usage": f"{psutil.virtual_memory().percent:.1f}%",
        "model_status": "loaded" if model else "not_loaded"
    }
