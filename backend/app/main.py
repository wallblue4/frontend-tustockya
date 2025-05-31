# app/main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware # Para conectar con el frontend
from .yolo_classifier import YOLOClassifier
import logging

# Configuración básica de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Servicio de Clasificación de Tenis con YOLO",
    description="API para clasificar imágenes de tenis (raquetas, pelotas, etc.) usando un modelo YOLO entrenado.",
    version="1.0.0"
)

# --- Configuración CORS para el Frontend ---
# Ajusta esto a los dominios de tu frontend.
# En desarrollo, puedes usar "http://localhost:XXXX" o "*" para permitir todo (NO RECOMENDADO EN PRODUCCIÓN).
origins = [
    "http://localhost:3000",  # Sigue siendo útil si pruebas desde tu misma PC
    "http://127.0.0.1:5500",  # Si usas Live Server para el HTML simple
    "http://192.168.68.152",  # <-- ¡Añade tu IP directa si accedes así!
    "http://192.168.68.152:5173", # <-- Si tu React App corre en esa IP y puerto
    "capacitor://localhost",  # <-- Si tu app es Capacitor
    "ionic://localhost",      # <-- Si tu app es Ionic
    "app://localhost",        # <-- Otros esquemas de apps
    "*"                       # <-- ¡Añade este comodín para depuración!
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variable global para el modelo
yolo_classifier_model: YOLOClassifier = None

@app.on_event("startup")
async def load_model_on_startup():
    """
    Carga el modelo YOLO de clasificación una vez al iniciar la aplicación.
    """
    global yolo_classifier_model
    try:
        # La ruta del modelo es relativa a la carpeta raíz del proyecto,
        # no a la carpeta 'app' donde está main.py
        yolo_classifier_model = YOLOClassifier(model_path='models/best.pt')
        logger.info("Servicio de clasificación de tenis iniciado y modelo cargado.")
    except Exception as e:
        logger.error(f"Fallo crítico al cargar el modelo: {e}")
        # En producción, podrías querer que la app falle si el modelo no carga
        # raise HTTPException(status_code=500, detail="No se pudo iniciar el servicio de inferencia.")

@app.get("/")
async def read_root():
    """
    Endpoint de bienvenida.
    """
    return {"message": "Bienvenido al Servicio de Clasificación de Tenis con YOLO. Usa /classify para enviar imágenes."}

@app.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    """
    Recibe una imagen y devuelve la clasificación predicha por el modelo YOLO.
    """
    if not yolo_classifier_model:
        raise HTTPException(status_code=503, detail="El modelo de clasificación aún no está cargado o hubo un error al iniciarlo.")

    # Validar tipo de archivo
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo enviado no es una imagen válida.")

    try:
        # Leer el contenido de la imagen
        image_bytes = await file.read()

        # Realizar la predicción
        prediction_result = yolo_classifier_model.predict(image_bytes)

        return JSONResponse(content={"prediction": prediction_result})

    except ValueError as ve:
        logger.error(f"Error en la predicción: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error interno del servidor al clasificar imagen: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {e}")

@app.get("/health")
async def health_check():
    """
    Endpoint para verificar el estado del servicio y la carga del modelo.
    """
    if yolo_classifier_model:
        return {"status": "ok", "model_loaded": True, "message": "Servicio y modelo funcionando correctamente."}
    else:
        return {"status": "degraded", "model_loaded": False, "message": "Servicio funcionando, pero el modelo aún no está cargado o falló al cargar."}
