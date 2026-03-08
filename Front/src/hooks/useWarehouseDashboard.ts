import { useState, useEffect, useCallback } from 'react';
import { useTransferNotifications } from './useTransferNotifications';
import { useTransferPolling } from './useTransferPolling';
import { vendorAPI } from '../services/api';
import { warehouseAPI } from '../services/transfersAPI';
import { inventoryAPI } from '../services/inventoryAPI';
import type { InventoryLocation } from '../types';
import type {
  WarehouseTab,
  PendingRequest,
  AcceptedRequest,
  TransferHistoryItem,
  WarehouseStats,
} from '../types/warehouse';

export const useWarehouseDashboard = (initialTab: WarehouseTab = 'pending') => {
  // Estados principales
  const [activeTab, setActiveTab] = useState<WarehouseTab>(initialTab);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<AcceptedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Devoluciones
  const [pendingReturns, setPendingReturns] = useState<any[]>([]);

  // UI responsivo
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'normal'>('all');
  const [purposeFilter, setPurposeFilter] = useState<'all' | 'cliente' | 'restock' | 'return'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    setSearchTerm('');
  }, [activeTab]);

  // Estadisticas
  const [stats, setStats] = useState<WarehouseStats>({
    totalRequests: 0,
    urgentRequests: 0,
    averageResponseTime: '0 min',
    completionRate: 0,
    totalStockValue: 0,
  });

  // Inventario
  const [inventory, setInventory] = useState<InventoryLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | 'all'>('all');
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Hooks
  const { notifyNewTransferAvailable, addNotification } = useTransferNotifications();

  // Historial
  const [transferHistory, setTransferHistory] = useState<TransferHistoryItem[]>([]);
  const [transferHistoryLoading, setTransferHistoryLoading] = useState(false);

  const loadTransferHistory = async () => {
    try {
      setTransferHistoryLoading(true);
      const resp = await vendorAPI.getWarehouseDailyTransferHistory();
      if (resp && resp.transfers) {
        setTransferHistory(resp.transfers);
      } else if (resp && resp.success && resp.transfers === undefined && Array.isArray(resp)) {
        setTransferHistory(resp as any);
      } else {
        setTransferHistory([]);
      }
    } catch (err) {
      console.error('Error cargando historial de transferencias:', err);
      setTransferHistory([]);
    } finally {
      setTransferHistoryLoading(false);
    }
  };

  // Polling callback
  const handlePollingUpdate = useCallback(
    (data: any) => {
      const newPending = data.pending || [];
      const newAccepted = data.accepted || [];

      setPendingRequests((prevPending) => {
        const newRequests = newPending.filter(
          (req: PendingRequest) => !prevPending.find((existing) => existing.id === req.id)
        );

        if (newRequests.length > 0) {
          newRequests.forEach((request: PendingRequest) => {
            notifyNewTransferAvailable({
              product: `${request.brand} ${request.model}`,
              requester: request.requester_first_name
                ? `${request.requester_first_name} ${request.requester_last_name}`
                : request.requester_name || 'Usuario',
              purpose: request.purpose,
            });
          });
        }
        return newPending;
      });

      setAcceptedRequests(newAccepted);

      setStats({
        totalRequests: newPending.length + newAccepted.length,
        urgentRequests: newPending.filter((r: PendingRequest) => r.priority === 'high' || r.priority_level === 'URGENT')
          .length,
        averageResponseTime: '12 min',
        completionRate: 94.5,
        totalStockValue: 1580.5,
      });
    },
    [notifyNewTransferAvailable]
  );

  // Polling
  const { error: pollingError } = useTransferPolling('bodeguero', {
    enabled: true,
    interval: 15000,
    onUpdate: handlePollingUpdate,
    onError: (error) => {
      console.error('Error en polling de bodega:', error);
      setError('Error de conexion con el servidor');
    },
  });

  // Cargar historial cuando se abre la tab
  useEffect(() => {
    if (activeTab === 'history') {
      loadTransferHistory();
    }
  }, [activeTab]);

  // Carga inicial
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar inventario
  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Cargando datos iniciales de bodeguero...');

      const [pendingResponse, acceptedResponse] = await Promise.all([
        warehouseAPI.getPendingRequests(),
        warehouseAPI.getAcceptedRequests(),
      ]);

      console.log('Datos de solicitudes pendientes:', pendingResponse);
      console.log('Datos de transferencias aceptadas:', acceptedResponse);

      setPendingRequests(pendingResponse.pending_requests || []);
      setAcceptedRequests(acceptedResponse.accepted_requests || []);

      const returns = (acceptedResponse.accepted_requests || []).filter(
        (req: AcceptedRequest) =>
          req.request_type === 'return' && (req.status === 'delivered' || req.status === 'accepted')
      );
      setPendingReturns(returns);
      console.log('Devoluciones pendientes filtradas:', returns.length);

      setStats({
        totalRequests:
          (pendingResponse.pending_requests?.length || 0) + (acceptedResponse.accepted_requests?.length || 0),
        urgentRequests: pendingResponse.urgent_count || 0,
        averageResponseTime: '12 min',
        completionRate: 94.5,
        totalStockValue: pendingResponse.total_stock_value || 0,
      });
    } catch (err) {
      console.error('Error cargando datos de bodeguero:', err);
      setError('Error conectando con el servidor - Usando datos de prueba');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    console.log('WH002: Aceptando solicitud:', requestId);
    setActionLoading(requestId);

    try {
      const request = pendingRequests.find((r) => r.id === requestId);
      if (!request) throw new Error('Solicitud no encontrada');

      const response = await warehouseAPI.acceptRequest({
        transfer_request_id: requestId,
        accepted: true,
        estimated_preparation_time: request.priority === 'high' ? 10 : 15,
        notes: `Producto disponible. ${request.priority === 'high' ? 'Preparando para entrega inmediata.' : 'Preparando segun cronograma.'}`,
      });

      console.log('WH002 Response:', response);

      addNotification('success', 'Solicitud Aceptada', `Transferencia #${requestId} aceptada y lista para entrega`, {
        label: 'Ver Entregas',
        onClick: () => setActiveTab('accepted'),
      });

      await loadInitialData();
    } catch (err) {
      console.error('Error en WH002:', err);
      addNotification('error', 'Error al Aceptar', err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliverToCourier = async (requestId: number) => {
    console.log('WH004: Entregando a corredor:', requestId);
    setActionLoading(requestId);

    try {
      const request = acceptedRequests.find((r) => r.id === requestId);
      if (!request) throw new Error('Solicitud no encontrada');

      const courierId = request.pickup_info?.courier_id || request.courier_info?.id;
      if (!courierId) throw new Error('No hay corredor asignado para esta solicitud');

      const response = await warehouseAPI.deliverToCourier({
        transfer_request_id: requestId,
        courier_id: courierId,
        delivery_notes: 'Producto entregado al corredor en perfecto estado. Caja original sellada.',
      });

      console.log('WH004 Response:', response);
      console.log('Status devuelto por el endpoint:', response.status);

      addNotification(
        'success',
        'Entregado al Corredor',
        `Transferencia #${requestId} entregada exitosamente al corredor ${request.courier_info?.name || request.pickup_info?.who || courierId}`
      );

      console.log('Recargando datos despues de entrega...');
      await loadInitialData();
    } catch (err) {
      console.error('Error en WH004:', err);
      addNotification('error', 'Error en Entrega', err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliverToVendor = async (requestId: number) => {
    console.log('WH005: Entregando a vendedor:', requestId);
    setActionLoading(requestId);

    try {
      const request = acceptedRequests.find((r) => r.id === requestId);
      if (!request) throw new Error('Solicitud no encontrada');

      const response = await warehouseAPI.deliverToVendor(requestId, {
        delivered: true,
        delivery_notes: 'Producto entregado al vendedor en perfecto estado. Caja original sellada.',
        vendor_id: request.requester_info?.id,
        vendor_name: request.requester_info?.name,
      });

      console.log('WH005 Response:', response);

      addNotification(
        'success',
        'Entregado al Vendedor',
        `Transferencia #${requestId} entregada exitosamente a ${request.requester_info?.name || 'vendedor'}`
      );

      await loadInitialData();
    } catch (err) {
      console.error('Error en WH005:', err);
      addNotification('error', 'Error en Entrega', err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReturnReception = async (returnId: number) => {
    try {
      const response = await warehouseAPI.confirmReturnReception(returnId, {
        received_quantity: 1,
        product_condition: 'good',
        return_to_inventory: true,
        quality_check_passed: true,
        notes: 'Producto verificado - en perfecto estado',
      });

      alert(`${response.message}\n\nInventario restaurado: +${response.received_quantity} unidad(es)`);
      loadInitialData();
    } catch (err: any) {
      console.error('Error confirmando recepcion:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  // Filtrado
  const filteredPendingRequests = pendingRequests.filter((request) => {
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const isReturn = request.purpose === 'return' || request.request_type === 'return';
    const matchesPurpose =
      purposeFilter === 'all' || (purposeFilter === 'return' ? isReturn : request.purpose === purposeFilter);

    if (!matchesPriority || !matchesPurpose) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const haystack = [
        request.brand,
        request.model,
        request.sneaker_reference_code,
        request.size,
        request.requester_name,
        request.requester_first_name,
        request.requester_last_name,
        request.source_location_name,
        request.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  const handleRefresh = async () => {
    console.log('Refrescando datos manualmente...');
    setLoading(true);
    try {
      await loadInitialData();
      addNotification('success', 'Datos Actualizados', 'Informacion refrescada correctamente');
    } catch (_err) {
      addNotification('error', 'Error', 'No se pudieron actualizar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      setInventoryLoading(true);
      console.log('Cargando inventario...');

      const response = await inventoryAPI.getAllInventory();
      console.log('Inventario cargado:', response);

      setInventory(response.locations || []);

      if (response.locations && response.locations.length > 0 && selectedLocation === 'all') {
        setSelectedLocation(response.locations[0].location_id);
      }
    } catch (err) {
      console.error('Error cargando inventario:', err);
      addNotification('error', 'Error', 'No se pudo cargar el inventario');
      setInventory([]);
    } finally {
      setInventoryLoading(false);
    }
  };

  const getFilteredInventory = () => {
    let filteredLocations = inventory;

    if (selectedLocation !== 'all') {
      filteredLocations = inventory.filter((location) => location.location_id === selectedLocation);
    }

    if (searchTerm) {
      const searchQ = searchTerm.toLowerCase();
      filteredLocations = filteredLocations.map((location) => ({
        ...location,
        products: location.products.filter(
          (product) =>
            product.description.toLowerCase().includes(searchQ) ||
            product.brand.toLowerCase().includes(searchQ) ||
            product.model.toLowerCase().includes(searchQ) ||
            product.reference_code.toLowerCase().includes(searchQ) ||
            (product.color_info && product.color_info.toLowerCase().includes(searchQ)) ||
            product.location_name.toLowerCase().includes(searchQ) ||
            product.product_id.toString().includes(searchQ) ||
            product.unit_price.includes(searchQ) ||
            product.box_price.includes(searchQ) ||
            product.sizes.some((size) => size.size.includes(searchQ))
        ),
      }));
    }

    return filteredLocations.filter((location) => location.products.length > 0);
  };

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Loading/error
    loading,
    error,
    pollingError,
    actionLoading,

    // Data
    pendingRequests,
    acceptedRequests,
    pendingReturns,
    transferHistory,
    transferHistoryLoading,
    stats,
    inventory,
    inventoryLoading,

    // Filters
    showFilters,
    setShowFilters,
    priorityFilter,
    setPriorityFilter,
    purposeFilter,
    setPurposeFilter,
    searchTerm,
    setSearchTerm,
    selectedLocation,
    setSelectedLocation,

    // Computed
    filteredPendingRequests,
    getFilteredInventory,

    // Actions
    handleRefresh,
    handleAcceptRequest,
    handleDeliverToCourier,
    handleDeliverToVendor,
    handleConfirmReturnReception,
    loadInventory,
    loadTransferHistory,
  };
};
