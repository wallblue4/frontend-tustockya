// FullScreenCameraCapture.tsx
import React, { useRef, useState } from "react";
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

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header con botón cerrar */}
      <div className="flex justify-between items-center p-4 bg-card/80 backdrop-blur-sm text-foreground border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Grabar Video</h2>
        <Button 
          variant="outline" 
          onClick={closeFullScreen}
        >
          ✕ Cerrar
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/20 text-destructive p-3 text-center border-b border-destructive/30">
          {error}
        </div>
      )}

      {/* Video container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover rounded-lg"
          style={{ maxHeight: "calc(100vh - 160px)" }}
        />
      </div>

      {/* Controls footer */}
      <div className="p-4 bg-card/80 backdrop-blur-sm flex justify-center gap-4 border-t border-border">
        {stream && !recording && (
          <Button 
            onClick={startRecording} 
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-8 py-3 rounded-full text-lg"
          >
            ● REC
          </Button>
        )}
        
        {recording && (
          <Button 
            onClick={stopRecording} 
            className="bg-muted hover:bg-muted/90 text-foreground px-8 py-3 rounded-full text-lg animate-pulse"
          >
            ■ Parar
          </Button>
        )}
      </div>
    </div>
  );
};