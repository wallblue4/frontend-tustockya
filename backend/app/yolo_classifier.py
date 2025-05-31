# app/yolo_classifier.py
import torch
from ultralytics import YOLO
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

class YOLOClassifier:
    def __init__(self, model_path='models/best.pt'):
        """
        Inicializa el modelo YOLO para clasificación.
        Args:
            model_path (str): Ruta al archivo .pt del modelo entrenado.
        """
        try:
            logger.info(f"Cargando modelo YOLO de clasificación desde: {model_path}")
            # Asegúrate de que el modelo esté cargado en la CPU si no tienes GPU o CUDA configurado
            # Si tienes GPU y quieres usarla: self.model = YOLO(model_path).to('cuda')
            self.model = YOLO(model_path)
            self.model.eval() # Asegura que el modelo esté en modo evaluación
            logger.info("Modelo YOLO de clasificación cargado exitosamente.")
        except Exception as e:
            logger.error(f"Error al cargar el modelo YOLO de clasificación: {e}")
            raise RuntimeError(f"No se pudo cargar el modelo de clasificación: {e}")

    def predict(self, image_bytes: bytes):
        """
        Realiza la predicción de clase en una imagen.
        Args:
            image_bytes (bytes): Contenido binario de la imagen.
        Returns:
            dict: Diccionario con la clase predicha y su confianza.
        """
        try:
            # Abrir la imagen desde bytes con PIL
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

            # Realizar la inferencia
            # Para clasificación, results[0] contiene los resultados de la primera imagen
            # result.probs contiene las probabilidades para cada clase
            results = self.model(image)

            if not results:
                raise ValueError("No se obtuvieron resultados de la predicción.")

            result = results[0] # Para clasificación, solo hay un resultado por imagen

            # Extraer la clase predicha y la confianza
            class_id = result.probs.top1
            class_name = result.names[class_id]
            confidence = result.probs.top1conf.item()

            return {
                "class_name": class_name,
                "confidence": round(confidence, 4) # Redondear para mejor visualización
            }
        except Exception as e:
            logger.error(f"Error durante la predicción de la imagen: {e}")
            raise
