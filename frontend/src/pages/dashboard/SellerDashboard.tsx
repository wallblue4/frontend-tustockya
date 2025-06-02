import React, { useRef, useState } from 'react';
import { Camera, ShoppingBag, Package, Clock } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Button } from '../../components/ui/Button'; // Asumiendo que este es tu componente Button

// Define la interfaz para la respuesta esperada de tu backend
interface PredictionResult {
  class_name: string;
  confidence: number;
}

interface ScanResponse {
  prediction: PredictionResult;
}

export const SellerDashboard: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<PredictionResult | null>(null); // Estado para guardar el resultado de la IA
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Estado para errores
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para abrir la cámara (o selector de archivos)
  const handleScanProduct = () => {
    // Limpiamos los estados de resultado y error antes de una nueva escaneo
    setScanResult(null);
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  // Manejar la imagen capturada
  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Imagen capturada:', file.name);
      sendImageToServer(file);
    }
  };

  // --- FUNCIÓN CLAVE: Determina la URL del backend ---
  const getBackendApiUrl = () => {
    // Cuando el frontend se ejecuta dentro del contenedor Docker con Nginx,
    // y Nginx está configurado para hacer proxy de /api/ al backend.
    // window.location.protocol será 'http:'
    // window.location.hostname será la IP de tu PC (ej. 192.168.68.152) o 'localhost'
    // window.location.port será el puerto mapeado (ej. '3000')
    // El frontend llamará a /api/classify, y Nginx lo redirigirá.
    return `https://electricity-karen-application-repairs.trycloudflare.com`;
  };

  // --- FUNCIÓN CLAVE: ENVIAR IMAGEN AL SERVIDOR ---
  const sendImageToServer = async (imageFile: File) => {
    setIsScanning(true); // Activar estado de escaneo
    setErrorMessage(null); // Limpiar errores anteriores

    const formData = new FormData();
    // ¡IMPORTANTE! El nombre del campo debe ser 'file' para coincidir con tu endpoint de FastAPI
    formData.append('file', imageFile);

    try {
      // Obtener la URL base para el API (ej. http://192.168.68.152:3000/api)
      const backendApiBaseUrl = getBackendApiUrl();
      const classifyEndpointUrl = `${backendApiBaseUrl}/classify`; // Endpoint completo

      console.log('Intentando enviar imagen a:', classifyEndpointUrl);

      const response = await fetch(classifyEndpointUrl, {
        method: 'POST',
        body: formData,
        // No necesitas establecer 'Content-Type' para FormData, fetch lo hace automáticamente
      });

      if (!response.ok) {
        // Si hay un error HTTP, intentamos leer el mensaje de error del backend
        const errorData = await response.json();
        // Incluye el status code para depuración
        throw new Error(errorData.detail || `Error del servidor: ${response.status} - ${response.statusText}`);
      }

      const result: ScanResponse = await response.json();
      console.log('Respuesta del servidor:', result);
      
      // Actualizamos el estado con el resultado de la clasificación
      if (result && result.prediction) {
        setScanResult(result.prediction);
      } else {
        setErrorMessage('La respuesta del servidor no tiene el formato esperado.');
      }

    } catch (error: any) {
      console.error('Error escaneando producto:', error);
      // Muestra el mensaje de error directamente al usuario
      setErrorMessage(`Error al escanear el producto: ${error.message}`);
    } finally {
      setIsScanning(false); // Desactivar estado de escaneo
      // Limpiar el input para permitir escanear la misma imagen nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Manejar y mostrar el resultado del escaneo
  const renderScanResult = () => {
    if (isScanning) {
      return (
        <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center animate-pulse">
          <Camera className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <p className="text-blue-800">Analizando producto...</p>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="col-span-2 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 font-semibold">{errorMessage}</p>
        </div>
      );
    }

    if (scanResult) {
      return (
        <div className="col-span-2 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <h3 className="text-green-800 text-lg font-semibold mb-2">Clasificación Exitosa:</h3>
          <p className="text-green-800">
            **Clase:** <span className="font-bold">{scanResult.class_name}</span>
          </p>
          <p className="text-green-800">
            **Confianza:** <span className="font-bold">{(scanResult.confidence * 100).toFixed(2)}%</span>
          </p>
          {/* Aquí podrías añadir más lógica basada en la clase_name, como mostrar detalles del producto */}
          {scanResult.class_name === 'raqueta' && (
            <p className="mt-2 text-green-700">¡Parece una raqueta de tenis!</p>
          )}
          {scanResult.class_name === 'pelota' && (
            <p className="mt-2 text-green-700">¡Identificada una pelota de tenis!</p>
          )}
        </div>
      );
    }

    return null; // No mostrar nada si no hay escaneo, error ni resultado
  };

  return (
    <DashboardLayout title="Panel de Vendedor">
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-6 p-6">
        {/* Input oculto para la cámara */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageCapture}
          accept="image/*"
          capture="environment" // Fuerza cámara trasera en móviles (opcional)
          style={{ display: 'none' }}
        />

        {/* Botón Escanear */}
        <Button
          className="h-48 text-xl font-semibold flex flex-col items-center justify-center space-y-4"
          onClick={handleScanProduct}
          isLoading={isScanning} // Usar la prop isLoading de tu componente Button
          disabled={isScanning}
        >
          <Camera className="h-12 w-12" />
          <span>{isScanning ? 'Escaneando...' : 'Escanear'}</span>
        </Button>

        <Button
          className="h-48 text-xl font-semibold flex flex-col items-center justify-center space-y-4"
          onClick={() => console.log('Nueva Venta')}
        >
          <ShoppingBag className="h-12 w-12" />
          <span>Nueva Venta</span>
        </Button>

        <Button
          className="h-48 text-xl font-semibold flex flex-col items-center justify-center space-y-4"
          onClick={() => console.log('Solicitar Tenis')}
        >
          <Package className="h-12 w-12" />
          <span>Solicitar Tenis</span>
        </Button>

        <Button
          className="h-48 text-xl font-semibold flex flex-col items-center justify-center space-y-4"
          onClick={() => console.log('Solicitudes Pendientes')}
        >
          <Clock className="h-12 w-12" />
          <span>Solicitudes Pendientes</span>
        </Button>

        {/* Contenedor para mostrar el estado y los resultados */}
        {renderScanResult()}
      </div>
    </DashboardLayout>
  );
};
