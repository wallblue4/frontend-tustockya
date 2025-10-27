// FullScreenCameraCapture.tsx
import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Button } from "../ui/Button";

interface Props {
  onVideoRecorded?: (videoUrl: string | null, blob?: Blob) => void;
}

export const FullScreenCameraCapture: React.FC<Props> = ({ onVideoRecorded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openFullScreenCamera = async () => {
    setError(null);
    setIsFullScreen(true);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Usar cámara trasera por defecto
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err: any) {
      setError("No se pudo acceder a la cámara: " + err.message);
    }
  };

  const closeFullScreen = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setIsFullScreen(false);
    setRecording(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startRecording = () => {
    if (!stream) return;
    setRecording(true);

    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      onVideoRecorded?.(url, blob);
      closeFullScreen();
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
  };

  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current?.stop();
  };

  if (!isFullScreen) {
    return (
      <div className="space-y-2">
        <Button 
          onClick={openFullScreenCamera}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
        >
          📹 Abrir camara
        </Button>
        
        {videoUrl && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">Video grabado:</p>
            <video 
              src={videoUrl} 
              controls 
              className="w-full max-w-xs rounded-lg shadow border"
            />
          </div>
        )}
      </div>
    );
  }

  // Usar React Portal para renderizar fuera del contenedor padre
  const fullScreenContent = (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh', zIndex: 999999 }}>
      {/* Header con botón cerrar */}
      <div className="flex justify-between items-center p-4 bg-black/90 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">Grabar Video</h2>
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
          muted
          className="w-full h-full object-cover"
          style={{ maxHeight: "calc(100vh - 160px)" }}
        />
        {/* Controls overlayed at the bottom center */}
        <div className="absolute left-0 w-full flex justify-center z-10" style={{ bottom: 'env(safe-area-inset-bottom, 0px)', paddingBottom: 'calc(7% + env(safe-area-inset-bottom, 80px))' }}>
          {stream && !recording && (
            <Button 
              onClick={startRecording} 
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg"
            >
              ● REC
            </Button>
          )}
          {recording && (
            <Button 
              onClick={stopRecording} 
              className="bg-white hover:bg-gray-200 text-black px-8 py-4 rounded-full text-lg font-semibold animate-pulse shadow-lg"
            >
              ■ Parar
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(fullScreenContent, document.body);
};