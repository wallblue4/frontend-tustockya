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

// Interfaz para la estructura del endpoint VE002 según documentación
interface PendingTransfer {
  id: number;
  status: string;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  purpose: string;
  courier_name?: string;
  estimated_arrival?: string;
  time_elapsed: string;
  next_action: string;
}

// Interfaz para el response del endpoint VE002
interface PendingTransfersResponse {
  success: boolean;
  pending_transfers: PendingTransfer[];
  urgent_count: number;
  normal_count: number;
}

export const TransfersView: React.FC<TransfersViewProps> = ({ 
  onTransferRequested,
  prefilledProductData 
}) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [urgentCount, setUrgentCount] = useState(0);
  const [normalCount, setNormalCount] = useState(0);
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
        vendorAPI.getPendingTransfers(), // Usa VE002: /api/v1/vendor/pending-transfers
        vendorAPI.getPendingReceptions() // Usa VE003: /api/v1/vendor/pending-receptions
      ]);
      
      // El endpoint VE002 devuelve: { success, pending_transfers, urgent_count, normal_count }
      setPendingTransfers(transfersResponse.pending_transfers || []);
      setUrgentCount(transfersResponse.urgent_count || 0);
      setNormalCount(transfersResponse.normal_count || 0);
      
      // El endpoint VE003 devuelve: { success, pending_receptions, total_pending }
      setPendingReceptions(receptionsResponse.pending_receptions || []);
      
    } catch (err: any) {
      console.error('Error loading transfers:', err);
      setError('Error conectando con el servidor');
      setPendingTransfers([]);
      setPendingReceptions([]);
      setUrgentCount(0);
      setNormalCount(0);
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

  // Función para calcular tiempo transcurrido desde la descripción que ya viene
  const parseTimeElapsed = (timeElapsedStr: string): string => {
    // El endpoint ya devuelve el tiempo formateado (ej: "35 minutos")
    return timeElapsedStr || 'Recién solicitado';
  };

  // Función para obtener el nombre del corredor desde el campo courier_name
  const getCourierName = (transfer: PendingTransfer): string => {
    return transfer.courier_name || 'Sin asignar';
  };

  // El next_action ya viene del endpoint
  const getNextAction = (transfer: PendingTransfer): string => {
    return transfer.next_action || 'Estado desconocido';
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

  // Filtrar transferencias por estado - Para el endpoint VE002 ya vienen filtradas
  const activeTransfers = pendingTransfers; // Ya vienen solo las pendientes/activas

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

      {/* Resumen de transferencias según endpoint VE002 */}
      {(urgentCount > 0 || normalCount > 0) && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{urgentCount + normalCount}</p>
                <p className="text-xs text-gray-600">Total Pendientes</p>
              </div>
              {urgentCount > 0 && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
                  <p className="text-xs text-red-600">🔥 Urgentes</p>
                </div>
              )}
              {normalCount > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{normalCount}</p>
                  <p className="text-xs text-blue-600">📦 Normales</p>
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
                  <span>Transferencias ({activeTransfers.length})</span>
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
              Transferencias ({activeTransfers.length})
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
            {activeTransfers.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Package className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm md:text-base">No tienes transferencias activas</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {activeTransfers.map((transfer) => (
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
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs md:text-sm text-gray-500">Tiempo transcurrido</p>
                        <p className="font-medium text-sm md:text-base">{parseTimeElapsed(transfer.time_elapsed)}</p>
                        {transfer.estimated_arrival && (
                          <div className="text-xs text-gray-400 mt-1">
                            <span>ETA: {new Date(transfer.estimated_arrival).toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información del corredor si está asignado */}
                    {transfer.courier_name && (
                      <div className="mt-3 p-2 md:p-3 bg-blue-50 rounded-md">
                        <p className="text-xs md:text-sm">
                          <strong>Corredor asignado:</strong> {getCourierName(transfer)}
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