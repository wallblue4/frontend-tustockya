// src/pages/dashboard/WarehouseDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Send, 
  X, 
  Clock, 
  User, 
  CheckCircle,
  AlertCircle,
  Truck,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MapPin,
  DollarSign
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

// NUEVAS IMPORTACIONES
import { TransferNotifications } from '../../components/notifications/TransferNotifications';
import { useTransferNotifications } from '../../hooks/useTransferNotifications';
import { useTransferPolling } from '../../hooks/useTransferPolling';
import { useAuth } from '../../context/AuthContext';
import { warehouseAPI } from '../../services/transfersAPI';

// Tipos actualizados
interface PendingRequest {
  id: number;
  requester_name?: string;
  requester_first_name?: string;
  requester_last_name?: string;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  purpose: 'cliente' | 'restock';
  priority: 'high' | 'normal';
  requested_at: string;
  time_waiting?: string;
  can_fulfill?: boolean;
  available_stock?: number;
  notes?: string;
  product_image?: string;
  product_price?: string;
  product_color?: string;
  stock_info?: {
    can_fulfill: boolean;
    available_stock: number;
  };
}

interface AcceptedRequest {
  id: number;
  status: string;
  status_description?: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  purpose: 'cliente' | 'restock';
  sneaker_reference_code: string;
  requester_first_name?: string;
  requester_last_name?: string;
  courier_first_name?: string;
  courier_last_name?: string;
  estimated_pickup_time?: string;
  preparation_time?: number;
  ready_for_pickup?: boolean;
  notes?: string;
  product_image?: string;
  product_price?: string;
  product_color?: string;
}

