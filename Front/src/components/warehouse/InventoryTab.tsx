import React from 'react';
import type { InventoryLocation } from '../../types';
import { formatPrice, getTotalInventoryValue, getTotalProducts } from '../../utils/warehouseUtils';
import { Warehouse, Search, RefreshCw, MapPin } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface InventoryTabProps {
  inventory: InventoryLocation[];
  inventoryLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedLocation: number | 'all';
  setSelectedLocation: (location: number | 'all') => void;
  getFilteredInventory: () => InventoryLocation[];
  onLoadInventory: () => void;
}

const InventoryTab: React.FC<InventoryTabProps> = ({
  inventory,
  inventoryLoading,
  searchTerm,
  setSearchTerm,
  selectedLocation,
  setSelectedLocation,
  getFilteredInventory,
  onLoadInventory,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
          <h2 className="text-lg md:text-xl font-semibold flex items-center">
            <Warehouse className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
            Inventario de Bodega
          </h2>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar marca, modelo, talla..."
                className="pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground w-full sm:w-64"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
              >
                <option value="all">Todas las ubicaciones</option>
                {inventory.map((location) => (
                  <option key={location.location_id} value={location.location_id}>
                    {location.location_name}
                  </option>
                ))}
              </select>

              <Button variant="outline" onClick={onLoadInventory} disabled={inventoryLoading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${inventoryLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {inventoryLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Cargando inventario...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumen por ubicación */}
            {selectedLocation === 'all' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((location) => {
                  const totalUnits = getTotalProducts(location);
                  const totalValue = getTotalInventoryValue(location);
                  const activeProducts = location.products.filter((p) => p.is_active === 1).length;
                  const totalSizes = location.products.reduce((sum, product) => sum + product.sizes.length, 0);

                  return (
                    <Card key={location.location_id} className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{location.location_name}</h3>
                          <span className="text-xs text-muted-foreground">ID: {location.location_id}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Productos únicos:</span>
                            <span className="font-medium">{location.products.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Productos activos:</span>
                            <span className="font-medium text-green-600">{activeProducts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total unidades:</span>
                            <span className="font-medium">{totalUnits}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total tallas:</span>
                            <span className="font-medium">{totalSizes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Valor total:</span>
                            <span className="font-medium text-green-600">{formatPrice(totalValue)}</span>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">Promedio por producto:</span>
                              <span className="text-xs font-medium">
                                {formatPrice(location.products.length > 0 ? totalValue / location.products.length : 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Lista de productos filtrados */}
            {getFilteredInventory().length === 0 ? (
              <div className="text-center py-8">
                <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium">
                  {searchTerm ? 'No se encontraron productos' : 'No hay inventario disponible'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {searchTerm ? 'Prueba con otros términos de búsqueda' : 'El inventario se cargará automáticamente'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {getFilteredInventory().map((location) => (
                  <div key={location.location_id} className="space-y-4">
                    {selectedLocation === 'all' && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">{location.location_name}</h3>
                        <span className="text-sm text-muted-foreground">({location.products.length} productos)</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {location.products.map((product) => (
                        <Card key={product.product_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Header con imagen pequeña y info básica */}
                              <div className="flex space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                      src={
                                        product.image_url ||
                                        `https://via.placeholder.com/80x80/e5e7eb/6b7280?text=${encodeURIComponent(product.brand)}`
                                      }
                                      alt={product.description}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        if (!e.currentTarget.dataset.fallback) {
                                          e.currentTarget.dataset.fallback = 'true';
                                          e.currentTarget.src = `https://via.placeholder.com/80x80/f3f4f6/9ca3af?text=${encodeURIComponent(product.brand)}`;
                                        }
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <h4 className="font-semibold text-sm leading-tight">
                                      {product.brand} {product.model}
                                    </h4>
                                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                                      {product.total_quantity}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                    {product.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono">{product.reference_code}</p>
                                </div>
                              </div>

                              {/* Información detallada */}
                              <div className="space-y-2">
                                {/* Color */}
                                {product.color_info && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Color:</span>
                                    <span className="text-xs font-medium">{product.color_info}</span>
                                  </div>
                                )}

                                {/* Precios */}
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-xs text-muted-foreground">Precio unitario:</span>
                                    <div className="text-sm font-bold text-green-600">
                                      {formatPrice(product.unit_price)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs text-muted-foreground">Caja:</span>
                                    <div className="text-xs text-muted-foreground">
                                      {formatPrice(product.box_price)}
                                    </div>
                                  </div>
                                </div>

                                {/* Estado del producto */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Estado:</span>
                                  <span
                                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                                      product.is_active === 1
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {product.is_active === 1 ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>

                                {/* Fechas */}
                                <div className="space-y-1 pt-2 border-t">
                                  <div className="flex justify-between">
                                    <span className="text-xs text-muted-foreground">Creado:</span>
                                    <span className="text-xs">
                                      {new Date(product.created_at).toLocaleDateString('es-CO')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-xs text-muted-foreground">Actualizado:</span>
                                    <span className="text-xs">
                                      {new Date(product.updated_at).toLocaleDateString('es-CO')}
                                    </span>
                                  </div>
                                </div>

                                {/* Tallas disponibles */}
                                <div className="pt-2 border-t">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium">Tallas:</span>
                                    <span className="text-xs text-muted-foreground">
                                      {product.sizes.length} disponibles
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1">
                                    {product.sizes.map((size) => (
                                      <div
                                        key={size.size}
                                        className={`p-1 rounded text-center text-xs ${
                                          size.quantity > 0
                                            ? 'bg-green-50 text-green-800 border border-green-200'
                                            : 'bg-gray-50 text-gray-600 border border-gray-200'
                                        }`}
                                      >
                                        <div className="font-medium">{size.size}</div>
                                        <div className="text-xs">
                                          {size.quantity}
                                          {size.quantity_exhibition > 0 && (
                                            <span className="text-orange-600">+{size.quantity_exhibition}</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {product.sizes.some((s) => s.quantity_exhibition > 0) && (
                                    <div className="text-xs text-orange-600 mt-1 text-center">
                                      *Naranja = unidades en exhibición
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryTab;
