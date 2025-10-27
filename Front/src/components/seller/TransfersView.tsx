import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { vendorAPI } from '../../services/transfersAPI';
import { PendingTransferItem, PendingTransfersResponse } from '../../types';
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
  DollarSign
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
  id: number;
  status: 'completed' | 'cancelled';
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  purpose: 'cliente' | 'restock' | 'pair_formation';
  priority: 'high' | 'normal';
  requested_at: string;
  completed_at: string | null;
  duration: string;
  next_action: string;
  product_image?: string; // Campo opcional para la imagen
}

export const TransfersView: React.FC<TransfersViewProps> = ({ 
  onTransferRequested,
  prefilledProductData,
  onSellProduct 
}) => {
  // Usar onSellProduct como prop, igual que en ProductScanner
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'new'>('pending');
  
  // *** ESTADOS ACTUALIZADOS PARA ENDPOINTS CORRECTOS ***
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransferItem[]>([]);
  const [completedTransfers, setCompletedTransfers] = useState<CompletedTransfer[]>([]);
  
  // *** NUEVOS ESTADOS PARA DEVOLUCIONES ***
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedTransferForReturn, setSelectedTransferForReturn] = useState<any>(null);
  const [isCreatingReturn, setIsCreatingReturn] = useState(false);
  
  // Estados de resumen
  const [urgentCount, setUrgentCount] = useState(0);
  const [normalCount, setNormalCount] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [todayStats, setTodayStats] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para UI responsivo
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    pickup_type: 'corredor',
    destination_type: 'exhibicion',
    notes: '',
    transfer_type: 'pair',
    foot_side: undefined
  });

  // Effect para manejar datos prefilled
  useEffect(() => {
    if (prefilledProductData) {
      // Determinar cantidad basada en el tipo de transferencia
      let quantity = 1;
      if (prefilledProductData.transfer_type === 'form_pair') {
        quantity = Math.min(prefilledProductData.left_feet || 0, prefilledProductData.right_feet || 0);
      } else if (prefilledProductData.pairs && prefilledProductData.pairs > 0) {
        quantity = prefilledProductData.pairs;
      }

      setRequestForm({
        source_location_id: prefilledProductData.source_location_id ?? undefined,
        destination_location_id: user?.location_id ?? undefined,
        sneaker_reference_code: prefilledProductData.sneaker_reference_code || '',
        brand: prefilledProductData.brand || '',
        model: prefilledProductData.model || '',
        size: prefilledProductData.size || '',
        quantity: quantity,
        purpose: 'cliente',
        pickup_type: 'corredor',
        destination_type: 'exhibicion',
        notes: prefilledProductData.request_notes || `Solicitud desde escáner - Color: ${prefilledProductData.color || 'N/A'}`,
        transfer_type: 'pair', // Por defecto par completo
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

      // *** CARGAR TRANSFERENCIAS COMPLETADAS ***
      console.log('🔄 Cargando transferencias completadas...');
      const completedResponse = await vendorAPI.getCompletedTransfers();
      
      if (completedResponse.success) {
        setCompletedTransfers(completedResponse.completed_transfers || []);
        setTodayStats(completedResponse.today_stats || null);
        console.log('✅ Transferencias completadas cargadas:', completedResponse.completed_transfers?.length || 0);
      }
      
    } catch (err: any) {
      console.error('Error loading transfers:', err);
      setError('Error conectando con el servidor');
      setPendingTransfers([]);
      setCompletedTransfers([]);
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
        pickup_type: 'corredor',
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
  const handleGenerateReturn = (transfer: CompletedTransfer) => {
    // Convertir CompletedTransfer al formato que espera el modal
    const transferForReturn: any = {
      id: transfer.id,
      sneaker_reference_code: transfer.sneaker_reference_code,
      brand: transfer.brand,
      model: transfer.model,
      size: transfer.size,
      quantity: transfer.quantity,
      product_image: transfer.product_image
    };
    setSelectedTransferForReturn(transferForReturn);
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async (returnData: any) => {
    if (!selectedTransferForReturn) return;

    setIsCreatingReturn(true);
    try {
      console.log('🔄 Creando devolución...', returnData);
      
      const response = await vendorAPI.createReturn(returnData);
      
      console.log('✅ Devolución creada:', response);
      
      // Mostrar mensaje de éxito con detalles del flujo
      alert(`${response.message}\n\nID: ${response.return_id}\nTiempo estimado: ${response.estimated_return_time}\n\nPróxima acción: ${response.next_action}`);
      
      // Cerrar modal y recargar datos
      setShowReturnModal(false);
      setSelectedTransferForReturn(null);
      loadTransfersData();
      
    } catch (err: any) {
      console.error('❌ Error creando devolución:', err);
      alert('Error creando devolución: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsCreatingReturn(false);
    }
  };

  const handleReturnModalClose = () => {
    setShowReturnModal(false);
    setSelectedTransferForReturn(null);
  };

  const handleConfirmReception = async (transfer: PendingTransferItem) => {
  try {
    // Confirmar recepción solamente
    await vendorAPI.confirmReception(transfer.id, 1, true, 'Producto recibido correctamente');
    
    // Mensaje de éxito
    alert('✅ Recepción confirmada exitosamente.\n\nEl producto ahora aparecerá en "Transferencias Completadas" donde podrás venderlo o generar una devolución si es necesario.');
    
    // Recargar datos para actualizar las listas
    loadTransfersData();
    
  } catch (err: any) {
    console.error('Error en confirmar recepción:', err);
    alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
  }
};

  // Nueva función para vender desde transferencias completadas
  const handleSellFromCompletedTransfer = (transfer: CompletedTransfer) => {
    console.log('📦 Transferencia seleccionada para venta:', transfer);
    console.log('🔑 Transfer ID:', transfer.id);
    
    // Preparar datos para SalesForm incluyendo el transfer_id
    const salesData = {
      code: transfer.sneaker_reference_code,
      brand: transfer.brand,
      model: transfer.model,
      size: transfer.size,
      price: 0, // No disponible en el endpoint, el vendedor deberá ingresarlo
      location: 'Local Actual', // No disponible en el endpoint
      storage_type: 'display',
      color: 'N/A', // No disponible en el endpoint
      image: transfer.product_image || undefined,
      transfer_id: transfer.id // Agregar el ID de la transferencia
    };
    
    console.log('📤 Datos que se enviarán a SalesForm:', salesData);
    console.log('🔑 Transfer ID en salesData:', salesData.transfer_id);
    
    // Llamar callback para abrir SalesForm
    if (onSellProduct) {
      console.log('✅ Llamando a onSellProduct con transfer_id:', salesData.transfer_id);
      onSellProduct(salesData);
    } else {
      console.error('❌ onSellProduct no está definido');
      alert('Error: No se puede abrir el formulario de ventas. onSellProduct no está definido.');
    }
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

      {/* Resumen de transferencias */}
      {totalPending > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-muted/20 p-3 rounded-lg">
                <p className="text-2xl font-bold text-muted-foreground">{totalPending}</p>
                <p className="text-xs text-muted-foreground">Total Pendientes</p>
              </div>
              {urgentCount > 0 && (
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-destructive">{urgentCount}</p>
                  <p className="text-xs text-destructive">🔥 Urgentes</p>
                </div>
              )}
              {normalCount > 0 && (
                <div className="bg-success/10 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-success">{normalCount}</p>
                  <p className="text-xs text-success">✅ Normales</p>
                </div>
              )}
              {todayStats && (
                <div className="bg-success/10 p-3 rounded-lg border border-success/20">
                  <p className="text-2xl font-bold text-success">{todayStats.completed || 0}</p>
                  <p className="text-xs text-success">Completadas Hoy</p>
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
                {activeTab === 'completed' && <History className="h-4 w-4 text-primary" />}
                {activeTab === 'new' && <Plus className="h-4 w-4 text-primary" />}
                <span className="font-medium">
                  {activeTab === 'pending' && `Recepciones por Confirmar (${totalPending})`}
                  {activeTab === 'completed' && 'Historial del Día'}
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
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-muted/20 ${
                    activeTab === 'pending' ? 'bg-primary/10 text-primary' : ''
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
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-muted/20 border-t ${
                    activeTab === 'completed' ? 'bg-primary/10 text-primary' : ''
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
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-muted/20 border-t ${
                    activeTab === 'new' ? 'bg-primary/10 text-primary' : ''
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
              Pendientes ({pendingTransfers.length})
            </Button>
            <Button
              variant={activeTab === 'completed' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('completed')}
              size="sm"
              className="flex-1 md:flex-none text-xs md:text-sm"
            >
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Completadas ({completedTransfers.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <h3 className="text-base md:text-lg font-semibold">Transferencias Pendientes de Confirmación</h3>
          </CardHeader>
          <CardContent>
            {pendingTransfers.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Package className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm md:text-base">No tienes transferencias pendientes</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {pendingTransfers
                  .sort((a, b) => {
                    // Ordenar por porcentaje de avance de mayor a menor
                    const progressA = getProgressPercentage(a);
                    const progressB = getProgressPercentage(b);
                    return progressB - progressA;
                  })
                  .map((transfer) => (
                  <div key={transfer.id} className="border border-border rounded-lg p-3 md:p-4 bg-card shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-3 md:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="mb-4">
                            <div className="bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg flex items-center justify-center">
                              <img
                                src={transfer.product_image}
                                className="w-32 h-48 object-cover rounded-lg border border-border"
                                alt={`${transfer.brand} ${transfer.model}`}
                              />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(transfer)}`}>
                            {getStatusIcon(transfer)}
                            <span>{getStatusText(transfer)}</span>
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transfer.pickup_type === 'corredor' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                          }`}>
                            {transfer.pickup_type === 'corredor' ? '🚚 Corredor' : '🏃‍♂️ Vendedor'}
                          </span>
                          {transfer.purpose === 'return' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted/10 text-muted-foreground">
                              🔄 Devolución
                            </span>
                          )}
                          {transfer.purpose === 'pair_formation' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              🔗 Formar Par
                            </span>
                          )}
                        </div>

                        {/* Barra de progreso */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Progreso</span>
                            <span className="text-xs font-bold text-primary">{getProgressPercentage(transfer)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(getProgressPercentage(transfer))}`}
                              style={{ width: `${getProgressPercentage(transfer)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <h4 className="font-semibold text-sm md:text-lg truncate">
                          {transfer.brand} {transfer.model}
                        </h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          Código: {transfer.sneaker_reference_code} | Talla: {transfer.size} | Cantidad: {transfer.quantity}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {getNextAction(transfer)}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        
                        {/* Botones de acción */}
                        <div className="flex flex-col space-y-2 mt-3">
                          {/* Botones para pickup_type 'corredor' */}
                          {transfer.pickup_type === 'corredor' && (
                            <>
                              {transfer.status === 'delivered' && (
                                <Button
                                  onClick={() => handleConfirmReception(transfer)}
                                  className="bg-success hover:bg-success/90 text-success-foreground text-sm w-full"
                                  size="sm"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirmar Recepción
                                </Button>
                              )}
                              
                              {transfer.status === 'pending' && (
                                <Button
                                  onClick={() => handleCancelTransfer(transfer.id)}
                                  className="bg-error hover:bg-error/90 text-error-foreground text-sm w-full"
                                  size="sm"
                                  variant="outline"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </Button>
                              )}
                            </>
                          )}

                          {/* Botones para pickup_type 'vendedor' */}
                          {transfer.pickup_type === 'vendedor' && (
                            <>
                              {/* CASO 1: Devolución - Status accepted - Debes llevar el producto a bodega */}
                              {transfer.purpose === 'return' && transfer.status === 'accepted' && (
                                <>
                                  <div className="p-3 bg-muted/10 border border-muted/20 rounded-lg mb-2">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium text-muted-foreground">
                                        🔄 Devolución: Debes llevar el producto a la bodega
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Lleva el producto personalmente a la bodega para completar la devolución.
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => handleDeliverReturnToWarehouse(transfer.id)}
                                    className="bg-muted text-muted-foreground hover:bg-muted/80 text-sm w-full"
                                    size="sm"
                                  >
                                    <Package className="h-4 w-4 mr-2" />
                                    Entregar a Bodeguero
                                  </Button>
                                </>
                              )}
                              
                              {/* CASO 2: Transferencia normal - Status accepted - Debes ir a recoger */}
                              {transfer.purpose !== 'return' && transfer.status === 'accepted' && (
                                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4 text-warning" />
                                    <span className="text-sm font-medium text-warning">
                                      Debes ir a recoger el producto a la bodega
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* CASO 3: Status delivered - Confirmar recepción */}
                              {transfer.status === 'delivered' && (
                                <Button
                                  onClick={() => handleConfirmReception(transfer)}
                                  className="bg-success hover:bg-success/90 text-success-foreground text-sm w-full"
                                  size="sm"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirmar Recepción
                                </Button>
                              )}
                              
                              {/* CASO 4: Status pending - Cancelar */}
                              {transfer.status === 'pending' && (
                                <Button
                                  onClick={() => handleCancelTransfer(transfer.id)}
                                  className="bg-error hover:bg-error/90 text-error-foreground text-sm w-full"
                                  size="sm"
                                  variant="outline"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Información de participantes */}
                    <div className="mt-3 p-2 md:p-3 bg-muted/5 border border-border rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
                        {transfer.pickup_type === 'corredor' ? (
                          <>
                            <div>
                              <strong>Corredor:</strong> {getCourierName(transfer)}
                            </div>
                            <div>
                              <strong>Bodeguero:</strong> {transfer.warehouse_keeper_name || 'Sin asignar'}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <strong>Bodeguero:</strong> {transfer.warehouse_keeper_name || 'Sin asignar'}
                            </div>
                            <div>
                              <strong>Tipo:</strong> Recogida por vendedor
                            </div>
                          </>
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

      {activeTab === 'completed' && (
        <Card>
          <CardHeader>
            <h3 className="text-base md:text-lg font-semibold">Transferencias Completadas</h3>
            {todayStats && (
              <div className="flex space-x-4 mt-2 text-sm text-muted-foreground">
                <span>Total: {todayStats.total_transfers}</span>
                <span>Completadas: {todayStats.completed}</span>
                <span>Éxito: {todayStats.success_rate?.toFixed(1)}%</span>
                <span>Promedio: {todayStats.average_duration}</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {completedTransfers.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm md:text-base">No hay transferencias completadas hoy</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {completedTransfers.map((transfer) => (
                  <div key={transfer.id} className="border border-border rounded-lg p-3 md:p-4 bg-card shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-3 md:space-y-0">
                      <div className="flex-1 min-w-0">
                        {/* Imagen del producto */}
                        <div className="mb-4">
                          <div className="bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg flex items-center justify-center">
                            {transfer.product_image && (
                              <img
                                src={transfer.product_image}
                                className="w-32 h-48 object-cover rounded-lg border border-border"
                                alt={`${transfer.brand} ${transfer.model}`}
                              />
                            )}
                          </div>
                        </div>

                        {/* Estado */}
                        <div className="flex items-center space-x-2 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transfer.status === 'completed' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                          }`}>
                            {transfer.status === 'completed' ? '✅ Completada' : '❌ Cancelada'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transfer.priority === 'high' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                          }`}>
                            {transfer.priority === 'high' ? '🔥 Urgente' : '📦 Normal'}
                          </span>
                          {transfer.purpose === 'pair_formation' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              🔗 Formar Par
                            </span>
                          )}
                        </div>

                        {/* Información del producto */}
                        <h4 className="font-semibold text-sm md:text-lg truncate mb-2">
                          {transfer.brand} {transfer.model}
                        </h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate mb-2">
                          Código: {transfer.sneaker_reference_code} | Talla: {transfer.size} | Cantidad: {transfer.quantity}
                        </p>

                        {/* Propósito */}
                        <div className="text-xs md:text-sm mb-3">
                          <span className="text-muted-foreground">Propósito:</span>
                          <span className="font-medium ml-1">
                            {transfer.purpose === 'cliente' ? '🏃‍♂️ Cliente' : 
                             transfer.purpose === 'pair_formation' ? '🔗 Formar Par' : '📦 Restock'}
                          </span>
                        </div>

                        {/* Fechas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                          <div>
                            <strong>Solicitado:</strong> {new Date(transfer.requested_at).toLocaleString()}
                          </div>
                          <div>
                            <strong>Completado:</strong> {transfer.completed_at ? new Date(transfer.completed_at).toLocaleString() : 'N/A'}
                          </div>
                          <div>
                            <strong>Duración:</strong> {transfer.duration}
                          </div>
                        </div>

                        {/* Botones de acción - SOLO para transferencias completadas */}
                        {transfer.status === 'completed' && (
                          <div className="flex flex-col md:flex-row gap-2 mt-3">
                            <Button
                              onClick={() => handleGenerateReturn(transfer)}
                              className="bg-muted text-muted-foreground hover:bg-muted/80 text-sm flex-1"
                              size="sm"
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Generar Devolución
                            </Button>
                            <Button
                              onClick={() => handleSellFromCompletedTransfer(transfer)}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm flex-1"
                              size="sm"
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Vender
                            </Button>
                          </div>
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
                    onChange={(e) => setRequestForm({...requestForm, sneaker_reference_code: e.target.value})}
                    placeholder="AD-UB22-BLK-001"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground ${
                      prefilledProductData?.sneaker_reference_code ? 'border-primary/30 bg-primary/10' : 'border-border'
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
                    onChange={(e) => setRequestForm({...requestForm, brand: e.target.value})}
                    placeholder="Adidas"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground ${
                      prefilledProductData?.brand ? 'border-primary/30 bg-primary/10' : 'border-border'
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
                    onChange={(e) => setRequestForm({...requestForm, model: e.target.value})}
                    placeholder="Ultraboost 22"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground ${
                      prefilledProductData?.model ? 'border-primary/30 bg-primary/10' : 'border-border'
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
                    onChange={(e) => setRequestForm({...requestForm, size: e.target.value})}
                    placeholder="9.5"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground ${
                      prefilledProductData?.size ? 'border-primary/30 bg-primary/10' : 'border-border'
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
                    onChange={(e) => setRequestForm({...requestForm, purpose: e.target.value})}
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
                    onChange={(e) => setRequestForm({...requestForm, pickup_type: e.target.value})}
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
                    onChange={(e) => setRequestForm({...requestForm, quantity: parseInt(e.target.value) || 1})}
                    min="1"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground ${
                      prefilledProductData?.transfer_type ? 'border-primary/30 bg-primary/10' : 'border-border'
                    }`}
                  />
                  {prefilledProductData?.transfer_type && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Cantidad calculada automáticamente según disponibilidad
                    </p>
                  )}
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
                              foot_side: undefined,
                              quantity: prefilledProductData.available_options?.pairs_quantity || 1
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
                              foot_side: 'left',
                              quantity: prefilledProductData.available_options?.left_feet_quantity || 1
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
                              foot_side: 'right',
                              quantity: prefilledProductData.available_options?.right_feet_quantity || 1
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
                  onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base bg-card text-foreground ${
                    prefilledProductData ? 'border-primary/30 bg-primary/10' : 'border-border'
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

      {/* *** NUEVO MODAL DE DEVOLUCIÓN *** */}
      {showReturnModal && selectedTransferForReturn && (
        <ReturnModal
          transfer={selectedTransferForReturn}
          onClose={handleReturnModalClose}
          onSubmit={handleReturnSubmit}
          isSubmitting={isCreatingReturn}
        />
      )}
    </div>
  );
};