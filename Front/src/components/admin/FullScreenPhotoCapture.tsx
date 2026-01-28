// FullScreenPhotoCapture.tsx
import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Button } from "../ui/Button";

interface Props {
  onPhotoTaken?: (photoUrl: string | null, blob?: Blob) => void;
  hideInternalPreview?: boolean; // Ocultar el preview interno cuando el padre maneja el preview
}

export const FullScreenPhotoCapture: React.FC<Props> = ({ onPhotoTaken, hideInternalPreview = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Estado para prevenir doble clic

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFullScreenCamera = async () => {
    setError(null);
    setIsFullScreen(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Usar cámara trasera por defecto
        audio: false, // No necesitamos audio para fotos
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err: any) {
      setError("No se pudo acceder a la cámara: " + err.message);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return; // Prevenir doble procesamiento
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      onPhotoTaken?.(url, file);
      setIsProcessing(false);
    }
    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    event.target.value = '';
  };

  const closeFullScreen = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setIsFullScreen(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const takePhoto = () => {
    if (!stream || !videoRef.current || !canvasRef.current || isProcessing) return;

    // Activar estado de procesamiento inmediatamente para prevenir doble clic
    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setIsProcessing(false);
      return;
    }

    // Configurar el canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a blob
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPhotoUrl(url);
        onPhotoTaken?.(url, blob);
        setIsProcessing(false);
        closeFullScreen();
      } else {
        setIsProcessing(false);
      }
    }, 'image/jpeg', 0.9);
  };

  if (!isFullScreen) {
    return (
      <div className="space-y-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={openFullScreenCamera}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            disabled={isProcessing}
          >
            {isProcessing ? '⏳ Procesando...' : '📸 Abrir camara'}
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full py-3"
            disabled={isProcessing}
          >
            {isProcessing ? '⏳ Procesando...' : '📁 Subir imagen'}
          </Button>
        </div>

        {!hideInternalPreview && photoUrl && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">Foto seleccionada:</p>
            <img
              src={photoUrl}
              alt="Foto del producto"
              className="w-full max-w-xs rounded-lg shadow border object-cover"
            />
          </div>
        )}
      </div>
    );
  }

  // Usar React Portal para renderizar fuera del contenedor padre
  const fullScreenContent = (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh', zIndex: 999999 }}>
      {/* Canvas oculto para capturar la foto */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header con botón cerrar */}
      <div className="flex justify-between items-center p-4 bg-black/90 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">Tomar Foto</h2>
        <Button
          variant="ghost"
          onClick={closeFullScreen}
          className="text-white hover:bg-white/10 border-white/20"
        >
          ✕ Cerrar
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 text-red-200 p-3 text-center border-b border-red-500/30">
          {error}
        </div>
      )}

      {/* Video container with controls at bottom */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ maxHeight: "calc(100vh - 160px)" }}
        />
        {/* Controls overlayed at the bottom center */}
        <div className="absolute left-0 w-full flex justify-center z-10" style={{ bottom: 'env(safe-area-inset-bottom, 0px)', paddingBottom: 'calc(7% + env(safe-area-inset-bottom, 80px))' }}>
          {stream && !isProcessing && (
            <Button
              onClick={takePhoto}
              className="bg-card text-foreground border border-border hover:bg-card/80 px-8 py-4 rounded-full text-lg font-semibold shadow-lg"
            >
              📸 Tomar Foto
            </Button>
          )}
          {isProcessing && (
            <Button
              disabled
              className="bg-gray-500 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg"
            >
              ⏳ Procesando...
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(fullScreenContent, document.body);
};
