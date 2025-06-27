import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { vendorAPI, formatDate } from '../../services/api';
import { 
  Package, 
  MapPin, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  User
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
}

interface TransferRequest {
  id: string;
  product_code: string;
  product_name: string;
  size: string;
  quantity: number;
  from_location: string;
  to_location: string;
  purpose: 'exhibition' | 'sale';
  pickup_by: 'vendor' | 'runner';
  storage_location: 'warehouse' | 'display';
  status: 'pending' | 'approved' | 'in_transit' | 'delivered' | 'cancelled';
  notes?: string;
  created_at: string;
  assigned_runner?: string;
}

export const TransfersView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [locations, setLocations] = useState<Location[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    product_code: '',
    product_name: '',
    size: '',
    quantity: 1,
    from_location: '',
    purpose: 'sale' as 'exhibition' | 'sale',
    pickup_by: 'runner' as 'vendor' | 'runner',
    storage_location: 'warehouse' as 'warehouse' | 'display',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [locationsResponse, transfersResponse] = await Promise.all([
        vendorAPI.getLocations(),
        vendorAPI.getMyTransferRequests()
      ]);
      
      setLocations(locationsResponse.data || []);
      setTransfers(transfersResponse.data || []);
    } catch (error) {
      console.warn('Backend API not available, using mock data');
      setError('Conectando con el servidor...');
      
      // Mock data
      setLocations([
        { id: '1', name: 'Almacén Principal', address: 'Calle 123 #45-67' },
        { id: '2', name: 'Tienda Centro', address: 'Centro Comercial Plaza' },
        { id: '3', name: 'Tienda Norte', address: 'Av. Norte #89-12' }
      ]);

      setTransfers([
        {
          id: '1',
          product_code: 'NK001',
          product_name: 'Nike Air Max 90',
          size: '9.5',
          quantity: 2,
          from_location: 'Almacén Principal',
          to_location: 'Tienda Centro',
          purpose: 'exhibition',
          pickup_by: 'runner',
          storage_location: 'display',
          status: 'pending',
          notes: 'Para exhibición en vitrina',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await vendorAPI.requestTransfer(formData);
      
      // Reset form
      setFormData({
        product_code: '',
        product_name: '',
        size: '',
        quantity: 1,
        from_location: '',
        purpose: 'sale',
        pickup_by: 'runner',
        storage_location: 'warehouse',
        notes: ''
      });
      
      // Reload transfers
      loadData();
      setActiveTab('list');
      alert('Solicitud de transferencia enviada exitosamente');
    } catch (error) {
      alert('Error al enviar solicitud: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'approved':
        return 'bg-primary/10 text-primary';
      case 'in_transit':
        return 'bg-secondary/10 text-secondary';
      case 'delivered':
        return 'bg-success/10 text-success';
      case 'cancelled':
        return 'bg-error/10 text-error';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobada';
      case 'in_transit':
        return 'En Tránsito';
      case 'delivered':
        return 'Entregada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando transferencias...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <Button
              variant={activeTab === 'list' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('list')}
            >
              <Package className="h-4 w-4 mr-2" />
              Mis Solicitudes
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
            <p className="text-sm text-amber-800">Modo de desarrollo - Usando datos de prueba</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'list' ? (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Mis Solicitudes de Transferencia
            </h3>
          </CardHeader>
          <CardContent>
            {transfers.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No tienes solicitudes de transferencia</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transfers.map((transfer) => (
                  <div key={transfer.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                            {getStatusLabel(transfer.status)}
                          </span>
                          <span className="text-sm text-gray-500">{formatDate(transfer.created_at)}</span>
                        </div>
                        
                        <h4 className="font-semibold text-lg">{transfer.product_name}</h4>
                        <p className="text-sm text-gray-600">
                          Código: {transfer.product_code} | Talla: {transfer.size} | Cantidad: {transfer.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Desde</p>
                        <p className="font-medium flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {transfer.from_location}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Hacia</p>
                        <p className="font-medium flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {transfer.to_location}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Propósito</p>
                        <p className="font-medium">{transfer.purpose === 'exhibition' ? 'Exhibición' : 'Venta'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Recoge</p>
                        <p className="font-medium flex items-center">
                          {transfer.pickup_by === 'runner' ? <Truck className="h-4 w-4 mr-1" /> : <User className="h-4 w-4 mr-1" />}
                          {transfer.pickup_by === 'runner' ? 'Corredor' : 'Vendedor'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Almacenar en</p>
                        <p className="font-medium">{transfer.storage_location === 'warehouse' ? 'Bodega' : 'Exhibición'}</p>
                      </div>
                    </div>

                    {transfer.assigned_runner && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500">Corredor Asignado</p>
                        <p className="font-medium">{transfer.assigned_runner}</p>
                      </div>
                    )}

                    {transfer.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{transfer.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Nueva Solicitud de Transferencia
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Código del Producto"
                  value={formData.product_code}
                  onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                  placeholder="Ej: NK001"
                  required
                />
                <Input
                  label="Nombre del Producto"
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  placeholder="Ej: Nike Air Max 90"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Talla"
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                  placeholder="Ej: 9.5"
                  required
                />
                <Input
                  label="Cantidad"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local de Origen
                </label>
                <select
                  value={formData.from_location}
                  onChange={(e) => setFormData({...formData, from_location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Seleccionar ubicación</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propósito
                  </label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value as 'exhibition' | 'sale'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="sale">Venta</option>
                    <option value="exhibition">Exhibición</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quién Recoge
                  </label>
                  <select
                    value={formData.pickup_by}
                    onChange={(e) => setFormData({...formData, pickup_by: e.target.value as 'vendor' | 'runner'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="runner">Corredor</option>
                    <option value="vendor">Vendedor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Almacenar en
                  </label>
                  <select
                    value={formData.storage_location}
                    onChange={(e) => setFormData({...formData, storage_location: e.target.value as 'warehouse' | 'display'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="warehouse">Bodega</option>
                    <option value="display">Exhibición</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Información adicional sobre la transferencia..."
                />
              </div>

              <Button type="submit" className="w-full">
                Enviar Solicitud de Transferencia
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};