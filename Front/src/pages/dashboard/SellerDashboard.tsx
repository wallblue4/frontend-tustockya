import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Search,
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
  Truck,
  CheckCircle
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
import { ScannerTransferRequest } from '../../components/seller/ScannerTransferRequest';
import { ScannerSaleConfirm } from '../../components/seller/ScannerSaleConfirm';
import { useNavigate } from 'react-router-dom';
import { vendorAPI } from '../../services/api';
import { CameraCapture } from '../../components/seller/CameraCapture';
import { transfersAPI } from '../../services/transfersAPI';
import { useAuth } from '../../context/AuthContext';

type ViewType = 'dashboard' | 'scan' | 'new-sale' | 'today-sales' | 'expenses' | 'expenses-list' | 'transfers' | 'notifications' | 'scanner-transfer' | 'scanner-sale';

// Interfaces
interface PrefilledProduct {
  code: string;
  brand: string;
  model: string;
  size: string;
  price: number;
  location?: string;
  storage_type?: string;
  color?: string;
  image?: string[];
  transfer_id?: number; // ID de transferencia (requerido solo para ventas desde transferencias)
}

interface PredictionResult {
  class_name: string;
  confidence: number;
}

// *** INTERFAZ ACTUALIZADA PARA RESUMEN DE TRANSFERENCIAS ***
interface TransfersSummary {
  total_pending: number;
  urgent_count: number;     // Transferencias que requieren atención urgente
  normal_count: number;     // Transferencias en proceso normal
  completed_today: number;  // Transferencias completadas hoy
  success_rate: number;     // Porcentaje de éxito del día
}

