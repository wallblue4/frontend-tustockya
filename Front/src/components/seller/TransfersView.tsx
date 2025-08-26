import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { vendorAPI } from '../../services/transfersAPI';

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
  User,
  MapPin,
  Calendar,
  History
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
  } | null;
}

// *** INTERFACES ACTUALIZADAS SEGÚN DOCUMENTACIÓN ***

// Interfaz para transferencia pendiente (recepciones por confirmar)
interface PendingTransfer {
  id: number;
  status: 'pending' | 'accepted' | 'courier_assigned' | 'in_transit' | 'delivered';
  status_info: {
    status: string;
    title: string;
    description: string;
    detail?: string;
    action_required?: string;
    next_step?: string;
    estimated_time?: string;
    urgency: 'high' | 'medium' | 'normal';
    can_cancel: boolean;
    progress_percentage: number;
    courier_info?: {
      name: string;
      email: string;
      picked_up_at?: string;
    };
  };
  product_info: {
    reference_code: string;
    brand: string;
    model: string;
    size: string;
    quantity: number;
    color: string;
    price: number;
    image?: string;
    full_description: string;
  };
  location_info: {
    from: {
      name: string;
      address: string;
      phone: string;
    };
    to: {
      name: string;
      address: string;
    };
  };
  purpose_info: {
    purpose: string;
    description: string;
    priority: string;
    destination_type: string;
    storage_location: string;
  };
  timeline: Array<{
    step: string;
    title: string;
    timestamp: string | null;
    completed: boolean;
    description: string;
  }>;
  hours_since_request: number;
  days_since_request: number;
  hours_in_current_state: number;
}

// Interfaz para transferencia completada (historial)
interface CompletedTransfer {
  id: number;
  status: 'completed' | 'cancelled';
  result_info: {
    result: 'success' | 'cancelled';
    title: string;
    description: string;
    color: 'green' | 'red';
    icon: string;
  };
  product_info: {
    reference_code: string;
    brand: string;
    model: string;
    size: string;
    quantity: number;
    color: string;
    price: number;
    total_value: number;
    image?: string;
    full_description: string;
  };
  time_info: {
    requested_at: string;
    completed_at: string;
    duration: string;
    duration_hours: number;
  };
  locations: {
    from: string;
    to: string;
  };
  participants: {
    warehouse_keeper: string;
    courier: string;
  };
  purpose: {
    type: string;
    description: string;
    urgent: boolean;
  };
  notes?: string;
  reception_notes?: string;
}

