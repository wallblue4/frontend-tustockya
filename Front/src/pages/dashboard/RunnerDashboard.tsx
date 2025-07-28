// src/pages/dashboard/RunnerDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle,
  AlertCircle,
  User,
  Navigation,
  Route,
  Star,
  DollarSign,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Award,
  TrendingUp
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

// IMPORTACIONES
import { TransferNotifications } from '../../components/notifications/TransferNotifications';
import { useTransferNotifications } from '../../hooks/useTransferNotifications';
import { useTransferPolling } from '../../hooks/useTransferPolling';
import { useAuth } from '../../context/AuthContext';
import { courierAPI } from '../../services/transfersAPI';

// Tipos actualizados
interface AvailableRequest {
  id: number;
  status: string;
  action_required: string;
  status_description: string;
  next_step: string;
  purpose: 'cliente' | 'restock';
  hours_since_accepted: number;
  request_info: {
    pickup_location: string;
    pickup_address: string;
    delivery_location: string;
    delivery_address: string;
    product_description: string;
    urgency: string;
    warehouse_keeper: string;
    requester: string;
  };
}

interface AssignedTransport {
  id: number;
  status: string;
  action_required: string;
  action_description: string;
  source_location_name: string;
  destination_location_name: string;
  product: string;
  requester_name: string;
  estimated_pickup_time?: number;
  courier_accepted_at: string;
}

interface DeliveryHistoryItem {
  id: number;
  status: string;
  product: string;
  delivered_to: string;
  delivered_at: string;
  total_time: string;
  delivery_successful: boolean;
  distance?: string;
  earnings?: number;
}

