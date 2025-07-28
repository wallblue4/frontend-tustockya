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
  List,
  ChevronRight,
  Truck
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
import { CameraCapture } from '../../components/seller/CameraCapture';
import { transfersAPI } from '../../services/transfersAPI';

type ViewType = 'dashboard' | 'scan' | 'new-sale' | 'today-sales' | 'expenses' | 'expenses-list' | 'transfers' | 'notifications';

// Interfaces
interface PrefilledProduct {
  code: string;
  brand: string;
  model: string;
  size: string;
  price: number;
  location?: string;
  storage_type?: string;
}

interface PredictionResult {
  class_name: string;
  confidence: number;
}

// Nueva interfaz para los datos de transferencias
interface TransfersSummary {
  total_requests: number;
  pending: number;
  accepted: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
}

export const SellerDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [prefilledProduct, setPrefilledProduct] = useState<PrefilledProduct | null>(null);
  const [productDataForTransfer, setProductDataForTransfer] = useState<any>(null);

  // Estados para la cámara
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  
  // Nuevo estado para transferencias
  const [transfersSummary, setTransfersSummary] = useState<TransfersSummary | null>(null);
  const [transfersLoading, setTransfersLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDashboardData();
    loadTransfersSummary();
  }, []);

  const loadDashboardData = async () => {
    try {
      setApiError(null);
      const response = await vendorAPI.getDashboard();
      setApiData(response); 
    } catch (error) {
      console.warn('Backend API not available, using mock data for development');
      
      setApiError('Conectando con el servidor...');
      
      // Mock data
      setApiData({
        success: true,
        dashboard_timestamp: new Date().toISOString(),
        vendor_info: {
          name: 'Carlos Rodriguez (Mock)',
          email: 'vendedor6@tustockya.com',
          location_name: 'Local #5',
          role: 'seller',
          location_id: 5
        },
        today_summary: {
          date: new Date().toISOString().split('T')[0],
          sales: {
            total_count: 2,
            pending_confirmations: 0,
            total_amount: 788000,
            confirmed_amount: 788000,
            pending_amount: 0
          },
          expenses: {
            count: 0,
            total_amount: 0
          },
          net_income: 788000,
          payment_methods_breakdown: []
        },
        pending_actions: {
          sale_confirmations: 0,
          transfer_requests: {
            pending: 6,
            in_transit: 2,
            delivered: 0
          },
          discount_requests: {
            pending: 0,
            approved: 0,
            rejected: 0
          },
          return_notifications: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para cargar resumen de transferencias usando endpoint VE002
  const loadTransfersSummary = async () => {
    try {
      setTransfersLoading(true);
      const response = await transfersAPI.vendor.getPendingTransfers();
      
      if (response.success) {
        // VE002 devuelve { success, pending_transfers, urgent_count, normal_count }
        const totalPending = (response.urgent_count || 0) + (response.normal_count || 0);
        const summary = {
          total_requests: totalPending,
          pending: totalPending,
          accepted: 0, // VE002 no incluye estos datos, solo pendientes
          in_transit: 0,
          delivered: 0,
          cancelled: 0
        };
        setTransfersSummary(summary);
      }
    } catch (error) {
      console.warn('Error loading transfers summary:', error);
      // Fallback a datos mock basados en la documentación
      setTransfersSummary({
        total_requests: 8,
        pending: 6,
        accepted: 0,
        in_transit: 2,
        delivered: 0,
        cancelled: 0
      });
    } finally {
      setTransfersLoading(false);
    }
  };

  // Cerrar cámara
  const handleCloseCameraCapture = () => {
    setShowCamera(false);
    setIsProcessingImage(false);
    setCapturedImage(null);
    setScanResult(null);
    setErrorMessage(null);
  };

  // Abrir cámara desde botón "Escanear"
  const handleOpenCamera = () => {
    // Limpiar estados previos
    setScanResult(null);
    setErrorMessage(null);
    setCapturedImage(null);
    setIsProcessingImage(false);
    
    // Mostrar modal de cámara
    setShowCamera(true);
  };

  // Manejar captura desde CameraCapture
  const handleCameraCapture = async (imageFile: File) => {
    console.log('Imagen capturada desde cámara:', imageFile.name);
    
    setCapturedImage(imageFile);
    setIsProcessingImage(true);
    
    // Procesar la imagen
    await sendImageToServer(imageFile);
    
    // Cerrar modal de cámara después del procesamiento
    setShowCamera(false);
    setIsProcessingImage(false);
  };

  // Función para backup - input file
  const handleFileInputCapture = () => {
    setScanResult(null);
    setErrorMessage(null);
    setCapturedImage(null);
    fileInputRef.current?.click();
  };

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Imagen capturada desde input:', file.name);
      setCapturedImage(file);
      sendImageToServer(file);
    }
  };

  const sendImageToServer = async (imageFile: File) => {
    setIsScanning(true);
    setErrorMessage(null);

    try {
      console.log('Simulando procesamiento de imagen:', imageFile.name);
      
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Resultado simulado
      const mockResult: PredictionResult = {
        class_name: 'tenis_nike',
        confidence: 0.85
      };
      
      setScanResult(mockResult);
      
      // Navegar a la vista de scan después del procesamiento exitoso
      setCurrentView('scan');
      
    } catch (error: any) {
      console.error('Error simulando escaneo:', error);
      setErrorMessage('Error en la simulación del escaneo');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
            <Button 
              onClick={() => setErrorMessage(null)}
              className="mt-2"
              variant="ghost"
              size="sm"
            >
              Cerrar
            </Button>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  const handleRequestTransfer = (productData: {
    sneaker_reference_code: string;
    brand: string;
    model: string;
    color: string;
    size: string;
    product: any;
  }) => {
    console.log('🔍 SellerDashboard - Datos recibidos del ProductScanner:', productData);
    
    // Guardar los datos exactamente como llegan
    setProductDataForTransfer(productData);
    
    console.log('🔍 SellerDashboard - Estado actualizado, cambiando a transfers');
    
    // Cambiar a la vista de transferencias
    setCurrentView('transfers');
    
    console.log('🔍 SellerDashboard - Vista cambiada a transfers');
  };

  const handleSellProduct = (productData: {
    code: string;
    brand: string;
    model: string;
    size: string;
    price: number;
    location: string;
    storage_type: string;
  }) => {
    console.log('Recibiendo datos del producto escaneado:', productData);
    
    const prefilledData: PrefilledProduct = {
      code: productData.code,
      brand: productData.brand,
      model: productData.model,
      size: productData.size,
      price: productData.price,
      location: productData.location,
      storage_type: productData.storage_type
    };
    
    console.log('Datos preparados para prellenar:', prefilledData);
    
    setPrefilledProduct(prefilledData);
    setCurrentView('new-sale');
  };

  const goBack = () => {
    console.log('🔍 SellerDashboard - Limpiando estados y volviendo al dashboard');
    setPrefilledProduct(null);
    setProductDataForTransfer(null);
    setCapturedImage(null);
    setScanResult(null);
    setErrorMessage(null);
    setCurrentView('dashboard');
    console.log('🔍 SellerDashboard - Estados limpiados');
  };

  const handleNewSaleClick = () => {
    setPrefilledProduct(null);
    setCurrentView('new-sale');
  };

  // Nueva función para manejar click en transferencias
  const handleTransfersClick = () => {
    setProductDataForTransfer(null); // Limpiar datos prefilled
    setCurrentView('transfers');
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
              capturedImage={capturedImage}
              scanResult={scanResult}
            />
          </div>
        );
      
      case 'new-sale':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={goBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
            </Button>
            <SalesForm prefilledProduct={prefilledProduct} />
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
        console.log('🔍 SellerDashboard - Renderizando TransfersView con datos:', productDataForTransfer);
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={goBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
            </Button>
            <TransfersView 
              prefilledProductData={productDataForTransfer}
              onTransferRequested={(transferId, isUrgent) => {
                console.log('✅ Transferencia solicitada:', { transferId, isUrgent });
                loadTransfersSummary(); // Recargar resumen después de nueva transferencia
                goBack(); // Volver al dashboard después de la solicitud
              }}
            />
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
      {/* Input oculto para la cámara como backup */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageCapture}
        accept="image/*"
        capture="environment"
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
              onClick={handleOpenCamera}     
            >
              <Camera className="h-6 w-6" />
              <span className="text-sm">Escanear</span>
            </Button>
            
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={handleNewSaleClick}
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

      {/* Resultado del escaneo - Solo mostrar en dashboard si hay error */}
      {renderScanResult()}
      
      {/* Vendor Info */}
      {apiData && apiData.vendor_info && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{apiData.vendor_info.name}</h2>
                <p className="text-gray-600">{apiData.vendor_info.email}</p>
                <p className="text-sm text-gray-500">
                  {apiData.vendor_info.location_name} • {apiData.vendor_info.role}
                </p>
                {apiData.today_summary && apiData.today_summary.date && (
                  <p className="text-xs text-gray-400 mt-1">
                    Fecha: {new Date(apiData.today_summary.date).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Resumen del Día</p>
                <p className="text-lg font-bold text-green-600">
                  {apiData.today_summary && apiData.today_summary.sales && apiData.today_summary.sales.total_count || 0} ventas totales
                </p>
                {apiData.today_summary && apiData.today_summary.sales && apiData.today_summary.sales.pending_confirmations > 0 && (
                  <p className="text-sm text-amber-600">
                    {apiData.today_summary.sales.pending_confirmations} pendientes de confirmar
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  ${apiData.today_summary && apiData.today_summary.sales && apiData.today_summary.sales.total_amount && apiData.today_summary.sales.total_amount.toLocaleString('es-CO') || '0'}
                </p>
              </div>
            </div>
            
            {/* Información adicional de acciones pendientes */}
            {(apiData.pending_actions || transfersSummary) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {apiData.pending_actions && apiData.pending_actions.sale_confirmations > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {apiData.pending_actions.sale_confirmations}
                      </p>
                      <p className="text-xs text-blue-600">Ventas por confirmar</p>
                    </div>
                  )}
                  
                  {/* NUEVO BOTÓN CLICKEABLE PARA TRANSFERENCIAS - Actualizado para VE002 */}
                  {transfersSummary && transfersSummary.pending > 0 && (
                    <button
                      onClick={handleTransfersClick}
                      className="bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-purple-600">
                            {transfersSummary.pending}
                          </p>
                          <p className="text-xs text-purple-600">Transferencias pendientes</p>
                          {transfersLoading && (
                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mt-1"></div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
                      </div>
                      <div className="mt-1 flex items-center justify-center space-x-1">
                        <Clock className="h-3 w-3 text-purple-500" />
                        <span className="text-xs text-purple-500">Ver todas las transferencias</span>
                      </div>
                    </button>
                  )}
                  
                  {apiData.pending_actions && apiData.pending_actions.discount_requests && apiData.pending_actions.discount_requests.pending > 0 && (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {apiData.pending_actions.discount_requests.pending}
                      </p>
                      <p className="text-xs text-orange-600">Descuentos pendientes</p>
                    </div>
                  )}
                  
                  {apiData.pending_actions && apiData.pending_actions.return_notifications > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {apiData.pending_actions.return_notifications}
                      </p>
                      <p className="text-xs text-red-600">Devoluciones</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {apiData && <DashboardStats data={apiData} />}

    </div>
  );

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
      currentView === 'new-sale' ? (prefilledProduct ? 'Nueva Venta - Producto Escaneado' : 'Nueva Venta') :
      currentView === 'today-sales' ? 'Ventas del Día' :
      currentView === 'expenses' ? 'Registrar Gasto' :
      currentView === 'expenses-list' ? 'Gastos del Día' :
      currentView === 'transfers' ? 'Transferencias' :
      'Notificaciones'
    }>
      {/* MODAL DE CÁMARA */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={handleCloseCameraCapture}
          isProcessing={isProcessingImage}
        />
      )}
      {renderCurrentView()}
    </DashboardLayout>
  );
};