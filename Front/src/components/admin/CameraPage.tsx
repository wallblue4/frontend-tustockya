import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const CameraPage = () => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chunks = useRef<Blob[]>([]);
  const navigate = useNavigate();

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      console.log("🎥 Video capturado:", url, blob);
      chunks.current = [];
      // Aquí podrías enviarlo al backend o guardarlo en estado global
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setRecording(false);
  };

  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center space-y-6">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full max-w-2xl h-auto rounded-lg border"
      />
      <div className="flex space-x-4">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg"
          >
            🎥 Iniciar
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-red-600 text-white rounded-lg text-lg"
          >
            ⏹ Detener
          </button>
        )}
        <button
          onClick={() => navigate("/admin")}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg text-lg"
        >
          🔙 Volver
        </button>
      </div>
    </div>
  );
};

export default CameraPage;