export const RunnerDashboard: React.FC = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState<'available' | 'assigned' | 'history' | 'stats'>('available');
  const [availableRequests, setAvailableRequests] = useState<AvailableRequest[]>([]);
  const [assignedTransports, setAssignedTransports] = useState<AssignedTransport[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Estados de UI responsivo
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estados de filtros
  const [purposeFilter, setPurposeFilter] = useState<'all' | 'cliente' | 'restock'>('all');

  // Estados de estadísticas
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    todayDeliveries: 0,
    successRate: 0,
    averageTime: '0 min',
    totalEarnings: 0,
    rating: 0
  });

  // HOOKS
  const { user } = useAuth();
  const {
    notifications,
    dismissNotification,
    dismissAllNotifications,
    notifyTransportAvailable,
    addNotification
  } = useTransferNotifications();

  // Callback para manejar actualizaciones de polling
  const handlePollingUpdate = useCallback((data: any) => {
    const newAvailable = data.available || [];
    const newAssigned = data.assigned || [];

    // Detectar nuevas entregas disponibles
    if (newAvailable.length > availableRequests.length) {
      const newRequests = newAvailable.filter(
        (req: AvailableRequest) => !availableRequests.find(existing => existing.id === req.id)
      );
      
      newRequests.forEach((request: AvailableRequest) => {
        notifyTransportAvailable({
          product: request.request_info.product_description,
          distance: '3.2 km',
          purpose: request.purpose
        });
      });
    }

    setAvailableRequests(newAvailable);
    setAssignedTransports(newAssigned);

    setStats(prev => ({
      ...prev,
      totalDeliveries: deliveryHistory.length,
      todayDeliveries: newAssigned.length,
    }));
  }, [availableRequests, notifyTransportAvailable, deliveryHistory.length]);

  // POLLING para corredor
  const { data: courierData, error: pollingError, refetch } = useTransferPolling('corredor', {
    enabled: true,
    interval: 20000,
    onUpdate: handlePollingUpdate,
    onError: (error) => {
      console.error('Error en polling de corredor:', error);
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
      
      const [availableResponse, assignedResponse, historyResponse] = await Promise.all([
        courierAPI.getAvailableRequests(),
        courierAPI.getMyAssignedTransports(),
        courierAPI.getMyDeliveries()
      ]);
      
      setAvailableRequests(availableResponse.available_requests || []);
      setAssignedTransports(assignedResponse.my_transports || []);
      setDeliveryHistory(historyResponse.recent_deliveries || []);
      
    } catch (err) {
      console.error('Error loading courier data:', err);
      setError('Error conectando con el servidor');
      
      // Mock data mejorado para desarrollo
      setAvailableRequests([
        {
          id: 15,
          status: 'accepted',
          action_required: 'accept_transport',
          status_description: 'Disponible para aceptar transporte',
          next_step: 'Aceptar esta solicitud de transporte',
          purpose: 'cliente',
          hours_since_accepted: 0.5,
          request_info: {
            pickup_location: 'Bodega Norte',
            pickup_address: 'Zona Industrial 202',
            delivery_location: 'Local Principal',
            delivery_address: 'Calle Principal 123',
            product_description: 'Adidas Ultraboost 22 - Talla 9.5',
            urgency: '🔥 Cliente presente',
            warehouse_keeper: 'Carlos González',
            requester: 'Juan Pérez'
          }
        },
        {
          id: 18,
          status: 'accepted',
          action_required: 'accept_transport',
          status_description: 'Disponible para aceptar transporte',
          next_step: 'Aceptar esta solicitud de transporte',
          purpose: 'restock',
          hours_since_accepted: 1.2,
          request_info: {
            pickup_location: 'Bodega Sur',
            pickup_address: 'Zona Industrial 304',
            delivery_location: 'Local Mall',
            delivery_address: 'Centro Comercial Norte',
            product_description: 'Nike Air Force 1 - Talla 10',
            urgency: '📦 Normal',
            warehouse_keeper: 'Ana Rodríguez',
            requester: 'María González'
          }
        }
      ]);
      
      setAssignedTransports([
        {
          id: 19,
          status: 'courier_assigned',
          action_required: 'ir_a_recoger',
          action_description: 'Ve al punto de recolección',
          source_location_name: 'Bodega Central',
          destination_location_name: 'Local Centro',
          product: 'Puma RS-X - Talla 9',
          requester_name: 'Carlos López',
          estimated_pickup_time: 15,
          courier_accepted_at: new Date(Date.now() - 300000).toISOString()
        }
      ]);

      setDeliveryHistory([
        {
          id: 20,
          status: 'completed',
          product: 'Nike Air Max 90 - Talla 8.5',
          delivered_to: 'Laura Martínez',
          delivered_at: new Date(Date.now() - 7200000).toISOString(),
          total_time: '28 minutos',
          delivery_successful: true,
          distance: '4.1 km',
          earnings: 15000
        },
        {
          id: 21,
          status: 'completed',
          product: 'Adidas Stan Smith - Talla 7',
          delivered_to: 'Pedro Ramírez',
          delivered_at: new Date(Date.now() - 14400000).toISOString(),
          total_time: '22 minutos',
          delivery_successful: true,
          distance: '2.8 km',
          earnings: 12000
        }
      ]);

      // Mock stats mejorado
      setStats({
        totalDeliveries: 47,
        todayDeliveries: 3,
        successRate: 98.5,
        averageTime: '26 min',
        totalEarnings: 350000,
        rating: 4.8
      });
      
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar acciones
  const handleAcceptRequest = async (requestId: number) => {
    console.log('🚚 Aceptando entrega:', requestId);
    setActionLoading(requestId);
    
    try {
      const request = availableRequests.find(r => r.id === requestId);
      const estimatedTime = request?.purpose === 'cliente' ? 15 : 20;
      
      const response = await courierAPI.acceptRequest(
        requestId, 
        estimatedTime, 
        `En camino al punto de recolección. ETA: ${estimatedTime} minutos.`
      );
      
      console.log('✅ Entrega aceptada:', response);
      
      addNotification(
        'success',
        '🚚 Entrega Aceptada',
        `Transferencia #${requestId} aceptada. Dirígete al punto de recolección.`,
        {
          label: 'Ver Mis Entregas',
          onClick: () => setActiveTab('assigned')
        }
      );
      
      await refetch();
      
    } catch (err) {
      console.error('❌ Error al aceptar:', err);
      addNotification(
        'error',
        '❌ Error al Aceptar',
        err instanceof Error ? err.message : 'Error desconocido'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPickup = async (requestId: number) => {
    console.log('📦 Confirmando recolección:', requestId);
    setActionLoading(requestId);
    
    try {
      await courierAPI.confirmPickup(
        requestId, 
        'Producto recogido en perfecto estado. En camino al destino.'
      );
      
      addNotification(
        'success',
        '📦 Recolección Confirmada',
        `Transferencia #${requestId} recogida. En tránsito al destino.`
      );
      
      await refetch();
      
    } catch (err) {
      console.error('❌ Error en recolección:', err);
      addNotification(
        'error',
        '❌ Error en Recolección',
        err instanceof Error ? err.message : 'Error desconocido'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelivery = async (requestId: number) => {
    console.log('✅ Confirmando entrega:', requestId);
    setActionLoading(requestId);
    
    try {
      await courierAPI.confirmDelivery(
        requestId, 
        true, 
        'Entrega exitosa. Producto entregado en perfecto estado.'
      );
      
      addNotification(
        'success',
        '✅ Entrega Completada',
        `Transferencia #${requestId} entregada exitosamente.`,
        {
          label: 'Ver Historial',
          onClick: () => setActiveTab('history')
        }
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
  const filteredAvailableRequests = availableRequests.filter(request => {
    return purposeFilter === 'all' || request.purpose === purposeFilter;
  });

  // Funciones para obtener acciones según estado
  const getActionButton = (transport: AssignedTransport) => {
    switch (transport.action_required) {
      case 'ir_a_recoger':
        return (
          <Button
            onClick={() => handleConfirmPickup(transport.id)}
            disabled={actionLoading === transport.id}
            className="w-full bg-blue-600 hover:bg-blue-700 text-sm md:text-base"
            size="sm"
          >
            {actionLoading === transport.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Package className="h-4 w-4 mr-2" />
            )}
            Confirmar Recolección
          </Button>
        );
      case 'confirmar_entrega':
        return (
          <Button
            onClick={() => handleConfirmDelivery(transport.id)}
            disabled={actionLoading === transport.id}
            className="w-full bg-green-600 hover:bg-green-700 text-sm md:text-base"
            size="sm"
          >
            {actionLoading === transport.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Confirmar Entrega
          </Button>
        );
      default:
        return (
          <div className="w-full text-center text-gray-500 py-2 text-sm">
            Esperando siguiente acción...
          </div>
        );
    }
  };

  const formatDistance = (pickup: string, delivery: string) => {
    const distances: Record<string, number> = {
      'Bodega Norte-Local Principal': 3.2,
      'Bodega Sur-Local Mall': 4.5,
      'Bodega Central-Local Centro': 2.1
    };
    return distances[`${pickup}-${delivery}`] || 3.5;
  };

  const calculateEarnings = (distance: number, isUrgent: boolean) => {
    const baseRate = 5000;
    const urgentMultiplier = isUrgent ? 1.5 : 1;
    return Math.round(distance * baseRate * urgentMultiplier);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const toggleCardExpansion = (cardId: number) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  if (loading) {
    return (
      <DashboardLayout title="Panel de Corredor">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando entregas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Panel de Corredor">
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
                  <p className="text-xs md:text-sm text-gray-600">Hoy</p>
                  <p className="text-lg md:text-2xl font-bold text-blue-600">{stats.todayDeliveries}</p>
                </div>
                <Truck className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Total</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.totalDeliveries}</p>
                </div>
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Éxito</p>
                  <p className="text-lg md:text-2xl font-bold text-green-600">{stats.successRate}%</p>
                </div>
                <Award className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Rating</p>
                  <p className="text-lg md:text-2xl font-bold text-yellow-600">{stats.rating}</p>
                </div>
                <Star className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs - RESPONSIVE */}
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="flex flex-wrap gap-2 md:gap-4">
              <Button
                variant={activeTab === 'available' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('available')}
                size="sm"
                className="flex-1 md:flex-none text-xs md:text-sm"
              >
                <Package className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Disponibles</span>
                <span className="sm:hidden">Disp.</span>
                ({filteredAvailableRequests.length})
              </Button>
              <Button
                variant={activeTab === 'assigned' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('assigned')}
                size="sm"
                className="flex-1 md:flex-none text-xs md:text-sm"
              >
                <Truck className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Mis Entregas</span>
                <span className="sm:hidden">Entregas</span>
                ({assignedTransports.length})
              </Button>
              <Button
                variant={activeTab === 'history' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('history')}
                size="sm"
                className="flex-1 md:flex-none text-xs md:text-sm"
              >
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Historial</span>
                <span className="sm:hidden">Hist.</span>
                ({deliveryHistory.length})
              </Button>
              <Button
                variant={activeTab === 'stats' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('stats')}
                size="sm"
                className="flex-1 md:flex-none text-xs md:text-sm"
              >
                <Star className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
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
                <p className="text-amber-800 text-sm">{error} - Usando datos de prueba</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenido según tab activo */}
        {activeTab === 'available' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                <h2 className="text-lg md:text-xl font-semibold flex items-center">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
                  Entregas Disponibles
                </h2>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    size="sm"
                    className="md:hidden"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                  </Button>
                  
                  <select
                    value={purposeFilter}
                    onChange={(e) => setPurposeFilter(e.target.value as any)}
                    className={`px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md text-xs md:text-sm ${showFilters ? 'block' : 'hidden md:block'}`}
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="cliente">Solo urgentes</option>
                    <option value="restock">Solo normales</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAvailableRequests.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Package className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-base md:text-lg font-medium">No hay entregas disponibles</h3>
                  <p className="text-gray-500 text-sm">
                    {purposeFilter !== 'all' 
                      ? 'No hay entregas que coincidan con el filtro'
                      : 'Revisa en unos minutos para nuevas solicitudes.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {filteredAvailableRequests.map((request) => {
                    const distance = formatDistance(
                      request.request_info.pickup_location,
                      request.request_info.delivery_location
                    );
                    const earnings = calculateEarnings(distance, request.purpose === 'cliente');
                    
                    return (
                      <div key={request.id} className="border rounded-lg bg-white hover:shadow-lg transition-shadow">
                        {/* MOBILE COMPACT VIEW */}
                        <div className="md:hidden">
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    request.purpose === 'cliente' 
                                      ? 'bg-red-100 text-red-800 border border-red-200' 
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}>
                                    {request.request_info.urgency}
                                  </span>
                                </div>
                                
                                <h3 className="font-semibold text-base mb-1 truncate">
                                  {request.request_info.product_description}
                                </h3>
                                
                                <p className="text-sm text-gray-600 mb-1">
                                  <User className="h-3 w-3 inline mr-1" />
                                  {request.request_info.requester}
                                </p>
                                
                                <p className="text-xs text-gray-500">
                                  ⏱️ {request.hours_since_accepted.toFixed(1)}h • 📍 {distance} km
                                </p>
                              </div>
                                  
                            </div>
                            
                            <Button
                              onClick={() => toggleCardExpansion(request.id)}
                              variant="ghost"
                              size="sm"
                              className="w-full text-sm mb-3"
                            >
                              {expandedCard === request.id ? (
                                <>Menos detalles <ChevronUp className="h-4 w-4 ml-2" /></>
                              ) : (
                                <>Ver detalles <ChevronDown className="h-4 w-4 ml-2" /></>
                              )}
                            </Button>
                            
                            {expandedCard === request.id && (
                              <div className="mt-3 pt-3 border-t space-y-3">
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center mb-1">
                                      <Navigation className="h-4 w-4 text-green-600 mr-1" />
                                      <span className="font-medium text-green-800 text-sm">Entregar</span>
                                    </div>
                                    <p className="text-sm font-medium">{request.request_info.delivery_location}</p>
                                    <p className="text-xs text-gray-600">{request.request_info.delivery_address}</p>
                                  </div>
                                </div>
                                
                                <div className="p-2 bg-gray-50 rounded-lg border">
                                  <p className="text-xs">
                                    <strong>📋 Siguiente:</strong> {request.next_step}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            <Button
                              onClick={() => handleAcceptRequest(request.id)}
                              disabled={actionLoading === request.id}
                              className="w-full bg-success hover:bg-success/90 text-white text-sm"
                              size="sm"
                            >
                              {actionLoading === request.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <Truck className="h-4 w-4 mr-2" />
                              )}
                              Aceptar (ETA: {request.purpose === 'cliente' ? '15' : '20'} min)
                            </Button>
                          </div>
                        </div>

                        {/* DESKTOP FULL VIEW */}
                        <div className="hidden md:block p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-grow">
                              <div className="flex items-center space-x-3 mb-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  request.purpose === 'cliente' 
                                    ? 'bg-red-100 text-red-800 border border-red-200' 
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  {request.request_info.urgency}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ⏱️ Esperando: {request.hours_since_accepted.toFixed(1)} horas
                                </span>
                              </div>
                              
                              <h3 className="font-semibold text-xl mb-2">
                                {request.request_info.product_description}
                              </h3>
                              <p className="text-gray-600 mb-3">
                                <User className="h-4 w-4 inline mr-1" />
                                Solicitado por: <strong>{request.request_info.requester}</strong>
                              </p>
                            </div>
                            
                            <div className="text-right ml-6">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-lg font-bold text-green-700">
                                  {formatPrice(earnings)}
                                </p>
                                <p className="text-xs text-green-600">Ganancia estimada</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center mb-2">
                                <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                                <h4 className="font-semibold text-blue-800">Punto de Recolección</h4>
                              </div>
                              <p className="font-medium">{request.request_info.pickup_location}</p>
                              <p className="text-sm text-gray-600">{request.request_info.pickup_address}</p>
                              <p className="text-xs text-blue-600 mt-1">
                                📞 Contacto: {request.request_info.warehouse_keeper}
                              </p>
                            </div>
                            
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center mb-2">
                                <Navigation className="h-5 w-5 text-green-600 mr-2" />
                                <h4 className="font-semibold text-green-800">Punto de Entrega</h4>
                              </div>
                              <p className="font-medium">{request.request_info.delivery_location}</p>
                              <p className="text-sm text-gray-600">{request.request_info.delivery_address}</p>
                              <p className="text-xs text-green-600 mt-1">
                                📍 Distancia: ~{distance} km
                              </p>
                            </div>
                          </div>

                          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                            <p className="text-sm">
                              <strong>📋 Siguiente paso:</strong> {request.next_step}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">{request.status_description}</p>
                          </div>

                          <Button
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={actionLoading === request.id}
                            className="w-full bg-success hover:bg-success/90 text-white py-3"
                          >
                            {actionLoading === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Truck className="h-4 w-4 mr-2" />
                            )}
                            Aceptar Entrega (ETA: {request.purpose === 'cliente' ? '15' : '20'} min)
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'assigned' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg md:text-xl font-semibold flex items-center">
                <Truck className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
                Mis Entregas Asignadas
              </h2>
            </CardHeader>
            <CardContent>
              {assignedTransports.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Truck className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-base md:text-lg font-medium">No tienes entregas asignadas</h3>
                  <p className="text-gray-500 text-sm">Las entregas que aceptes aparecerán aquí.</p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {assignedTransports.map((transport) => (
                    <div key={transport.id} className="border rounded-lg bg-white">
                      {/* MOBILE VIEW */}
                      <div className="md:hidden p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1 truncate">{transport.product}</h4>
                            <p className="text-sm text-gray-600 mb-1">
                              <User className="h-3 w-3 inline mr-1" />
                              Para: <strong>{transport.requester_name}</strong>
                            </p>
                            <p className="text-xs text-gray-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(transport.courier_accepted_at).toLocaleTimeString()}
                            </p>
                          </div>
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transport.status === 'courier_assigned' ? 'bg-yellow-100 text-yellow-800' :
                            transport.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {transport.action_description}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                          <div className="p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center mb-1">
                              <MapPin className="h-3 w-3 text-blue-600 mr-1" />
                              <span className="font-medium text-blue-800">Desde</span>
                            </div>
                            <p className="font-medium">{transport.source_location_name}</p>
                          </div>
                          
                          <div className="p-2 bg-green-50 rounded border border-green-200">
                            <div className="flex items-center mb-1">
                              <Navigation className="h-3 w-3 text-green-600 mr-1" />
                              <span className="font-medium text-green-800">Hacia</span>
                            </div>
                            <p className="font-medium">{transport.destination_location_name}</p>
                          </div>
                        </div>
                        
                        {transport.estimated_pickup_time && (
                          <div className="mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-xs">
                              <Clock className="h-3 w-3 inline mr-1" />
                              <strong>ETA:</strong> {transport.estimated_pickup_time} minutos
                            </p>
                          </div>
                        )}
                        
                        {getActionButton(transport)}
                      </div>

                      {/* DESKTOP VIEW */}
                      <div className="hidden md:block p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-xl mb-2">{transport.product}</h4>
                            <p className="text-gray-600 mb-2">
                              <User className="h-4 w-4 inline mr-1" />
                              Para: <strong>{transport.requester_name}</strong>
                            </p>
                            <p className="text-sm text-gray-500 mb-3">
                              <Clock className="h-4 w-4 inline mr-1" />
                              Aceptado: {new Date(transport.courier_accepted_at).toLocaleString()}
                            </p>
                          </div>
                          
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            transport.status === 'courier_assigned' ? 'bg-yellow-100 text-yellow-800' :
                            transport.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {transport.action_description}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center mb-1">
                              <MapPin className="h-4 w-4 text-blue-600 mr-1" />
                              <span className="font-medium text-blue-800">Desde</span>
                            </div>
                            <p className="text-sm font-medium">{transport.source_location_name}</p>
                          </div>
                          
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center mb-1">
                              <Navigation className="h-4 w-4 text-green-600 mr-1" />
                              <span className="font-medium text-green-800">Hacia</span>
                            </div>
                            <p className="text-sm font-medium">{transport.destination_location_name}</p>
                          </div>
                        </div>

                        {transport.estimated_pickup_time && (
                          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm">
                              <Clock className="h-4 w-4 inline mr-1" />
                              <strong>Tiempo estimado de llegada:</strong> {transport.estimated_pickup_time} minutos
                            </p>
                          </div>
                        )}

                        {getActionButton(transport)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg md:text-xl font-semibold flex items-center">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
                Historial de Entregas
              </h2>
            </CardHeader>
            <CardContent>
              {deliveryHistory.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-base md:text-lg font-medium">No hay entregas completadas</h3>
                  <p className="text-gray-500 text-sm">Tu historial de entregas aparecerá aquí.</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {deliveryHistory.map((delivery) => (
                    <div key={delivery.id} className="border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                      {/* MOBILE VIEW */}
                      <div className="md:hidden">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{delivery.product}</h4>
                            <p className="text-xs text-gray-600">
                              <User className="h-3 w-3 inline mr-1" />
                              {delivery.delivered_to}
                            </p>
                            <p className="text-xs text-gray-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(delivery.delivered_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="text-right ml-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              delivery.delivery_successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {delivery.delivery_successful ? '✅' : '❌'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {delivery.total_time}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {delivery.distance && (
                            <div>
                              <p className="text-gray-500">Distancia</p>
                              <p className="font-medium">{delivery.distance}</p>
                            </div>
                          )}
                          {delivery.earnings && (
                            <div>
                              <p className="text-gray-500">Ganancia</p>
                              <p className="font-medium text-green-600">{formatPrice(delivery.earnings)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500">Estado</p>
                            <p className="font-medium text-xs">{delivery.status}</p>
                          </div>
                        </div>
                      </div>

                      {/* DESKTOP VIEW */}
                      <div className="hidden md:block">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{delivery.product}</h4>
                            <p className="text-sm text-gray-600">
                              <User className="h-4 w-4 inline mr-1" />
                              Entregado a: <strong>{delivery.delivered_to}</strong>
                            </p>
                            <p className="text-xs text-gray-500">
                              <Clock className="h-4 w-4 inline mr-1" />
                              {new Date(delivery.delivered_at).toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              delivery.delivery_successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {delivery.delivery_successful ? '✅ Exitosa' : '❌ Fallida'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              ⏱️ {delivery.total_time}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {delivery.distance && (
                            <div>
                              <p className="text-gray-500">Distancia</p>
                              <p className="font-medium">{delivery.distance}</p>
                            </div>
                          )}
                          {delivery.earnings && (
                            <div>
                              <p className="text-gray-500">Ganancia</p>
                              <p className="font-medium text-green-600">{formatPrice(delivery.earnings)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500">Estado</p>
                            <p className="font-medium">{delivery.status}</p>
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
                <h3 className="text-base md:text-lg font-semibold">📊 Estadísticas Generales</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Total entregas realizadas:</span>
                    <span className="font-bold">{stats.totalDeliveries}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Entregas completadas hoy:</span>
                    <span className="font-bold text-blue-600">{stats.todayDeliveries}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Tasa de éxito:</span>
                    <span className="font-bold text-green-600">{stats.successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Tiempo promedio:</span>
                    <span className="font-bold">{stats.averageTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Ganancias totales:</span>
                    <span className="font-bold text-green-600">{formatPrice(stats.totalEarnings)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Rating promedio:</span>
                    <span className="font-bold text-yellow-600">{stats.rating} ⭐</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-base md:text-lg font-semibold">📈 Rendimiento Semanal</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => {
                    const deliveries = [8, 12, 6, 15, 11, 4, 2][index];
                    const maxDeliveries = 15;
                    const height = (deliveries / maxDeliveries) * 100;
                    
                    return (
                      <div key={day} className="text-center">
                        <div className="bg-gray-200 h-16 md:h-20 rounded flex items-end justify-center">
                          <div 
                            className="bg-blue-500 rounded-t w-full flex items-end justify-center text-xs text-white font-medium"
                            style={{ height: `${height}%`, minHeight: deliveries > 0 ? '16px' : '0' }}
                          >
                            {deliveries > 0 && deliveries}
                          </div>
                        </div>
                        <p className="text-xs mt-1 text-gray-600">{day}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-4 text-center text-xs md:text-sm">
                  <div>
                    <p className="text-gray-500">Promedio diario</p>
                    <p className="font-bold">8.3 entregas</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mejor día</p>
                    <p className="font-bold text-green-600">Jueves (15)</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total semanal</p>
                    <p className="font-bold">58 entregas</p>
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