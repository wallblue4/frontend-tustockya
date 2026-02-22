import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { vendorAPI } from '../../services/transfersAPI';
import { PendingTransferItem, PendingTransfersResponse, TransferHistoryItem, TransferHistoryResponse, IncomingTransfer, IncomingTransfersResponse } from '../../types';
import { ReturnModal } from './ReturnModal';

import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  XCircle,
  History,
  DollarSign,
  MapPin,
  ArrowDownCircle,
  Send,
  LayoutGrid,
  List,
  Layers
} from 'lucide-react';

interface TransfersViewProps {
  onTransferRequested?: (transferId: number, isUrgent: boolean) => void;
  prefilledProductData?: {
    sneaker_reference_code: string;
    brand: string;
    model: string;
    color: string;
    size: string;
    product?: any;
    source_location_id?: number;
    destination_location_id?: number;
    // Información específica de pies separados
    pairs?: number;
    left_feet?: number;
    right_feet?: number;
    can_sell?: boolean;
    can_form_pair?: boolean;
    missing_foot?: 'left' | 'right' | null;
    location_name?: string;
    transfer_type?: 'pair' | 'left_foot' | 'right_foot' | 'form_pair';
    request_notes?: string;
    pickup_type?: 'vendedor' | 'corredor';
    // Opciones disponibles para solicitar
    available_options?: {
      pairs_available?: boolean;
      left_feet_available?: boolean;
      right_feet_available?: boolean;
      pairs_quantity?: number;
      left_feet_quantity?: number;
      right_feet_quantity?: number;
    };
  } | null;
  onSellProduct?: (productData: {
    code: string;
    brand: string;
    model: string;
    size: string;
    price: number;
    location: string;
    storage_type: string;
    color?: string;
    image?: string;
    transfer_id?: number; // ID de transferencia (siempre presente cuando viene desde TransfersView)
  }) => void;
}

// *** INTERFACES ACTUALIZADAS SEGÚN DOCUMENTACIÓN ***
// Ahora usamos PendingTransferItem del types/index.ts

