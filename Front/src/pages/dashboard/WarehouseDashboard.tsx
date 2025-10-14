// src/pages/dashboard/WarehouseDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Send, 
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
  Warehouse
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

// NUEVAS IMPORTACIONES
import { TransferNotifications } from '../../components/notifications/TransferNotifications';
import { useTransferNotifications } from '../../hooks/useTransferNotifications';
import { useTransferPolling } from '../../hooks/useTransferPolling';
import { warehouseAPI } from '../../services/transfersAPI';
import { inventoryAPI } from '../../services/inventoryAPI';
import { InventoryLocation } from '../../types';

// *** USANDO TRANSFERS API EN LUGAR DE CONFIGURACIÓN LOCAL ***

// *** TIPOS ACTUALIZADOS SEGÚN DOCUMENTACIÓN ***
interface PendingRequest {
  source_location_name: string;
  id: number;
  requester_name?: string;
  requester_first_name?: string;
  requester_last_name?: string;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  purpose: 'cliente' | 'restock' | 'return';
  priority: 'high' | 'normal';
  priority_level: 'URGENT' | 'NORMAL';
  requested_at: string;
  time_waiting?: string;
  can_fulfill?: boolean;
  available_stock?: number;
  notes?: string;
  product_image?: string;
  product_price?: string;
  product_color?: string;
  // Nuevos campos de la API
  requester_info?: {
    name: string;
    email: string;
  };
  location_info?: {
    from: {
      id: number;
      name: string;
      address: string;
    };
    to: {
      id: number;
      name: string;
      address: string;
    };
  };
  product_info?: {
    image: string;
    unit_price: number;
    box_price: number;
    stock_available: number;
    description: string;
  };
  stock_info?: {
    can_fulfill: boolean;
    available_stock: number;
  };
}

interface AcceptedRequest {
  id: number;
  status: 'accepted' | 'in_transit' | 'courier_assigned' | 'delivered';
  status_info?: {
    title: string;
    description: string;
    action_required: string;
    next_step: string;
    progress: number;
  };
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  product_image?: string;
  product_description?: string;
  transfer_type?: string;
  transfer_type_display?: string;
  purpose: 'cliente' | 'restock' | 'return';
  priority?: string;
  pickup_type?: string;
  pickup_info?: {
    type: string;
    type_display: string;
    who: string;
    description: string;
    icon: string;
    requires_courier: boolean;
    courier_assigned: boolean;
  };
  accepted_at: string;
  courier_accepted_at?: string | null;
  picked_up_at?: string | null;
  time_since_accepted?: string;
  notes?: string | null;
  warehouse_notes?: string | null;
  // Campos opcionales que pueden no estar en la respuesta
  requester_name?: string;
  courier_name?: string;
  courier_assigned?: boolean;
  courier_id?: number | null;
  requester_info?: {
    id: number;
    name: string;
    role: string;
  };
  courier_info?: {
    id: number | null;
    name: string | null;
    assigned: boolean;
  };
  location_info?: {
    from?: {
      id: number;
      name: string;
    };
    to?: {
      id: number;
      name: string;
    };
    source?: {
      id: number;
      name: string;
    };
    destination?: {
      id: number;
      name: string;
    };
  };
  product_info?: {
    image_url: string;
    unit_price: number;
    description: string;
  };
}

