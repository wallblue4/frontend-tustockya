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
      
      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara');
      }

      // Primero intentar con configuración básica
      let constraints = {
        video: {
          facingMode: 'environment'
        }
      };

      try {
        // Intentar con configuración avanzada primero
        constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsStreaming(true);
        }
      } catch (advancedError) {
        console.log('Configuración avanzada falló, intentando básica:', advancedError);
        
        // Si falla, intentar con configuración básica
        const basicConstraints = {
          video: true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsStreaming(true);
        }
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      
      let errorMessage = 'No se pudo acceder a la cámara.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Acceso a la cámara denegado. Por favor, permite el acceso y reintenta.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Tu navegador no soporta acceso a la cámara.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación.';
      }
      
      setError(errorMessage);
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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 safe-area-top">
        <div className="flex items-center space-x-3"></div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClose}
          className="text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Camera View - Responsive container */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl w-full h-full max-w-2xl max-h-full">
          {error ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-center p-4 sm:p-8">
              <div className="text-center max-w-sm">
                <div className="p-4 bg-red-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-10 w-10 text-destructive" />
                </div>
                <h4 className="text-foreground font-semibold mb-2">Error de Cámara</h4>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{error}</p>
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
                    className="w-full border-border text-muted-foreground hover:bg-muted/10"
                  >
                    Cancelar
                  </Button>
                </div>
                
                {/* Instrucciones adicionales */}
                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h5 className="text-primary font-medium text-sm mb-2">💡 Consejos:</h5>
                  <ul className="text-muted-foreground text-xs space-y-1 text-left">
                    <li>• Asegúrate de permitir el acceso a la cámara</li>
                    <li>• Cierra otras apps que usen la cámara</li>
                    <li>• Recarga la página si el problema persiste</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : capturedImage ? (
            <div className="relative w-full h-full">
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
              
              {/* Controls para imagen capturada - dentro de la imagen */}
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button 
                    onClick={retakePhoto} 
                    variant="outline" 
                    className="flex-1 border-border text-foreground hover:bg-muted/10 bg-black/50 backdrop-blur-sm"
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
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Scanning Animation Overlay */}
              {isScanning && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
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
              
              {/* Scanner Frame Overlay - Responsive */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4 py-4">
                {/* Dark overlay with cut-out */}
                <div className="absolute inset-0 bg-black/40"></div>
                
                {/* Scanner frame - Responsive size */}
                <div className="relative z-10">
                  {/* Main scanning area - Se adapta al contenedor */}
                  <div className="relative w-full max-w-80 aspect-square min-w-64 border-2 border-primary rounded-2xl bg-transparent">
                    {/* Corner indicators - Responsive */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 sm:w-8 sm:h-8 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 sm:w-8 sm:h-8 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                      <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse">
                        <div className="absolute inset-0 bg-primary/50 animate-ping"></div>
                      </div>
                    </div>
                    
                    {/* Center content - Responsive text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white bg-black/50 px-3 sm:px-6 py-2 sm:py-3 rounded-lg backdrop-blur-sm">
                        <Camera className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-primary" />
                        <p className="text-sm sm:text-base font-medium">Centra el producto aquí</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Instructional text - Responsive positioning */}
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20">
                <div className="bg-card/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-border/30">
                  <div className="flex items-center space-x-2 text-foreground">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">
                      {isStreaming ? 'Cámara lista para escanear' : 'Iniciando cámara...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de captura dentro de la imagen - Responsive */}
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-20">
                <div className="relative">
                  {/* Anillo exterior animado - Responsive */}
                  <div className={`absolute inset-0 rounded-full border-2 sm:border-4 ${
                    isScanning 
                      ? 'border-primary animate-pulse' 
                      : isStreaming 
                        ? 'border-primary/50 animate-pulse' 
                        : 'border-gray-500'
                  } transition-all duration-300 w-16 h-16 sm:w-20 sm:h-20`}
                  ></div>
                  
                  {/* Anillo medio con efecto glow - Responsive */}
                  <div className={`absolute inset-1 sm:inset-2 rounded-full ${
                    isScanning 
                      ? 'bg-primary/20 ring-2 sm:ring-4 ring-primary/30' 
                      : isStreaming 
                        ? 'bg-primary/10 ring-1 sm:ring-2 ring-primary/20' 
                        : 'bg-gray-600/20'
                  } transition-all duration-300`}
                  ></div>
                  
                  {/* Botón principal - Responsive */}
                  <button
                    onClick={capturePhoto}
                    disabled={!isStreaming || isScanning}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-200 transform ${
                      isScanning
                        ? 'bg-primary scale-95 shadow-lg shadow-primary/50'
                        : isStreaming
                          ? 'bg-white hover:bg-gray-100 hover:scale-105 active:scale-95 shadow-xl'
                          : 'bg-gray-500 cursor-not-allowed'
                    } disabled:opacity-50`}
                  >
                    {isScanning ? (
                      <div className="text-white">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
                      </div>
                    ) : (
                      <div className="text-primary">
                        <Camera className="h-6 w-6 sm:h-8 sm:w-8" />
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
            </div>
          )}
          
          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Texto instructivo - Fixed at bottom */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 safe-area-bottom">
        <div className="text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">
            Mantén el producto dentro del recuadro para mejor reconocimiento
          </p>
        </div>
      </div>
    </div>
  );
};