export const TransfersView: React.FC<TransfersViewProps> = ({ 
  onTransferRequested,
  prefilledProductData 
}) => {
  const [activeTab, setActiveTab] = useState('pending');
  
  // *** ESTADOS ACTUALIZADOS PARA ENDPOINTS CORRECTOS ***
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [completedTransfers, setCompletedTransfers] = useState<CompletedTransfer[]>([]);
  
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
    notes: ''
  });

  // Effect para manejar datos prefilled
  useEffect(() => {
    if (prefilledProductData) {
      setRequestForm({
        source_location_id: prefilledProductData.source_location_id ?? undefined,
        destination_location_id: user?.location_id ?? undefined,
        sneaker_reference_code: prefilledProductData.sneaker_reference_code || '',
        brand: prefilledProductData.brand || '',
        model: prefilledProductData.model || '',
        size: prefilledProductData.size || '',
        quantity: 1,
        purpose: 'cliente',
        pickup_type: 'corredor',
        destination_type: 'exhibicion',
        notes: `Solicitud desde escáner - Color: ${prefilledProductData.color || 'N/A'}`
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
        setPendingTransfers(pendingResponse.pending_transfers || []);
        setUrgentCount(pendingResponse.urgent_count || 0);
        setNormalCount(pendingResponse.normal_count || 0);
        setTotalPending(pendingResponse.total_pending || 0);
        console.log('✅ Transferencias pendientes cargadas:', pendingResponse.pending_transfers?.length || 0);
      }
      
      // Cargar transferencias completadas (historial)
      console.log('🔄 Cargando transferencias completadas...');
      const completedResponse = await vendorAPI.getCompletedTransfers(); // Usa /vendor/completed-transfers
      
      if (completedResponse.success) {
        setCompletedTransfers(completedResponse.completed_transfers || []);
        setTodayStats(completedResponse.today_stats);
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
      const response = await vendorAPI.requestTransfer(transferPayload);
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
        notes: ''
      });
      setActiveTab('pending');
      loadTransfersData();
    } catch (err: any) {
      console.error('Error enviando solicitud:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  // *** FUNCIÓN ACTUALIZADA - Confirmar recepción para transferencias pendientes ***
  const handleConfirmReception = async (transferId: number) => {
    try {
      await vendorAPI.confirmReception(transferId, 1, true, 'Producto recibido correctamente');
      alert('Recepción confirmada exitosamente');
      loadTransfersData(); // Recargar datos
    } catch (err: any) {
      console.error('Error confirmando recepción:', err);
      alert('Error confirmando recepción: ' + (err instanceof Error ? err.message : 'Error desconocido'));
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

  // *** FUNCIONES HELPER ACTUALIZADAS ***
  
  // Función para calcular tiempo transcurrido
  const parseTimeElapsed = (hoursInState: number): string => {
    if (hoursInState < 1) {
      const minutes = Math.floor(hoursInState * 60);
      return `${minutes}m`;
    }
    const hours = Math.floor(hoursInState);
    const minutes = Math.floor((hoursInState % 1) * 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Función para obtener el nombre del corredor
  const getCourierName = (transfer: PendingTransfer): string => {
    return transfer.status_info.courier_info?.name || 'Sin asignar';
  };

  // La próxima acción para transferencias pendientes
  const getNextAction = (transfer: PendingTransfer): string => {
    if (transfer.status_info.action_required === 'confirm_reception') {
      return '🔥 REQUIERE CONFIRMACIÓN DE RECEPCIÓN';
    }
    return transfer.status_info.next_step || 'En proceso...';
  };

  const getStatusColor = (transfer: PendingTransfer) => {
    switch (transfer.status_info.urgency) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusIcon = (transfer: PendingTransfer) => {
    switch (transfer.status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'courier_assigned':
        return <User className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusText = (transfer: PendingTransfer): string => {
    return transfer.status_info.title;
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
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-3">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-blue-800">
                  Producto desde Escáner IA
                </p>
                <p className="text-sm text-blue-700 truncate">
                  {prefilledProductData.brand} {prefilledProductData.model} - Talla {prefilledProductData.size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de transferencias */}
      {totalPending > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{totalPending}</p>
                <p className="text-xs text-gray-600">Total Pendientes</p>
              </div>
              {urgentCount > 0 && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
                  <p className="text-xs text-red-600">🔥 Urgentes</p>
                </div>
              )}
              {normalCount > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{normalCount}</p>
                  <p className="text-xs text-green-600">✅ Normales</p>
                </div>
              )}
              {todayStats && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{todayStats.completed || 0}</p>
                  <p className="text-xs text-blue-600">Completadas Hoy</p>
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
              className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white"
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
                    <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                      ●
                    </span>
                  )}
                </span>
              </div>
              {showMobileMenu ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showMobileMenu && (
              <div className="mt-2 border border-gray-300 rounded-lg bg-white shadow-lg">
                <button
                  onClick={() => {
                    setActiveTab('pending');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 ${
                    activeTab === 'pending' ? 'bg-blue-50 text-blue-700' : ''
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
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 border-t ${
                    activeTab === 'completed' ? 'bg-blue-50 text-blue-700' : ''
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
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 border-t ${
                    activeTab === 'new' ? 'bg-blue-50 text-blue-700' : ''
                  } ${prefilledProductData ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    Nueva Solicitud
                    {prefilledProductData && (
                      <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
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
              className={prefilledProductData ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
              {prefilledProductData && (
                <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  ●
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-amber-600 flex-shrink-0" />
              <p className="text-amber-800 text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content based on active tab */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <h3 className="text-base md:text-lg font-semibold">Transferencias Pendientes de Confirmación</h3>
          </CardHeader>
          <CardContent>
            {pendingTransfers.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Package className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm md:text-base">No tienes transferencias pendientes</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {pendingTransfers.map((transfer) => (
                  <div key={transfer.id} className="border rounded-lg p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-3 md:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(transfer)}`}>
                            {getStatusIcon(transfer)}
                            <span>{getStatusText(transfer)}</span>
                          </span>
                          {transfer.status_info.urgency === 'high' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🔥 URGENTE
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-sm md:text-lg truncate">
                          {transfer.product_info.brand} {transfer.product_info.model}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600 truncate">
                          Código: {transfer.product_info.reference_code} | Talla: {transfer.product_info.size} | Cantidad: {transfer.product_info.quantity}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500">
                          {getNextAction(transfer)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Tiempo en estado actual: {parseTimeElapsed(transfer.hours_in_current_state)}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs md:text-sm text-gray-500">Progreso</p>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${transfer.status_info.progress_percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">{transfer.status_info.progress_percentage}%</p>
                        
                        {/* Botones de acción */}
                        <div className="flex flex-col space-y-2 mt-3">
                          {transfer.status === 'delivered' && (
                            <Button
                              onClick={() => handleConfirmReception(transfer.id)}
                              className="bg-green-600 hover:bg-green-700 text-sm w-full"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmar Recepción
                            </Button>
                          )}
                          
                          {transfer.status_info.can_cancel && (
                            <Button
                              onClick={() => handleCancelTransfer(transfer.id)}
                              className="bg-red-600 hover:bg-red-700 text-sm w-full"
                              size="sm"
                              variant="outline"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Información de ubicaciones */}
                    <div className="mt-3 p-2 md:p-3 bg-blue-50 rounded-md">
                      <p className="text-xs md:text-sm">
                        <strong>Desde:</strong> {transfer.location_info.from.name} → <strong>Hacia:</strong> {transfer.location_info.to.name}
                      </p>
                      {transfer.status_info.courier_info && (
                        <p className="text-xs md:text-sm mt-1">
                          <strong>Corredor:</strong> {transfer.status_info.courier_info.name}
                        </p>
                      )}
                    </div>

                    {/* Timeline visual */}
                    {transfer.timeline && (
                      <div className="mt-3 p-2 md:p-3 bg-gray-50 rounded-md">
                        <p className="text-xs font-medium text-gray-700 mb-2">Progreso de la transferencia:</p>
                        <div className="space-y-1">
                          {transfer.timeline.slice(-3).map((step, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs">
                              <div className={`w-2 h-2 rounded-full ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className={step.completed ? 'text-green-700' : 'text-gray-500'}>
                                {step.title}
                              </span>
                              {step.timestamp && (
                                <span className="text-gray-400">
                                  {new Date(step.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
            <h3 className="text-base md:text-lg font-semibold">Historial de Transferencias del Día</h3>
            {todayStats && (
              <div className="text-sm text-gray-600">
                {todayStats.completed} completadas • {todayStats.cancelled} canceladas • {todayStats.success_rate}% éxito
              </div>
            )}
          </CardHeader>
          <CardContent>
            {completedTransfers.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <History className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm md:text-base">No hay transferencias completadas hoy</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {completedTransfers.map((transfer) => (
                  <div key={transfer.id} className="border rounded-lg p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-3 md:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                            transfer.result_info.result === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <span>{transfer.result_info.icon}</span>
                            <span>{transfer.result_info.title}</span>
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-sm md:text-lg truncate">
                          {transfer.product_info.brand} {transfer.product_info.model}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600 truncate">
                          Código: {transfer.product_info.reference_code} | Talla: {transfer.product_info.size}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500">
                          {transfer.result_info.description}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs md:text-sm text-gray-500">Duración</p>
                        <p className="font-medium text-sm md:text-base">{transfer.time_info.duration}</p>
                        <p className="text-xs text-gray-400">
                          {transfer.time_info.requested_at} - {transfer.time_info.completed_at}
                        </p>
                        {transfer.result_info.result === 'success' && (
                          <p className="text-xs font-medium text-green-600 mt-1">
                            ${transfer.product_info.total_value.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 p-2 md:p-3 bg-gray-50 rounded-md">
                      <p className="text-xs md:text-sm">
                        <strong>Ruta:</strong> {transfer.locations.from} → {transfer.locations.to}
                      </p>
                      <p className="text-xs md:text-sm mt-1">
                        <strong>Participantes:</strong> {transfer.participants.warehouse_keeper} (Bodeguero) • {transfer.participants.courier} (Corredor)
                      </p>
                      {transfer.notes && (
                        <p className="text-xs md:text-sm mt-1">
                          <strong>Notas:</strong> {transfer.notes}
                        </p>
                      )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Referencia {prefilledProductData?.sneaker_reference_code && '✅'}
                  </label>
                  <input
                    type="text"
                    value={requestForm.sneaker_reference_code}
                    onChange={(e) => setRequestForm({...requestForm, sneaker_reference_code: e.target.value})}
                    placeholder="AD-UB22-BLK-001"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base ${
                      prefilledProductData?.sneaker_reference_code ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca {prefilledProductData?.brand && '✅'}
                  </label>
                  <input
                    type="text"
                    value={requestForm.brand}
                    onChange={(e) => setRequestForm({...requestForm, brand: e.target.value})}
                    placeholder="Adidas"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base ${
                      prefilledProductData?.brand ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo {prefilledProductData?.model && '✅'}
                  </label>
                  <input
                    type="text"
                    value={requestForm.model}
                    onChange={(e) => setRequestForm({...requestForm, model: e.target.value})}
                    placeholder="Ultraboost 22"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base ${
                      prefilledProductData?.model ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Talla {prefilledProductData?.size && '✅'}
                  </label>
                  <input
                    type="text"
                    value={requestForm.size}
                    onChange={(e) => setRequestForm({...requestForm, size: e.target.value})}
                    placeholder="9.5"
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base ${
                      prefilledProductData?.size ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propósito
                  </label>
                  <select
                    value={requestForm.purpose}
                    onChange={(e) => setRequestForm({...requestForm, purpose: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
                  >
                    <option value="cliente">🔥 Cliente Presente (Urgente)</option>
                    <option value="restock">📦 Restock (Normal)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recoge
                  </label>
                  <select
                    value={requestForm.pickup_type}
                    onChange={(e) => setRequestForm({...requestForm, pickup_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
                  >
                    <option value="vendedor">🏃‍♂️ Vendedor</option>
                    <option value="corredor">🚚 Corredor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={requestForm.quantity}
                    onChange={(e) => setRequestForm({...requestForm, quantity: parseInt(e.target.value) || 1})}
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base ${
                    prefilledProductData ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
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
    </div>
  );
};