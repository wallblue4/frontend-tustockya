import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Clock, Receipt, TrendingUp, AlertCircle, List, ChevronRight, Truck } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useSeller } from '../../context/SellerContext';
import { useAuth } from '../../context/AuthContext';

export const SellerHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    apiData,
    apiError,
    loading,
    transfersSummary,
    isScanning,
    errorMessage,
    setErrorMessage,
    setShowCamera,
    setScanResult,
    setCapturedImage,
    setIsProcessingImage,
    fileInputRef,
    handleImageCapture,
  } = useSeller();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const handleOpenCamera = () => {
    setScanResult(null);
    setErrorMessage(null);
    setCapturedImage(null);
    setIsProcessingImage(false);
    setShowCamera(true);
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
            <button onClick={() => setErrorMessage(null)} className="mt-2 text-sm text-red-600 hover:underline">
              Cerrar
            </button>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 p-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageCapture}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
      />

      {apiError && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Modo de Desarrollo</p>
                <p className="text-sm text-amber-700">
                  Usando datos de prueba. El servidor backend no esta disponible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registrar */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Registrar</h3>

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

        <button
          onClick={() => navigate('/seller/expenses')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-border/80 hover:bg-accent/50 transition-all"
        >
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
            <Receipt className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-foreground">Registrar Gasto</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
        </button>
      </div>

      {/* Gestion */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Gestion</h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => navigate('/seller/sales')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border hover:border-border/80 hover:bg-accent/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-foreground">Ventas del dia</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/seller/expenses-list')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border hover:border-border/80 hover:bg-accent/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <List className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-foreground">Gastos del dia</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/seller/transfers')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border hover:border-border/80 hover:bg-accent/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-foreground">Pedidos</span>
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

      {renderScanResult()}

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
                <p className="text-xs text-gray-400 mt-1">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
