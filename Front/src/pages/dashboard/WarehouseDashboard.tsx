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
  RefreshCw
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

// Tipos
interface PendingRequest {
  id: number;
  requester_name: string;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  purpose: 'cliente' | 'restock';
  priority: 'high' | 'normal';
  requested_at: string;
  time_waiting: string;
  can_fulfill: boolean;
  available_stock: number;
  notes?: string;
}

interface AcceptedRequest {
  id: number;
  status: string;
  product: string;
  requester_name: string;
  courier_name?: string;
  courier_eta?: string;
  preparation_time: number;
  ready_for_pickup: boolean;
  notes?: string;
}

export const WarehouseDashboard: React.FC = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'stats'>('pending');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<AcceptedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
          requester: request.requester_name,
          purpose: request.purpose
        });
      });
    }

    // Actualizar estados
    setPendingRequests(newPending);
    setAcceptedRequests(newAccepted);

    // Actualizar estadísticas
    setStats({
      totalRequests: newPending.length + newAccepted.length,
      urgentRequests: newPending.filter((r: PendingRequest) => r.priority === 'high').length,
      averageResponseTime: '12 min', // Mock - en real vendría del API
      completionRate: 94.5, // Mock
      totalStockValue: 1580.50 // Mock
    });
  }, [pendingRequests, notifyNewTransferAvailable]);

  // POLLING para bodeguero (15 segundos como recomienda la documentación)
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
      
      // Mock data para desarrollo
      setPendingRequests([
        {
          id: 15,
          requester_name: 'Juan Pérez',
          sneaker_reference_code: 'AD-UB22-BLK-001',
          brand: 'Adidas',
          model: 'Ultraboost 22',
          size: '9.5',
          quantity: 1,
          purpose: 'cliente',
          priority: 'high',
          requested_at: new Date().toISOString(),
          time_waiting: '5 minutos',
          can_fulfill: true,
          available_stock: 3,
          notes: 'Cliente presente esperando'
        },
        {
          id: 16,
          requester_name: 'María González',
          sneaker_reference_code: 'NK-AF1-WHT-002',
          brand: 'Nike',
          model: 'Air Force 1',
          size: '10',
          quantity: 2,
          purpose: 'restock',
          priority: 'normal',
          requested_at: new Date(Date.now() - 600000).toISOString(),
          time_waiting: '10 minutos',
          can_fulfill: true,
          available_stock: 8,
          notes: 'Restock semanal programado'
        }
      ]);
      
      setAcceptedRequests([
        {
          id: 17,
          status: 'courier_assigned',
          product: 'Puma RS-X - Talla 9',
          requester_name: 'Carlos López',
          courier_name: 'Ana Martínez',
          courier_eta: '15 minutos',
          preparation_time: 10,
          ready_for_pickup: true,
          notes: 'Producto empacado y listo'
        }
      ]);
      
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar acciones
  const handleAcceptRequest = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      const request = pendingRequests.find(r => r.id === requestId);
      
      await warehouseAPI.acceptRequest({
        transfer_request_id: requestId,
        accepted: true,
        estimated_preparation_time: request?.priority === 'high' ? 10 : 15,
        notes: `Producto disponible. ${request?.priority === 'high' ? 'Preparando para entrega inmediata.' : 'Preparando según cronograma.'}`
      });
      
      addNotification(
        'success',
        '✅ Solicitud Aceptada',
        `Transferencia #${requestId} aceptada y en preparación`,
        {
          label: 'Ver en Preparación',
          onClick: () => setActiveTab('accepted')
        }
      );
      
      await refetch(); // Recargar datos
      
    } catch (err) {
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
      request.requester_name.toLowerCase().includes(searchTerm.toLowerCase());
    
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

      <div className="space-y-6">
        {/* Header con estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Solicitudes</p>
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Urgentes</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgentRequests}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tiempo Promedio</p>
                  <p className="text-2xl font-bold">{stats.averageResponseTime}</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tasa Completación</p>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Card>
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <Button
                variant={activeTab === 'pending' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('pending')}
              >
                <Clock className="h-4 w-4 mr-2" />
                Solicitudes Pendientes ({filteredPendingRequests.length})
              </Button>
              <Button
                variant={activeTab === 'accepted' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('accepted')}
              >
                <Package className="h-4 w-4 mr-2" />
                En Preparación ({acceptedRequests.length})
              </Button>
              <Button
                variant={activeTab === 'stats' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('stats')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Estadísticas
              </Button>
              <div className="flex-grow"></div>
              <Button
                variant="ghost"
                onClick={refetch}
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores de estado */}
        {pollingError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">Error de conexión - Usando datos locales</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <p className="text-amber-800">⚠️ {error} - Usando datos de prueba</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenido según tab activo */}
        {activeTab === 'pending' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center">
                  <Package className="h-6 w-6 text-primary mr-2" />
                  Solicitudes Pendientes de Aprobación
                </h2>
                
                {/* Controles de filtros */}
                <div className="flex space-x-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Buscar por código, marca o vendedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">Todas las prioridades</option>
                    <option value="high">Solo urgentes</option>
                    <option value="normal">Solo normales</option>
                  </select>
                  
                  <select
                    value={purposeFilter}
                    onChange={(e) => setPurposeFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">Todos los propósitos</option>
                    <option value="cliente">Solo clientes</option>
                    <option value="restock">Solo restock</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
  {filteredPendingRequests.length === 0 ? (
    <div className="text-center py-12">
      <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
      <h3 className="text-lg font-medium">
        {searchTerm || priorityFilter !== 'all' || purposeFilter !== 'all' 
          ? 'No hay solicitudes que coincidan con los filtros'
          : 'No hay solicitudes pendientes'
        }
      </h3>
      <p className="text-gray-500">
        {searchTerm || priorityFilter !== 'all' || purposeFilter !== 'all'
          ? 'Prueba ajustando los filtros de búsqueda'
          : 'Las nuevas solicitudes aparecerán aquí automáticamente.'
        }
      </p>
    </div>
  ) : (
    <div className="space-y-6">
      {filteredPendingRequests.map((request) => (
        <div key={request.id} className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-start mb-4">
            
            {/* ✅ CORREGIDO: Imagen sin bucle infinito */}
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
                  💰 ${parseFloat(request.product_price).toFixed(2)}
                </p>
              )}
            </div>

            {/* Contenido principal */}
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
                Solicitado por: <strong>{request.requester_first_name} {request.requester_last_name}</strong>
              </p>
            </div>
            
            {/* Indicador de disponibilidad */}
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
      ))}
    </div>
  )}
</CardContent>
          </Card>
        )}

        {activeTab === 'accepted' && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <Package className="h-6 w-6 text-primary mr-2" />
                Transferencias en Preparación
              </h2>
            </CardHeader>
            <CardContent>
  {acceptedRequests.length === 0 ? (
    <div className="text-center py-12">
      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
      <h3 className="text-lg font-medium">No hay solicitudes en preparación</h3>
      <p className="text-gray-500">Las solicitudes aceptadas aparecerán aquí.</p>
    </div>
  ) : (
    <div className="space-y-4">
      {acceptedRequests.map((request) => (
        <div key={request.id} className="border rounded-lg p-6 bg-white">
          <div className="flex items-start mb-4">
            
            {/* ✅ CORREGIDO: Imagen sin bucle infinito */}
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
                  💰 ${parseFloat(request.product_price).toFixed(2)}
                </p>
              )}
            </div>

            {/* Contenido principal */}
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
                Solicitado por: <strong>{request.requester_first_name} {request.requester_last_name}</strong>
              </p>
              
              {/* ✅ CORREGIDO: Verificar courier con los campos reales */}
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
            
            {/* Estado visual */}
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

          {/* ✅ CORREGIDO: Condición realista para mostrar botón */}
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
          
          {/* ✅ Info adicional para debugging */}
          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            <div className="flex justify-between items-center">
              <span>ID: {request.id} | Código: {request.sneaker_reference_code}</span>
              <span>Status: {request.status} | Corredor: {request.courier_first_name ? `${request.courier_first_name} ${request.courier_last_name}` : 'Sin asignar'}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">📊 Estadísticas del Día</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Solicitudes procesadas:</span>
                    <span className="font-bold">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tiempo promedio de respuesta:</span>
                    <span className="font-bold text-green-600">8.5 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Solicitudes urgentes:</span>
                    <span className="font-bold text-red-600">6</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Productos entregados:</span>
                    <span className="font-bold">18</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
             <CardHeader>
               <h3 className="text-lg font-semibold">🎯 Rendimiento</h3>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 <div>
                   <div className="flex justify-between items-center mb-1">
                     <span>Tasa de completación</span>
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
                     <span>Productos sin stock</span>
                     <span className="font-bold text-red-600">2</span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2">
                     <div className="bg-red-600 h-2 rounded-full" style={{ width: '8%' }}></div>
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between items-center mb-1">
                     <span>Satisfacción promedio</span>
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