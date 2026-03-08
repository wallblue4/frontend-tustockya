import React from 'react';
import { Package, CheckCircle, Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface ReturnsTabProps {
  pendingReturns: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  actionLoading: number | null;
  onConfirmReturnReception: (returnId: number) => void;
}

const ReturnsTab: React.FC<ReturnsTabProps> = ({
  pendingReturns,
  searchTerm,
  setSearchTerm,
  actionLoading,
  onConfirmReturnReception,
}) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg md:text-xl font-semibold flex items-center">
          <Package className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
          Devoluciones Pendientes
        </h2>
      </CardHeader>
      <CardContent>
        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por marca, modelo, referencia, talla..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground placeholder:text-muted-foreground"
          />
        </div>
        {(() => {
          const q = searchTerm.trim().toLowerCase();
          const filteredReturns = q
            ? pendingReturns.filter((item) => {
                const haystack = [
                  item.product?.brand || item.brand,
                  item.product?.model || item.model,
                  item.product?.reference_code || item.sneaker_reference_code,
                  item.product?.size || item.size,
                  item.source_location_name,
                  item.requester_name,
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase();
                return haystack.includes(q);
              })
            : pendingReturns;
          return filteredReturns.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Package className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base md:text-lg font-medium">No hay devoluciones pendientes</h3>
              <p className="text-muted-foreground text-sm">Las devoluciones aparecerán aquí cuando sean solicitadas.</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {filteredReturns.map((returnItem) => (
                <div
                  key={returnItem.id}
                  className="border border-border rounded-xl bg-card shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="p-4 md:p-6">
                    {/* Header con estado */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                          🔄 Devolución
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            returnItem.pickup_type === 'corredor'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {returnItem.pickup_type === 'corredor' ? '🚚 Con Corredor' : '👤 Con Vendedor'}
                        </span>
                      </div>
                    </div>

                    {/* Información del producto */}
                    <div className="flex items-center space-x-4 mb-4">
                      {returnItem.product?.image_url && (
                        <img
                          src={returnItem.product.image_url}
                          alt={`${returnItem.product.brand} ${returnItem.product.model}`}
                          className="w-16 h-16 object-cover rounded-lg border border-border"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-card-foreground">
                          {returnItem.product?.brand || returnItem.brand}{' '}
                          {returnItem.product?.model || returnItem.model}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Talla {returnItem.product?.size || returnItem.size} • Cantidad:{' '}
                          {returnItem.product?.quantity || returnItem.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Tipo:</strong> {returnItem.request_type_display || 'Devolución'}
                        </p>
                        {returnItem.requester_info && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Solicitado por:</strong> {returnItem.requester_info.name}
                          </p>
                        )}
                        {returnItem.courier_info && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Corredor:</strong> {returnItem.courier_info.name || 'No asignado'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Información de ubicaciones */}
                    {returnItem.location && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="text-sm font-medium text-primary mb-1">📍 Desde</div>
                          <div className="text-sm font-medium text-card-foreground">
                            {returnItem.location.source_name}
                          </div>
                        </div>
                        <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                          <div className="text-sm font-medium text-success mb-1">🏪 Hacia</div>
                          <div className="text-sm font-medium text-card-foreground">
                            {returnItem.location.destination_name}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline de la devolución */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Timeline</h4>
                      <div className="space-y-1 text-xs text-blue-700">
                        {returnItem.requested_at && (
                          <div>✅ Solicitado: {new Date(returnItem.requested_at).toLocaleString()}</div>
                        )}
                        {returnItem.accepted_at && (
                          <div>✅ Aceptado: {new Date(returnItem.accepted_at).toLocaleString()}</div>
                        )}
                        {returnItem.courier_accepted_at && (
                          <div>🚚 Corredor asignado: {new Date(returnItem.courier_accepted_at).toLocaleString()}</div>
                        )}
                        {returnItem.picked_up_at && (
                          <div>📦 Recogido: {new Date(returnItem.picked_up_at).toLocaleString()}</div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex space-x-3">
                      {/* Solo mostrar botón de confirmar recepción cuando está delivered */}
                      {returnItem.status === 'delivered' && (
                        <Button
                          onClick={() => onConfirmReturnReception(returnItem.id)}
                          disabled={actionLoading === returnItem.id}
                          className="w-full bg-success hover:bg-success/90 text-success-foreground text-sm"
                          size="sm"
                        >
                          {actionLoading === returnItem.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          ✅ Confirmar Recepción
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
};

export default ReturnsTab;
