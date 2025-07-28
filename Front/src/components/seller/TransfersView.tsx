import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
  Calendar
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
  } | null;
}

// Interfaz para la estructura del endpoint real
interface TransferRequest {
  id: number;
  requester_id: number;
  source_location_id: number;
  destination_location_id: number;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  purpose: string;
  pickup_type: string;
  destination_type: string;
  courier_id: number | null;
  warehouse_keeper_id: number | null;
  status: string;
  requested_at: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  confirmed_reception_at: string | null;
  received_quantity: number | null;
  reception_notes: string | null;
  courier_accepted_at: string | null;
  courier_notes: string | null;
  estimated_pickup_time: string | null;
  pickup_notes: string | null;
  source_location_name: string;
  destination_location_name: string;
  courier_first_name: string | null;
  courier_last_name: string | null;
  warehouse_keeper_first_name: string | null;
  warehouse_keeper_last_name: string | null;
  status_info: {
    status: string;
    status_description: string;
    pickup_person: string;
    destination: string;
  };
}

interface TransfersSummary {
  total_requests: number;
  pending: number;
  accepted: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
}

export const TransfersView: React.FC<TransfersViewProps> = ({ 
  onTransferRequested,
  prefilledProductData 
}) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [allTransfers, setAllTransfers] = useState<TransferRequest[]>([]);
  const [summary, setSummary] = useState<TransfersSummary | null>(null);
  const [pendingReceptions, setPendingReceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para UI responsivo
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [requestForm, setRequestForm] = useState({
    source_location_id: 2,
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
        source_location_id: 2,
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
  }, [prefilledProductData]);

  useEffect(() => {
    loadTransfersData();
    const interval = setInterval(loadTransfersData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTransfersData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const [transfersResponse, receptionsResponse] = await Promise.all([
        vendorAPI.getPendingTransfers(),
        vendorAPI.getPendingReceptions()
      ]);
      
      // El endpoint devuelve todas las transferencias, no solo pendientes
      setAllTransfers(transfersResponse.pending_transfers || []);
      setSummary(transfersResponse.summary || null);
      setPendingReceptions(receptionsResponse.pending_receptions || []);
      
    } catch (err: any) {
      console.error('Error loading transfers:', err);
      setError('Error conectando con el servidor');
      setAllTransfers([]);
      setPendingReceptions([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await vendorAPI.requestTransfer(requestForm);
      
      onTransferRequested?.(
        response.transfer_request_id, 
        requestForm.purpose === 'cliente'
      );
      
      alert(`Solicitud creada exitosamente. ID: ${response.transfer_request_id}`);
      
      setRequestForm({
        source_location_id: 2,
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

  const handleConfirmReception = async (requestId: number) => {
    try {
      await vendorAPI.confirmReception(requestId, 1, true, 'Producto recibido correctamente');
      alert('Recepción confirmada exitosamente');
      loadTransfersData();
    } catch (err: any) {
      console.error('Error confirmando recepción:', err);
      alert('Error confirmando recepción: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  // Función para calcular tiempo transcurrido
  const getTimeElapsed = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Función para obtener el nombre del corredor
  const getCourierName = (transfer: TransferRequest): string => {
    if (transfer.courier_first_name && transfer.courier_last_name) {
      return `${transfer.courier_first_name} ${transfer.courier_last_name}`;
    }
    return 'Sin asignar';
  };

  // Función para obtener la próxima acción
  const getNextAction = (transfer: TransferRequest): string => {
    switch (transfer.status) {
      case 'pending':
        return 'Esperando aceptación del bodeguero';
      case 'accepted':
        return 'Esperando asignación de corredor';
      case 'courier_assigned':
        return 'Corredor asignado, esperando recolección';
      case 'in_transit':
        return 'En tránsito hacia destino';
      case 'delivered':
        return 'Entregado, esperando confirmación';
      case 'completed':
        return 'Transferencia completada';
      case 'cancelled':
        return 'Transferencia cancelada';
      default:
        return transfer.status_info?.status_description || 'Estado desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'courier_assigned': return 'bg-purple-100 text-purple-800';
      case 'in_transit': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-200 text-green-900';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'courier_assigned': return <User className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptada';
      case 'courier_assigned': return 'Corredor Asignado';
      case 'in_transit': return 'En Tránsito';
      case 'delivered': return 'Entregada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  // Filtrar transferencias por estado
  const pendingTransfers = allTransfers.filter(t => 
    ['pending', 'accepted', 'courier_assigned', 'in_transit'].includes(t.status)
  );

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
      {summary && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{summary.total_requests}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
                <p className="text-xs text-yellow-600">Pendientes</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{summary.accepted}</p>
                <p className="text-xs text-blue-600">Aceptadas</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{summary.in_transit}</p>
                <p className="text-xs text-orange-600">En Tránsito</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{summary.delivered}</p>
                <p className="text-xs text-green-600">Entregadas</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{summary.cancelled}</p>
                <p className="text-xs text-red-600">Canceladas</p>
              </div>
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
                {activeTab === 'receptions' && <CheckCircle className="h-4 w-4 text-primary" />}
                {activeTab === 'new' && <Plus className="h-4 w-4 text-primary" />}
                <span className="font-medium">
                  {activeTab === 'pending' && `Transferencias (${pendingTransfers.length})`}
                  {activeTab === 'receptions' && `Por Confirmar (${pendingReceptions.length})`}
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
                  <span>Transferencias ({pendingTransfers.length})</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('receptions');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 border-t ${
                    activeTab === 'receptions' ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Por Confirmar ({pendingReceptions.length})</span>
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
              Transferencias ({pendingTransfers.length})
            </Button>
            <Button
              variant={activeTab === 'receptions' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('receptions')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Por Confirmar ({pendingReceptions.length})
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
            <h3 className="text-base md:text-lg font-semibold">Transferencias Activas</h3>
          </CardHeader>
          <CardContent>
            {pendingTransfers.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Package className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm md:text-base">No tienes transferencias activas</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {pendingTransfers.map((transfer) => (
                  <div key={transfer.id} className="border rounded-lg p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-3 md:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(transfer.status)}`}>
                            {getStatusIcon(transfer.status)}
                            <span>{getStatusText(transfer.status)}</span>
                          </span>
                          {transfer.purpose === 'cliente' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🔥 URGENTE
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-sm md:text-lg truncate">
                          {transfer.brand} {transfer.model}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600 truncate">
                          Código: {transfer.sneaker_reference_code} | Talla: {transfer.size}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500">
                          {getNextAction(transfer)}
                        </p>
                        
                        {/* Información de ubicaciones */}
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>De: {transfer.source_location_name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>A: {transfer.destination_location_name}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs md:text-sm text-gray-500">Tiempo transcurrido</p>
                        <p className="font-medium text-sm md:text-base">{getTimeElapsed(transfer.requested_at)}</p>
                        <div className="text-xs text-gray-400 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(transfer.requested_at).toLocaleDateString('es-ES')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información del corredor si está asignado */}
                    {transfer.courier_first_name && (
                      <div className="mt-3 p-2 md:p-3 bg-blue-50 rounded-md">
                        <p className="text-xs md:text-sm">
                          <strong>Corredor asignado:</strong> {getCourierName(transfer)}
                        </p>
                      </div>
                    )}

                    {/* Información del bodeguero si está asignado */}
                    {transfer.warehouse_keeper_first_name && (
                      <div className="mt-3 p-2 md:p-3 bg-green-50 rounded-md">
                        <p className="text-xs md:text-sm">
                          <strong>Bodeguero:</strong> {transfer.warehouse_keeper_first_name} {transfer.warehouse_keeper_last_name}
                        </p>
                      </div>
                    )}

                    {/* Notas si existen */}
                    {transfer.notes && (
                      <div className="mt-3 p-2 md:p-3 bg-gray-50 rounded-md">
                        <p className="text-xs md:text-sm text-gray-700">
                          <strong>Notas:</strong> {transfer.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'receptions' && (
        <Card>
          <CardHeader>
            <h3 className="text-base md:text-lg font-semibold">Productos por Confirmar Recepción</h3>
          </CardHeader>
          <CardContent>
            {pendingReceptions.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm md:text-base">No tienes productos por confirmar</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {pendingReceptions.map((reception: any) => (
                  <div key={reception.id} className="border rounded-lg p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-3 md:space-y-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm md:text-lg truncate">
                          {reception.brand} {reception.model}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Código: {reception.sneaker_reference_code} | Talla: {reception.size} | Cantidad: {reception.quantity}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500">
                          Entregado por: {reception.courier_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Entregado: {new Date(reception.delivered_at).toLocaleString()}
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => handleConfirmReception(reception.id)}
                        className="bg-green-600 hover:bg-green-700 text-sm md:text-base w-full md:w-auto"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar Recepción
                      </Button>
                    </div>

                    {reception.delivery_notes && (
                      <div className="mt-3 p-2 md:p-3 bg-gray-50 rounded-md">
                        <p className="text-xs md:text-sm text-gray-700">{reception.delivery_notes}</p>
                      </div>
                    )}
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