export const WarehouseDashboard: React.FC = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'stats'>('pending');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<AcceptedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Estados de UI responsivo
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'normal'>('all');
  const [purposeFilter, setPurposeFilter] = useState<'all' | 'cliente' | 'restock'>('all');

  // Estados de estadísticas
  const [stats, setStats] = useState({
    totalRequests: 0,
    urgentRequests: 0,
    averageResponseTime: '0 min',
    completionRate: 0,
    totalStockValue: 0
  });

  // HOOKS
  const { user } = useAuth();
  const {
    notifications,
    dismissNotification,
    dismissAllNotifications,
    notifyNewTransferAvailable,
    addNotification
  } = useTransferNotifications();

  // Callback para manejar actualizaciones de polling
  const handlePollingUpdate = useCallback((data: any) => {
    const newPending = data.pending || [];
    const newAccepted = data.accepted || [];

    // Detectar nuevas solicitudes
    if (newPending.length > pendingRequests.length) {
      const newRequests = newPending.filter(
        (req: PendingRequest) => !pendingRequests.find(existing => existing.id === req.id)
      );
      
      newRequests.forEach((request: PendingRequest) => {
        notifyNewTransferAvailable({
          product: `${request.brand} ${request.model}`,
          requester: request.requester_first_name ? 
            `${request.requester_first_name} ${request.requester_last_name}` : 
            request.requester_name || 'Usuario',
          purpose: request.purpose
        });
      });
    }

    setPendingRequests(newPending);
    setAcceptedRequests(newAccepted);

    setStats({
      totalRequests: newPending.length + newAccepted.length,
      urgentRequests: newPending.filter((r: PendingRequest) => r.priority === 'high').length,
      averageResponseTime: '12 min',
      completionRate: 94.5,
      totalStockValue: 1580.50
    });
  }, [pendingRequests, notifyNewTransferAvailable]);

  // POLLING para bodeguero
  const { data: warehouseData, error: pollingError, refetch } = useTransferPolling('bodeguero', {
    enabled: true,
    interval: 15000,
    onUpdate: handlePollingUpdate,
    onError: (error) => {
      console.error('Error en polling de bodega:', error);
      setError('Error de conexión con el servidor');
    }
  });

  // Cargar datos inicial
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [pendingResponse, acceptedResponse] = await Promise.all([
        warehouseAPI.getPendingRequests(),
        warehouseAPI.getAcceptedRequests()
      ]);
      
      setPendingRequests(pendingResponse.pending_requests || []);
      setAcceptedRequests(acceptedResponse.accepted_requests || []);
      
    } catch (err) {
      console.error('Error loading warehouse data:', err);
      setError('Error conectando con el servidor');
      
      // Mock data mejorado para desarrollo
      setPendingRequests([
        {
          id: 15,
          requester_first_name: 'Juan',
          requester_last_name: 'Pérez',
          sneaker_reference_code: 'AD-UB22-BLK-001',
          brand: 'Adidas',
          model: 'Ultraboost 22',
          size: '9.5',
          quantity: 1,
          purpose: 'cliente',
          priority: 'high',
          requested_at: new Date().toISOString(),
          time_waiting: '5 minutos',
          product_color: 'Negro/Blanco',
          product_price: '289000',
          notes: 'Cliente presente esperando',
          stock_info: {
            can_fulfill: true,
            available_stock: 3
          }
        },
        {
          id: 16,
          requester_first_name: 'María',
          requester_last_name: 'González',
          sneaker_reference_code: 'NK-AF1-WHT-002',
          brand: 'Nike',
          model: 'Air Force 1',
          size: '10',
          quantity: 2,
          purpose: 'restock',
          priority: 'normal',
          requested_at: new Date(Date.now() - 600000).toISOString(),
          time_waiting: '10 minutos',
          product_color: 'Blanco',
          product_price: '349000',
          notes: 'Restock semanal programado',
          stock_info: {
            can_fulfill: true,
            available_stock: 8
          }
        }
      ]);
      
      setAcceptedRequests([
        {
          id: 17,
          status: 'courier_assigned',
          status_description: 'Corredor asignado',
          brand: 'Puma',
          model: 'RS-X',
          size: '9',
          quantity: 1,
          purpose: 'cliente',
          sneaker_reference_code: 'PM-RSX-001',
          requester_first_name: 'Carlos',
          requester_last_name: 'López',
          courier_first_name: 'Ana',
          courier_last_name: 'Martínez',
          estimated_pickup_time: '15',
          product_color: 'Blanco/Azul',
          product_price: '299000',
          notes: 'Producto empacado y listo'
        }
      ]);
      
    } finally {
      setLoading(false);
    }
  };

  // CORREGIR: Función para aceptar solicitud
  const handleAcceptRequest = async (requestId: number) => {
    console.log('🔄 Aceptando solicitud:', requestId);
    setActionLoading(requestId);
    
    try {
      const request = pendingRequests.find(r => r.id === requestId);
      
      if (!request) {
        throw new Error('Solicitud no encontrada');
      }

      console.log('📦 Datos de la solicitud:', request);
      
      // Llamada corregida a la API
      const response = await warehouseAPI.acceptRequest({
        transfer_request_id: requestId,
        accepted: true,
        estimated_preparation_time: request.priority === 'high' ? 10 : 15,
        notes: `Producto disponible. ${request.priority === 'high' ? 'Preparando para entrega inmediata.' : 'Preparando según cronograma.'}`
      });
      
      console.log('✅ Respuesta del servidor:', response);
      
      addNotification(
        'success',
        '✅ Solicitud Aceptada',
        `Transferencia #${requestId} aceptada y en preparación`,
        {
          label: 'Ver en Preparación',
          onClick: () => setActiveTab('accepted')
        }
      );
      
      // Recargar datos
      await refetch();
      
    } catch (err) {
      console.error('❌ Error al aceptar solicitud:', err);
      addNotification(
        'error',
        '❌ Error al Aceptar',
        err instanceof Error ? err.message : 'Error desconocido'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    console.log('🔄 Rechazando solicitud:', requestId);
    setActionLoading(requestId);
    
    try {
      await warehouseAPI.acceptRequest({
        transfer_request_id: requestId,
        accepted: false,
        estimated_preparation_time: 0,
        notes: 'Producto no disponible en este momento.'
      });
      
      addNotification(
        'info',
        '❌ Solicitud Rechazada',
        `Transferencia #${requestId} ha sido rechazada`
      );
      
      await refetch();
      
    } catch (err) {
      console.error('❌ Error al rechazar solicitud:', err);
      addNotification(
        'error',
        '❌ Error al Rechazar',
        err instanceof Error ? err.message : 'Error desconocido'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliverToCourier = async (requestId: number) => {
    console.log('🔄 Entregando a corredor:', requestId);
    setActionLoading(requestId);
    
    try {
      await warehouseAPI.deliverToCourier({
        transfer_request_id: requestId,
        delivered: true,
        delivery_notes: 'Producto entregado al corredor en perfecto estado. Caja original sellada.'
      });
      
      addNotification(
        'success',
        '🚚 Entregado al Corredor',
        `Transferencia #${requestId} entregada exitosamente`
      );
      
      await refetch();
      
    } catch (err) {
      console.error('❌ Error en entrega:', err);
      addNotification(
        'error',
        '❌ Error en Entrega',
        err instanceof Error ? err.message : 'Error desconocido'
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Funciones de filtrado
  const filteredPendingRequests = pendingRequests.filter(request => {
    const matchesSearch = 
      request.sneaker_reference_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.requester_first_name && request.requester_first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.requester_last_name && request.requester_last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.requester_name && request.requester_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesPurpose = purposeFilter === 'all' || request.purpose === purposeFilter;
    
    return matchesSearch && matchesPriority && matchesPurpose;
  });

  // Funciones de utilidad
  const getPriorityColor = (priority: string) => {
    return priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getPurposeColor = (purpose: string) => {
    return purpose === 'cliente' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800';
  };

  const formatTimeWaiting = (requestedAt: string) => {
    const now = new Date();
    const requested = new Date(requestedAt);
    const diffMs = now.getTime() - requested.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutos`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numPrice);
  };

  const toggleCardExpansion = (cardId: number) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  if (loading) {
    return (
      <DashboardLayout title="Panel de Bodega">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando solicitudes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Panel de Bodega">
      {/* COMPONENTE DE NOTIFICACIONES */}
      <TransferNotifications
        notifications={notifications}
        onDismiss={dismissNotification}
        onDismissAll={dismissAllNotifications}
      />

      <div className="space-y-4 md:space-y-6">
        {/* Header con estadísticas rápidas - RESPONSIVE */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Total</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.totalRequests}</p>
                </div>
                <Package className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Urgentes</p>
                  <p className="text-lg md:text-2xl font-bold text-red-600">{stats.urgentRequests}</p>
                </div>
                <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Tiempo Prom.</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.averageResponseTime}</p>
                </div>
                <Clock className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Completación</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.completionRate}%</p>
                </div>
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs - RESPONSIVE */}
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="flex flex-wrap gap-2 md:gap-4">
              <Button
                variant={activeTab === 'pending' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('pending')}
                size="sm"
                className="flex-1 md:flex-none text-xs md:text-sm"
              >
                <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Pendientes</span>
                <span className="sm:hidden">Pend.</span>
                ({filteredPendingRequests.length})
              </Button>
              <Button
                variant={activeTab === 'accepted' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('accepted')}
                size="sm"
                className="flex-1 md:flex-none text-xs md:text-sm"
              >
                <Package className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Preparación</span>
                <span className="sm:hidden">Prep.</span>
                ({acceptedRequests.length})
              </Button>
              <Button
                variant={activeTab === 'stats' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('stats')}
                size="sm"
                className="flex-1 md:flex-none text-xs md:text-sm"
              >
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Estadísticas</span>
                <span className="sm:hidden">Stats</span>
              </Button>
              <div className="flex-grow hidden md:block"></div>
              <Button
                variant="ghost"
                onClick={refetch}
                size="sm"
                className="text-xs md:text-sm"
              >
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Actualizar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores de estado */}
        {pollingError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                <p className="text-red-800 text-sm">Error de conexión - Usando datos locales</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                <p className="text-amber-800 text-sm">⚠️ {error} - Usando datos de prueba</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenido según tab activo */}
        {activeTab === 'pending' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                <h2 className="text-lg md:text-xl font-semibold flex items-center">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
                  Solicitudes Pendientes
                </h2>
                
                {/* Controles de filtros - RESPONSIVE */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-48 md:w-64 text-sm"
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    size="sm"
                    className="sm:hidden"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                  </Button>
                  
                  <div className={`flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 ${showFilters ? 'block' : 'hidden sm:flex'}`}>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as any)}
                      className="px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md text-xs md:text-sm"
                    >
                      <option value="all">Todas</option>
                      <option value="high">Urgentes</option>
                      <option value="normal">Normales</option>
                    </select>
                    
                    <select
                      value={purposeFilter}
                      onChange={(e) => setPurposeFilter(e.target.value as any)}
                      className="px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md text-xs md:text-sm"
                    >
                      <option value="all">Todos</option>
                      <option value="cliente">Clientes</option>
                      <option value="restock">Restock</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPendingRequests.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Package className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-base md:text-lg font-medium">
                    {searchTerm || priorityFilter !== 'all' || purposeFilter !== 'all' 
                      ? 'No hay solicitudes que coincidan'
                      : 'No hay solicitudes pendientes'
                    }
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm || priorityFilter !== 'all' || purposeFilter !== 'all'
                      ? 'Prueba ajustando los filtros'
                      : 'Las nuevas solicitudes aparecerán aquí automáticamente.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {filteredPendingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg bg-white hover:shadow-md transition-shadow">
                      {/* MOBILE COMPACT VIEW */}
                      <div className="md:hidden">
                        <div className="p-4">
                          <div className="flex items-start space-x-3 mb-3">
                            <div className="flex-shrink-0">
                              <img
                                src={request.product_image || `https://via.placeholder.com/80x60/e5e7eb/6b7280?text=${encodeURIComponent(request.brand)}`}
                                alt={`${request.brand} ${request.model}`}
                                className="w-20 h-15 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  if (!e.currentTarget.dataset.fallback) {
                                    e.currentTarget.dataset.fallback = 'true';
                                    e.currentTarget.src = `https://via.placeholder.com/80x60/f3f4f6/9ca3af?text=${encodeURIComponent(request.brand)}`;
                                  }
                                }}
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                                  {request.priority === 'high' ? '🔥' : '📦'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(request.purpose)}`}>
                                  {request.purpose === 'cliente' ? '🏃‍♂️' : '📦'}
                                </span>
                              </div>
                              
                              <h3 className="font-semibold text-base mb-1 truncate">
                                {request.brand} {request.model}
                              </h3>
                              
                              <p className="text-sm text-gray-600 mb-1">
                                Talla {request.size} • {request.quantity} unidad{request.quantity > 1 ? 'es' : ''}
                              </p>
                              
                              <p className="text-xs text-gray-500">
                                ⏱️ {formatTimeWaiting(request.requested_at)} •{' '}
                                {request.requester_first_name ? 
                                  `${request.requester_first_name} ${request.requester_last_name}` : 
                                  request.requester_name || 'Usuario'
                                }
                              </p>
                            </div>
                            
                            <div className="flex flex-col items-end">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                request.stock_info?.can_fulfill 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {request.stock_info?.can_fulfill ? '✅' : '❌'}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                Stock: {request.stock_info?.available_stock || 0}
                              </p>
                              {request.product_price && (
                                <p className="text-xs font-medium text-green-600">
                                  {formatPrice(request.product_price)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => toggleCardExpansion(request.id)}
                            variant="ghost"
                            size="sm"
                            className="w-full text-sm"
                          >
                            {expandedCard === request.id ? (
                              <>Menos detalles <ChevronUp className="h-4 w-4 ml-2" /></>
                            ) : (
                              <>Más detalles <ChevronDown className="h-4 w-4 ml-2" /></>
                            )}
                          </Button>
                          
                          {expandedCard === request.id && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-gray-500">Código</p>
                                  <p className="font-medium text-xs">{request.sneaker_reference_code}</p>
                                </div>
                                {request.product_color && (
                                  <div>
                                    <p className="text-gray-500">Color</p>
                                    <p className="font-medium text-xs">{request.product_color}</p>
                                  </div>
                                )}
                              </div>
                              
                              {request.notes && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-sm">
                                    <strong>📝 Notas:</strong> {request.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex space-x-2 mt-4">
                            <Button 
                              onClick={() => handleAcceptRequest(request.id)}
                              disabled={!request.stock_info?.can_fulfill || actionLoading === request.id}
                              className="flex-1 bg-success hover:bg-success/90 disabled:opacity-50 text-sm"
                              size="sm"
                            >
                              {actionLoading === request.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              Aceptar
                            </Button>
                            <Button 
                              onClick={() => handleRejectRequest(request.id)}
                              disabled={actionLoading === request.id}
                              variant="outline" 
                              className="flex-1 text-error hover:bg-error/10 border-error text-sm"
                              size="sm"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* DESKTOP FULL VIEW */}
                      <div className="hidden md:block p-6">
                        <div className="flex items-start mb-4">
                          <div className="flex-shrink-0 mr-4">
                            <img
                              src={request.product_image || `https://via.placeholder.com/150x100/e5e7eb/6b7280?text=${encodeURIComponent(request.brand + ' ' + request.model)}`}
                              alt={`${request.brand} ${request.model}`}
                              className="w-32 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                              onError={(e) => {
                                if (!e.currentTarget.dataset.fallback) {
                                  e.currentTarget.dataset.fallback = 'true';
                                  e.currentTarget.src = `https://via.placeholder.com/150x100/f3f4f6/9ca3af?text=${encodeURIComponent(request.brand)}`;
                                }
                              }}
                            />
                            {request.product_price && (
                              <p className="text-xs text-gray-600 mt-1 text-center font-medium">
                                💰 {formatPrice(request.product_price)}
                              </p>
                            )}
                          </div>

                          <div className="flex-grow">
                            <div className="flex items-center space-x-3 mb-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(request.priority)}`}>
                                {request.priority === 'high' ? '🔥 URGENTE' : '📦 Normal'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(request.purpose)}`}>
                                {request.purpose === 'cliente' ? '🏃‍♂️ Cliente Presente' : '📦 Restock'}
                              </span>
                              <span className="text-sm text-gray-500">
                                ⏱️ Esperando: {formatTimeWaiting(request.requested_at)}
                              </span>
                            </div>
                            
                            <h3 className="font-semibold text-xl mb-2">
                              {request.brand} {request.model}
                            </h3>
                            
                            {request.product_color && (
                              <p className="text-sm text-gray-600 mb-2">
                                🎨 <strong>Color:</strong> {request.product_color}
                              </p>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <p className="text-gray-500">Código</p>
                                <p className="font-medium">{request.sneaker_reference_code}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Talla</p>
                                <p className="font-medium">{request.size}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Cantidad</p>
                                <p className="font-medium">{request.quantity}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Stock Disponible</p>
                                <p className="font-medium">{request.stock_info?.available_stock || 0}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">
                              <User className="h-4 w-4 inline mr-1" />
                              Solicitado por: <strong>
                                {request.requester_first_name ? 
                                  `${request.requester_first_name} ${request.requester_last_name}` : 
                                  request.requester_name || 'Usuario'
                                }
                              </strong>
                            </p>
                          </div>
                          
                          <div className="text-right ml-6">
                            <div className={`px-4 py-3 rounded-lg border-2 ${
                              request.stock_info?.can_fulfill 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <p className="text-sm font-medium">
                                {request.stock_info?.can_fulfill ? '✅ Disponible' : '❌ No disponible'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Stock: {request.stock_info?.available_stock || 0} unidades
                              </p>
                            </div>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm">
                              <strong>📝 Notas:</strong> {request.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <Button 
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={!request.stock_info?.can_fulfill || actionLoading === request.id}
                            className="flex-1 bg-success hover:bg-success/90 disabled:opacity-50"
                          >
                            {actionLoading === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Aceptar y Preparar
                          </Button>
                          <Button 
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={actionLoading === request.id}
                            variant="outline" 
                            className="flex-1 text-error hover:bg-error/10 border-error"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'accepted' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg md:text-xl font-semibold flex items-center">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
                Transferencias en Preparación
              </h2>
            </CardHeader>
            <CardContent>
              {acceptedRequests.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-base md:text-lg font-medium">No hay solicitudes en preparación</h3>
                  <p className="text-gray-500 text-sm">Las solicitudes aceptadas aparecerán aquí.</p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {acceptedRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg bg-white">
                      {/* MOBILE VIEW */}
                      <div className="md:hidden p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="flex-shrink-0">
                            <img
                              src={request.product_image || `https://via.placeholder.com/80x60/e5e7eb/6b7280?text=${encodeURIComponent(request.brand)}`}
                              alt={`${request.brand} ${request.model}`}
                              className="w-20 h-15 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                if (!e.currentTarget.dataset.fallback) {
                                  e.currentTarget.dataset.fallback = 'true';
                                  e.currentTarget.src = `https://via.placeholder.com/80x60/f3f4f6/9ca3af?text=${encodeURIComponent(request.brand)}`;
                                }
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1">
                              {request.brand} {request.model}
                            </h4>
                            <p className="text-sm text-gray-600 mb-1">
                              Talla {request.size} • {request.quantity} unidad{request.quantity > 1 ? 'es' : ''}
                            </p>
                            <p className="text-xs text-gray-500">
                              {request.requester_first_name ? 
                                `${request.requester_first_name} ${request.requester_last_name}` : 
                                'Usuario'
                              }
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'courier_assigned'
                                ? 'bg-green-100 text-green-800' 
                                : request.status === 'accepted'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {request.status === 'courier_assigned' ? '✅ Listo' : 
                               request.status === 'accepted' ? '🔄 Esperando' : 
                               request.status}
                            </span>
                          </div>
                        </div>
                        
                        {request.courier_first_name && (
                          <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-600">
                              <Truck className="h-3 w-3 inline mr-1" />
                              Corredor: <strong>{request.courier_first_name} {request.courier_last_name}</strong>
                            </p>
                          </div>
                        )}
                        
                        {(request.status === 'courier_assigned' || (request.status === 'accepted' && request.courier_first_name)) && (
                          <Button
                            onClick={() => handleDeliverToCourier(request.id)}
                            disabled={actionLoading === request.id}
                            className="w-full bg-primary hover:bg-primary/90 text-white text-sm"
                            size="sm"
                          >
                            {actionLoading === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Entregar a Corredor
                          </Button>
                        )}
                      </div>

                      {/* DESKTOP VIEW */}
                      <div className="hidden md:block p-6">
                        <div className="flex items-start mb-4">
                          <div className="flex-shrink-0 mr-4">
                            <img
                              src={request.product_image || `https://via.placeholder.com/150x100/e5e7eb/6b7280?text=${encodeURIComponent(request.brand + ' ' + request.model)}`}
                              alt={`${request.brand} ${request.model}`}
                              className="w-32 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                              onError={(e) => {
                                if (!e.currentTarget.dataset.fallback) {
                                  e.currentTarget.dataset.fallback = 'true';
                                  e.currentTarget.src = `https://via.placeholder.com/150x100/f3f4f6/9ca3af?text=${encodeURIComponent(request.brand)}`;
                                }
                              }}
                            />
                            {request.product_price && (
                              <p className="text-xs text-gray-600 mt-1 text-center font-medium">
                                💰 {formatPrice(request.product_price)}
                              </p>
                            )}
                          </div>

                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-2">
                              {request.brand} {request.model} - Talla {request.size}
                            </h4>
                            
                            {request.product_color && (
                              <p className="text-sm text-gray-600 mb-2">
                                🎨 <strong>Color:</strong> {request.product_color}
                              </p>
                            )}
                            
                            <p className="text-sm text-gray-600 mb-2">
                              <User className="h-4 w-4 inline mr-1" />
                              Solicitado por: <strong>
                                {request.requester_first_name ? 
                                  `${request.requester_first_name} ${request.requester_last_name}` : 
                                  'Usuario'
                                }
                              </strong>
                            </p>
                            
                            {request.courier_first_name && (
                              <div className="mb-2">
                                <p className="text-sm text-blue-600">
                                  <Truck className="h-4 w-4 inline mr-1" />
                                  Corredor asignado: <strong>{request.courier_first_name} {request.courier_last_name}</strong>
                                  {request.estimated_pickup_time && ` (ETA: ${request.estimated_pickup_time} min)`}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>
                                <Clock className="h-4 w-4 inline mr-1" />
                                Estado: {request.status_description || request.status}
                              </span>
                              <span>
                                📍 Propósito: {request.purpose === 'cliente' ? '🏃‍♂️ Cliente' : '📦 Restock'}
                              </span>
                              <span>
                                📦 Cantidad: {request.quantity}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right ml-6">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              request.status === 'courier_assigned'
                                ? 'bg-green-100 text-green-800' 
                                : request.status === 'accepted'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {request.status === 'courier_assigned' ? '✅ Listo para recoger' : 
                               request.status === 'accepted' ? '🔄 Esperando corredor' : 
                               request.status === 'in_transit' ? '🚚 En tránsito' : request.status}
                            </span>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>📝 Notas:</strong> {request.notes}
                            </p>
                          </div>
                        )}

                        {(request.status === 'courier_assigned' || (request.status === 'accepted' && request.courier_first_name)) && (
                          <div className="mt-4">
                            <Button
                              onClick={() => handleDeliverToCourier(request.id)}
                              disabled={actionLoading === request.id}
                              className="w-full bg-primary hover:bg-primary/90 text-white"
                            >
                              {actionLoading === request.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              Entregar a Corredor
                            </Button>
                          </div>
                        )}
                        
                        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                          <div className="flex justify-between items-center">
                            <span>ID: {request.id} | Código: {request.sneaker_reference_code}</span>
                            <span>Status: {request.status} | Corredor: {request.courier_first_name ? `${request.courier_first_name} ${request.courier_last_name}` : 'Sin asignar'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-base md:text-lg font-semibold">📊 Estadísticas del Día</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Solicitudes procesadas:</span>
                    <span className="font-bold">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Tiempo promedio de respuesta:</span>
                    <span className="font-bold text-green-600">8.5 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Solicitudes urgentes:</span>
                    <span className="font-bold text-red-600">6</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Productos entregados:</span>
                    <span className="font-bold">18</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-base md:text-lg font-semibold">🎯 Rendimiento</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm md:text-base">Tasa de completación</span>
                      <span className="font-bold">{stats.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${stats.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm md:text-base">Productos sin stock</span>
                      <span className="font-bold text-red-600">2</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '8%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm md:text-base">Satisfacción promedio</span>
                      <span className="font-bold text-green-600">4.8/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};