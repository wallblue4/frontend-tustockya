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
  Plus
} from 'lucide-react';

interface TransfersViewProps {
  onTransferRequested?: (transferId: number, isUrgent: boolean) => void;
}



export const TransfersView: React.FC<TransfersViewProps> = ({ 
  onTransferRequested 
}) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [pendingReceptions, setPendingReceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state para nueva solicitud
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({
    source_location_id: 2,
    sneaker_reference_code: '',
    brand: '',
    model: '',
    size: '',
    quantity: 1,
    purpose: 'cliente', // 'cliente' o 'restock'
    pickup_type: 'corredor',
    destination_type: 'exhibicion',
    notes: ''
  });

  useEffect(() => {
    loadTransfersData();
    
    // Polling cada 30 segundos como recomienda la documentación
    const interval = setInterval(loadTransfersData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTransfersData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('🔄 Cargando datos de transferencias...');
      
      // USAR vendorAPI en lugar de transfersAPI
      const [pendingResponse, receptionsResponse] = await Promise.all([
        vendorAPI.getPendingTransfers(),
        vendorAPI.getPendingReceptions()
      ]);
      
      console.log('✅ Datos cargados:', { pendingResponse, receptionsResponse });
      
      setPendingTransfers(pendingResponse.pending_transfers || []);
      setPendingReceptions(receptionsResponse.pending_receptions || []);
      
    } catch (err) {
      console.error('❌ Error loading transfers:', err);
      setError('Error conectando con el servidor');
      
      // Datos mock como fallback (esto no debería ejecutarse ahora que tenemos fallback automático)
      setPendingTransfers([]);
      setPendingReceptions([]);
      
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('🔄 Enviando nueva solicitud:', requestForm);
      
      // USAR vendorAPI en lugar de transfersAPI
      const response = await vendorAPI.requestTransfer(requestForm);
      
      console.log('✅ Respuesta de solicitud:', response);
      
      // Notificar al dashboard padre
      onTransferRequested?.(
        response.transfer_request_id, 
        requestForm.purpose === 'cliente'
      );
      
      alert(`Solicitud creada exitosamente. ID: ${response.transfer_request_id}`);
      
      // Reset form
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
      
    } catch (err) {
      console.error('❌ Error enviando solicitud:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };


  const handleConfirmReception = async (requestId: number) => {
    try {
      console.log('🔄 Confirmando recepción:', requestId);
      
      // USAR vendorAPI en lugar de transfersAPI
      await vendorAPI.confirmReception(requestId, 1, true, 'Producto recibido correctamente');
      
      console.log('✅ Recepción confirmada');
      alert('Recepción confirmada exitosamente');
      loadTransfersData();
    } catch (err) {
      console.error('❌ Error confirmando recepción:', err);
      alert('Error confirmando recepción: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'courier_assigned': return 'bg-purple-100 text-purple-800';
      case 'in_transit': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
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
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
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
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content based on active tab */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Transferencias Pendientes</h3>
          </CardHeader>
          <CardContent>
            {pendingTransfers.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No tienes transferencias pendientes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTransfers.map((transfer) => (
                  <div key={transfer.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(transfer.status)}`}>
                            {getStatusIcon(transfer.status)}
                            <span>{transfer.status}</span>
                          </span>
                          {transfer.purpose === 'cliente' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🔥 URGENTE
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-lg">
                          {transfer.brand} {transfer.model}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Código: {transfer.sneaker_reference_code} | Talla: {transfer.size}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transfer.next_action}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Tiempo transcurrido</p>
                        <p className="font-medium">{transfer.time_elapsed}</p>
                        {transfer.estimated_arrival && (
                          <p className="text-xs text-gray-400">
                            ETA: {new Date(transfer.estimated_arrival).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {transfer.courier_name && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm">
                          <strong>Corredor asignado:</strong> {transfer.courier_name}
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
            <h3 className="text-lg font-semibold">Productos por Confirmar Recepción</h3>
          </CardHeader>
          <CardContent>
            {pendingReceptions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No tienes productos por confirmar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReceptions.map((reception) => (
                  <div key={reception.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">
                          {reception.brand} {reception.model}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Código: {reception.sneaker_reference_code} | Talla: {reception.size} | Cantidad: {reception.quantity}
                        </p>
                        <p className="text-sm text-gray-500">
                          Entregado por: {reception.courier_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Entregado: {new Date(reception.delivered_at).toLocaleString()}
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => handleConfirmReception(reception.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar Recepción
                      </Button>
                    </div>

                    {reception.delivery_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{reception.delivery_notes}</p>
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
            <h3 className="text-lg font-semibold">Nueva Solicitud de Transferencia</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNewRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Código de Referencia"
                  value={requestForm.sneaker_reference_code}
                  onChange={(e) => setRequestForm({...requestForm, sneaker_reference_code: e.target.value})}
                  placeholder="AD-UB22-BLK-001"
                  required
                />
                <Input
                  label="Marca"
                  value={requestForm.brand}
                  onChange={(e) => setRequestForm({...requestForm, brand: e.target.value})}
                  placeholder="Adidas"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Modelo"
                  value={requestForm.model}
                  onChange={(e) => setRequestForm({...requestForm, model: e.target.value})}
                  placeholder="Ultraboost 22"
                  required
                />
                <Input
                  label="Talla"
                  value={requestForm.size}
                  onChange={(e) => setRequestForm({...requestForm, size: e.target.value})}
                  placeholder="9.5"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propósito
                  </label>
                  <select
                    value={requestForm.purpose}
                    onChange={(e) => setRequestForm({...requestForm, purpose: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="cliente">🔥 Cliente Presente (Urgente)</option>
                    <option value="restock">📦 Restock (Normal)</option>
                  </select>
                </div>
                <Input
                  label="Cantidad"
                  type="number"
                  value={requestForm.quantity}
                  onChange={(e) => setRequestForm({...requestForm, quantity: parseInt(e.target.value) || 1})}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Información adicional sobre la transferencia..."
                />
              </div>

              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Solicitar Transferencia
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};