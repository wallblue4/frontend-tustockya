import React from 'react';
import { Search, Truck } from 'lucide-react';
import { TransferHistoryItem } from '../../types/warehouse';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface TransferHistoryTabProps {
  transferHistory: TransferHistoryItem[];
  transferHistoryLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const TransferHistoryTab: React.FC<TransferHistoryTabProps> = ({
  transferHistory,
  transferHistoryLoading,
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg md:text-xl font-semibold flex items-center">
          <Truck className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
          Historial de Transferencias de Hoy
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
        {transferHistoryLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mr-4"></div>
            <span className="text-muted-foreground">Cargando historial...</span>
          </div>
        ) : (
          (() => {
            const q = searchTerm.trim().toLowerCase();
            const filteredHistory = q
              ? transferHistory.filter((item) => {
                  const haystack = [
                    item.brand,
                    item.model,
                    item.sneaker_reference_code,
                    item.size,
                    item.product_info?.brand,
                    item.product_info?.model,
                    item.source_location_name,
                    item.requester_name,
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                  return haystack.includes(q);
                })
              : transferHistory;
            return filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No se encontraron transferencias para hoy.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((item) => (
                  <article
                    key={item.id}
                    className={`border rounded-md p-3 bg-card shadow-sm ${
                      item.request_type === 'return' || item.purpose === 'return'
                        ? 'border-orange-300 border-l-4 border-l-orange-500'
                        : item.purpose === 'restock'
                          ? 'border-blue-300 border-l-4 border-l-blue-500'
                          : item.purpose === 'cliente'
                            ? 'border-emerald-300 border-l-4 border-l-emerald-500'
                            : 'border-border'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-4">
                      <div className="flex-shrink-0 self-center sm:self-start">
                        <img
                          src={item.product_info?.image_url}
                          alt={item.product_info?.model}
                          className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-md shadow-sm"
                        />
                      </div>

                      <div className="mt-3 sm:mt-0 flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="truncate">
                            {/* Título de tipo: Devolución / Reposición / Pedido */}
                            <div
                              className={`text-sm font-semibold mb-1 ${
                                item.request_type === 'return' || item.purpose === 'return'
                                  ? 'text-orange-600'
                                  : item.purpose === 'restock'
                                    ? 'text-blue-600'
                                    : item.purpose === 'cliente'
                                      ? 'text-emerald-600'
                                      : 'text-primary'
                              }`}
                            >
                              {item.request_type === 'return' || item.purpose === 'return'
                                ? '↩️ Devolución'
                                : item.purpose === 'restock'
                                  ? '📦 Reposición'
                                  : item.purpose === 'cliente'
                                    ? '🏃 Pedido'
                                    : item.purpose === 'pair_formation'
                                      ? '🔗 Formar Par'
                                      : '📦 Transferencia'}
                            </div>
                            <div className="font-medium text-sm truncate">
                              {item.product_info?.brand} {item.product_info?.model}
                            </div>
                            <div className="flex items-center flex-wrap gap-2 mt-1">
                              <span className="inline-block text-xs px-2 py-0.5 rounded bg-card border border-border text-muted-foreground">
                                {item.pickup_info?.type || '—'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right ml-3 flex-shrink-0">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${item.status === 'completed' ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted-foreground'}`}
                            >
                              {item.status}
                            </span>
                            {typeof item.quantity !== 'undefined' && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.inventory_type === 'pair'
                                  ? 'Par'
                                  : item.inventory_type === 'left_only'
                                    ? 'Izquierdo'
                                    : item.inventory_type === 'right_only'
                                      ? 'Derecho'
                                      : item.inventory_type}{' '}
                                {item.quantity} ud.
                              </div>
                            )}
                            <p className={`inline-block px-2 py-0.5 rounded text-xs font-medium `}>
                              Talla: {item.size}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            <div className="truncate">
                              <strong>Origen:</strong> {item.source_location || 'N/A'}
                            </div>
                            <div className="truncate">
                              <strong>Destino:</strong> {item.destination_location || 'N/A'}
                            </div>
                            <div className="truncate">
                              <strong>Solicitado:</strong>{' '}
                              {item.requested_at
                                ? new Date(item.requested_at).toLocaleString('es-CO', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })
                                : 'N/A'}
                            </div>
                          </div>
                          <div>
                            {/* Si hay fechas adicionales, mostrarlas */}
                            {item.accepted_at && (
                              <div>
                                <strong>Aceptado:</strong>{' '}
                                {new Date(item.accepted_at).toLocaleString('es-CO', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                            {item.picked_up_at && (
                              <div>
                                <strong>Recolectado (picked_up_at):</strong>{' '}
                                {new Date(item.picked_up_at).toLocaleString('es-CO', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                            {item.delivered_at && (
                              <div>
                                <strong>Entregado (delivered_at):</strong>{' '}
                                {new Date(item.delivered_at).toLocaleString('es-CO', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                            {item.pickup_info?.type === 'corredor' && item.pickup_info?.name && (
                              <div className="truncate">
                                <strong>🚚 Corredor:</strong> {item.pickup_info.name}
                              </div>
                            )}
                            {item.requester_name && (
                              <div className="truncate">
                                <strong>👤 Receptor:</strong> {item.requester_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            );
          })()
        )}
      </CardContent>
    </Card>
  );
};

export default TransferHistoryTab;