export const SellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [scanViewTitle, setScanViewTitle] = useState('Escanear Producto');
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [prefilledProduct, setPrefilledProduct] = useState<PrefilledProduct | null>(null);
  const [productDataForTransfer, setProductDataForTransfer] = useState<any>(null);

  // Estados para la cámara y búsqueda
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);

  // *** ESTADO ACTUALIZADO PARA TRANSFERENCIAS ***
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
      console.warn('Backend API not available');

      setApiError('Conectando con el servidor...');

    } finally {
      setLoading(false);
    }
  };

  // *** FUNCIÓN ACTUALIZADA PARA CARGAR RESUMEN DE TRANSFERENCIAS ***
  const loadTransfersSummary = async () => {
    try {
      setTransfersLoading(true);
      console.log('🔄 Cargando resumen de transferencias...');

      // Cargar datos de ambos endpoints
      const [pendingResponse, completedResponse] = await Promise.allSettled([
        transfersAPI.vendor.getPendingTransfers(),   // /vendor/pending-transfers
        transfersAPI.vendor.getCompletedTransfers()  // /vendor/completed-transfers
      ]);

      let summary: TransfersSummary = {
        total_pending: 0,
        urgent_count: 0,
        normal_count: 0,
        completed_today: 0,
        success_rate: 0
      };

      // Procesar transferencias pendientes
      if (pendingResponse.status === 'fulfilled' && pendingResponse.value.success) {
        const pendingData = pendingResponse.value;
        summary.total_pending = pendingData.total_pending || 0;
        summary.urgent_count = pendingData.urgent_count || 0;
        summary.normal_count = pendingData.normal_count || 0;

        console.log('✅ Transferencias pendientes cargadas:', summary.total_pending);
      } else {
        console.warn('⚠️ Error cargando transferencias pendientes');
      }

      // Procesar transferencias completadas
      if (completedResponse.status === 'fulfilled' && completedResponse.value.success) {
        const completedData = completedResponse.value;
        summary.completed_today = completedData.today_stats?.completed || 0;
        summary.success_rate = completedData.today_stats?.success_rate || 0;

        console.log('✅ Transferencias completadas cargadas:', summary.completed_today);
      } else {
        console.warn('⚠️ Error cargando transferencias completadas');
      }

      console.log('📈 Resumen final calculado:', summary);
      setTransfersSummary(summary);

    } catch (error) {
      console.warn('⚠️ Error loading transfers summary:', error);
      // Fallback a datos mock para mostrar algo mientras debuggeamos
      const mockSummary: TransfersSummary = {
        total_pending: 1,
        urgent_count: 1,
        normal_count: 0,
        completed_today: 2,
        success_rate: 75.0
      };
      console.log('📦 Usando datos mock:', mockSummary);
      setTransfersSummary(mockSummary);
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

  // Abrir búsqueda por texto
  const handleOpenSearch = () => {
    setScanResult(null);
    setErrorMessage(null);
    setCapturedImage(null);
    setIsSearchMode(true);
    setCurrentView('scan');
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

  // Función para backup - input file (cámara)
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

    console.log('🔍 SellerDashboard - Estado actualizado, cambiando a scanner-transfer');

    // Cambiar a la vista simplificada de transferencia desde scanner
    setCurrentView('scanner-transfer');

    console.log('🔍 SellerDashboard - Vista cambiada a scanner-transfer');
  };

  // Función única para abrir SalesForm con datos prellenados, navegando a la ruta de venta
  const handleSellProduct = (productData: {
    code: string;
    brand: string;
    model: string;
    size: string;
    price: number;
    location: string;
    storage_type: string;
    color?: string;
    image?: string;
    transfer_id?: number; // Opcional (requerido solo para ventas desde transferencias)
  }) => {
    console.log('🔍 SellerDashboard - Recibiendo datos para venta:', productData);
    console.log('🔑 SellerDashboard - Transfer ID recibido:', productData.transfer_id);

    // Convertir los datos al formato que espera SalesForm
    const prefilledData: PrefilledProduct = {
      code: productData.code,
      brand: productData.brand,
      model: productData.model,
      size: productData.size,
      price: productData.price,
      location: productData.location,
      storage_type: productData.storage_type,
      color: productData.color,
      image: productData.image ? [productData.image] : undefined, // Convertir string a array
      transfer_id: productData.transfer_id // ✅ COPIAR EL TRANSFER_ID (puede ser undefined)
    };

    console.log('🔍 SellerDashboard - Datos preparados para SalesForm:', prefilledData);
    console.log('🔑 SellerDashboard - Transfer ID en prefilledData:', prefilledData.transfer_id);

    // Siempre usar vista simplificada (ScannerSaleConfirm) para todas las ventas
    setPrefilledProduct(prefilledData);
    setCurrentView('scanner-sale');
    console.log('✅ SellerDashboard - Vista cambiada a scanner-sale', prefilledData.transfer_id ? '(desde transferencia)' : '(venta directa)');
  };

  const goBack = () => {
    console.log('🔍 SellerDashboard - Limpiando estados y volviendo al dashboard');
    setPrefilledProduct(null);
    setProductDataForTransfer(null);
    setScanViewTitle('Escanear Producto');
    setCapturedImage(null);
    setScanResult(null);
    setErrorMessage(null);
    setIsSearchMode(false);
    setCurrentView('dashboard');
    console.log('🔍 SellerDashboard - Estados limpiados');
  };

  const goBackToScanner = () => {
    setProductDataForTransfer(null);
    setPrefilledProduct(null);
    setCurrentView('scan');
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
      case 'scanner-transfer':
      case 'scanner-sale':
        return (
          <div className="space-y-4">
            {/* Botón superior: volver al dashboard desde scan, o volver al escáner desde sub-vistas */}
            {currentView === 'scan' ? (
              <Button variant="ghost" onClick={goBack} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
              </Button>
            ) : (
              <Button variant="ghost" onClick={goBackToScanner} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Escáner
              </Button>
            )}

            {/* ProductScanner siempre montado, oculto cuando estamos en sub-vistas */}
            <div className={currentView !== 'scan' ? 'hidden' : ''}>
              <ProductScanner
                onRequestTransfer={handleRequestTransfer}
                onStepTitleChange={setScanViewTitle}
                onSellProduct={handleSellProduct}
                capturedImage={capturedImage}
                scanResult={scanResult}
                searchMode={isSearchMode}
              />
            </div>

            {/* ScannerTransferRequest */}
            {currentView === 'scanner-transfer' && productDataForTransfer && (
              <ScannerTransferRequest
                prefilledProductData={productDataForTransfer}
                onTransferRequested={(transferId, isUrgent) => {
                  console.log('✅ Transferencia solicitada desde scanner:', { transferId, isUrgent });
                  loadTransfersSummary();
                }}
                onBack={goBackToScanner}
                onViewTransfers={handleTransfersClick}
              />
            )}

            {/* ScannerSaleConfirm */}
            {currentView === 'scanner-sale' && prefilledProduct && (
              <ScannerSaleConfirm
                productData={{
                  code: prefilledProduct.code,
                  brand: prefilledProduct.brand,
                  model: prefilledProduct.model,
                  size: prefilledProduct.size,
                  price: prefilledProduct.price,
                  location: prefilledProduct.location,
                  storage_type: prefilledProduct.storage_type,
                  color: prefilledProduct.color,
                  image: prefilledProduct.image?.[0],
                  transfer_id: prefilledProduct.transfer_id,
                }}
                onSaleCompleted={goBack}
                onBack={prefilledProduct.transfer_id ? goBack : goBackToScanner}
              />
            )}
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
              onSellProduct={handleSellProduct}
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

      {/* Registrar */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Registrar</h3>

        {/* Vender — acción principal */}
        <button
          onClick={handleOpenCamera}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="p-3 rounded-lg bg-white/20">
            <Camera className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-base font-semibold">Vender Producto</p>
            <p className="text-sm opacity-80">Escanear y registrar venta</p>
          </div>
        </button>

        {/* Registrar gasto — acción secundaria */}
        <button
          onClick={() => setCurrentView('expenses')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-border/80 hover:bg-accent/50 transition-all"
        >
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
            <Receipt className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-foreground">Registrar Gasto</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
        </button>
      </div>

      {/* Gestión */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Gestión</h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setCurrentView('today-sales')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border hover:border-border/80 hover:bg-accent/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-foreground">Ventas del día</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => setCurrentView('expenses-list')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border hover:border-border/80 hover:bg-accent/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <List className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-foreground">Gastos del día</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={handleTransfersClick}
            className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border hover:border-border/80 hover:bg-accent/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-foreground">Transferencias</span>
              {transfersSummary && transfersSummary.total_pending > 0 && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                  <Clock className="h-3 w-3" />
                  {transfersSummary.total_pending}
                </span>
              )}
              {transfersSummary && transfersSummary.urgent_count > 0 && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                  <AlertCircle className="h-3 w-3" />
                  {transfersSummary.urgent_count}
                </span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Resultado del escaneo - Solo mostrar en dashboard si hay error */}
      {renderScanResult()}

      {/* Vendor Info */}
      {apiData && apiData.vendor_info && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{apiData.vendor_info.name}</h2>
                <h3 className="text-lg font-medium">{user?.location_name}</h3>
                <p className="text-gray-600">{apiData.vendor_info.email}</p>
                <span className="text-xs text-green-800 font-bold bg-green-300 px-2 py-1 rounded-md">
                  Rol: {apiData.vendor_info.role === 'seller' ? 'Vendedor' : apiData.vendor_info.role}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Fecha: {new Date().toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {
        /* Stats
        {apiData && <DashboardStats data={apiData} />}
         */
      }

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
    <DashboardLayout onHome={currentView !== 'dashboard' ? goBack : undefined} title={
      currentView === 'dashboard' ? 'Panel de Vendedor' :
        currentView === 'scan' ? (isSearchMode ? 'Buscar Producto' : scanViewTitle) :
          currentView === 'scanner-transfer' ? 'Solicitar Transferencia' :
            currentView === 'scanner-sale' ? 'Confirmar Venta' :
              currentView === 'new-sale' ? (prefilledProduct ? 'Nueva Venta - Producto Escaneado' : 'Nueva Venta') :
                currentView === 'today-sales' ? 'Ventas del Día' :
                  currentView === 'expenses' ? 'Registrar Gasto' :
                    currentView === 'expenses-list' ? 'Gastos del Día' :
                      currentView === 'transfers' ? 'Gestión de Transferencias' :
                        'Notificaciones'
    }>
      {/* MODAL DE CÁMARA */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={handleCloseCameraCapture}
          onSearchMode={() => {
            setShowCamera(false);
            handleOpenSearch();
          }}
          isProcessing={isProcessingImage}
        />
      )}
      {renderCurrentView()}
    </DashboardLayout>
  );
};