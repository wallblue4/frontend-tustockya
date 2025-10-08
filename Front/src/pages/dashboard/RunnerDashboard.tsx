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
  Star,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// IMPORTACIONES
import { TransferNotifications } from '../../components/notifications/TransferNotifications';
import { useTransferNotifications } from '../../hooks/useTransferNotifications';
import { useTransferPolling } from '../../hooks/useTransferPolling';
import { useAuth } from '../../context/AuthContext';
import { courierAPI } from '../../services/transfersAPI';
import { AssignedTransport, CourierStats, MyTransportsResponse } from '../../types';

// Tipos actualizados
interface AvailableRequest {
  product_image: string | undefined;
  id: number;
  status: string;
  action_required: string;
  status_description: string;
  next_step: string;
  purpose: 'cliente' | 'restock' | 'return';
  hours_since_accepted: number;
  notes?: string;
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

// Removido - ahora usamos el tipo de types/index.ts

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
  const [courierStats, setCourierStats] = useState<CourierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Estados de UI responsivo
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estados de filtros
  const [purposeFilter, setPurposeFilter] = useState<'all' | 'cliente' | 'restock'>('all');

  // Estados de estadísticas (mantenido para compatibilidad con polling)
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    todayDeliveries: 0,
    successRate: 0,
    averageTime: '0 min',
    totalEarnings: 0,
    rating: 0
  });

  // HOOKS
  const { } = useAuth();
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
  const { error: pollingError, refetch } = useTransferPolling('corredor', {
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
      
      // Usar la respuesta completa del endpoint my-transports
      const transportsResponse = assignedResponse as MyTransportsResponse;
      setAssignedTransports(transportsResponse.my_transports || []);
      setCourierStats(transportsResponse.courier_stats || null);

      // Map delivery history from backend response
      const deliveries = (historyResponse.delivery_history || []).map((item: any) => ({
        id: item.id,
        status: item.status,
        product: `${item.brand} ${item.model} - Talla ${item.size}`,
        delivered_to: `${item.requester_first_name} ${item.requester_last_name}`,
        delivered_at: item.delivered_at,
        total_time: item.delivered_at && item.picked_up_at ? `${Math.round((new Date(item.delivered_at).getTime() - new Date(item.picked_up_at).getTime()) / 60000)} minutos` : '',
        delivery_successful: item.status === 'completed',
        distance: undefined, // Optionally calculate if available
        earnings: undefined // Optionally calculate if available
      }));
      setDeliveryHistory(deliveries);

    } catch (err) {
      console.error('Error loading courier data:', err);
      setError('Error conectando con el servidor');

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
      
      // Detectar si es una devolución
      const isReturn = request?.request_info?.product_description?.includes('devolución') || 
                      request?.notes?.includes('return') ||
                      request?.purpose === 'return';
      
      let response;
      if (isReturn) {
        response = await courierAPI.acceptReturnTransport(
          requestId, 
          estimatedTime, 
          `En camino al punto de recolección para devolución. ETA: ${estimatedTime} minutos.`
        );
      } else {
        response = await courierAPI.acceptRequest(
          requestId, 
          estimatedTime, 
          `En camino al punto de recolección. ETA: ${estimatedTime} minutos.`
        );
      }
      
      console.log('✅ Entrega aceptada:', response);
      
      addNotification(
        'success',
        '🚚 Entrega Aceptada',
        `${isReturn ? 'Devolución' : 'Transferencia'} #${requestId} aceptada. ${response.message}`,
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
      // Detectar si es una devolución
      const transport = assignedTransports.find(t => t.id === requestId);
      const isReturn = transport?.courier_notes?.includes('return') || 
                      transport?.purpose === 'return';
      
      let response;
      if (isReturn) {
        response = await courierAPI.confirmReturnPickup(
          requestId, 
          'Producto de devolución recogido del vendedor - return en buen estado'
        );
      } else {
        response = await courierAPI.confirmPickup(
          requestId, 
          'Producto recogido en perfecto estado. En camino al destino.'
        );
      }
      
      addNotification(
        'success',
        '📦 Recolección Confirmada',
        `${isReturn ? 'Devolución' : 'Transferencia'} #${requestId} recogida. ${response.message}`
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
      // Detectar si es una devolución
      const transport = assignedTransports.find(t => t.id === requestId);
      const isReturn = transport?.courier_notes?.includes('return') || 
                      transport?.purpose === 'return';
      
      let response;
      if (isReturn) {
        response = await courierAPI.confirmReturnDelivery(
          requestId, 
          true, 
          'Producto devuelto entregado en bodega exitosamente'
        );
      } else {
        response = await courierAPI.confirmDelivery(
          requestId, 
          true, 
          'Entrega exitosa. Producto entregado en perfecto estado.'
        );
      }
      
      addNotification(
        'success',
        '✅ Entrega Completada',
        `${isReturn ? 'Devolución' : 'Transferencia'} #${requestId} entregada exitosamente. ${response.message}`,
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

  // Función para obtener la acción requerida basada en el estado
  const getActionRequired = (transport: AssignedTransport) => {
    const isReturn = transport.purpose === 'return';
    
    switch (transport.status) {
      case 'courier_assigned':
        return { 
          action: 'confirm_pickup', 
          description: isReturn ? '🔄 Devolución - Recibir de Vendedor' : 'Asignado - Confirmar Recolección' 
        };
      case 'in_transit':
        return { 
          action: 'confirm_delivery', 
          description: isReturn ? '🔄 Devolución - Entregar a Bodeguero' : 'En Tránsito - Confirmar Entrega' 
        };
      case 'delivered':
        return { 
          action: 'delivered', 
          description: isReturn ? 'Devolución Entregada - Esperando confirmación del bodeguero' : 'Entregado - Esperando confirmación del vendedor' 
        };
      default:
        return { 
          action: 'confirm_pickup', 
          description: isReturn ? '🔄 Devolución - Recibir de Vendedor' : 'Asignado - Confirmar Recolección' 
        };
    }
  };

  // Funciones de filtrado
  const filteredAvailableRequests = availableRequests.filter(request => {
    return purposeFilter === 'all' || request.purpose === purposeFilter;
  });

  // Separar transportes activos de los completados
  // Filtrar transportes que no estén en status "delivered"
  const activeTransports = assignedTransports.filter(transport => transport.status !== 'delivered');
  const completedTransports: AssignedTransport[] = []; // No hay transportes completados en el sistema actual

  // Funciones para obtener acciones según estado
  const getActionButton = (transport: AssignedTransport) => {
    const isReturn = transport.purpose === 'return';
    
    // *** CASO ESPECIAL: DEVOLUCIONES ***
    if (isReturn) {
      // PASO 1: Si está "courier_assigned", mostrar "Recibir de Vendedor"
      if (transport.status === 'courier_assigned') {
        return (
          <Button
            onClick={() => handleConfirmPickup(transport.id)}
            disabled={actionLoading === transport.id}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm md:text-base"
            size="sm"
          >
            {actionLoading === transport.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            📦 Recibir de Vendedor
          </Button>
        );
      }
      
      // PASO 2: Si está "in_transit", mostrar "Entregar a Bodeguero"
      if (transport.status === 'in_transit') {
        return (
          <Button
            onClick={() => handleConfirmDelivery(transport.id)}
            disabled={actionLoading === transport.id}
            className="w-full bg-success hover:bg-success/90 text-success-foreground text-sm md:text-base"
            size="sm"
          >
            {actionLoading === transport.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-success-foreground mr-2"></div>
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            🏪 Entregar a Bodeguero
          </Button>
        );
      }
    }
    
    // *** CASO NORMAL: TRANSFERENCIAS REGULARES ***
    // Mostrar botón cuando el status sea "in_transit"
    if (transport.status === 'in_transit') {
      return (
        <Button
          onClick={() => handleConfirmDelivery(transport.id)}
          disabled={actionLoading === transport.id}
          className="w-full bg-success hover:bg-success/90 text-success-foreground text-sm md:text-base"
          size="sm"
        >
          {actionLoading === transport.id ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-success-foreground mr-2"></div>
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Confirmar Entrega
        </Button>
      );
    }
    
    // Para todos los otros status, no mostrar botón
    return (
      <div className="w-full text-center text-muted-foreground py-2 text-sm">
        Esperando siguiente acción...
      </div>
    );
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
            <p className="text-muted-foreground">Cargando entregas...</p>
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
                ({activeTransports.length})
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
          <Card className="border-warning/30 bg-warning/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium text-warning">Modo de Desarrollo</p>
                  <p className="text-sm text-warning">
                    Usando datos de prueba. El servidor backend no está disponible.
                  </p>
                </div>
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
                    className={`px-2 py-1 md:px-3 md:py-2 border border-border rounded-md text-xs md:text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${showFilters ? 'block' : 'hidden md:block'}`}
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
                  <Package className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base md:text-lg font-medium">No hay entregas disponibles</h3>
                  <p className="text-muted-foreground text-sm">
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
                      <div key={request.id} className="border border-border rounded-xl bg-card shadow-sm hover:shadow-lg transition-all duration-300">
                        
                        {/* MOBILE COMPACT VIEW */}
                        <div className="md:hidden">
                          <div className="p-4">
                            {/* Header con etiquetas de prioridad */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  request.purpose === 'cliente' 
                                    ? 'bg-error/20 text-error border border-error/30' 
                                    : 'bg-primary/20 text-primary border border-primary/30'
                                }`}>
                                  {request.request_info.urgency}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID #{request.id}
                              </div>
                            </div>
                            
                            {/* Layout horizontal: Imagen vertical a la izquierda, info a la derecha */}
                            <div className="flex space-x-4 mb-4">
                              {/* Imagen vertical */}
                              <div className="flex-shrink-0">
                                <div className="w-32 h-48 rounded-lg overflow-hidden border border-border bg-muted/20">
                                  {request.product_image ? (
                                    <img
                                      src={request.product_image}
                                      alt={request.request_info.product_description}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                      <div className="text-center">
                                        <div className="text-2xl mb-1">📦</div>
                                        <div className="text-xs">Sin imagen</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Información del producto */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base text-card-foreground mb-2 leading-tight">
                                  {request.request_info.product_description}
                                </h3>
                                
                                <div className="space-y-2 mb-3">
                                  <div className="flex items-center space-x-1 text-sm text-card-foreground">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium truncate">
                                      Solicitante: {request.request_info.requester}
                                    </span>
                                  </div>
                                  
                                  <p className="text-xs text-muted-foreground">
                                    ⏱️ {request.hours_since_accepted ? request.hours_since_accepted.toFixed(1) : '0'}h • 📍 {distance} km
                                  </p>
                                </div>
                                
                                {/* Ganancia estimada compacta */}
                                <div className="p-2 bg-success/10 rounded border border-success/20 text-center">
                                  <div className="text-sm font-bold text-success">
                                    {formatPrice(earnings)}
                                  </div>
                                  <div className="text-xs text-success/80">Ganancia estimada</div>
                                </div>
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
                              <div className="mb-4 pt-4 border-t border-border space-y-3">
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <div className="flex items-center mb-1">
                                      <MapPin className="h-4 w-4 text-primary mr-1" />
                                      <span className="font-medium text-primary text-sm">Recoger</span>
                                    </div>
                                    <p className="text-sm font-medium text-card-foreground">{request.request_info.pickup_location}</p>
                                    <p className="text-xs text-muted-foreground">{request.request_info.pickup_address}</p>
                                  </div>
                                  <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                                    <div className="flex items-center mb-1">
                                      <Navigation className="h-4 w-4 text-success mr-1" />
                                      <span className="font-medium text-success text-sm">Entregar</span>
                                    </div>
                                    <p className="text-sm font-medium text-card-foreground">{request.request_info.delivery_location}</p>
                                    <p className="text-xs text-muted-foreground">{request.request_info.delivery_address}</p>
                                  </div>
                                </div>
                                
                                <div className="p-2 bg-muted/20 rounded-lg border border-border">
                                  <p className="text-xs text-card-foreground">
                                    <strong>📋 Siguiente:</strong> {request.next_step}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            <Button
                              onClick={() => handleAcceptRequest(request.id)}
                              disabled={actionLoading === request.id}
                              className="w-full bg-success hover:bg-success/90 text-success-foreground text-sm"
                              size="sm"
                            >
                              {actionLoading === request.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-success-foreground mr-2"></div>
                              ) : (
                                <Truck className="h-4 w-4 mr-2" />
                              )}
                              Aceptar (ETA: {request.purpose === 'cliente' ? '15' : '20'} min)
                            </Button>
                          </div>
                        </div>

                        {/* DESKTOP FULL VIEW */}
                        <div className="hidden md:block p-6">
                          {/* Header con etiquetas */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                request.purpose === 'cliente' 
                                  ? 'bg-error/20 text-error border border-error/30' 
                                  : 'bg-primary/20 text-primary border border-primary/30'
                              }`}>
                                {request.request_info.urgency}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ⏱️ Esperando: {request.hours_since_accepted ? request.hours_since_accepted.toFixed(1) : '0'} horas
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID #{request.id}
                            </div>
                          </div>
                          
                          {/* Layout horizontal: Imagen vertical a la izquierda, información a la derecha */}
                          <div className="flex space-x-6">
                            
                            {/* Imagen del producto vertical */}
                            <div className="flex-shrink-0">
                              <div className="w-48 h-64 rounded-xl overflow-hidden border border-border shadow-sm bg-muted/20">
                                {request.product_image ? (
                                  <img
                                    src={request.product_image}
                                    alt={request.request_info.product_description}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                      <div className="text-6xl mb-2">📦</div>
                                      <div className="text-sm">Sin imagen</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Ganancia estimada debajo de la imagen */}
                              <div className="mt-3 bg-success/10 border border-success/20 rounded-lg p-3 text-center">
                                <p className="text-lg font-bold text-success">
                                  {formatPrice(earnings)}
                                </p>
                                <p className="text-xs text-success/80">Ganancia estimada</p>
                              </div>
                            </div>
                            
                            {/* Información del producto */}
                            <div className="flex-1 space-y-6">
                              <div>
                                <h3 className="text-3xl font-bold text-card-foreground mb-3 leading-tight">
                                  {request.request_info.product_description}
                                </h3>
                                
                                {/* Cliente */}
                                <div className="p-4 bg-muted/20 rounded-lg mb-6">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                      <User className="h-6 w-6 text-primary-foreground" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-card-foreground text-lg">
                                        Solicitante: {request.request_info.requester}
                                      </div>
                                      <div className="text-sm text-muted-foreground">Cliente</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Ruta de entrega */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                                    <div className="flex items-center mb-2">
                                      <MapPin className="h-5 w-5 text-primary mr-2" />
                                      <h4 className="font-semibold text-primary">Punto de Recolección</h4>
                                    </div>
                                    <p className="font-medium text-card-foreground">{request.request_info.pickup_location}</p>
                                    <p className="text-sm text-muted-foreground">{request.request_info.pickup_address}</p>
                                    <p className="text-xs text-primary mt-1">
                                      📞 Contacto: {request.request_info.warehouse_keeper}
                                    </p>
                                  </div>
                                  
                                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                                    <div className="flex items-center mb-2">
                                      <Navigation className="h-5 w-5 text-success mr-2" />
                                      <h4 className="font-semibold text-success">Punto de Entrega</h4>
                                    </div>
                                    <p className="font-medium text-card-foreground">{request.request_info.delivery_location}</p>
                                    <p className="text-sm text-muted-foreground">{request.request_info.delivery_address}</p>
                                    <p className="text-xs text-success mt-1">
                                      📍 Distancia: ~{distance} km
                                    </p>
                                  </div>
                                </div>

                                <div className="p-4 bg-muted/20 rounded-lg border border-border mb-6">
                                  <p className="text-sm text-card-foreground">
                                    <strong>📋 Siguiente paso:</strong> {request.next_step}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">{request.status_description}</p>
                                </div>

                                <Button
                                  onClick={() => handleAcceptRequest(request.id)}
                                  disabled={actionLoading === request.id}
                                  className="w-full bg-success hover:bg-success/90 text-success-foreground py-3"
                                >
                                  {actionLoading === request.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-success-foreground mr-2"></div>
                                  ) : (
                                    <Truck className="h-4 w-4 mr-2" />
                                  )}
                                  Aceptar Entrega (ETA: {request.purpose === 'cliente' ? '15' : '20'} min)
                                </Button>
                              </div>
                            </div>
                          </div>
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
              <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                <h2 className="text-lg md:text-xl font-semibold flex items-center">
                  <Truck className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
                  Mis Entregas Asignadas
                </h2>
                {courierStats && (
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">En progreso: {courierStats.in_progress}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-muted-foreground">Completadas: {courierStats.completed}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activeTransports.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Truck className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base md:text-lg font-medium">No tienes entregas asignadas</h3>
                  <p className="text-muted-foreground text-sm">Las entregas que aceptes aparecerán aquí.</p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {activeTransports.map((transport) => {
                    const { description } = getActionRequired(transport);
                    return (
                    <div key={transport.id} className="border border-border rounded-xl bg-card shadow-sm hover:shadow-lg transition-all duration-300">
                      
                      {/* MOBILE VIEW */}
                      <div className="md:hidden">
                        <div className="p-4">
                          {/* Header con estado */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                transport.status === 'courier_assigned' ? 'bg-warning/20 text-warning border border-warning/30' :
                                transport.status === 'in_transit' ? 'bg-primary/20 text-primary border border-primary/30' :
                                transport.status === 'delivered' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                'bg-success/20 text-success border border-success/30'
                              }`}>
                                {description}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                transport.purpose === 'cliente' ? 'bg-blue-100 text-blue-800' : 
                                transport.purpose === 'return' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {transport.purpose === 'cliente' ? 'Cliente' : 
                                 transport.purpose === 'return' ? '🔄 Devolución' : 'Restock'}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID #{transport.id}
                            </div>
                          </div>
                          
                          {/* Imagen más grande para mobile */}
                          <div className="mb-4">
                            <div className="bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg flex items-center justify-center p-4">
                              {transport.product_image ? (
                                <img
                                  src={transport.product_image}
                                  alt={`${transport.brand} ${transport.model}`}
                                  className="w-32 h-48 object-cover rounded-lg border border-border"
                                />
                              ) : (
                                <div className="text-muted-foreground text-center">
                                  <div className="text-4xl mb-2">📦</div>
                                  <div className="text-sm">Imagen no disponible</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Información del producto */}
                          <div className="mb-4">
                            <h3 className="font-bold text-lg text-card-foreground mb-2 leading-tight">
                              {transport.brand} {transport.model}
                            </h3>
                            <div className="flex items-center space-x-3 mb-3">
                              <span className="text-sm font-medium text-primary">
                                Talla {transport.size}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Cantidad: {transport.quantity}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Ref: {transport.sneaker_reference_code}
                              </span>
                            </div>
                          </div>
                          
                          {/* Ruta */}
                          <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-muted-foreground">DESDE</div>
                                  <div className="text-sm font-medium text-card-foreground truncate">
                                    {transport.source_location.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {transport.source_location.address}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2 border-l-2 border-dashed border-border h-4"></div>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-success rounded-full"></div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-muted-foreground">HACIA</div>
                                  <div className="text-sm font-medium text-card-foreground truncate">
                                    {transport.destination_location.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {transport.destination_location.address}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {getActionButton(transport)}
                        </div>
                      </div>

                      {/* DESKTOP VIEW */}
                      <div className="hidden md:block p-6">
                        {/* Header con estado */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                              transport.status === 'courier_assigned' ? 'bg-warning/20 text-warning border border-warning/30' :
                              transport.status === 'in_transit' ? 'bg-primary/20 text-primary border border-primary/30' :
                              transport.status === 'delivered' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                              'bg-success/20 text-success border border-success/30'
                            }`}>
                              {description}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              transport.purpose === 'cliente' ? 'bg-blue-100 text-blue-800' : 
                              transport.purpose === 'return' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {transport.purpose === 'cliente' ? 'Cliente' : 
                               transport.purpose === 'return' ? '🔄 Devolución' : 'Restock'}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID #{transport.id} • {transport.courier_accepted_at ? new Date(transport.courier_accepted_at).toLocaleDateString() : 'Sin fecha'}
                          </div>
                        </div>
                        
                        {/* Contenido principal con imagen más grande */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* Imagen del producto - más grande */}
                          <div className="lg:col-span-1">
                            <div className="w-full h-80 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl flex items-center justify-center shadow-inner p-6">
                              {transport.product_image ? (
                                <img
                                  src={transport.product_image}
                                  alt={`${transport.brand} ${transport.model}`}
                                  className="w-full h-full object-cover rounded-lg border border-border"
                                />
                              ) : (
                                <div className="text-muted-foreground text-center">
                                  <div className="text-8xl mb-4">📦</div>
                                  <div className="text-lg">Imagen no disponible</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Información del producto y cliente - ajustado para 2 columnas */}
                          <div className="lg:col-span-2 space-y-6">
                            <div>
                              <h3 className="text-3xl font-bold text-card-foreground mb-3 leading-tight">
                                {transport.brand} {transport.model}
                              </h3>
                              
                              <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                                  <div className="text-xl font-bold text-primary">
                                    {transport.size}
                                  </div>
                                  <div className="text-sm text-primary font-medium">Talla</div>
                                </div>
                                <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
                                  <div className="text-xl font-bold text-success">{transport.quantity}</div>
                                  <div className="text-sm text-success font-medium">Cantidad</div>
                                </div>
                                <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
                                  <div className="text-xl font-bold text-accent">
                                    {transport.purpose === 'cliente' ? '👤' : transport.purpose === 'return' ? '🔄' : '📦'}
                                  </div>
                                  <div className="text-sm text-accent font-medium">
                                    {transport.purpose === 'cliente' ? 'Cliente' : 
                                     transport.purpose === 'return' ? 'Devolución' : 'Restock'}
                                  </div>
                                </div>
                                <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
                                  <div className="text-lg font-bold text-warning">{transport.sneaker_reference_code}</div>
                                  <div className="text-sm text-warning font-medium">Referencia</div>
                                </div>
                              </div>
                              
                              {/* Información de propósito */}
                              <div className="p-4 bg-muted/20 rounded-lg mb-6">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                    <Package className="h-6 w-6 text-primary-foreground" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-card-foreground text-lg">
                                      {transport.purpose === 'cliente' ? 'Entrega a Cliente' : 
                                       transport.purpose === 'return' ? '🔄 Devolución a Bodega' : 'Restock'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {transport.purpose === 'cliente' ? 'Producto para cliente final' : 
                                       transport.purpose === 'return' ? 'Producto devuelto - retornar a inventario' : 'Producto para restock'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Ruta visual */}
                              <div className="p-4 bg-muted/20 rounded-lg mb-6">
                                <h4 className="font-semibold text-card-foreground mb-4">Ruta de Entrega</h4>
                                
                                <div className="space-y-4">
                                  <div className="flex items-center space-x-4">
                                    <div className="w-4 h-4 bg-primary rounded-full flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-muted-foreground">DESDE</div>
                                      <div className="font-medium text-card-foreground">
                                        {transport.source_location.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {transport.source_location.address}
                                      </div>
                                      {transport.source_location.phone && (
                                        <div className="text-xs text-primary">
                                          📞 {transport.source_location.phone}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="ml-2 border-l-2 border-dashed border-border h-8"></div>
                                  
                                  <div className="flex items-center space-x-4">
                                    <div className="w-4 h-4 bg-success rounded-full flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-muted-foreground">HACIA</div>
                                      <div className="font-medium text-card-foreground">
                                        {transport.destination_location.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {transport.destination_location.address}
                                      </div>
                                      {transport.destination_location.phone && (
                                        <div className="text-xs text-success">
                                          📞 {transport.destination_location.phone}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Tiempo estimado */}
                              {transport.estimated_pickup_time && (
                                <div className="p-3 bg-warning/10 rounded-lg border border-warning/20 mb-4">
                                  <div className="flex items-center justify-center space-x-2">
                                    <Clock className="h-5 w-5 text-warning" />
                                    <span className="text-sm font-medium text-warning">
                                      ETA: {transport.estimated_pickup_time} minutos
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Notas del corredor */}
                              {transport.courier_notes && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                                  <div className="flex items-start space-x-2">
                                    <div className="text-blue-600">💬</div>
                                    <div>
                                      <div className="text-sm font-medium text-blue-800 mb-1">Notas del Corredor</div>
                                      <div className="text-sm text-blue-700">{transport.courier_notes}</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Notas de recolección */}
                              {transport.pickup_notes && (
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
                                  <div className="flex items-start space-x-2">
                                    <div className="text-green-600">📝</div>
                                    <div>
                                      <div className="text-sm font-medium text-green-800 mb-1">Notas de Recolección</div>
                                      <div className="text-sm text-green-700">{transport.pickup_notes}</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Nota especial para entregas pendientes de confirmación */}
                              {transport.status === 'delivered' && (
                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 mb-4">
                                  <div className="flex items-start space-x-2">
                                    <div className="text-orange-600">⏳</div>
                                    <div>
                                      <div className="text-sm font-medium text-orange-800 mb-1">Esperando Confirmación</div>
                                      <div className="text-sm text-orange-700">
                                        El producto fue entregado al vendedor. Estamos esperando que confirme la recepción para completar la transferencia.
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Timestamps */}
                              <div className="p-3 bg-muted/20 rounded-lg border border-border mb-4">
                                <div className="text-sm font-medium text-card-foreground mb-2">Historial de Estados</div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  {transport.courier_accepted_at && (
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                                      <span>✅ Aceptado: {new Date(transport.courier_accepted_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {transport.picked_up_at && (
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-warning rounded-full"></div>
                                      <span>📦 Recolectado: {new Date(transport.picked_up_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {transport.delivered_at && (
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                      <span>🎯 Entregado: {new Date(transport.delivered_at).toLocaleString()}</span>
                                      {transport.status === 'delivered' && (
                                        <span className="text-orange-600 text-xs">(Esperando confirmación)</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Botón de acción */}
                              {getActionButton(transport)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
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
                  <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base md:text-lg font-medium">No hay entregas completadas</h3>
                  <p className="text-muted-foreground text-sm">Tu historial de entregas aparecerá aquí.</p>
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
                            <p className="text-xs text-muted-foreground">
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
                            <p className="text-xs text-muted-foreground mt-1">
                              {delivery.total_time}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {delivery.distance && (
                            <div>
                              <p className="text-muted-foreground">Distancia</p>
                              <p className="font-medium">{delivery.distance}</p>
                            </div>
                          )}
                          {delivery.earnings && (
                            <div>
                              <p className="text-muted-foreground">Ganancia</p>
                              <p className="font-medium text-green-600">{formatPrice(delivery.earnings)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground">Estado</p>
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
                            <p className="text-xs text-muted-foreground">
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
                            <p className="text-xs text-muted-foreground mt-1">
                              ⏱️ {delivery.total_time}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {delivery.distance && (
                            <div>
                              <p className="text-muted-foreground">Distancia</p>
                              <p className="font-medium">{delivery.distance}</p>
                            </div>
                          )}
                          {delivery.earnings && (
                            <div>
                              <p className="text-muted-foreground">Ganancia</p>
                              <p className="font-medium text-green-600">{formatPrice(delivery.earnings)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground">Estado</p>
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
                <h3 className="text-base md:text-lg font-semibold">📊 Estadísticas del Corredor</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  {courierStats ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm md:text-base">Total transportes:</span>
                        <span className="font-bold text-primary">{courierStats.total_transports}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm md:text-base">En progreso:</span>
                        <span className="font-bold text-blue-600">{courierStats.in_progress}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm md:text-base">Completadas:</span>
                        <span className="font-bold text-green-600">{courierStats.completed}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm md:text-base">Tasa de finalización:</span>
                        <span className="font-bold text-orange-600">{courierStats.completion_rate}%</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-muted-foreground">Cargando estadísticas...</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-base md:text-lg font-semibold">📈 Resumen de Entregas</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Resumen por estado */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-card-foreground">Estado Actual</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="text-2xl font-bold text-primary">{activeTransports.length}</div>
                        <div className="text-xs text-primary font-medium">En Progreso</div>
                      </div>
                      <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                        <div className="text-2xl font-bold text-success">{completedTransports.length}</div>
                        <div className="text-xs text-success font-medium">Completadas</div>
                      </div>
                    </div>
                  </div>

                  {/* Resumen por propósito */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-card-foreground">Por Tipo</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-lg font-bold text-blue-600">
                          {assignedTransports.filter(t => t.purpose === 'cliente').length}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">Cliente</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-lg font-bold text-orange-600">
                          {assignedTransports.filter(t => t.purpose === 'return').length}
                        </div>
                        <div className="text-xs text-orange-600 font-medium">Devolución</div>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  {courierStats && (
                    <div className="p-3 bg-muted/20 rounded-lg border border-border">
                      <div className="text-sm font-medium text-card-foreground mb-2">Rendimiento</div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-success h-2 rounded-full transition-all duration-300"
                            style={{ width: `${courierStats.completion_rate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {courierStats.completion_rate}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};