export const WarehouseDashboard: React.FC = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'inventory' | 'stats' | 'returns'>('pending');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<AcceptedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // *** NUEVOS ESTADOS PARA DEVOLUCIONES ***
  const [pendingReturns, setPendingReturns] = useState<any[]>([]);

  // Estados de UI responsivo
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estados de filtros
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

  // Estados del inventario
  const [inventory, setInventory] = useState<InventoryLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | 'all'>('all');
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');

  // HOOKS
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

  // POLLING para bodeguero - Cada 15 segundos según documentación
  const { error: pollingError } = useTransferPolling('bodeguero', {
    enabled: true,
    interval: 15000, // 15 segundos según documentación
    onUpdate: handlePollingUpdate,
    onError: (error) => {
      console.error('Error en polling de bodega:', error);
      setError('Error de conexión con el servidor');
    }
  });

  // *** CARGAR DATOS INICIAL USANDO ENDPOINTS CORRECTOS ***
  useEffect(() => {
    loadInitialData();
  }, []);

  // *** CARGAR INVENTARIO ***
  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventory();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Cargando datos iniciales de bodeguero...');
      
      // Cargar datos en paralelo usando transfersAPI
      const [pendingResponse, acceptedResponse] = await Promise.all([
        warehouseAPI.getPendingRequests(),  // WH001
        warehouseAPI.getAcceptedRequests()  // WH003
      ]);
      
      console.log('✅ Datos de solicitudes pendientes:', pendingResponse);
      console.log('✅ Datos de transferencias aceptadas:', acceptedResponse);
      
      setPendingRequests(pendingResponse.pending_requests || []);
      setAcceptedRequests(acceptedResponse.accepted_requests || []);
      
      // *** FILTRAR DEVOLUCIONES DE LAS ACCEPTED_REQUESTS ***
      const returns = (acceptedResponse.accepted_requests || []).filter(
        (req: AcceptedRequest) => req.purpose === 'return' && req.status === 'delivered'
      );
      setPendingReturns(returns);
      console.log('✅ Devoluciones pendientes filtradas:', returns.length);
      
      // Actualizar estadísticas
      setStats({
        totalRequests: (pendingResponse.pending_requests?.length || 0) + (acceptedResponse.accepted_requests?.length || 0),
        urgentRequests: pendingResponse.urgent_count || 0,
        averageResponseTime: '12 min',
        completionRate: 94.5,
        totalStockValue: pendingResponse.total_stock_value || 0
      });
      
    } catch (err) {
      console.error('❌ Error cargando datos de bodeguero:', err);
      setError('Error conectando con el servidor - Usando datos de prueba');
    } finally {
      setLoading(false);
    }
  };

  // *** FUNCIÓN CORREGIDA: Aceptar solicitud usando WH002 ***
  const handleAcceptRequest = async (requestId: number) => {
    console.log('🔄 WH002: Aceptando solicitud:', requestId);
    setActionLoading(requestId);
    
    try {
      const request = pendingRequests.find(r => r.id === requestId);
      
      if (!request) {
        throw new Error('Solicitud no encontrada');
      }

      console.log('📦 Datos de la solicitud:', request);
      
      // Llamada usando transfersAPI
      const response = await warehouseAPI.acceptRequest({
        transfer_request_id: requestId,
        accepted: true,
        estimated_preparation_time: request.priority === 'high' ? 10 : 15,
        notes: `Producto disponible. ${request.priority === 'high' ? 'Preparando para entrega inmediata.' : 'Preparando según cronograma.'}`
      });
      
      console.log('✅ WH002 Response:', response);
      
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
      await loadInitialData();
      
    } catch (err) {
      console.error('❌ Error en WH002:', err);
      addNotification(
        'error',
        '❌ Error al Aceptar',
        err instanceof Error ? err.message : 'Error desconocido'
      );
    } finally {
      setActionLoading(null);
    }
  };


   // *** FUNCIÓN CORREGIDA: Entregar a corredor usando WH004 ***
   const handleDeliverToCourier = async (requestId: number) => {
     console.log('🔄 WH004: Entregando a corredor:', requestId);
     setActionLoading(requestId);
     
     try {
       // Buscar la solicitud para obtener el courier_id
       const request = acceptedRequests.find(r => r.id === requestId);
       
       if (!request) {
         throw new Error('Solicitud no encontrada');
       }

       if (!request.courier_info?.id) {
         throw new Error('No hay corredor asignado para esta solicitud');
       }

       console.log('📦 Datos de la solicitud:', request);
       console.log('🚚 Courier ID:', request.courier_info.id);
       
      // Llamada usando transfersAPI con la estructura correcta
      const response = await warehouseAPI.deliverToCourier({
        transfer_request_id: requestId,
        courier_id: request.courier_info.id,
        delivery_notes: 'Producto entregado al corredor en perfecto estado. Caja original sellada.'
      });
       
      console.log('✅ WH004 Response:', response);
      console.log('📊 Status devuelto por el endpoint:', response.status);
      
      addNotification(
        'success',
        '🚚 Entregado al Corredor',
        `Transferencia #${requestId} entregada exitosamente al corredor ${request.courier_info.name || request.courier_info.id}`
      );
      
      console.log('🔄 Recargando datos después de entrega...');
      await loadInitialData();
      console.log('✅ Datos recargados');
       
     } catch (err) {
       console.error('❌ Error en WH004:', err);
       addNotification(
         'error',
         '❌ Error en Entrega',
         err instanceof Error ? err.message : 'Error desconocido'
       );
     } finally {
       setActionLoading(null);
     }
   };

  const handleDeliverToVendor = async (requestId: number) => {
    console.log('🔄 WH005: Entregando a vendedor:', requestId);
    setActionLoading(requestId);
    
    try {
      // Llamada usando transfersAPI
      const response = await warehouseAPI.deliverToVendor(requestId, {
        delivered: true,
        delivery_notes: 'Producto entregado al vendedor en perfecto estado. Caja original sellada.'
      });
      
      console.log('✅ WH005 Response:', response);
      
      addNotification(
        'success',
        '👤 Entregado al Vendedor',
        `Transferencia #${requestId} entregada exitosamente`
      );
      
      await loadInitialData();
      
    } catch (err) {
      console.error('❌ Error en WH005:', err);
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
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesPurpose = purposeFilter === 'all' || request.purpose === purposeFilter;
    
    return matchesPriority && matchesPurpose;
  });

  // *** FUNCIÓN PARA REFRESCAR DATOS MANUALMENTE ***
  const handleRefresh = async () => {
    console.log('🔄 Refrescando datos manualmente...');
    setLoading(true);
    try {
      await loadInitialData();
      addNotification('success', '✅ Datos Actualizados', 'Información refrescada correctamente');
    } catch (err) {
      addNotification('error', '❌ Error', 'No se pudieron actualizar los datos');
    } finally {
      setLoading(false);
    }
  };

  // *** FUNCIÓN PARA CARGAR INVENTARIO ***
  const loadInventory = async () => {
    try {
      setInventoryLoading(true);
      console.log('🔄 Cargando inventario...');
      
      const response = await inventoryAPI.getAllInventory();
      console.log('✅ Inventario cargado:', response);
      
      setInventory(response.locations || []);
      
      // Establecer la primera ubicación como seleccionada por defecto
      if (response.locations && response.locations.length > 0 && selectedLocation === 'all') {
        setSelectedLocation(response.locations[0].location_id);
      }
      
    } catch (err) {
      console.error('❌ Error cargando inventario:', err);
      addNotification('error', '❌ Error', 'No se pudo cargar el inventario');
      setInventory([]);
    } finally {
      setInventoryLoading(false);
    }
  };

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

  // Funciones de utilidad para inventario
  const getFilteredInventory = () => {
    let filteredLocations = inventory;

    // Filtrar por ubicación seleccionada
    if (selectedLocation !== 'all') {
      filteredLocations = inventory.filter(location => location.location_id === selectedLocation);
    }

    // Filtrar productos por término de búsqueda (incluye TODOS los campos disponibles)
    if (inventorySearchTerm) {
      const searchTerm = inventorySearchTerm.toLowerCase();
      filteredLocations = filteredLocations.map(location => ({
        ...location,
        products: location.products.filter(product =>
          product.description.toLowerCase().includes(searchTerm) ||
          product.brand.toLowerCase().includes(searchTerm) ||
          product.model.toLowerCase().includes(searchTerm) ||
          product.reference_code.toLowerCase().includes(searchTerm) ||
          (product.color_info && product.color_info.toLowerCase().includes(searchTerm)) ||
          product.location_name.toLowerCase().includes(searchTerm) ||
          product.product_id.toString().includes(searchTerm) ||
          product.unit_price.includes(searchTerm) ||
          product.box_price.includes(searchTerm) ||
          // Buscar en las tallas también
          product.sizes.some(size => size.size.includes(searchTerm))
        )
      }));
    }

    // Filtrar ubicaciones vacías después de aplicar búsqueda
    return filteredLocations.filter(location => location.products.length > 0);
  };

  const getTotalInventoryValue = (location: InventoryLocation) => {
    return location.products.reduce((total, product) => {
      const unitPrice = parseFloat(product.unit_price);
      return total + (unitPrice * product.total_quantity);
    }, 0);
  };

   const getTotalProducts = (location: InventoryLocation) => {
     return location.products.reduce((total, product) => total + product.total_quantity, 0);
   };

   // Helper function para extraer nombres de ubicación de forma segura
   const getLocationName = (locationObj: any): string => {
     if (typeof locationObj === 'string') {
       return locationObj;
     }
     if (locationObj && typeof locationObj === 'object') {
       if (locationObj.name) {
         return locationObj.name;
       }
       if (locationObj.id) {
         return `Ubicación ${locationObj.id}`;
       }
     }
    return 'N/A';
  };

  // *** NUEVA FUNCIÓN PARA DEVOLUCIONES ***
  const handleConfirmReturnReception = async (returnId: number) => {
    try {
      const response = await warehouseAPI.confirmReturnReception(returnId, {
        received_quantity: 1,
        product_condition: 'good',
        return_to_inventory: true,
        quality_check_passed: true,
        notes: 'Producto verificado - en perfecto estado'
      });
      
      alert(`${response.message}\n\nInventario restaurado: +${response.received_quantity} unidad(es)`);
      loadInitialData();
    } catch (err: any) {
      console.error('Error confirmando recepción:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Panel de Bodega">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando solicitudes de bodega...</p>
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
                  <p className="text-xs md:text-sm text-muted-foreground">Total Solicitudes</p>
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
                  <p className="text-xs md:text-sm text-muted-foreground">🔥 Urgentes</p>
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
                  <p className="text-xs md:text-sm text-muted-foreground">⏱️ Tiempo Prom.</p>
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
                  <p className="text-xs md:text-sm text-muted-foreground">✅ Completación</p>
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
                variant={activeTab === 'inventory' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('inventory')}
                size="sm"
                className="flex-1 md:flex-none text-xs md:text-sm"
              >
                <Warehouse className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Inventario</span>
                <span className="sm:hidden">Inv.</span>
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
              <Button
                variant={activeTab === 'returns' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('returns')}
                size="sm"
                className="flex-1 md:flex-none text-xs md:text-sm"
              >
                <Package className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Devoluciones</span>
                <span className="sm:hidden">Returns</span>
                ({pendingReturns.length})
              </Button>
              <div className="flex-grow hidden md:block"></div>
              <Button
                variant="ghost"
                onClick={handleRefresh}
                size="sm"
                className="text-xs md:text-sm"
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                      className="px-2 py-1 md:px-3 md:py-2 border border-border rounded-md text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
                    >
                      <option value="all">Todas las prioridades</option>
                      <option value="high">🔥 Urgentes</option>
                      <option value="normal">📦 Normales</option>
                    </select>
                    
                    <select
                      value={purposeFilter}
                      onChange={(e) => setPurposeFilter(e.target.value as any)}
                      className="px-2 py-1 md:px-3 md:py-2 border border-border rounded-md text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
                    >
                      <option value="all">Todos los propósitos</option>
                      <option value="cliente">🏃‍♂️ Cliente presente</option>
                      <option value="restock">📦 Restock</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPendingRequests.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Package className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base md:text-lg font-medium">
                    {priorityFilter !== 'all' || purposeFilter !== 'all' 
                      ? 'No hay solicitudes que coincidan con los filtros'
                      : 'No hay solicitudes pendientes'
                    }
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {priorityFilter !== 'all' || purposeFilter !== 'all'
                      ? 'Prueba ajustando los filtros de búsqueda'
                      : 'Las nuevas solicitudes de transferencia aparecerán aquí automáticamente.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {filteredPendingRequests.map((request) => (
                    <div key={request.id} className="border rounded-xl bg-white shadow-sm hover:shadow-lg transition-all duration-300">
                      
                      {/* MOBILE COMPACT VIEW */}
                      <div className="md:hidden">
                        <div className="p-4">
                          {/* Header con etiquetas de prioridad */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority_level)}`}>
                                {request.priority_level === 'URGENT' ? '🔥 URGENTE' : '📦 Normal'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(request.purpose)}`}>
                                {request.purpose === 'cliente' ? '🏃‍♂️ Cliente' : '📦 Restock'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              ID #{request.id}
                            </div>
                          </div>
                          
                          {/* Layout horizontal: Imagen vertical a la izquierda, info a la derecha */}
                          <div className="flex space-x-4 mb-4">
                            {/* Imagen vertical */}
                            <div className="flex-shrink-0">
                              <div className="w-32 h-48 rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={request.product_info?.image}
                                  alt={`${request.brand} ${request.model}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    if (!e.currentTarget.dataset.fallback) {
                                      e.currentTarget.dataset.fallback = 'true';
                                      e.currentTarget.src = `https://via.placeholder.com/200x260/f3f4f6/9ca3af?text=${encodeURIComponent(request.brand)}`;
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            
                            {/* Información del producto */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base text-gray-900 mb-2 leading-tight">
                                {request.brand} {request.model}
                              </h3>
                              <div className="space-y-2 mb-3">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-medium text-blue-600">
                                    Talla {request.size}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {request.quantity} unidad{request.quantity > 1 ? 'es' : ''}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-gray-700">
                                  <User className="h-3 w-3 text-gray-400" />
                                  <span className="font-medium truncate">
                                    Solicitante: {request.requester_info?.name || 'Usuario'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                                  <span className="font-medium">De: {request.location_info?.from?.name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                                  <span className="font-medium">A: {request.location_info?.to?.name || 'N/A'}</span>
                                </div>
                              </div>
                              
                              {/* Estado de disponibilidad compacto */}
                              <div className={`p-2 rounded text-center ${
                                ((request.product_info?.stock_available ?? 0) > 0) 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                <div className="text-xs font-medium">
                                  {((request.product_info?.stock_available ?? 0) > 0) ? '✅ Disponible' : '❌ Sin stock'}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Stock: {request.product_info?.stock_available ?? 0}
                                </div>
                                {request.product_info?.unit_price && (
                                  <div className="text-xs font-medium text-green-600 mt-1">
                                    {formatPrice(request.product_info.unit_price)}
                                  </div>
                                )}
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
                              <>Más detalles <ChevronDown className="h-4 w-4 ml-2" /></>
                            )}
                          </Button>
                          
                          {expandedCard === request.id && (
                            <div className="mb-4 pt-4 border-t space-y-3">
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
                          
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => handleAcceptRequest(request.id)}
                              disabled={!((request.product_info?.stock_available ?? 0) > 0) || actionLoading === request.id}
                              className="flex-1 bg-success hover:bg-success/90 disabled:opacity-50 text-sm"
                              size="sm"
                            >
                              {actionLoading === request.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              ✅ Aceptar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* DESKTOP FULL VIEW */}
                      <div className="hidden md:block p-6">
                        {/* Header con etiquetas */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(request.priority_level)}`}>
                              {request.priority_level === 'URGENT' ? '🔥 URGENTE' : '📦 Normal'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(request.purpose)}`}>
                              {request.purpose === 'cliente' ? '🏃‍♂️ Cliente Presente' : '📦 Restock'}
                            </span>
                            <span className="text-sm text-gray-500">
                              ⏱️ Esperando: {formatTimeWaiting(request.requested_at)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            ID #{request.id}
                          </div>
                        </div>
                        
                        {/* Layout horizontal: Imagen vertical a la izquierda, información a la derecha */}
                        <div className="flex space-x-6">
                          
                          {/* Imagen del producto vertical */}
                          <div className="flex-shrink-0">
                            <div className="w-48 h-64 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                              <img
                                src={request.product_info?.image || `https://via.placeholder.com/300x400/e5e7eb/6b7280?text=${encodeURIComponent(request.brand + ' ' + request.model)}`}
                                alt={`${request.brand} ${request.model}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  if (!e.currentTarget.dataset.fallback) {
                                    e.currentTarget.dataset.fallback = 'true';
                                    e.currentTarget.src = `https://via.placeholder.com/300x400/f3f4f6/9ca3af?text=${encodeURIComponent(request.brand)}`;
                                  }
                                }}
                              />
                            </div>
                            {request.product_info?.unit_price && (
                              <p className="text-center mt-3 font-medium text-green-600 text-lg">
                                💰 {formatPrice(request.product_info.unit_price)}
                              </p>
                            )}
                          </div>
                          
                          {/* Información del producto */}
                          <div className="flex-1 space-y-6">
                            <div>
                              <h3 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
                                {request.brand} {request.model}
                              </h3>
                              
                              {request.product_color && (
                                <p className="text-lg text-gray-600 mb-4">
                                  🎨 <strong>Color:</strong> {request.product_color}
                                </p>
                              )}
                              
                              <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                  <div className="text-xl font-bold text-blue-600">
                                    {request.size}
                                  </div>
                                  <div className="text-sm text-blue-600 font-medium">Talla</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                  <div className="text-xl font-bold text-green-600">{request.quantity}</div>
                                  <div className="text-sm text-green-600 font-medium">Cantidad</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                  <div className="text-xl font-bold text-purple-600">{request.available_stock ?? request.stock_info?.available_stock ?? 0}</div>
                                  <div className="text-sm text-purple-600 font-medium">Stock</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                  <div className="text-lg font-bold text-gray-600">📦</div>
                                  <div className="text-sm text-gray-600 font-medium">Producto</div>
                                </div>
                              </div>
                              
                              {/* Cliente */}
                              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-lg">
                                      Solicitante: {request.requester_first_name ? 
                                        `${request.requester_first_name} ${request.requester_last_name}` : 
                                        request.requester_name || 'Usuario'
                                      }
                                    </div>
                                    <div className="text-sm text-gray-500">Cliente</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Código de referencia */}
                              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                                <div className="text-sm text-gray-500 mb-1">Código de referencia</div>
                                <div className="font-mono font-medium text-gray-900">{request.sneaker_reference_code}</div>
                              </div>
                              
                              {/* Estado de disponibilidad */}
                              <div className={`p-4 rounded-lg border-2 mb-6 ${
                                ((request.product_info?.stock_available ?? 0) > 0) 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-red-50 border-red-200'
                              }`}>
                                <div className="flex justify-between items-center">
                                  <span className={`text-lg font-medium ${
                                    ((request.product_info?.stock_available ?? 0) > 0) 
                                      ? 'text-green-700' 
                                      : 'text-red-700'
                                  }`}>
                                    {((request.product_info?.stock_available ?? 0) > 0) ? '✅ Disponible' : '❌ No disponible'}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    Stock disponible: {request.product_info?.stock_available ?? 0} unidades
                                  </span>
                                </div>
                              </div>
                              
                              {request.notes && (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                                  <p className="text-sm">
                                    <strong>📝 Notas:</strong> {request.notes}
                                  </p>
                                </div>
                              )}

                              <div className="flex space-x-3">
                                <Button 
                                  onClick={() => handleAcceptRequest(request.id)}
                                  disabled={!((request.product_info?.stock_available ?? 0) > 0) || actionLoading === request.id}
                                  className="flex-1 bg-success hover:bg-success/90 disabled:opacity-50"
                                >
                                  {actionLoading === request.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                  )}
                                  ✅ Aceptar y Preparar
                                </Button>
                              </div>
                            </div>
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

        {activeTab === 'accepted' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg md:text-xl font-semibold flex items-center">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
                Transferencias en Preparación
              </h2>
            </CardHeader>
            <CardContent>
              {(() => {
                // Filtrar transferencias que están en preparación:
                // 1. Status "courier_assigned" (para entregar a corredor)
                // 2. Status "accepted" con pickup_type "vendedor" (para entregar a vendedor)
                const preparationRequests = acceptedRequests.filter(request => 
                  request.status === 'courier_assigned' ||'accepted'||
                  (request.status === 'accepted' && request.pickup_type === 'vendedor')
                );
                
                return preparationRequests.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-base md:text-lg font-medium">No hay transferencias en preparación</h3>
                    <p className="text-muted-foreground text-sm">Las solicitudes aceptadas aparecerán aquí para ser entregadas a corredores.</p>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    {preparationRequests.map((request) => (
                    <div key={request.id} className="border border-border rounded-lg bg-card">
                      {/* MOBILE VIEW */}
                      <div className="md:hidden p-4">
                        {/* Status tag at the top */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-base text-foreground">
                              {request.brand} {request.model}
                            </h4>
                            {request.purpose === 'return' && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                🔄 Devolución
                              </span>
                            )}
                          </div>
                           <span className={`px-2 py-1 rounded-full text-xs font-medium 
                             ${request.status === 'courier_assigned' ? 'bg-success/10 text-success' : 
                               request.status === 'in_transit' ? 'bg-blue-100 text-blue-800' : 'bg-warning/10 text-warning'}
                           `}>
                             {request.pickup_type === 'corredor' ? (
                               request.status === 'courier_assigned' ? '✅ Corredor asignado' : 
                               request.status === 'in_transit' ? '🚚 En tránsito' : '🔄 Esperando corredor'
                             ) : (
                               request.status === 'accepted' ? (
                                 request.purpose === 'return' ? '⏳ Esperando que vendedor entregue' : '⏳ Esperando vendedor'
                               ) : '✅ Listo para entrega'
                             )}
                           </span>
                        </div>

                        <div className="flex items-start space-x-3 mb-3">
                          <div className="flex-shrink-0">
                             <img
                               src={request.product_image || request.product_info?.image_url || `https://via.placeholder.com/200x300/e5e7eb/6b7280?text=${encodeURIComponent(request.brand + ' ' + request.model)}`}
                               alt={`${request.brand} ${request.model}`}
                               className="w-32 h-48 object-cover rounded-lg border border-border bg-muted"
                               onError={(e) => {
                                 if (!e.currentTarget.dataset.fallback) {
                                   e.currentTarget.dataset.fallback = 'true';
                                   e.currentTarget.src = `https://via.placeholder.com/200x300/f3f4f6/9ca3af?text=${encodeURIComponent(request.brand)}`;
                                 }
                               }}
                             />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground mb-1">
                              Talla {request.size} • {request.quantity} unidad{request.quantity > 1 ? 'es' : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Solicitado por: {request.requester_info?.name || request.requester_name || 'Usuario'}
                            </p>
                             <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-1">
                               <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
                               <span className="font-medium">De: {getLocationName(request.location_info?.from || request.location_info?.source)}</span>
                             </div>
                             <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-1">
                               <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
                               <span className="font-medium">A: {getLocationName(request.location_info?.to || request.location_info?.destination)}</span>
                             </div>
                          </div>
                        </div>
                        
                         {/* Información específica según pickup_type */}
                         {request.pickup_type === 'corredor' && request.status === 'courier_assigned' && request.courier_info?.assigned && request.courier_info?.id && (
                           <div className="mb-3 p-2 bg-primary/10 rounded-lg">
                             <p className="text-xs text-primary">
                               <Truck className="h-3 w-3 inline mr-1" />
                               Corredor: <strong>{request.courier_info.name || `ID: ${request.courier_info.id}`}</strong>
                             </p>
                           </div>
                         )}

                         {request.pickup_type === 'vendedor' && request.status === 'accepted' && (
                           <div className={`mb-3 p-2 rounded-lg border ${
                             request.purpose === 'return' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'
                           }`}>
                             <p className={`text-xs font-medium ${
                               request.purpose === 'return' ? 'text-orange-800' : 'text-yellow-800'
                             }`}>
                               <User className="h-3 w-3 inline mr-1" />
                               <strong>Esperando al vendedor:</strong> {request.requester_info?.name || request.requester_name || 'Usuario'}
                             </p>
                             <p className={`text-xs mt-1 ${
                               request.purpose === 'return' ? 'text-orange-700' : 'text-yellow-700'
                             }`}>
                               {request.purpose === 'return' 
                                 ? '🔄 El vendedor debe traer el producto para devolución'
                                 : 'El vendedor debe venir a recoger el producto personalmente'
                               }
                             </p>
                           </div>
                         )}
                         
                         {/* NUEVO: Devolución entregada por vendedor - esperando confirmación */}
                         {request.pickup_type === 'vendedor' && request.status === 'delivered' && request.purpose === 'return' && (
                           <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                             <p className="text-xs text-green-800 font-medium">
                               <CheckCircle className="h-3 w-3 inline mr-1" />
                               <strong>Devolución entregada por vendedor</strong>
                             </p>
                             <p className="text-xs text-green-700 mt-1">
                               🔍 Debes verificar el producto y confirmar la recepción para restaurar el inventario
                             </p>
                           </div>
                         )}
                         
                         {/* Botones de entrega según pickup_type */}
                         {request.pickup_type === 'corredor' && request.status === 'courier_assigned' && request.courier_info?.assigned && request.courier_info?.id && (
                          <Button
                            onClick={() => handleDeliverToCourier(request.id)}
                            disabled={actionLoading === request.id}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                            size="sm"
                          >
                            {actionLoading === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            🚚 Entregar a Corredor 
                          </Button>
                         )}

                         {/* Botón para transferencia normal con vendedor - status accepted */}
                         {request.pickup_type === 'vendedor' && request.status === 'accepted' && request.purpose !== 'return' && (
                           <Button
                             onClick={() => handleDeliverToVendor(request.id)}
                             disabled={actionLoading === request.id}
                             className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
                             size="sm"
                           >
                             {actionLoading === request.id ? (
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                             ) : (
                               <User className="h-4 w-4 mr-2" />
                             )}
                             👤 Entregar a Vendedor 
                           </Button>
                         )}

                         {/* *** NUEVO: Botón para confirmar recepción de devoluciones - Mobile *** */}
                         {request.pickup_type === 'vendedor' && request.purpose === 'return' && request.status === 'delivered' && (
                           <Button
                             onClick={() => handleConfirmReturnReception(request.id)}
                             disabled={actionLoading === request.id}
                             className="w-full bg-success hover:bg-success/90 text-success-foreground text-sm"
                             size="sm"
                           >
                             {actionLoading === request.id ? (
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                             ) : (
                               <CheckCircle className="h-4 w-4 mr-2" />
                             )}
                             ✅ Confirmar Recepción de Devolución
                           </Button>
                         )}
                         
                         {/* Botón para devoluciones por corredor */}
                         {request.purpose === 'return' && request.pickup_type === 'corredor' && request.status === 'delivered' && (
                           <Button
                             onClick={() => handleConfirmReturnReception(request.id)}
                             disabled={actionLoading === request.id}
                             className="w-full bg-success hover:bg-success/90 text-success-foreground text-sm mt-2"
                             size="sm"
                           >
                             {actionLoading === request.id ? (
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                             ) : (
                               <CheckCircle className="h-4 w-4 mr-2" />
                             )}
                             ✅ Confirmar Recepción
                           </Button>
                         )}

                      </div>

                      {/* DESKTOP VIEW */}
                      <div className="hidden md:block p-6">
                        {/* Status tag at the top for desktop */}
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-lg text-foreground">
                              {request.brand} {request.model} - Talla {request.size}
                            </h4>
                            {request.purpose === 'return' && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                🔄 Devolución
                              </span>
                            )}
                          </div>
                           <span className={`px-3 py-1 rounded-full text-sm font-medium 
                             ${request.status === 'courier_assigned' ? 'bg-success/10 text-success' : 
                               request.status === 'in_transit' ? 'bg-blue-100 text-blue-800' : 'bg-warning/10 text-warning'}
                           `}>
                             {request.pickup_type === 'corredor' ? (
                               request.status === 'courier_assigned' ? '✅ Corredor asignado' : 
                               request.status === 'in_transit' ? '🚚 En tránsito' : '🔄 Esperando corredor'
                             ) : (
                               request.status === 'accepted' ? (
                                 request.purpose === 'return' ? '⏳ Esperando que vendedor entregue' : '⏳ Esperando vendedor'
                               ) : '✅ Listo para entrega'
                             )}
                           </span>
                        </div>

                        <div className="flex items-start mb-4">
                          <div className="flex-shrink-0 mr-4">
                             <img
                               src={request.product_image || request.product_info?.image_url || `https://via.placeholder.com/200x300/e5e7eb/6b7280?text=${encodeURIComponent(request.brand + ' ' + request.model)}`}
                               alt={`${request.brand} ${request.model}`}
                               className="w-32 h-48 object-cover rounded-lg border border-border bg-muted shadow-sm"
                               onError={(e) => {
                                 if (!e.currentTarget.dataset.fallback) {
                                   e.currentTarget.dataset.fallback = 'true';
                                   e.currentTarget.src = `https://via.placeholder.com/200x300/f3f4f6/9ca3af?text=${encodeURIComponent(request.brand)}`;
                                 }
                               }}
                             />
                            {request.product_info?.unit_price && (
                              <p className="text-xs text-muted-foreground mt-1 text-center font-medium">
                                💰 {formatPrice(request.product_info.unit_price)}
                              </p>
                            )}
                          </div>

                          <div className="flex-1">
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              <User className="h-4 w-4 inline mr-1" />
                              Solicitado por: <strong>{request.requester_info?.name || request.requester_name || 'Usuario'}</strong>
                            </p>
                            
                             <div className="mb-2">
                               <p className="text-sm text-muted-foreground">
                                 <MapPin className="h-4 w-4 inline mr-1" />
                                 <strong>De:</strong> {getLocationName(request.location_info?.from || request.location_info?.source)}
                               </p>
                               <p className="text-sm text-muted-foreground">
                                 <MapPin className="h-4 w-4 inline mr-1" />
                                 <strong>A:</strong> {getLocationName(request.location_info?.to || request.location_info?.destination)}
                               </p>
                             </div>
                            
                             {request.status === 'courier_assigned' && request.courier_info?.assigned && request.courier_info?.id && (
                               <div className="mb-2">
                                 <p className="text-sm text-primary">
                                   <Truck className="h-4 w-4 inline mr-1" />
                                   Corredor: <strong>{request.courier_info.name || `ID: ${request.courier_info.id}`}</strong>
                                 </p>
                               </div>
                             )}
                            
                            <div className="space-y-2 text-sm text-muted-foreground">
                              {request.status_info && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-blue-800">{request.status_info.title}</span>
                                    <span className="text-xs text-blue-600">{request.status_info.progress}%</span>
                                  </div>
                                  <p className="text-xs text-blue-700 mb-1">{request.status_info.description}</p>
                                  <p className="text-xs text-blue-600">
                                    <strong>Siguiente paso:</strong> {request.status_info.next_step}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4">
                                <span>
                                  <Clock className="h-4 w-4 inline mr-1" />
                                  Estado: {request.status}
                                </span>
                                <span>
                                  📍 Propósito: {request.purpose === 'cliente' ? '🏃‍♂️ Cliente' : '📦 Restock'}
                                </span>
                                <span>
                                  📦 Cantidad: {request.quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {request.product_info?.description && (
                          <div className="mb-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              <strong>📝 Descripción:</strong> {request.product_info.description}
                            </p>
                          </div>
                        )}

                         {/* Información específica según pickup_type - Desktop */}
                         {request.pickup_type === 'corredor' && request.status === 'courier_assigned' && request.courier_info?.assigned && request.courier_info?.id && (
                           <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                             <p className="text-sm text-primary">
                               <Truck className="h-4 w-4 inline mr-1" />
                               <strong>Corredor asignado:</strong> {request.courier_info.name || `ID: ${request.courier_info.id}`}
                             </p>
                           </div>
                         )}

                         {request.pickup_type === 'vendedor' && request.status === 'accepted' && (
                           <div className={`mb-4 p-3 rounded-lg border ${
                             request.purpose === 'return' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'
                           }`}>
                             <p className={`text-sm font-medium ${
                               request.purpose === 'return' ? 'text-orange-800' : 'text-yellow-800'
                             }`}>
                               <User className="h-4 w-4 inline mr-1" />
                               <strong>Esperando al vendedor:</strong> {request.requester_info?.name || request.requester_name || 'Usuario'}
                             </p>
                             <p className={`text-sm mt-1 ${
                               request.purpose === 'return' ? 'text-orange-700' : 'text-yellow-700'
                             }`}>
                               {request.purpose === 'return' 
                                 ? '🔄 El vendedor debe traer el producto para devolución'
                                 : 'El vendedor debe venir a recoger el producto personalmente'
                               }
                             </p>
                           </div>
                         )}
                         
                         {/* NUEVO: Devolución entregada por vendedor - esperando confirmación - Desktop */}
                         {request.pickup_type === 'vendedor' && request.status === 'delivered' && request.purpose === 'return' && (
                           <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                             <p className="text-sm text-green-800 font-medium">
                               <CheckCircle className="h-4 w-4 inline mr-1" />
                               <strong>Devolución entregada por vendedor</strong>
                             </p>
                             <p className="text-sm text-green-700 mt-1">
                               🔍 Debes verificar el producto y confirmar la recepción para restaurar el inventario
                             </p>
                           </div>
                         )}

                         {/* Botones de entrega según pickup_type - Desktop */}
                         {request.pickup_type === 'corredor' && request.status === 'courier_assigned' && request.courier_info?.assigned && request.courier_info?.id && (
                           <div className="mt-4">
                             <Button
                               onClick={() => handleDeliverToCourier(request.id)}
                               disabled={actionLoading === request.id}
                               className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                             >
                               {actionLoading === request.id ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                               ) : (
                                 <Send className="h-4 w-4 mr-2" />
                               )}
                               🚚 Entregar a Corredor (WH004)
                             </Button>
                           </div>
                         )}

                         {/* Botón para transferencia normal con vendedor - status accepted - Desktop */}
                         {request.pickup_type === 'vendedor' && request.status === 'accepted' && request.purpose !== 'return' && (
                           <div className='mt-4'>
                             <Button
                               onClick={() => handleDeliverToVendor(request.id)}
                               disabled={actionLoading === request.id}
                               className="w-full bg-green-600 hover:bg-green-700 text-white"
                             >
                               {actionLoading === request.id ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                               ) : (
                                 <User className="h-4 w-4 mr-2" />
                               )}
                               👤 Entregar a Vendedor (WH005)
                             </Button>
                           </div>
                         )}

                         {/* *** NUEVO: Botón para confirmar recepción de devoluciones - Desktop *** */}
                         {request.pickup_type === 'vendedor' && request.purpose === 'return' && request.status === 'delivered' && (
                           <div className='mt-4'>
                             <Button
                               onClick={() => handleConfirmReturnReception(request.id)}
                               disabled={actionLoading === request.id}
                               className="w-full bg-success hover:bg-success/90 text-success-foreground"
                             >
                               {actionLoading === request.id ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                               ) : (
                                 <CheckCircle className="h-4 w-4 mr-2" />
                               )}
                               ✅ Confirmar Recepción de Devolución
                             </Button>
                           </div>
                         )}
                         
                         {/* Botón para devoluciones por corredor */}
                         {request.purpose === 'return' && request.pickup_type === 'corredor' && request.status === 'delivered' && (
                           <div className='mt-4'>
                             <Button
                               onClick={() => handleConfirmReturnReception(request.id)}
                               disabled={actionLoading === request.id}
                               className="w-full bg-success hover:bg-success/90 text-success-foreground"
                             >
                               {actionLoading === request.id ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                               ) : (
                                 <CheckCircle className="h-4 w-4 mr-2" />
                               )}
                               ✅ Confirmar Recepción de Devolución
                             </Button>
                           </div>
                         )}
                        
                          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                          <div className="flex justify-between items-center">
                            <span>ID: {request.id} | Código: {request.sneaker_reference_code}</span>
                            <span>Status: {request.status} | Corredor: {request.courier_info?.name || request.courier_name || 'Sin asignar'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {activeTab === 'inventory' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                <h2 className="text-lg md:text-xl font-semibold flex items-center">
                  <Warehouse className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
                  Inventario de Bodega
                </h2>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="flex space-x-2">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
                    >
                      <option value="all">Todas las ubicaciones</option>
                      {inventory.map((location) => (
                        <option key={location.location_id} value={location.location_id}>
                          {location.location_name}
                        </option>
                      ))}
                    </select>
                    
                    <Button
                      variant="outline"
                      onClick={loadInventory}
                      disabled={inventoryLoading}
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${inventoryLoading ? 'animate-spin' : ''}`} />
                      Actualizar
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Cargando inventario...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Barra de búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por marca, modelo, descripción, código, color, precio, talla, ID..."
                      value={inventorySearchTerm}
                      onChange={(e) => setInventorySearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Resumen por ubicación */}
                  {selectedLocation === 'all' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {inventory.map((location) => {
                        const totalUnits = getTotalProducts(location);
                        const totalValue = getTotalInventoryValue(location);
                        const activeProducts = location.products.filter(p => p.is_active === 1).length;
                        const totalSizes = location.products.reduce((sum, product) => sum + product.sizes.length, 0);
                        
                        return (
                          <Card key={location.location_id} className="border-primary/20">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-lg">{location.location_name}</h3>
                                <span className="text-xs text-muted-foreground">ID: {location.location_id}</span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Productos únicos:</span>
                                  <span className="font-medium">{location.products.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Productos activos:</span>
                                  <span className="font-medium text-green-600">{activeProducts}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Total unidades:</span>
                                  <span className="font-medium">{totalUnits}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Total tallas:</span>
                                  <span className="font-medium">{totalSizes}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Valor total:</span>
                                  <span className="font-medium text-green-600">
                                    {formatPrice(totalValue)}
                                  </span>
                                </div>
                                <div className="pt-2 border-t">
                                  <div className="flex justify-between">
                                    <span className="text-xs text-muted-foreground">Promedio por producto:</span>
                                    <span className="text-xs font-medium">
                                      {formatPrice(location.products.length > 0 ? totalValue / location.products.length : 0)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Lista de productos filtrados */}
                  {getFilteredInventory().length === 0 ? (
                    <div className="text-center py-8">
                      <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-lg font-medium">
                        {inventorySearchTerm ? 'No se encontraron productos' : 'No hay inventario disponible'}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {inventorySearchTerm ? 'Prueba con otros términos de búsqueda' : 'El inventario se cargará automáticamente'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {getFilteredInventory().map((location) => (
                        <div key={location.location_id} className="space-y-4">
                          {selectedLocation === 'all' && (
                            <div className="flex items-center space-x-3">
                              <MapPin className="h-5 w-5 text-primary" />
                              <h3 className="text-xl font-semibold">{location.location_name}</h3>
                              <span className="text-sm text-muted-foreground">
                                ({location.products.length} productos)
                              </span>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {location.products.map((product) => (
                              <Card key={product.product_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    {/* Header con imagen pequeña y info básica */}
                                    <div className="flex space-x-3">
                                      <div className="flex-shrink-0">
                                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                          <img
                                            src={product.image_url || `https://via.placeholder.com/80x80/e5e7eb/6b7280?text=${encodeURIComponent(product.brand)}`}
                                            alt={product.description}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              if (!e.currentTarget.dataset.fallback) {
                                                e.currentTarget.dataset.fallback = 'true';
                                                e.currentTarget.src = `https://via.placeholder.com/80x80/f3f4f6/9ca3af?text=${encodeURIComponent(product.brand)}`;
                                              }
                                            }}
                                          />
                                        </div>
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                          <h4 className="font-semibold text-sm leading-tight">
                                            {product.brand} {product.model}
                                          </h4>
                                          <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                                            {product.total_quantity}
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                          {product.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                          {product.reference_code}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Información detallada */}
                                    <div className="space-y-2">
                                      {/* Color */}
                                      {product.color_info && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-muted-foreground">Color:</span>
                                          <span className="text-xs font-medium">{product.color_info}</span>
                                        </div>
                                      )}
                                      
                                      {/* Precios */}
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <span className="text-xs text-muted-foreground">Precio unitario:</span>
                                          <div className="text-sm font-bold text-green-600">
                                            {formatPrice(product.unit_price)}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-xs text-muted-foreground">Caja:</span>
                                          <div className="text-xs text-muted-foreground">
                                            {formatPrice(product.box_price)}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Estado del producto */}
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Estado:</span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                          product.is_active === 1 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {product.is_active === 1 ? 'Activo' : 'Inactivo'}
                                        </span>
                                      </div>
                                      
                                      {/* Fechas */}
                                      <div className="space-y-1 pt-2 border-t">
                                        <div className="flex justify-between">
                                          <span className="text-xs text-muted-foreground">Creado:</span>
                                          <span className="text-xs">
                                            {new Date(product.created_at).toLocaleDateString('es-CO')}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-xs text-muted-foreground">Actualizado:</span>
                                          <span className="text-xs">
                                            {new Date(product.updated_at).toLocaleDateString('es-CO')}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Tallas disponibles */}
                                      <div className="pt-2 border-t">
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="text-xs font-medium">Tallas:</span>
                                          <span className="text-xs text-muted-foreground">
                                            {product.sizes.length} disponibles
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1">
                                          {product.sizes.map((size) => (
                                            <div
                                              key={size.size}
                                              className={`p-1 rounded text-center text-xs ${
                                                size.quantity > 0 
                                                  ? 'bg-green-50 text-green-800 border border-green-200' 
                                                  : 'bg-gray-50 text-gray-600 border border-gray-200'
                                              }`}
                                            >
                                              <div className="font-medium">{size.size}</div>
                                              <div className="text-xs">
                                                {size.quantity}
                                                {size.quantity_exhibition > 0 && (
                                                  <span className="text-orange-600">
                                                    +{size.quantity_exhibition}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        {product.sizes.some(s => s.quantity_exhibition > 0) && (
                                          <div className="text-xs text-orange-600 mt-1 text-center">
                                            *Naranja = unidades en exhibición
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Información adicional */}
                                      <div className="pt-2 border-t">
                                        <div className="text-xs text-muted-foreground">
                                          <div className="flex justify-between">
                                            <span>ID Producto:</span>
                                            <span className="font-mono">{product.product_id}</span>
                                          </div>
                                          {product.video_url && (
                                            <div className="mt-1">
                                              <span className="text-blue-600">📹 Tiene video</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                    <span className="text-sm md:text-base">Solicitudes urgentes atendidas:</span>
                    <span className="font-bold text-red-600">6</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Productos entregados a corredores:</span>
                    <span className="font-bold">18</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base">Valor total de stock gestionado:</span>
                    <span className="font-bold text-blue-600">{formatPrice(stats.totalStockValue)}</span>
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
                      <span className="text-sm md:text-base">Solicitudes rechazadas</span>
                      <span className="font-bold text-red-600">2</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '8%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm md:text-base">Eficiencia en entregas</span>
                      <span className="font-bold text-green-600">96.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '96.5%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm md:text-base">Tiempo promedio de preparación</span>
                      <span className="font-bold text-blue-600">12 min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card adicional con información de endpoints */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <h3 className="text-base md:text-lg font-semibold">🔧 Estado del Sistema</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">✅ Endpoints Implementados:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>WH001:</strong> GET /warehouse/pending-requests</li>
                      <li>• <strong>WH002:</strong> POST /warehouse/accept-request</li>
                      <li>• <strong>WH003:</strong> GET /warehouse/accepted-requests</li>
                      <li>• <strong>WH004:</strong> POST /warehouse/deliver-to-courier</li>
                      <li>• <strong>WH005:</strong> POST /warehouse/deliver-to-vendor</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-600">📊 Funcionalidades Activas:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Polling automático cada 15 segundos</li>
                      <li>• Notificaciones en tiempo real</li>
                      <li>• Filtros y búsqueda avanzada</li>
                      <li>• Interface responsive mobile/desktop</li>
                      <li>• Manejo de errores y fallback a mock data</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ Información:</strong> El sistema está configurado para trabajar con el backend en producción. 
                    Si el servidor no está disponible, se utilizan datos de prueba para desarrollo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'returns' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg md:text-xl font-semibold flex items-center">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
                Devoluciones Pendientes
              </h2>
            </CardHeader>
            <CardContent>
              {pendingReturns.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Package className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base md:text-lg font-medium">No hay devoluciones pendientes</h3>
                  <p className="text-muted-foreground text-sm">Las devoluciones aparecerán aquí cuando sean solicitadas.</p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {pendingReturns.map((returnItem) => (
                    <div key={returnItem.id} className="border border-border rounded-xl bg-card shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="p-4 md:p-6">
                        {/* Header con estado */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                              🔄 Devolución #{returnItem.id}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              returnItem.pickup_type === 'corredor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {returnItem.pickup_type === 'corredor' ? '🚚 Con Corredor' : '👤 Con Vendedor'}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ {returnItem.status_info?.title || 'Entregado'}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(returnItem.requested_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Información del producto */}
                        <div className="flex items-center space-x-4 mb-4">
                          {returnItem.product_image && (
                            <img 
                              src={returnItem.product_image} 
                              alt={`${returnItem.brand} ${returnItem.model}`}
                              className="w-16 h-16 object-cover rounded-lg border border-border"
                            />
                          )}
                          <div>
                            <h3 className="font-bold text-lg text-card-foreground">
                              {returnItem.brand} {returnItem.model}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Talla {returnItem.size} • Cantidad: {returnItem.quantity} • Ref: {returnItem.sneaker_reference_code}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Tipo:</strong> {returnItem.transfer_type_display || 'Devolución'}
                            </p>
                            {returnItem.requester_info && (
                              <p className="text-sm text-muted-foreground">
                                <strong>Solicitado por:</strong> {returnItem.requester_info.name}
                              </p>
                            )}
                            {returnItem.courier_info && (
                              <p className="text-sm text-muted-foreground">
                                <strong>Corredor:</strong> {returnItem.courier_info.name || 'No asignado'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Información de ubicaciones */}
                        {returnItem.location_info && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                              <div className="text-sm font-medium text-primary mb-1">📍 Desde (Vendedor)</div>
                              <div className="text-sm font-medium text-card-foreground">
                                {returnItem.location_info.source?.name || returnItem.location_info.from?.name || 'N/A'}
                              </div>
                            </div>
                            <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                              <div className="text-sm font-medium text-success mb-1">🏪 Hacia (Bodega)</div>
                              <div className="text-sm font-medium text-card-foreground">
                                {returnItem.location_info.destination?.name || returnItem.location_info.to?.name || 'N/A'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timeline de la devolución */}
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Timeline</h4>
                          <div className="space-y-1 text-xs text-blue-700">
                            {returnItem.requested_at && (
                              <div>✅ Solicitado: {new Date(returnItem.requested_at).toLocaleString()}</div>
                            )}
                            {returnItem.accepted_at && (
                              <div>✅ Aceptado: {new Date(returnItem.accepted_at).toLocaleString()}</div>
                            )}
                            {returnItem.courier_accepted_at && (
                              <div>🚚 Corredor asignado: {new Date(returnItem.courier_accepted_at).toLocaleString()}</div>
                            )}
                            {returnItem.picked_up_at && (
                              <div>📦 Recogido: {new Date(returnItem.picked_up_at).toLocaleString()}</div>
                            )}
                            <div className="pt-1 border-t border-blue-300">
                              <strong>⏱️ Tiempo desde aceptación:</strong> {returnItem.time_since_accepted || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex space-x-3">
                          {/* Solo mostrar botón de confirmar recepción cuando está delivered */}
                          {returnItem.status === 'delivered' && (
                            <Button
                              onClick={() => handleConfirmReturnReception(returnItem.id)}
                              disabled={actionLoading === returnItem.id}
                              className="w-full bg-success hover:bg-success/90 text-success-foreground text-sm"
                              size="sm"
                            >
                              {actionLoading === returnItem.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              ✅ Confirmar Recepción 
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};