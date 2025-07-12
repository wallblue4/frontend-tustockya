import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Camera, 
  X, 
  RotateCcw,
  CheckCircle,
  Loader2,
  ScanLine,
  Zap,
  Focus
} from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageFile: File) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onClose,
  isProcessing = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Usar cámara trasera por defecto
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    
    // Simular efecto de escaneado
    setTimeout(() => {
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Configurar el canvas con las dimensiones del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dibujar el frame actual del video en el canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir a blob y crear archivo
      canvas.toBlob((blob) => {
        if (blob) {
          const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedImage(imageUrl);
          
          // Crear archivo para enviar
          const file = new File([blob], `scan-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          
          stopCamera();
          setIsScanning(false);
          onCapture(file);
        }
      }, 'image/jpeg', 0.8);
    }, 1000); // Efecto de 1 segundo
  }, [onCapture, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setIsScanning(false);
    startCamera();
  }, [startCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Iniciar cámara automáticamente al montar el componente
  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-full">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold">Escáner IA</h3>
              <p className="text-gray-300 text-sm">Enfoca el producto en el recuadro</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
          {error ? (
            <div className="aspect-[4/3] flex items-center justify-center bg-gray-900 text-center p-8">
              <div className="text-center">
                <div className="p-4 bg-red-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-10 w-10 text-red-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Error de Cámara</h4>
                <p className="text-gray-300 text-sm mb-6">{error}</p>
                <div className="space-y-3">
                  <Button 
                    onClick={startCamera} 
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Intentar de Nuevo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleClose} 
                    className="w-full border-gray-600 text-gray-300 hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          ) : capturedImage ? (
            <div className="relative aspect-[4/3]">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-full object-cover"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <h4 className="text-lg font-semibold mb-2">Analizando con IA...</h4>
                    <p className="text-gray-300">Identificando producto en inventario</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Scanning Animation Overlay */}
              {isScanning && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative">
                      <Focus className="h-16 w-16 text-primary animate-pulse mx-auto mb-4" />
                      <div className="absolute inset-0">
                        <ScanLine className="h-16 w-16 text-white animate-bounce mx-auto" />
                      </div>
                    </div>
                    <h4 className="text-white text-lg font-semibold mb-2">Escaneando...</h4>
                    <p className="text-gray-300">Capturando imagen</p>
                  </div>
                </div>
              )}
              
              {/* Scanner Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Dark overlay with cut-out */}
                <div className="absolute inset-0 bg-black/40"></div>
                
                {/* Scanner frame */}
                <div className="relative z-10">
                  {/* Main scanning area */}
                  <div className="relative w-64 h-48 border-2 border-primary rounded-2xl bg-transparent">
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                      <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse">
                        <div className="absolute inset-0 bg-primary/50 animate-ping"></div>
                      </div>
                    </div>
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <Camera className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm font-medium">Centra el tenis aquí</p>
                        <p className="text-xs text-gray-300 mt-1">Para mejor reconocimiento</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Instructional text */}
              <div className="absolute top-4 left-4 right-4 z-20">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-white">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {isStreaming ? 'Cámara lista para escanear' : 'Iniciando cámara...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="mt-8 px-4">
          {capturedImage ? (
            <div className="flex space-x-3">
              <Button 
                onClick={retakePhoto} 
                variant="outline" 
                className="flex-1 border-gray-600 text-gray-300 hover:bg-white/10"
                disabled={isProcessing}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Tomar Otra
              </Button>
              <Button 
                onClick={handleClose} 
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Continuar
              </Button>
            </div>
          ) : (
            <div className="flex justify-center items-center">
              {/* Botón Principal de Captura */}
              <div className="relative">
                {/* Anillo exterior animado */}
                <div className={`absolute inset-0 rounded-full border-4 ${
                  isScanning 
                    ? 'border-primary animate-pulse' 
                    : isStreaming 
                      ? 'border-primary/50 animate-pulse' 
                      : 'border-gray-500'
                } transition-all duration-300`}
                style={{ width: '88px', height: '88px' }}
                ></div>
                
                {/* Anillo medio con efecto glow */}
                <div className={`absolute inset-2 rounded-full ${
                  isScanning 
                    ? 'bg-primary/20 ring-4 ring-primary/30' 
                    : isStreaming 
                      ? 'bg-primary/10 ring-2 ring-primary/20' 
                      : 'bg-gray-600/20'
                } transition-all duration-300`}
                ></div>
                
                {/* Botón principal */}
                <button
                  onClick={capturePhoto}
                  disabled={!isStreaming || isScanning}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 transform ${
                    isScanning
                      ? 'bg-primary scale-95 shadow-lg shadow-primary/50'
                      : isStreaming
                        ? 'bg-white hover:bg-gray-100 hover:scale-105 active:scale-95 shadow-xl'
                        : 'bg-gray-500 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {isScanning ? (
                    <div className="text-white">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="text-primary">
                      <Camera className="h-10 w-10" />
                    </div>
                  )}
                  
                  {/* Efecto de ondas al hacer clic */}
                  {isScanning && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20"></div>
                      <div className="absolute inset-0 rounded-full bg-primary animate-pulse opacity-10"></div>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Texto instructivo simple */}
        <div className="mt-4 px-4">
          <div className="text-center">
            <p className="text-gray-300 text-sm">
              Mantén el producto dentro del recuadro para mejor reconocimiento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};