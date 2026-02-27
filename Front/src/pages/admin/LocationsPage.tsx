import React from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Store,
  Warehouse,
  Activity,
  MapPin,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { EmptyState } from '../../components/admin/ErrorState';
import { fetchLocationStatistics } from '../../services/adminAPI';
import { formatCurrency } from '../../utils/formatters';
import { useAdmin } from '../../context/AdminContext';

export const LocationsPage: React.FC = () => {
  const { locations, loadLocations } = useAdmin();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold">Gestión de Ubicaciones</h2>
        <Button onClick={() => loadLocations()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Store className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{locations.filter(l => l.type === 'local').length}</p>
            <p className="text-sm text-gray-600">Locales de Venta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Warehouse className="h-8 w-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold">{locations.filter(l => l.type === 'bodega').length}</p>
            <p className="text-sm text-gray-600">Bodegas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{locations.filter(l => l.is_active).length}</p>
            <p className="text-sm text-gray-600">Activas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Ubicaciones Gestionadas</h3>
        </CardHeader>
        <CardContent>
          {locations.length > 0 ? (
            <div className="space-y-4">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${location.type === 'local' ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                      {location.type === 'local' ?
                        <Store className="h-6 w-6 text-primary" /> :
                        <Warehouse className="h-6 w-6 text-secondary" />
                      }
                    </div>
                    <div>
                      <h4 className="font-semibold">{location.name}</h4>
                      <p className="text-sm text-gray-600">{location.address || 'Sin dirección'}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={location.type === 'local' ? 'primary' : 'secondary'}>
                          {location.type === 'local' ? 'Local' : 'Bodega'}
                        </Badge>
                        <Badge variant={location.is_active ? 'success' : 'error'}>
                          {location.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {location.assigned_users_count} usuarios
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(parseFloat(location.total_inventory_value))}</p>
                    <p className="text-xs text-gray-500">{location.total_products} productos</p>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const stats = await fetchLocationStatistics(
                              location.id,
                              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                              new Date().toISOString().split('T')[0]
                            );
                            console.log('Location stats:', stats);
                            alert('Ver estadísticas en consola por ahora');
                          } catch (error) {
                            console.error('Error fetching location stats:', error);
                            alert('Error al obtener estadísticas');
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Stats
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No hay ubicaciones"
              description="No se encontraron ubicaciones bajo tu gestión"
              icon={<MapPin className="h-12 w-12 text-gray-400" />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
