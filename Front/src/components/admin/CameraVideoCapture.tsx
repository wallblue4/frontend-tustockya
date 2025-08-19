import { Button } from "../ui/Button";
// Front\src\components\admin\CameraVideoCapture.tsx
import React, { useRef, useState } from "react";
interface Props {
  onVideoRecorded?: (videoUrl: string | null, blob?: Blob) => void;
}

const CameraVideoCapture: React.FC<Props> = ({ onVideoRecorded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err: any) {
      setError("No se pudo acceder a la cámara: " + err.message);
    }
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
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
  };

  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current?.stop();
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  return (
    <div className="p-4 border rounded-xl bg-gray-50">
      <h3 className="font-semibold mb-2">Grabar Video con Cámara</h3>
      {error && <div className="text-red-600 mb-2">{error}</div>}

      <div className="flex flex-col items-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full max-w-md mb-2 rounded-lg shadow"
        />
        <div className="flex gap-2 mb-2">
          {!stream && (
            <Button onClick={startCamera}>Abrir Cámara</Button>
          )}
          {stream && !recording && (
            <Button onClick={startRecording} className="bg-green-600 hover:bg-green-700">
              Grabar
            </Button>
          )}
          {recording && (
            <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700">
              Detener
            </Button>
          )}
          {stream && (
            <Button variant="secondary" onClick={stopCamera}>
              Cerrar Cámara
            </Button>
          )}
        </div>

        {videoUrl && (
          <div className="mt-3 w-full max-w-md">
            <h4 className="font-medium mb-1">Video grabado:</h4>
            <video src={videoUrl} controls className="w-full rounded-lg shadow" />
            <a
              href={videoUrl}
              download="video.webm"
              className="block mt-2 text-primary underline text-sm"
            >
              Descargar Video
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraVideoCapture;
