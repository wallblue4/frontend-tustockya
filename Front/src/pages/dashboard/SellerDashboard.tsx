import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  ShoppingBag, 
  Package, 
  Clock, 
  ArrowLeft, 
  DollarSign,
  Plus,
  Receipt,
  TrendingUp,
  Bell,
  AlertCircle,
  List
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { DashboardStats } from '../../components/seller/DashboardStats';
import { ProductScanner } from '../../components/seller/ProductScanner';
import { SalesForm } from '../../components/seller/SalesForm';
import { ExpensesForm } from '../../components/seller/ExpensesForm';
import { ExpensesList } from '../../components/seller/ExpensesList';
import { SalesList } from '../../components/seller/SalesList';
import { TransfersView } from '../../components/seller/TransfersView';
import { vendorAPI } from '../../services/api';

type ViewType = 'dashboard' | 'scan' | 'new-sale' | 'today-sales' | 'expenses' | 'expenses-list' | 'transfers' | 'notifications';

interface ScannedProduct {
  id: string;
  name: string;
  image: string;
  sizes: Array<{
    size: string;
    quantity: number;
    location: string;
  }>;
}

// Define la interfaz para la respuesta esperada de tu backend
interface PredictionResult {
  class_name: string;
  confidence: number;
}

interface ScanResponse {
  prediction: PredictionResult;
}

export const SellerDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Estados para la funcionalidad de cámara
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setApiError(null);
      const response = await vendorAPI.getDashboard();
      const apiData = response.data;
      
      setDashboardData(apiData);
    } catch (error) {
      console.warn('Backend API not available, using mock data for development');
      
      // Set a user-friendly error message
      setApiError('Conectando con el servidor...');
      
      // Use mock data for development when backend is not available
      setDashboardData({
        vendor: {
          name: 'Juan Pérez',
          email: 'juan@tustockya.com',
          location: 'Local #1'
        },
        totalSales: 15,
        pendingSales: 3,
        totalAmount: 2450000,
        pendingAmount: 450000,
        itemsSold: 18,
        totalExpenses: 150000,
        netIncome: 2300000,
        paymentMethods: {
          cash: 1200000,
          card: 800000,
          transfer: 450000
        },
        pendingActions: {
          salesToConfirm: 3,
          transferRequests: 2,
          discountRequests: 1,
          unreadReturns: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIONES DE CÁMARA INTEGRADAS ---
  
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
    return `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api`;
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
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <Camera className="h-8 w-8 mx-auto mb-2 text-blue-600 animate-pulse" />
            <p className="text-blue-800">Analizando producto...</p>
          </CardContent>
        </Card>
      );
    }

    if (errorMessage) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-red-800 font-semibold">{errorMessage}</p>
          </CardContent>
        </Card>
      );
    }

    if (scanResult) {
      return (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
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
          </CardContent>
        </Card>
      );
    }

    return null; // No mostrar nada si no hay escaneo, error ni resultado
  };

  // --- FIN FUNCIONES DE CÁMARA ---

  const handleSellProduct = (product: any, size: string) => {
    // Navigate to sales form with pre-filled product
    setCurrentView('new-sale');
  };

  const handleRequestTransfer = (product: any) => {
    // Navigate to transfer request form
    setCurrentView('transfers');
  };

  const goBack = () => {
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'scan':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={goBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
            </Button>
            <ProductScanner 
              onSellProduct={handleSellProduct}
              onRequestTransfer={handleRequestTransfer}
            />
          </div>
        );
      
      case 'new-sale':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={goBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
            </Button>
            <SalesForm />
          </div>
        );
      
      case 'today-sales':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={goBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
            </Button>
            <SalesList />
          </div>
        );
      
      case 'expenses':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={goBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
            </Button>
            <ExpensesForm />
          </div>
        );

      case 'expenses-list':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={goBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
            </Button>
            <ExpensesList />
          </div>
        );
      
      case 'transfers':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={goBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
            </Button>
            <TransfersView />
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={goBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
            </Button>
            <NotificationsView />
          </div>
        );
      
      default:
        return <DashboardView />;
    }
  };

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Input oculto para la cámara */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageCapture}
        accept="image/*"
        capture="environment" // Fuerza cámara trasera en móviles (opcional)
        style={{ display: 'none' }}
      />

      {/* API Status Warning */}
      {apiError && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Modo de Desarrollo</p>
                <p className="text-sm text-amber-700">
                  Usando datos de prueba. El servidor backend no está disponible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={handleScanProduct}
              disabled={isScanning}
            >
              <Camera className="h-6 w-6" />
              <span className="text-sm">{isScanning ? 'Escaneando...' : 'Escanear'}</span>
            </Button>
            
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setCurrentView('new-sale')}
            >
              <ShoppingBag className="h-6 w-6" />
              <span className="text-sm">Nueva Venta</span>
            </Button>
            
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setCurrentView('expenses')}
            >
              <Receipt className="h-6 w-6" />
              <span className="text-sm">Registrar Gasto</span>
            </Button>
            
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setCurrentView('today-sales')}
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Ver Ventas</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado del escaneo */}
      {renderScanResult()}
      
      {/* Vendor Info */}
      {dashboardData && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{dashboardData.vendor.name}</h2>
                <p className="text-gray-600">{dashboardData.vendor.email}</p>
                <p className="text-sm text-gray-500">{dashboardData.vendor.location}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Resumen del Día</p>
                <p className="text-lg font-bold text-success">
                  {dashboardData.totalSales} ventas confirmadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {dashboardData && <DashboardStats data={dashboardData} />}

      {/* Navigation Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('today-sales')}>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Ventas del Día</h4>
              <p className="text-sm text-gray-600">Ver y confirmar ventas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('expenses-list')}>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-error/10 rounded-lg">
              <List className="h-6 w-6 text-error" />
            </div>
            <div>
              <h4 className="font-semibold">Ver Gastos</h4>
              <p className="text-sm text-gray-600">Gastos del día</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('transfers')}>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Package className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h4 className="font-semibold">Transferencias</h4>
              <p className="text-sm text-gray-600">Solicitar y gestionar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('expenses')}>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-warning/10 rounded-lg">
              <Receipt className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h4 className="font-semibold">Gastos</h4>
              <p className="text-sm text-gray-600">Registrar gastos del día</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('notifications')}>
          <CardContent className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-error/10 rounded-lg">
              <Bell className="h-6 w-6 text-error" />
            </div>
            <div>
              <h4 className="font-semibold">Notificaciones</h4>
              <p className="text-sm text-gray-600">Devoluciones y alertas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Placeholder component for notifications view
  const NotificationsView = () => (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Notificaciones</h2>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">Vista de notificaciones - En desarrollo</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout title="Panel de Vendedor">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={
      currentView === 'dashboard' ? 'Panel de Vendedor' :
      currentView === 'scan' ? 'Escanear Producto' :
      currentView === 'new-sale' ? 'Nueva Venta' :
      currentView === 'today-sales' ? 'Ventas del Día' :
      currentView === 'expenses' ? 'Registrar Gasto' :
      currentView === 'expenses-list' ? 'Gastos del Día' :
      currentView === 'transfers' ? 'Transferencias' :
      'Notificaciones'
    }>
      {renderCurrentView()}
    </DashboardLayout>
  );
};