// Interfaz para transferencia completada (historial) - Actualizada según respuesta real del API
interface CompletedTransfer {
  inventory_type: 'pair' | 'left_only' | 'right_only';
  id: number;
  status: 'completed' | 'cancelled';
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  unit_price?: number;
  purpose: 'cliente' | 'restock' | 'pair_formation' | 'return';
  priority: 'high' | 'normal';
  requested_at: string;
  completed_at: string | null;
  duration: string;
  next_action: string;
  product_image?: string;
  has_return_request?: boolean;
  pickup_type?: 'corredor' | 'vendedor';
  location_name?: string;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  onTransferRequested,
  prefilledProductData,
  onSellProduct
}) => {
  // Usar onSellProduct como prop, igual que en ProductScanner
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'history' | 'new' | 'incoming'>('pending');

  // *** ESTADOS ACTUALIZADOS PARA ENDPOINTS CORRECTOS ***
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransferItem[]>([]);
  const [completedTransfers, setCompletedTransfers] = useState<CompletedTransfer[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferHistoryItem[]>([]);
  const [incomingTransfers, setIncomingTransfers] = useState<IncomingTransfer[]>([]);

  // *** ESTADOS PARA DEVOLUCIONES ***
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedTransferForReturn, setSelectedTransferForReturn] = useState<any>(null);

  // Estados de resumen
  const [urgentCount, setUrgentCount] = useState(0);
  const [normalCount, setNormalCount] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para UI responsivo
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [pendingViewMode, setPendingViewMode] = useState<'grid' | 'list'>('grid');
  const [groupByRef, setGroupByRef] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [completedViewMode, setCompletedViewMode] = useState<'grid' | 'list'>('grid');
  const [completedGroupByRef, setCompletedGroupByRef] = useState(false);
  const [completedExpandedGroups, setCompletedExpandedGroups] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  // source_location_id SIEMPRE sale de user.location_id
  // source_location_id sale de la ubicación del producto/talla seleccionada en el scanner
  // destination_location_id sale de la ubicación del usuario actual
  const [requestForm, setRequestForm] = useState<{
    source_location_id?: number;
    destination_location_id?: number;
    sneaker_reference_code: string;
    brand: string;
    model: string;
    size: string;
    quantity: number;
    purpose: string;
    pickup_type: string;
    destination_type: string;
    notes: string;
    // Nuevo campo para tipo de transferencia
    transfer_type: 'pair' | 'single_foot';
    foot_side?: 'left' | 'right';
  }>({
    source_location_id: undefined, // origen: producto/talla seleccionada
    destination_location_id: user?.location_id ?? undefined, // destino: usuario actual
    sneaker_reference_code: '',
    brand: '',
    model: '',
    size: '',
    quantity: 1,
    purpose: 'cliente',
    pickup_type: 'vendedor',
    destination_type: 'exhibicion',
    notes: '',
    transfer_type: 'pair',
    foot_side: undefined
  });

  // Effect para manejar datos prefilled
  useEffect(() => {
    if (prefilledProductData) {
      // Mantener cantidad en 1 por defecto; el usuario puede cambiarla manualmente
      setRequestForm({
        source_location_id: prefilledProductData.source_location_id ?? undefined,
        destination_location_id: user?.location_id ?? undefined,
        sneaker_reference_code: prefilledProductData.sneaker_reference_code || '',
        brand: prefilledProductData.brand || '',
        model: prefilledProductData.model || '',
        size: prefilledProductData.size || '',
        quantity: 1,
        purpose: 'cliente',
        pickup_type: prefilledProductData.pickup_type || 'vendedor',
        destination_type: 'exhibicion',
        notes: prefilledProductData.request_notes || `Solicitud desde escáner - Color: ${prefilledProductData.color || 'N/A'}`,
        transfer_type: 'pair',
        foot_side: undefined
      });
      setActiveTab('new');
    }
  }, [prefilledProductData, user]);

  useEffect(() => {
    loadTransfersData();
    const interval = setInterval(loadTransfersData, 30000);
    return () => clearInterval(interval);
  }, []);

  // *** FUNCIÓN ACTUALIZADA PARA USAR ENDPOINTS CORRECTOS ***
  const loadTransfersData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Cargar transferencias pendientes (recepciones por confirmar)
      console.log('🔄 Cargando transferencias pendientes...');
      const pendingResponse = await vendorAPI.getPendingTransfers(); // Usa /vendor/pending-transfers

      if (pendingResponse.success) {
        const response = pendingResponse as PendingTransfersResponse;
        setPendingTransfers(response.pending_transfers || []);
        setUrgentCount(response.urgent_count || 0);
        setNormalCount(response.normal_count || 0);
        setTotalPending(response.total_pending || 0);
        console.log('✅ Transferencias pendientes cargadas:', response.pending_transfers?.length || 0);
      }

      // Cargar transferencias completadas (para acciones)
      console.log('🔄 Cargando transferencias completadas...');
      const completedResponse = await vendorAPI.getCompletedTransfers();

      if (completedResponse.success) {
        // Mapear la respuesta al tipo CompletedTransfer si es necesario
        // Asumimos que el backend devuelve un array compatible
        const completedData = (completedResponse as any).completed_transfers || [];
        setCompletedTransfers(completedData);
        console.log('✅ Transferencias completadas cargadas:', completedData.length);
      }

      // *** CARGAR HISTORIAL DEL DÍA ***
      console.log('🔄 Cargando historial del día...');
      const historyResponse = await vendorAPI.getTransferHistory();

      if (historyResponse.success) {
        const response = historyResponse as TransferHistoryResponse;
        setTransferHistory(response.history || []);
        // setTodayStats(response.stats || null); // Si el backend devuelve stats en el nuevo formato
        console.log('✅ Historial cargado:', response.history?.length || 0);
      }

      // *** CARGAR SOLICITUDES ENTRANTES (Vendor to Vendor) ***
      console.log('🔄 Cargando solicitudes entrantes...');
      const incomingResponse = await vendorAPI.getIncomingTransfers();

      if (incomingResponse.success) {
        const response = incomingResponse as IncomingTransfersResponse;
        setIncomingTransfers(response.incoming_transfers || []);
        console.log('✅ Solicitudes entrantes cargadas:', response.incoming_transfers?.length || 0);
      }

    } catch (err: any) {
      console.error('Error loading transfers:', err);
      setError('Error conectando con el servidor');
      setPendingTransfers([]);
      setCompletedTransfers([]);
      setTransferHistory([]);
      setIncomingTransfers([]);
      setUrgentCount(0);
      setNormalCount(0);
      setTotalPending(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Si prefilledProductData tiene los IDs, usarlos
      let transferPayload = { ...requestForm };
      if (prefilledProductData?.source_location_id) {
        transferPayload.source_location_id = prefilledProductData.source_location_id;
      }
      // destination siempre es el usuario actual
      transferPayload.destination_location_id = user?.location_id ?? undefined;
      let response;

      // Determinar qué endpoint usar basado en el tipo de transferencia
      if (requestForm.transfer_type === 'single_foot' && requestForm.foot_side) {
        // Usar endpoint para pie individual
        const singleFootPayload = {
          source_location_id: transferPayload.source_location_id || 0,
          destination_location_id: transferPayload.destination_location_id || 0,
          sneaker_reference_code: transferPayload.sneaker_reference_code,
          size: transferPayload.size,
          foot_side: requestForm.foot_side,
          quantity: transferPayload.quantity,
          purpose: 'pair_formation',
          pickup_type: transferPayload.pickup_type,
          notes: transferPayload.notes || null
        };
        console.log('📤 Enviando solicitud de pie individual:', singleFootPayload);
        response = await vendorAPI.requestSingleFoot(singleFootPayload);
      } else {
        // Usar endpoint normal para par completo
        console.log('📤 Enviando solicitud de par completo:', transferPayload);
        response = await vendorAPI.requestTransfer(transferPayload);
      }

      onTransferRequested?.(
        response.transfer_request_id,
        requestForm.purpose === 'cliente'
      );
      alert(`Solicitud creada exitosamente. ID: ${response.transfer_request_id}`);
      setRequestForm({
        source_location_id: typeof user?.location_id === 'number' ? user.location_id : undefined,
        destination_location_id: undefined,
        sneaker_reference_code: '',
        brand: '',
        model: '',
        size: '',
        quantity: 1,
        purpose: 'cliente',
        pickup_type: 'vendedor',
        destination_type: 'exhibicion',
        notes: '',
        transfer_type: 'pair',
        foot_side: undefined
      });
      setActiveTab('pending');
      loadTransfersData();
    } catch (err: any) {
      console.error('Error enviando solicitud:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  // *** NUEVA FUNCIÓN - Manejar devolución ***
  const handleGenerateReturn = (item: TransferHistoryItem | CompletedTransfer) => {
    // Convertir TransferHistoryItem al formato que espera el modal
    const transferForReturn: any = {
      id: item.id,
      sneaker_reference_code: item.sneaker_reference_code,
      brand: item.brand,
      model: item.model,
      size: item.size,
      quantity: item.quantity,
      inventory_type: item.inventory_type || 'pair', // Use original inventory type or default to 'pair'
      product_image: item.product_image
    };
    setSelectedTransferForReturn(transferForReturn);
    setShowReturnModal(true);
  };

  const handleReturnModalClose = () => {
    setShowReturnModal(false);
    setSelectedTransferForReturn(null);
  };

  const handleConfirmReception = async (transfer: PendingTransferItem) => {
    try {
      // Verificar si es una devolución
      const isReturn = transfer.purpose === 'return';

      if (isReturn) {
        console.log('🔄 Confirmando recepción de devolución...', transfer.id);
        await vendorAPI.confirmReturnReception(transfer.id, {
          received_quantity: transfer.quantity,
          condition: 'good',
          notes: 'Devolución recibida correctamente'
        });
      } else {
        // Confirmar recepción normal
        console.log('🔄 Confirmando recepción de transferencia...', transfer.id);
        await vendorAPI.confirmReception(transfer.id, 1, true, 'Producto recibido correctamente');
      }

      // Mensaje de éxito
      alert(`✅ Recepción de ${isReturn ? 'devolución' : 'transferencia'} confirmada exitosamente.\n\nEl inventario ha sido actualizado.`);

      // Recargar datos para actualizar las listas
      loadTransfersData();

    } catch (err: any) {
      console.error('Error en confirmar recepción:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  // Nueva función para vender desde transferencias completadas
  const handleSellFromHistory = (item: TransferHistoryItem) => {
    console.log('📦 Item seleccionado para venta:', item);
    console.log('🔑 Transfer ID:', item.id);

    // Preparar datos para SalesForm incluyendo el transfer_id
    const salesData = {
      code: item.sneaker_reference_code,
      brand: item.brand,
      model: item.model,
      size: item.size,
      price: item.unit_price || 0, // Usar precio unitario si existe, sino 0
      location: 'Local Actual',
      storage_type: 'display',
      color: 'N/A',
      image: item.product_image || undefined,
      transfer_id: item.id
    };

    console.log('📤 Datos que se enviarán a SalesForm:', salesData);

    if (onSellProduct) {
      onSellProduct(salesData);
    } else {
      console.error('❌ onSellProduct no está definido');
      alert('Error: No se puede abrir el formulario de ventas.');
    }
  };

  const handleSellFromCompletedTransfer = (item: CompletedTransfer) => {
    // Reutilizamos la lógica de venta, adaptando el tipo si es necesario
    // Como CompletedTransfer y TransferHistoryItem comparten los campos necesarios, podemos castear o crear el objeto
    const historyItem: TransferHistoryItem = {
      ...item,
      type: 'transfer', // Valor por defecto
      timestamp: item.completed_at || new Date().toISOString(), // Valor por defecto
      status: item.status === 'completed' ? 'completed' : 'cancelled', // Mapeo de status
      unit_price: item.unit_price // Pasar el precio unitario
    };
    handleSellFromHistory(historyItem);
  };


  // *** NUEVA FUNCIÓN - Cancelar transferencia ***
  const handleCancelTransfer = async (transferId: number, reason?: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta transferencia?')) {
      return;
    }

    try {
      await vendorAPI.cancelTransfer(transferId, reason || 'Cancelada por el vendedor');
      alert('Transferencia cancelada exitosamente');
      loadTransfersData(); // Recargar datos
    } catch (err: any) {
      console.error('Error cancelando transferencia:', err);
      alert('Error cancelando transferencia: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  // *** NUEVA FUNCIÓN - Entregar devolución a bodeguero ***
  const handleDeliverReturnToWarehouse = async (returnId: number) => {
    if (!confirm('¿Confirmas que entregarás este producto en la bodega?')) {
      return;
    }

    try {
      console.log('🔄 Entregando devolución a bodega...', returnId);
      const response = await vendorAPI.deliverReturnToWarehouse(
        returnId,
        'Producto entregado en perfecto estado para devolución'
      );

      console.log('✅ Devolución entregada:', response);
      alert(`${response.message}\n\nEl bodeguero ahora debe confirmar la recepción y verificar el producto.`);

      loadTransfersData();
    } catch (err: any) {
      console.error('❌ Error entregando devolución:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };


  // *** NUEVAS FUNCIONES PARA SOLICITUDES ENTRANTES ***
  const handleAcceptIncomingTransfer = async (transferId: number) => {
    try {
      console.log('🔄 Aceptando solicitud entrante...', transferId);
      await vendorAPI.acceptIncomingTransfer(transferId);
      alert('✅ Solicitud aceptada. Ahora puedes despachar el producto.');
      loadTransfersData();
    } catch (err: any) {
      console.error('❌ Error aceptando solicitud:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleDispatchIncomingTransfer = async (transferId: number) => {
    const notes = prompt('Notas de entrega (opcional):', 'Entregado a corredor');
    if (notes === null) return; // Cancelado por usuario

    try {
      console.log('🔄 Despachando solicitud entrante...', transferId);
      await vendorAPI.dispatchIncomingTransfer(transferId, { delivery_notes: notes });
      alert('✅ Producto despachado. El inventario ha sido actualizado.');
      loadTransfersData();
    } catch (err: any) {
      console.error('❌ Error despachando solicitud:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };


  // *** FUNCIONES HELPER ACTUALIZADAS ***

  // Función para obtener el nombre del corredor
  const getCourierName = (transfer: PendingTransferItem): string => {
    return transfer.courier_name || 'Sin asignar';
  };

  // La próxima acción para transferencias pendientes
  const getNextAction = (transfer: PendingTransferItem): string => {
    return transfer.next_action || 'En proceso...';
  };

  // Función para calcular porcentaje de avance según status y pickup_type
  const getProgressPercentage = (transfer: PendingTransferItem): number => {
    if (transfer.pickup_type === 'corredor') {
      // Flujo completo para corredor: pending -> accepted -> courier_assigned -> in_transit -> delivered -> completed
      switch (transfer.status) {
        case 'pending':
          return 16; // 1/6 = 16.67%
        case 'accepted':
          return 33; // 2/6 = 33.33%
        case 'courier_assigned':
          return 50; // 3/6 = 50%
        case 'in_transit':
          return 67; // 4/6 = 66.67%
        case 'delivered':
          return 83; // 5/6 = 83.33%
        case 'completed':
          return 100; // 6/6 = 100%
        default:
          return 0;
      }
    } else if (transfer.pickup_type === 'vendedor') {
      // Flujo simplificado para vendedor: pending -> accepted -> delivered -> completed
      switch (transfer.status) {
        case 'pending':
          return 25; // 1/4 = 25%
        case 'accepted':
          return 50; // 2/4 = 50%
        case 'delivered':
          return 75; // 3/4 = 75%
        case 'completed':
          return 100; // 4/4 = 100%
        default:
          return 0;
      }
    }
    return 0;
  };

  // Función para obtener el mensaje de estado según pickup_type
  const getStatusMessage = (transfer: PendingTransferItem): string => {
    if (transfer.pickup_type === 'corredor') {
      switch (transfer.status) {
        case 'pending':
          return 'Esperando aprobación del bodeguero';
        case 'accepted':
          return 'Esperando asignación de corredor';
        case 'courier_assigned':
          return 'Corredor asignado, esperando recolección';
        case 'in_transit':
          return 'Producto en tránsito hacia tu local';
        case 'delivered':
          return 'Producto entregado, esperando tu confirmación';
        case 'completed':
          return 'Transferencia completada';
        default:
          return 'Estado desconocido';
      }
    } else if (transfer.pickup_type === 'vendedor') {
      switch (transfer.status) {
        case 'pending':
          return 'Esperando aprobación del bodeguero';
        case 'accepted':
          return 'Debes ir a recoger el producto a la bodega';
        case 'delivered':
          return 'Producto entregado, confirma la recepción';
        case 'completed':
          return 'Transferencia completada';
        default:
          return 'Estado desconocido';
      }
    }
    return 'Estado desconocido';
  };

  // Función para obtener el color del progreso
  const getProgressColor = (percentage: number): string => {
    if (percentage < 30) return 'bg-error';
    if (percentage < 60) return 'bg-warning';
    if (percentage < 90) return 'bg-primary';
    return 'bg-success';
  };

  const getStatusColor = (transfer: PendingTransferItem) => {
    switch (transfer.priority) {
      case 'high':
        return 'bg-error/10 text-error';
      case 'normal':
        return 'bg-success/10 text-success';
      default:
        return 'bg-warning/10 text-warning';
    }
  };

  const getStatusIcon = (transfer: PendingTransferItem) => {
    switch (transfer.status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'courier_assigned':
        return <Truck className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusText = (transfer: PendingTransferItem): string => {
    return getStatusMessage(transfer);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando transferencias...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Indicador de datos prefilled */}
      {prefilledProductData && (
        <Card className="border-primary/30 bg-primary/10">
          <CardContent className="p-3 md:p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Package className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary">
                    Producto desde Escáner IA
                  </p>
                  <p className="text-sm text-primary truncate">
                    {prefilledProductData.brand} {prefilledProductData.model} - Talla {prefilledProductData.size}
                  </p>
                </div>
              </div>

              {/* Información específica de transferencia */}
              {prefilledProductData.transfer_type && (
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    {prefilledProductData.transfer_type === 'pair' && (
                      <span className="text-sm font-semibold text-success">👟 Par Completo</span>
                    )}
                    {prefilledProductData.transfer_type === 'left_foot' && (
                      <span className="text-sm font-semibold text-warning">🦶 Pie Izquierdo</span>
                    )}
                    {prefilledProductData.transfer_type === 'right_foot' && (
                      <span className="text-sm font-semibold text-warning">🦶 Pie Derecho</span>
                    )}
                    {prefilledProductData.transfer_type === 'form_pair' && (
                      <span className="text-sm font-semibold text-info">🔗 Formar Pares</span>
                    )}
                  </div>

                  {/* Inventario disponible en origen */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-success/10 rounded">
                      <div className="font-bold text-success">{prefilledProductData.pairs || 0}</div>
                      <div className="text-muted-foreground">👟 Pares</div>
                    </div>
                    <div className="text-center p-2 bg-warning/10 rounded">
                      <div className="font-bold text-warning">{prefilledProductData.left_feet || 0}</div>
                      <div className="text-muted-foreground">🦶 Izq</div>
                    </div>
                    <div className="text-center p-2 bg-warning/10 rounded">
                      <div className="font-bold text-warning">{prefilledProductData.right_feet || 0}</div>
                      <div className="text-muted-foreground">🦶 Der</div>
                    </div>
                  </div>

                  {/* Notas específicas */}
                  {prefilledProductData.request_notes && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                      💡 {prefilledProductData.request_notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Tabs - RESPONSIVE */}
      <Card>
        <CardContent className="p-2 md:p-4">
          {/* MOBILE: Dropdown Menu */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-full flex items-center justify-between p-3 border border-border rounded-lg bg-card"
            >
              <div className="flex items-center space-x-2">
                {activeTab === 'pending' && <Package className="h-4 w-4 text-primary" />}
                {activeTab === 'completed' && <CheckCircle className="h-4 w-4 text-primary" />}
                {activeTab === 'incoming' && <ArrowDownCircle className="h-4 w-4 text-primary" />}
                {activeTab === 'new' && <Plus className="h-4 w-4 text-primary" />}
                <span className="font-medium">
                  {activeTab === 'pending' && `Recepciones por Confirmar (${totalPending})`}
                  {activeTab === 'completed' && 'Transferencias Completadas'}
                  {activeTab === 'incoming' && `Solicitudes Entrantes (${incomingTransfers.filter(t => t.status === 'pending').length})`}
                  {activeTab === 'history' && 'Historial del Día'}
                  {activeTab === 'new' && 'Nueva Solicitud'}
                  {prefilledProductData && activeTab === 'new' && (
                    <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                      ●
                    </span>
                  )}
                </span>
              </div>
              {showMobileMenu ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showMobileMenu && (
              <div className="mt-2 border border-border rounded-lg bg-card shadow-lg">
                <button
                  onClick={() => {
                    setActiveTab('pending');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-muted/20 ${activeTab === 'pending' ? 'bg-primary/10 text-primary' : ''
                    }`}
                >
                  <Package className="h-4 w-4" />
                  <span>Recepciones por Confirmar ({totalPending})</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('completed');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-muted/20 border-t ${activeTab === 'completed' ? 'bg-primary/10 text-primary' : ''
                    }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Transferencias Completadas</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('incoming');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-muted/20 border-t ${activeTab === 'incoming' ? 'bg-primary/10 text-primary' : ''
                    }`}
                >
                  <ArrowDownCircle className="h-4 w-4" />
                  <span>Solicitudes Entrantes ({incomingTransfers.filter(t => t.status === 'pending').length})</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('history');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-muted/20 border-t ${activeTab === 'history' ? 'bg-primary/10 text-primary' : ''
                    }`}
                >
                  <History className="h-4 w-4" />
                  <span>Historial del Día</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('new');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-muted/20 border-t ${activeTab === 'new' ? 'bg-primary/10 text-primary' : ''
                    } ${prefilledProductData ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    Nueva Solicitud
                    {prefilledProductData && (
                      <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                        ●
                      </span>
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* DESKTOP: Horizontal Tabs */}
          <div className="hidden md:flex space-x-4">
            <Button
              variant={activeTab === 'pending' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('pending')}
            >
              <Package className="h-4 w-4 mr-2" />
              Recepciones por Confirmar ({totalPending})
            </Button>
            <Button
              variant={activeTab === 'completed' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('completed')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Transferencias Completadas
            </Button>
            <Button
              variant={activeTab === 'incoming' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('incoming')}
            >
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Solicitudes Entrantes ({incomingTransfers.filter(t => t.status === 'pending').length})
            </Button>
            <Button
              variant={activeTab === 'history' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('history')}
            >
              <History className="h-4 w-4 mr-2" />
              Historial del Día
            </Button>
            <Button
              variant={activeTab === 'new' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('new')}
              className={prefilledProductData ? 'ring-2 ring-primary ring-opacity-50' : ''}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
              {prefilledProductData && (
                <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                  ●
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-warning flex-shrink-0" />
              <p className="text-warning text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* *** BOTONES DE NAVEGACIÓN ENTRE TABS *** */}
      <Card>
        <CardContent className="p-2 md:p-4">
          <div className="flex gap-2 md:gap-4">
            <Button
              variant={activeTab === 'pending' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('pending')}
              size="sm"
              className="flex-1 md:flex-none text-xs md:text-sm"
            >
              <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Pedidos ({pendingTransfers.length})
            </Button>
            <Button
              variant={activeTab === 'completed' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('completed')}
              size="sm"
              className="flex-1 md:flex-none text-xs md:text-sm"
            >
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Completadas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base md:text-lg font-semibold">Pendientes de Confirmación</h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setGroupByRef(!groupByRef); setExpandedGroups(new Set()); }}
                  className={`p-1.5 rounded-lg transition-colors ${groupByRef ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/30 text-muted-foreground hover:text-foreground'}`}
                  aria-label="Agrupar por referencia"
                >
                  <Layers className="h-4 w-4" />
                </button>
                <div className="flex items-center bg-muted/30 rounded-lg p-0.5">
                  <button
                    onClick={() => setPendingViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${pendingViewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label="Vista grid"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPendingViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${pendingViewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label="Vista lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pendingTransfers.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Package className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm md:text-base">No tienes transferencias pendientes</p>
              </div>
            ) : (() => {
              const sorted = [...pendingTransfers].sort((a, b) => getProgressPercentage(b) - getProgressPercentage(a));

              // ===== Helper: renderizar un card individual =====
              const renderTransferCard = (transfer: PendingTransferItem) => {
                const isPending = transfer.status === 'pending';
                const cardBorder = isPending ? 'border-error/40' : 'border-success/40';
                const cardBg = isPending ? 'bg-error/5' : 'bg-success/5';
                const statusLabel =
                  transfer.status === 'pending' ? 'Pendiente' :
                    transfer.status === 'accepted' ? 'Aceptada' :
                      transfer.status === 'courier_assigned' ? 'Corredor asignado' :
                        transfer.status === 'in_transit' ? 'En camino' :
                          transfer.status === 'delivered' ? 'Entregada' : 'Completada';
                const inventoryLabel = transfer.purpose === 'pair_formation'
                  ? (transfer.inventory_type === 'left_only' ? '🦶 Izquierdo' : transfer.inventory_type === 'right_only' ? '🦶 Derecho' : '👟 Par')
                  : '👟 Par';

                // Botones de acción compartidos
                const actionButtons = (compact: boolean) => (
                  <div className={`flex flex-col ${compact ? 'gap-1.5 mt-2' : 'gap-1.5 mt-2'}`}>
                    {(transfer.status === 'delivered' && !transfer.is_return) && (
                      <Button onClick={() => handleConfirmReception(transfer)} className={`bg-success hover:bg-success/90 text-success-foreground w-full ${compact ? 'text-[10px] h-7' : 'text-xs'}`} size="sm">
                        <CheckCircle className="h-3 w-3 mr-1" /> Confirmar
                      </Button>
                    )}
                    {(transfer.status === 'delivered' && transfer.is_return && transfer.role_in_transfer === 'receiver') && (
                      <Button onClick={() => handleConfirmReception(transfer)} className={`bg-success hover:bg-success/90 text-success-foreground w-full ${compact ? 'text-[10px] h-7' : 'text-xs'}`} size="sm">
                        <CheckCircle className="h-3 w-3 mr-1" /> Confirmar Dev.
                      </Button>
                    )}
                    {(transfer.is_return && transfer.role_in_transfer === 'requester' && transfer.status === 'accepted') && (
                      <Button onClick={() => handleDeliverReturnToWarehouse(transfer.id)} className={`bg-muted text-muted-foreground hover:bg-muted/80 w-full ${compact ? 'text-[10px] h-7' : 'text-xs'}`} size="sm">
                        <Package className="h-3 w-3 mr-1" /> {compact ? 'A Bodega' : 'Entregar a Bodega'}
                      </Button>
                    )}
                    {(!transfer.is_return && transfer.status === 'accepted') && (
                      <div className={`bg-warning/10 border border-warning/20 rounded-lg text-center ${compact ? 'p-1.5' : 'p-2'}`}>
                        <span className="text-[10px] font-medium text-warning">Ir a recoger{!compact && ' a bodega'}</span>
                      </div>
                    )}
                    {transfer.status === 'pending' && (
                      <Button onClick={() => handleCancelTransfer(transfer.id)} className={`w-full ${compact ? 'text-[10px] h-7' : 'text-xs'}`} size="sm" variant="outline">
                        <XCircle className="h-3 w-3 mr-1" /> Cancelar
                      </Button>
                    )}
                  </div>
                );

                if (pendingViewMode === 'grid') {
                  return (
                    <div key={transfer.id} className={`border ${cardBorder} rounded-xl overflow-hidden ${cardBg} shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col`}>
                      <div className="aspect-square bg-muted/20 relative overflow-hidden">
                        <img src={transfer.product_image} className="absolute inset-0 w-full h-full object-cover" alt={`${transfer.brand} ${transfer.model}`} />
                        <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${isPending ? 'bg-error/80 text-white' : 'bg-success/80 text-white'}`}>{statusLabel}</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm bg-black/50 text-white">{transfer.pickup_type === 'corredor' ? '🚚 Corredor' : '🏃‍♂️ Vendedor'}</span>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-end">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-sm bg-black/70 text-white">{transfer.size}</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm bg-black/50 text-white">{inventoryLabel}</span>
                        </div>
                      </div>
                      <div className="p-2.5 flex flex-col flex-1 justify-between">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <h4 className="font-bold text-xs leading-tight line-clamp-2">{transfer.brand} {transfer.model}</h4>
                            <span className="text-xs font-semibold text-muted-foreground shrink-0">x{transfer.quantity}</span>
                          </div>
                          {transfer.location_name && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 shrink-0" />{transfer.location_name}
                            </p>
                          )}
                          {transfer.purpose === 'return' && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-muted/30 text-muted-foreground">🔄 Dev.</span>
                            </div>
                          )}
                        </div>
                        {actionButtons(true)}
                      </div>
                    </div>
                  );
                }

                // MODO LISTA
                return (
                  <div key={transfer.id} className={`border ${cardBorder} rounded-xl overflow-hidden ${cardBg} shadow-sm hover:shadow-lg transition-all duration-300`}>
                    <div className="flex flex-row">
                      <div className="w-2/5 md:w-1/3 aspect-square bg-muted/20 flex-shrink-0 relative overflow-hidden">
                        <img src={transfer.product_image} className="absolute inset-0 w-full h-full object-cover" alt={`${transfer.brand} ${transfer.model}`} />
                        <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${isPending ? 'bg-error/80 text-white' : 'bg-success/80 text-white'}`}>{statusLabel}</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm bg-black/50 text-white">{transfer.pickup_type === 'corredor' ? '🚚 Corredor' : '🏃‍♂️ Vendedor'}</span>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-end">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-sm bg-black/70 text-white">{transfer.size}</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm bg-black/50 text-white">{inventoryLabel}</span>
                        </div>
                      </div>
                      <div className="w-3/5 md:w-2/3 p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <h4 className="font-bold text-sm leading-tight">{transfer.brand} {transfer.model}</h4>
                            <span className="text-sm font-semibold text-muted-foreground shrink-0">x{transfer.quantity}</span>
                          </div>
                          {transfer.location_name && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 shrink-0" />{transfer.location_name}
                            </p>
                          )}
                          {transfer.purpose === 'return' && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/30 text-muted-foreground">🔄 Devolución</span>
                            </div>
                          )}
                        </div>
                        {actionButtons(false)}
                      </div>
                    </div>
                  </div>
                );
              };

              // ===== MODO SIN AGRUPAR =====
              if (!groupByRef) {
                return (
                  <div className={pendingViewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'}>
                    {sorted.map(renderTransferCard)}
                  </div>
                );
              }

              // ===== MODO AGRUPADO POR REFERENCIA =====
              const groups: Record<string, PendingTransferItem[]> = {};
              sorted.forEach((t) => {
                const key = t.sneaker_reference_code;
                if (!groups[key]) groups[key] = [];
                groups[key].push(t);
              });

              const toggleGroup = (key: string) => {
                setExpandedGroups((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) next.delete(key); else next.add(key);
                  return next;
                });
              };

              // Helper: renderizar item compacto dentro de un grupo (sin imagen ni datos repetidos)
              const renderGroupedItem = (transfer: PendingTransferItem) => {
                const isPending = transfer.status === 'pending';
                const statusLabel =
                  transfer.status === 'pending' ? 'Pendiente' :
                    transfer.status === 'accepted' ? 'Aceptada' :
                      transfer.status === 'courier_assigned' ? 'Corredor asignado' :
                        transfer.status === 'in_transit' ? 'En camino' :
                          transfer.status === 'delivered' ? 'Entregada' : 'Completada';
                const inventoryLabel = transfer.purpose === 'pair_formation'
                  ? (transfer.inventory_type === 'left_only' ? '🦶 Izq' : transfer.inventory_type === 'right_only' ? '🦶 Der' : '👟 Par')
                  : '👟 Par';

                const itemActions = (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(transfer.status === 'delivered' && !transfer.is_return) && (
                      <Button onClick={() => handleConfirmReception(transfer)} className="bg-success hover:bg-success/90 text-success-foreground text-[10px] h-7 px-2" size="sm">
                        <CheckCircle className="h-3 w-3 mr-1" /> Confirmar
                      </Button>
                    )}
                    {(transfer.status === 'delivered' && transfer.is_return && transfer.role_in_transfer === 'receiver') && (
                      <Button onClick={() => handleConfirmReception(transfer)} className="bg-success hover:bg-success/90 text-success-foreground text-[10px] h-7 px-2" size="sm">
                        <CheckCircle className="h-3 w-3 mr-1" /> Confirmar Dev.
                      </Button>
                    )}
                    {(transfer.is_return && transfer.role_in_transfer === 'requester' && transfer.status === 'accepted') && (
                      <Button onClick={() => handleDeliverReturnToWarehouse(transfer.id)} className="bg-muted text-muted-foreground hover:bg-muted/80 text-[10px] h-7 px-2" size="sm">
                        <Package className="h-3 w-3 mr-1" /> A Bodega
                      </Button>
                    )}
                    {(!transfer.is_return && transfer.status === 'accepted') && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-warning/10 border border-warning/20 text-warning">Ir a recoger</span>
                    )}
                    {transfer.status === 'pending' && (
                      <Button onClick={() => handleCancelTransfer(transfer.id)} className="text-[10px] h-7 px-2" size="sm" variant="outline">
                        <XCircle className="h-3 w-3 mr-1" /> Cancelar
                      </Button>
                    )}
                  </div>
                );

                return (
                  <div key={transfer.id} className={`flex items-start gap-3 p-2.5 rounded-lg border ${isPending ? 'border-error/30 bg-error/5' : 'border-success/30 bg-success/5'}`}>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/70 text-white">{transfer.size}</span>
                      <span className="text-xs font-semibold text-muted-foreground">x{transfer.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isPending ? 'bg-error/80 text-white' : 'bg-success/80 text-white'}`}>{statusLabel}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{transfer.pickup_type === 'corredor' ? '🚚 Corredor' : '🏃‍♂️ Vendedor'}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{inventoryLabel}</span>
                        {transfer.purpose === 'return' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/30 text-muted-foreground">🔄 Dev.</span>
                        )}
                      </div>
                      {transfer.location_name && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />{transfer.location_name}
                        </p>
                      )}
                      {itemActions}
                    </div>
                  </div>
                );
              };

              // Helper: agrupar cantidades por talla + inventory_type
              const sizeSummary = (items: PendingTransferItem[]) => {
                const sizeMap: Record<string, { qty: number; type: string }> = {};
                items.forEach((t) => {
                  const typeLabel = t.purpose === 'pair_formation'
                    ? (t.inventory_type === 'left_only' ? '🦶I' : t.inventory_type === 'right_only' ? '🦶D' : '👟')
                    : '👟';
                  const key = `${t.size}|${typeLabel}`;
                  if (!sizeMap[key]) sizeMap[key] = { qty: 0, type: typeLabel };
                  sizeMap[key].qty += t.quantity;
                });
                return Object.entries(sizeMap)
                  .map(([key, val]) => ({ size: key.split('|')[0], type: val.type, qty: val.qty }))
                  .sort((a, b) => parseFloat(a.size) - parseFloat(b.size) || a.type.localeCompare(b.type));
              };

              return (
                <div className="space-y-3">
                  {Object.entries(groups).map(([refCode, items]) => {
                    // Grupo con un solo elemento: formato de fila con acciones inline
                    if (items.length === 1) {
                      const t = items[0];
                      const isPending = t.status === 'pending';
                      const sLabel =
                        t.status === 'pending' ? 'Pendiente' :
                          t.status === 'accepted' ? 'Aceptada' :
                            t.status === 'courier_assigned' ? 'Corredor asignado' :
                              t.status === 'in_transit' ? 'En camino' :
                                t.status === 'delivered' ? 'Entregada' : 'Completada';
                      const invLabel = t.purpose === 'pair_formation'
                        ? (t.inventory_type === 'left_only' ? '🦶 Izq' : t.inventory_type === 'right_only' ? '🦶 Der' : '👟 Par')
                        : '👟 Par';
                      return (
                        <div key={refCode} className={`border rounded-xl overflow-hidden transition-all duration-300 ${isPending ? 'border-error/30' : 'border-success/30'}`}>
                          <div className={`flex items-center gap-3 p-3 ${isPending ? 'bg-error/5' : 'bg-success/5'}`}>
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-muted/20 flex-shrink-0">
                              <img src={t.product_image} className="w-full h-full object-cover" alt={`${t.brand} ${t.model}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-1.5">
                                <h4 className="font-bold text-sm leading-tight truncate">{t.brand} {t.model}</h4>
                                <span className="text-sm font-semibold text-muted-foreground shrink-0">x{t.quantity}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white">{t.size}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isPending ? 'bg-error/80 text-white' : 'bg-success/80 text-white'}`}>{sLabel}</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{t.pickup_type === 'corredor' ? '🚚 Corredor' : '🏃‍♂️ Vendedor'}</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{invLabel}</span>
                                {t.purpose === 'return' && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/30 text-muted-foreground">🔄 Dev.</span>}
                              </div>
                              {t.location_name && (
                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                                  <MapPin className="h-3 w-3 shrink-0" />{t.location_name}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {(t.status === 'delivered' && !t.is_return) && (
                                  <Button onClick={() => handleConfirmReception(t)} className="bg-success hover:bg-success/90 text-success-foreground text-[10px] h-7 px-2" size="sm">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Confirmar
                                  </Button>
                                )}
                                {(t.status === 'delivered' && t.is_return && t.role_in_transfer === 'receiver') && (
                                  <Button onClick={() => handleConfirmReception(t)} className="bg-success hover:bg-success/90 text-success-foreground text-[10px] h-7 px-2" size="sm">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Confirmar Dev.
                                  </Button>
                                )}
                                {(t.is_return && t.role_in_transfer === 'requester' && t.status === 'accepted') && (
                                  <Button onClick={() => handleDeliverReturnToWarehouse(t.id)} className="bg-muted text-muted-foreground hover:bg-muted/80 text-[10px] h-7 px-2" size="sm">
                                    <Package className="h-3 w-3 mr-1" /> A Bodega
                                  </Button>
                                )}
                                {(!t.is_return && t.status === 'accepted') && (
                                  <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-warning/10 border border-warning/20 text-warning">Ir a recoger</span>
                                )}
                                {t.status === 'pending' && (
                                  <Button onClick={() => handleCancelTransfer(t.id)} className="text-[10px] h-7 px-2" size="sm" variant="outline">
                                    <XCircle className="h-3 w-3 mr-1" /> Cancelar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const isExpanded = expandedGroups.has(refCode);
                    const first = items[0];
                    const totalQty = items.reduce((s, t) => s + t.quantity, 0);
                    const hasPending = items.some((t) => t.status === 'pending');
                    const allAccepted = items.every((t) => t.status !== 'pending');
                    const sizeEntries = sizeSummary(items);

                    return (
                      <div key={refCode} className={`border rounded-xl overflow-hidden transition-all duration-300 ${hasPending ? 'border-error/30' : 'border-success/30'}`}>
                        {/* Cabecera del grupo */}
                        <button
                          onClick={() => toggleGroup(refCode)}
                          className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${hasPending ? 'bg-error/5 hover:bg-error/10' : 'bg-success/5 hover:bg-success/10'}`}
                        >
                          {/* Miniatura */}
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-muted/20 flex-shrink-0">
                            <img src={first.product_image} className="w-full h-full object-cover" alt={`${first.brand} ${first.model}`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <h4 className="font-bold text-sm leading-tight truncate">{first.brand} {first.model}</h4>
                              <span className="text-sm font-semibold text-muted-foreground shrink-0">x{totalQty}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sizeEntries.map((entry, i) => (
                                <span key={`${entry.size}-${entry.type}-${i}`} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white">
                                  {entry.size} {entry.type} <span className="font-normal opacity-80">x{entry.qty}</span>
                                </span>
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {items.length} transferencias · {allAccepted ? <span className="text-success font-medium">Todo aceptado</span> : <span className="text-error font-medium">{items.filter((t) => t.status === 'pending').length} pendiente{items.filter((t) => t.status === 'pending').length > 1 ? 's' : ''}</span>}
                            </p>
                          </div>

                          {/* Chevron */}
                          <div className="shrink-0">
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </button>

                        {/* Contenido expandido: items compactos sin info repetida */}
                        {isExpanded && (
                          <div className={`p-3 border-t ${hasPending ? 'border-error/20' : 'border-success/20'}`}>
                            <div className="space-y-2">
                              {items.map(renderGroupedItem)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {activeTab === 'completed' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base md:text-lg font-semibold">Transferencias Completadas</h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setCompletedGroupByRef(!completedGroupByRef); setCompletedExpandedGroups(new Set()); }}
                  className={`p-1.5 rounded-lg transition-colors ${completedGroupByRef ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/30 text-muted-foreground hover:text-foreground'}`}
                  aria-label="Agrupar por referencia"
                >
                  <Layers className="h-4 w-4" />
                </button>
                <div className="flex items-center bg-muted/30 rounded-lg p-0.5">
                  <button
                    onClick={() => setCompletedViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${completedViewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label="Vista cuadrícula"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCompletedViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${completedViewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    aria-label="Vista lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {completedTransfers.filter((t) => !t.has_return_request).length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm md:text-base">No hay transferencias completadas hoy</p>
              </div>
            ) : (() => {
              const filtered = completedTransfers.filter((t) => !t.has_return_request);

              // Helper: card individual de completada
              const renderCompletedCard = (transfer: CompletedTransfer) => {
                const isCompleted = transfer.status === 'completed';
                const cardBorder = isCompleted ? 'border-success/40' : 'border-error/40';
                const cardBg = isCompleted ? 'bg-success/5' : 'bg-error/5';
                const statusLabel = isCompleted ? 'Completada' : 'Cancelada';
                const inventoryLabel = transfer.purpose === 'pair_formation'
                  ? (transfer.inventory_type === 'left_only' ? '🦶 Izquierdo' : transfer.inventory_type === 'right_only' ? '🦶 Derecho' : '👟 Par')
                  : '👟 Par';
                const isReturn = String(transfer.purpose).toLowerCase().trim() === 'return';

                const completedActions = (compact: boolean) => {
                  if (!isCompleted) return null;
                  if (isReturn) {
                    return (
                      <div className={`bg-muted/10 border border-muted/20 rounded-lg text-center ${compact ? 'p-1.5 mt-1.5' : 'p-2 mt-2'}`}>
                        <span className="text-[10px] font-medium text-muted-foreground">✅ Dev. completada</span>
                      </div>
                    );
                  }
                  return (
                    <div className={`flex flex-col ${compact ? 'gap-1.5 mt-2' : 'gap-1.5 mt-2'}`}>
                      <Button onClick={() => handleSellFromCompletedTransfer(transfer)} className={`bg-primary hover:bg-primary/90 text-primary-foreground w-full ${compact ? 'text-[10px] h-7' : 'text-xs'}`} size="sm">
                        <DollarSign className="h-3 w-3 mr-1" /> Vender
                      </Button>
                      <Button onClick={() => handleGenerateReturn(transfer)} className={`bg-muted text-muted-foreground hover:bg-muted/80 w-full ${compact ? 'text-[10px] h-7' : 'text-xs'}`} size="sm">
                        <Package className="h-3 w-3 mr-1" /> {compact ? 'Devolver' : 'Generar Devolución'}
                      </Button>
                    </div>
                  );
                };

                if (completedViewMode === 'grid') {
                  return (
                    <div key={transfer.id} className={`border ${cardBorder} rounded-xl overflow-hidden ${cardBg} shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col p-2.5`}>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isCompleted ? 'bg-success/80 text-white' : 'bg-error/80 text-white'}`}>{statusLabel}</span>
                        {transfer.pickup_type && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{transfer.pickup_type === 'corredor' ? '🚚 Corredor' : '🏃‍♂️ Vendedor'}</span>}
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/70 text-white">{transfer.size}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{inventoryLabel}</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <h4 className="font-bold text-xs leading-tight line-clamp-2">{transfer.brand} {transfer.model}</h4>
                            <span className="text-xs font-semibold text-muted-foreground shrink-0">x{transfer.quantity}</span>
                          </div>
                          {transfer.location_name && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 shrink-0" />{transfer.location_name}
                            </p>
                          )}
                          {isReturn && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-muted/30 text-muted-foreground">🔄 Dev.</span>
                            </div>
                          )}
                        </div>
                        {completedActions(true)}
                      </div>
                    </div>
                  );
                }

                // MODO LISTA
                return (
                  <div key={transfer.id} className={`border ${cardBorder} rounded-xl overflow-hidden ${cardBg} shadow-sm hover:shadow-lg transition-all duration-300 p-3`}>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/70 text-white">{transfer.size}</span>
                        <span className="text-xs font-semibold text-muted-foreground">x{transfer.quantity}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <h4 className="font-bold text-sm leading-tight">{transfer.brand} {transfer.model}</h4>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isCompleted ? 'bg-success/80 text-white' : 'bg-error/80 text-white'}`}>{statusLabel}</span>
                          {transfer.pickup_type && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{transfer.pickup_type === 'corredor' ? '🚚 Corredor' : '🏃‍♂️ Vendedor'}</span>}
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{inventoryLabel}</span>
                          {isReturn && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/30 text-muted-foreground">🔄 Dev.</span>}
                        </div>
                        {transfer.location_name && (
                          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />{transfer.location_name}
                          </p>
                        )}
                        {completedActions(false)}
                      </div>
                    </div>
                  </div>
                );
              };

              // MODO SIN AGRUPAR
              if (!completedGroupByRef) {
                return (
                  <div className={completedViewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'}>
                    {filtered.map(renderCompletedCard)}
                  </div>
                );
              }

              // MODO AGRUPADO POR REFERENCIA
              const cGroups: Record<string, CompletedTransfer[]> = {};
              filtered.forEach((t) => {
                const key = t.sneaker_reference_code;
                if (!cGroups[key]) cGroups[key] = [];
                cGroups[key].push(t);
              });

              const toggleCompletedGroup = (key: string) => {
                setCompletedExpandedGroups((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) next.delete(key); else next.add(key);
                  return next;
                });
              };

              // Helper: item compacto dentro de grupo completado
              const renderCompletedGroupedItem = (transfer: CompletedTransfer) => {
                const isCompleted = transfer.status === 'completed';
                const statusLabel = isCompleted ? 'Completada' : 'Cancelada';
                const inventoryLabel = transfer.purpose === 'pair_formation'
                  ? (transfer.inventory_type === 'left_only' ? '🦶 Izq' : transfer.inventory_type === 'right_only' ? '🦶 Der' : '👟 Par')
                  : '👟 Par';
                const isReturn = String(transfer.purpose).toLowerCase().trim() === 'return';

                const itemActions = isCompleted && !isReturn ? (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Button onClick={() => handleSellFromCompletedTransfer(transfer)} className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] h-7 px-2" size="sm">
                      <DollarSign className="h-3 w-3 mr-1" /> Vender
                    </Button>
                    <Button onClick={() => handleGenerateReturn(transfer)} className="bg-muted text-muted-foreground hover:bg-muted/80 text-[10px] h-7 px-2" size="sm">
                      <Package className="h-3 w-3 mr-1" /> Devolver
                    </Button>
                  </div>
                ) : isReturn ? (
                  <span className="text-[10px] text-muted-foreground mt-1 inline-block">✅ Dev. completada</span>
                ) : null;

                return (
                  <div key={transfer.id} className={`flex items-start gap-3 p-2.5 rounded-lg border ${isCompleted ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5'}`}>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/70 text-white">{transfer.size}</span>
                      <span className="text-xs font-semibold text-muted-foreground">x{transfer.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isCompleted ? 'bg-success/80 text-white' : 'bg-error/80 text-white'}`}>{statusLabel}</span>
                        {transfer.pickup_type && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{transfer.pickup_type === 'corredor' ? '🚚 Corredor' : '🏃‍♂️ Vendedor'}</span>}
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{inventoryLabel}</span>
                        {isReturn && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/30 text-muted-foreground">🔄 Dev.</span>}
                      </div>
                      {transfer.location_name && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />{transfer.location_name}
                        </p>
                      )}
                      {itemActions}
                    </div>
                  </div>
                );
              };

              // Helper: agrupar cantidades por talla + inventory_type para completadas
              const completedSizeSummary = (items: CompletedTransfer[]) => {
                const sizeMap: Record<string, { qty: number; type: string }> = {};
                items.forEach((t) => {
                  const typeLabel = t.purpose === 'pair_formation'
                    ? (t.inventory_type === 'left_only' ? '🦶I' : t.inventory_type === 'right_only' ? '🦶D' : '👟')
                    : '👟';
                  const key = `${t.size}|${typeLabel}`;
                  if (!sizeMap[key]) sizeMap[key] = { qty: 0, type: typeLabel };
                  sizeMap[key].qty += t.quantity;
                });
                return Object.entries(sizeMap)
                  .map(([key, val]) => ({ size: key.split('|')[0], type: val.type, qty: val.qty }))
                  .sort((a, b) => parseFloat(a.size) - parseFloat(b.size) || a.type.localeCompare(b.type));
              };

              return (
                <div className="space-y-3">
                  {Object.entries(cGroups).map(([refCode, items]) => {
                    // Grupo con un solo elemento: formato de fila con acciones inline
                    if (items.length === 1) {
                      const t = items[0];
                      const isComp = t.status === 'completed';
                      const sLabel = isComp ? 'Completada' : 'Cancelada';
                      const invLabel = t.purpose === 'pair_formation'
                        ? (t.inventory_type === 'left_only' ? '🦶 Izq' : t.inventory_type === 'right_only' ? '🦶 Der' : '👟 Par')
                        : '👟 Par';
                      const isRet = String(t.purpose).toLowerCase().trim() === 'return';
                      return (
                        <div key={refCode} className={`border rounded-xl overflow-hidden transition-all duration-300 ${isComp ? 'border-success/30' : 'border-error/30'}`}>
                          <div className={`flex items-center gap-3 p-3 ${isComp ? 'bg-success/5' : 'bg-error/5'}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-1.5">
                                <h4 className="font-bold text-sm leading-tight truncate">{t.brand} {t.model}</h4>
                                <span className="text-sm font-semibold text-muted-foreground shrink-0">x{t.quantity}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white">{t.size}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isComp ? 'bg-success/80 text-white' : 'bg-error/80 text-white'}`}>{sLabel}</span>
                                {t.pickup_type && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{t.pickup_type === 'corredor' ? '🚚 Corredor' : '🏃‍♂️ Vendedor'}</span>}
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white">{invLabel}</span>
                                {isRet && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/30 text-muted-foreground">🔄 Dev.</span>}
                              </div>
                              {t.location_name && (
                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                                  <MapPin className="h-3 w-3 shrink-0" />{t.location_name}
                                </p>
                              )}
                              {isComp && !isRet && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  <Button onClick={() => handleSellFromCompletedTransfer(t)} className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] h-7 px-2" size="sm">
                                    <DollarSign className="h-3 w-3 mr-1" /> Vender
                                  </Button>
                                  <Button onClick={() => handleGenerateReturn(t)} className="bg-muted text-muted-foreground hover:bg-muted/80 text-[10px] h-7 px-2" size="sm">
                                    <Package className="h-3 w-3 mr-1" /> Devolver
                                  </Button>
                                </div>
                              )}
                              {isRet && <span className="text-[10px] text-muted-foreground mt-1 inline-block">✅ Dev. completada</span>}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const isExpanded = completedExpandedGroups.has(refCode);
                    const first = items[0];
                    const totalQty = items.reduce((s, t) => s + t.quantity, 0);
                    const allCompleted = items.every((t) => t.status === 'completed');
                    const sizeEntries = completedSizeSummary(items);

                    return (
                      <div key={refCode} className={`border rounded-xl overflow-hidden transition-all duration-300 ${allCompleted ? 'border-success/30' : 'border-error/30'}`}>
                        <button
                          onClick={() => toggleCompletedGroup(refCode)}
                          className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${allCompleted ? 'bg-success/5 hover:bg-success/10' : 'bg-error/5 hover:bg-error/10'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <h4 className="font-bold text-sm leading-tight truncate">{first.brand} {first.model}</h4>
                              <span className="text-sm font-semibold text-muted-foreground shrink-0">x{totalQty}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sizeEntries.map((entry, i) => (
                                <span key={`${entry.size}-${entry.type}-${i}`} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white">
                                  {entry.size} {entry.type} <span className="font-normal opacity-80">x{entry.qty}</span>
                                </span>
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {items.length} transferencias · {allCompleted ? <span className="text-success font-medium">Todas completadas</span> : <span className="text-error font-medium">{items.filter((t) => t.status === 'cancelled').length} cancelada{items.filter((t) => t.status === 'cancelled').length > 1 ? 's' : ''}</span>}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className={`p-3 border-t ${allCompleted ? 'border-success/20' : 'border-error/20'}`}>
                            <div className="space-y-2">
                              {items.map(renderCompletedGroupedItem)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <h3 className="text-base md:text-lg font-semibold">Historial del Día</h3>
          </CardHeader>
          <CardContent>
            {transferHistory.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <History className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm md:text-base">No hay movimientos registrados hoy</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {transferHistory.map((item) => (
                  <Card key={`${item.type}-${item.id}`} className="overflow-hidden border border-border">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Estado Visual */}
                        <div className={`w-full md:w-2 flex-shrink-0 ${item.status === 'selled' ? 'bg-info' :
                          item.status === 'completed' ? 'bg-success' :
                            item.status === 'cancelled' ? 'bg-destructive' :
                              item.status === 'returned' ? 'bg-warning' : 'bg-muted'
                          }`} />

                        <div className="flex-1 p-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            {/* Info Principal */}
                            <div className="flex items-start space-x-4">
                              <div className={`p-2 rounded-full flex-shrink-0 ${item.status === 'selled' ? 'bg-info/10 text-info' :
                                item.status === 'completed' ? 'bg-success/10 text-success' :
                                  item.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                                    'bg-warning/10 text-warning'
                                }`}>
                                {item.status === 'selled' ? <DollarSign className="h-5 w-5" /> :
                                  item.status === 'completed' ? <CheckCircle className="h-5 w-5" /> :
                                    item.status === 'cancelled' ? <XCircle className="h-5 w-5" /> :
                                      <History className="h-5 w-5" />}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-lg">{item.brand} {item.model}</h3>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${item.status === 'selled' ? 'bg-info/10 text-info border-info/20' :
                                    item.status === 'completed' ? 'bg-success/10 text-success border-success/20' :
                                      item.status === 'cancelled' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                        'bg-warning/10 text-warning border-warning/20'
                                    }`}>
                                    {item.status === 'selled' ? 'VENDIDO' :
                                      item.status === 'completed' ? 'COMPLETADO' :
                                        item.status === 'cancelled' ? 'CANCELADO' :
                                          'DEVOLUCIÓN'}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  REF: {item.sneaker_reference_code} • Talla: {item.size} • Cant: {item.quantity}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${item.type === 'return' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                                    }`}>
                                    {item.type === 'return' ? '🔄 Devolución' : '📦 Transferencia'}
                                  </span>
                                  {item.purpose && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
                                      🎯 {item.purpose === 'cliente' ? 'Cliente' :
                                        item.purpose === 'restock' ? 'Restock' :
                                          item.purpose === 'pair_formation' ? 'Formar Par' :
                                            item.purpose}
                                    </span>
                                  )}
                                  {item.inventory_type && item.inventory_type !== 'pair' && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-purple-100 text-purple-800 border-purple-200">
                                      👟 {item.inventory_type === 'left_only' ? 'Pie Izquierdo' : 'Pie Derecho'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {item.notes && <span className="ml-2">• {item.notes}</span>}
                                </p>
                                {/* Información de Envío y Ubicación */}
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  {(item.source_location_name || item.destination_location_name) && (
                                    <div className="flex items-center text-muted-foreground">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      <span className="truncate">
                                        {item.source_location_name || 'Origen'} ➝ {item.destination_location_name || 'Destino'}
                                      </span>
                                    </div>
                                  )}
                                  {item.pickup_type && (
                                    <div className="flex items-center text-muted-foreground">
                                      <Truck className="h-3 w-3 mr-1" />
                                      <span className="capitalize">
                                        Envío: {item.pickup_type === 'corredor' ? `🏃 Corredor${item.courier_name ? ` (${item.courier_name})` : ''}` : '👤 Vendedor'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Acciones ELIMINADAS para Historial - Solo lectura */}
                            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                              {item.status === 'selled' && item.total_amount && (
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Venta Total</p>
                                  <p className="font-bold text-success">${item.total_amount.toLocaleString()}</p>
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
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'new' && (
        <Card>
          <CardHeader>
            <h3 className="text-base md:text-lg font-semibold">
              Nueva Solicitud de Transferencia
              {prefilledProductData && (
                <span className="ml-2 text-sm font-normal text-blue-600">
                  (Datos del escáner)
                </span>
              )}
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNewRequest} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Código de Referencia {prefilledProductData?.sneaker_reference_code && '✅'}
                  </label>
                  <input
                    type="text"
                    value={requestForm.sneaker_reference_code}
                    onChange={(e) => setRequestForm({ ...requestForm, sneaker_reference_code: e.target.value })}
                    placeholder="AD-UB22-BLK-001"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground ${prefilledProductData?.sneaker_reference_code ? 'border-primary/30 bg-primary/10' : 'border-border'
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Marca {prefilledProductData?.brand && '✅'}
                  </label>
                  <input
                    type="text"
                    value={requestForm.brand}
                    onChange={(e) => setRequestForm({ ...requestForm, brand: e.target.value })}
                    placeholder="Adidas"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground ${prefilledProductData?.brand ? 'border-primary/30 bg-primary/10' : 'border-border'
                      }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Modelo {prefilledProductData?.model && '✅'}
                  </label>
                  <input
                    type="text"
                    value={requestForm.model}
                    onChange={(e) => setRequestForm({ ...requestForm, model: e.target.value })}
                    placeholder="Ultraboost 22"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground ${prefilledProductData?.model ? 'border-primary/30 bg-primary/10' : 'border-border'
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Talla {prefilledProductData?.size && '✅'}
                  </label>
                  <input
                    type="text"
                    value={requestForm.size}
                    onChange={(e) => setRequestForm({ ...requestForm, size: e.target.value })}
                    placeholder="9.5"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground ${prefilledProductData?.size ? 'border-primary/30 bg-primary/10' : 'border-border'
                      }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Propósito
                  </label>
                  <select
                    value={requestForm.purpose}
                    onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground"
                  >
                    <option value="cliente">🔥 Cliente Presente (Urgente)</option>
                    <option value="restock">📦 Restock (Normal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Recoge
                  </label>
                  <select
                    value={requestForm.pickup_type}
                    onChange={(e) => setRequestForm({ ...requestForm, pickup_type: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground"
                  >
                    <option value="vendedor">🏃‍♂️ Vendedor</option>
                    <option value="corredor">🚚 Corredor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Cantidad {prefilledProductData?.transfer_type && '✅'}
                  </label>
                  <input
                    type="number"
                    value={requestForm.quantity}
                    onChange={(e) => setRequestForm({ ...requestForm, quantity: parseInt(e.target.value) || 1 })}
                    min="1"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground border-border"
                  />
                </div>
              </div>

              {/* Selección de tipo de transferencia - Solo mostrar si hay opciones disponibles */}
              {prefilledProductData?.available_options && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-primary mb-3">
                    🎯 ¿Qué deseas solicitar desde {prefilledProductData.location_name}?
                  </h4>

                  <div className="space-y-3">
                    {/* Opción 1: Par Completo */}
                    {prefilledProductData.available_options.pairs_available && (
                      <label className="flex items-center space-x-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/20">
                        <input
                          type="radio"
                          name="transfer_type"
                          value="pair"
                          checked={requestForm.transfer_type === 'pair'}
                          onChange={() => {
                            setRequestForm(prev => ({
                              ...prev,
                              transfer_type: 'pair',
                              foot_side: undefined
                            }));
                          }}
                          className="text-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">👟 Par Completo</span>
                            <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">
                              {prefilledProductData.available_options.pairs_quantity} disponible(s)
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Solicitar par completo para venta inmediata
                          </p>
                        </div>
                      </label>
                    )}

                    {/* Opción 2: Pie Izquierdo */}
                    {prefilledProductData.available_options.left_feet_available && (
                      <label className="flex items-center space-x-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/20">
                        <input
                          type="radio"
                          name="transfer_type"
                          value="single_foot"
                          checked={requestForm.transfer_type === 'single_foot' && requestForm.foot_side === 'left'}
                          onChange={() => {
                            setRequestForm(prev => ({
                              ...prev,
                              transfer_type: 'single_foot',
                              foot_side: 'left'
                            }));
                          }}
                          className="text-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">🦶 Pie Izquierdo</span>
                            <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded">
                              {prefilledProductData.available_options.left_feet_quantity} disponible(s)
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Solicitar pie izquierdo para formar par con pie derecho local
                          </p>
                        </div>
                      </label>
                    )}

                    {/* Opción 3: Pie Derecho */}
                    {prefilledProductData.available_options.right_feet_available && (
                      <label className="flex items-center space-x-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/20">
                        <input
                          type="radio"
                          name="transfer_type"
                          value="single_foot"
                          checked={requestForm.transfer_type === 'single_foot' && requestForm.foot_side === 'right'}
                          onChange={() => {
                            setRequestForm(prev => ({
                              ...prev,
                              transfer_type: 'single_foot',
                              foot_side: 'right'
                            }));
                          }}
                          className="text-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">🦶 Pie Derecho</span>
                            <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded">
                              {prefilledProductData.available_options.right_feet_quantity} disponible(s)
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Solicitar pie derecho para formar par con pie izquierdo local
                          </p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Información adicional */}
                  <div className="mt-3 p-2 bg-muted/20 rounded text-xs text-muted-foreground">
                    💡 <strong>Tip:</strong> Los pies individuales se usan para formar pares completos con el inventario local
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground ${prefilledProductData ? 'border-primary/30 bg-primary/10' : 'border-border'
                    }`}
                  placeholder="Información adicional sobre la transferencia..."
                />
              </div>

              <Button type="submit" className="w-full text-sm md:text-base py-3">
                <Plus className="h-4 w-4 mr-2" />
                Solicitar Transferencia
                {prefilledProductData && (
                  <span className="ml-2 text-xs opacity-80">
                    (Desde Escáner)
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'incoming' && (
        <Card>
          <CardHeader>
            <h3 className="text-base md:text-lg font-semibold">Solicitudes de Otros Vendedores</h3>
          </CardHeader>
          <CardContent>
            {incomingTransfers.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <ArrowDownCircle className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm md:text-base">No tienes solicitudes entrantes</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {incomingTransfers.map((transfer) => (
                  <div key={transfer.id} className="border border-border rounded-lg p-3 md:p-4 bg-card shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-3 md:space-y-0">
                      <div className="flex-1 min-w-0">
                        {/* Imagen del producto */}
                        {transfer.product_image && (
                          <div className="mb-3">
                            <img
                              src={transfer.product_image}
                              alt={`${transfer.brand} ${transfer.model}`}
                              className="w-32 h-48 object-cover rounded-lg border border-border"
                            />
                          </div>
                        )}

                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${transfer.status === 'pending' ? 'bg-warning/10 text-warning' :
                            transfer.status === 'accepted' ? 'bg-info/10 text-info' :
                              transfer.status === 'courier_assigned' ? 'bg-primary/10 text-primary' :
                                'bg-success/10 text-success'
                            }`}>
                            {transfer.status === 'pending' ? '⏳ Pendiente' :
                              transfer.status === 'accepted' ? (transfer.pickup_type === 'corredor' ? '⏳ Esperando corredor' : '✅ Aceptada') :
                                transfer.status === 'courier_assigned' ? '🚚 Corredor asignado' :
                                  transfer.status === 'in_transit' ? '🚚 En Tránsito' : transfer.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Hace {transfer.time_elapsed}
                          </span>
                        </div>

                        <h4 className="font-semibold text-sm md:text-lg truncate">
                          {transfer.brand} {transfer.model}
                        </h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          Código: {transfer.sneaker_reference_code} | Talla: {transfer.size}
                        </p>

                        <div className="mt-2 p-2 bg-muted/10 rounded-md border border-muted/20">
                          <p className="text-xs md:text-sm">
                            <strong>Solicitado por:</strong> {transfer.requester_name}
                          </p>
                          <p className="text-xs md:text-sm mt-1">
                            <strong>Tipo:</strong> {transfer.inventory_type === 'pair' ? '👟 Par Completo' :
                              transfer.inventory_type === 'left_only' ? '🦶 Pie Izquierdo' : '🦶 Pie Derecho'}
                          </p>
                          <p className="text-xs md:text-sm mt-1">
                            <strong>Envío:</strong> {transfer.pickup_type === 'corredor' ? '🚚 Corredor' : '🏃‍♂️ Vendedor'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-3 md:mt-0 md:ml-4">
                        {transfer.status === 'pending' && (
                          <Button
                            onClick={() => handleAcceptIncomingTransfer(transfer.id)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm w-full md:w-auto"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aceptar Solicitud
                          </Button>
                        )}

                        {/* Botón de Despacho: depende del pickup_type */}
                        {((transfer.pickup_type === 'vendedor' && transfer.status === 'accepted') ||
                          (transfer.pickup_type === 'corredor' && transfer.status === 'courier_assigned')) && (
                            <Button
                              onClick={() => handleDispatchIncomingTransfer(transfer.id)}
                              className="bg-success hover:bg-success/90 text-success-foreground text-sm w-full md:w-auto"
                              size="sm"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Despachar Producto
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

      {/* *** NUEVO MODAL DE DEVOLUCIÓN *** */}
      {showReturnModal && selectedTransferForReturn && (
        <ReturnModal
          transfer={selectedTransferForReturn}
          onClose={handleReturnModalClose}
          onSuccess={loadTransfersData}
        />
      )}
    </div>
  );
};