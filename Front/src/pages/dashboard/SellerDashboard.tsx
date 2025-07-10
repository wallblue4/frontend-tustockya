import React, { useState, useEffect } from 'react';
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

// Interface para producto prellenado
interface PrefilledProduct {
  code: string;
  brand: string;
  model: string;
  size: string;
  price: number;
  location?: string;
  storage_type?: string;
}

export const SellerDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [prefilledProduct, setPrefilledProduct] = useState<PrefilledProduct | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setApiError(null);
      const response = await vendorAPI.getDashboard();
      setApiData(response); 

    } catch (error) {
      console.warn('Backend API not available, using mock data for development');
      
      // Set a user-friendly error message
      setApiError('Conectando con el servidor...');
      
      // Usar mock data con setApiData
      setApiData({
        success: true,
        dashboard_timestamp: new Date().toISOString(),
        vendor_info: {
          name: 'Juan Pérez (Mock)',
          email: 'juan@tustockya.com',
          location_name: 'Local #1',
          role: 'seller',
          location_id: 1
        },
        today_summary: {
          date: new Date().toISOString().split('T')[0],
          sales: {
            total_count: 15,
            pending_confirmations: 3,
            total_amount: 2450000,
            confirmed_amount: 2000000,
            pending_amount: 450000
          },
          expenses: {
            count: 2,
            total_amount: 150000
          },
          net_income: 2300000,
          payment_methods_breakdown: []
        },
        pending_actions: {
          sale_confirmations: 3,
          transfer_requests: {
            pending: 2,
            in_transit: 0,
            delivered: 0
          },
          discount_requests: {
            pending: 1,
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

  // Funciones para manejo de productos
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
    
    // Preparar datos del producto para prellenar el formulario de ventas
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

  const handleRequestTransfer = (product: any) => {
    // Navigate to transfer request form
    setCurrentView('transfers');
  };

  const goBack = () => {
    // Limpiar producto prellenado al volver al dashboard
    setPrefilledProduct(null);
    setCurrentView('dashboard');
  };

  const handleNewSaleClick = () => {
    // Limpiar cualquier producto prellenado cuando se hace clic en "Nueva Venta" desde el dashboard
    setPrefilledProduct(null);
    setCurrentView('new-sale');
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
              authToken={
                localStorage.getItem('authToken') || 
                sessionStorage.getItem('authToken') || 
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTIwMjM1NDN9.isFUvKkUk3YDcazhGTI1PkW_dn15o7luU0lQT1vC1qg"
              }
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
              onClick={() => setCurrentView('scan')}
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
            {apiData.pending_actions && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {apiData.pending_actions.sale_confirmations > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {apiData.pending_actions.sale_confirmations}
                      </p>
                      <p className="text-xs text-blue-600">Ventas por confirmar</p>
                    </div>
                  )}
                  
                  {apiData.pending_actions.transfer_requests && apiData.pending_actions.transfer_requests.pending > 0 && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {apiData.pending_actions.transfer_requests.pending}
                      </p>
                      <p className="text-xs text-purple-600">Transferencias pendientes</p>
                    </div>
                  )}
                  
                  {apiData.pending_actions.discount_requests && apiData.pending_actions.discount_requests.pending > 0 && (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {apiData.pending_actions.discount_requests.pending}
                      </p>
                      <p className="text-xs text-orange-600">Descuentos pendientes</p>
                    </div>
                  )}
                  
                  {apiData.pending_actions.return_notifications > 0 && (
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
      currentView === 'new-sale' ? (prefilledProduct ? 'Nueva Venta - Producto Escaneado' : 'Nueva Venta') :
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