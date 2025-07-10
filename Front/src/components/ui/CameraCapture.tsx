import React, { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, X, Zap, ZapOff, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  isProcessing?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
  isProcessing = false
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      initializeCamera();
      checkAvailableCameras();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, facingMode]);

  const checkAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (error) {
      console.error('Error checking cameras:', error);
    }
  };

  const initializeCamera = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const toggleFlash = () => {
    setFlashEnabled(prev => !prev);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flash effect
    if (flashEnabled) {
      const flashOverlay = document.getElementById('flash-overlay');
      if (flashOverlay) {
        flashOverlay.style.opacity = '0.8';
        setTimeout(() => {
          flashOverlay.style.opacity = '0';
        }, 150);
      }
    }

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onCapture(file);
      }
    }, 'image/jpeg', 0.8);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Flash Overlay */}
      <div 
        id="flash-overlay"
        className="absolute inset-0 bg-white opacity-0 transition-opacity duration-150 pointer-events-none z-20"
      />
      
      {/* Camera Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex justify-between items-center text-white">
          <h2 className="text-xl font-semibold">📸 Escanear Producto</h2>
          <div className="flex items-center gap-3">
            {hasMultipleCameras && (
              <Button
                variant="ghost"
                size="sm"
                onClick={switchCamera}
                className="text-white hover:bg-white/20 p-2"
                disabled={isLoading}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFlash}
              className={`text-white hover:bg-white/20 p-2 ${flashEnabled ? 'bg-yellow-500/30' : ''}`}
            >
              {flashEnabled ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Iniciando cámara...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center text-white p-6">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={initializeCamera} variant="ghost" className="text-white">
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Camera Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Scanning Guide */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-64 h-64 border-2 border-white/70 rounded-xl relative">
                {/* Corner indicators */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                
                {/* Scanning animation */}
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" />
                </div>
              </div>
              
              <p className="text-white text-center mt-4 text-sm bg-black/50 px-3 py-1 rounded-full">
                Centra el producto en el marco
              </p>
            </div>
          </div>

          {/* Vignette Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        </div>
      </div>

      {/* Camera Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-8">
            {/* Gallery Button (placeholder) */}
            <div className="w-12 h-12" />
            
            {/* Capture Button */}
            <Button
              onClick={capturePhoto}
              disabled={isLoading || isProcessing}
              className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center shadow-lg"
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 text-gray-600 animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-400" />
              )}
            </Button>
            
            {/* Mode indicator */}
            <div className="w-12 h-12 flex items-center justify-center text-white text-xs">s
              <div className="text-center">
                <Camera className="h-4 w-4 mx-auto mb-1" />
                <span>{facingMode === 'environment' ? 'Trasera' : 'Frontal'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {isProcessing && (
          <div className="text-center mt-4">
            <p className="text-white text-sm">Analizando producto...</p>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};