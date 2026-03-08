import React from 'react';
import { Package, Send, CheckCircle, Truck, User, MapPin, Clock, Search } from 'lucide-react';
import type { AcceptedRequest } from '../../types/warehouse';
import { getPurposeColor, getInventoryTypeColor, getRequestTypeColor } from '../../utils/warehouseUtils';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface AcceptedRequestsTabProps {
  acceptedRequests: AcceptedRequest[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  actionLoading: number | null;
  onDeliverToCourier: (requestId: number) => void;
  onDeliverToVendor: (requestId: number) => void;
  onConfirmReturnReception: (returnId: number) => void;
}

const AcceptedRequestsTab: React.FC<AcceptedRequestsTabProps> = ({
  acceptedRequests,
  searchTerm,
  setSearchTerm,
  actionLoading,
  onDeliverToCourier,
  onDeliverToVendor,
  onConfirmReturnReception,
}) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg md:text-xl font-semibold flex items-center">
          <Package className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
          Entregas
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
          const preparationRequests = acceptedRequests.filter((request) => {
            const statusMatch =
              request.status === 'courier_assigned' ||
              (request.status === 'accepted' && request.pickup_type === 'vendedor');
            if (!statusMatch) return false;
            if (!q) return true;
            const haystack = [
              request.product.brand,
              request.product.model,
              request.product.reference_code,
              request.product.size,
              request.requester_info?.name,
              request.location?.source_name,
              request.location?.destination_name,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            return haystack.includes(q);
          });

          return preparationRequests.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base md:text-lg font-medium">No hay entregas pendientes</h3>
              <p className="text-muted-foreground text-sm">
                Las solicitudes aceptadas apareceran aqui para ser entregadas a corredores.
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {preparationRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-border rounded-lg bg-card shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  {/* MOBILE VIEW */}
                  <div className="md:hidden p-4">
                    {/* Status tag at the top */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-base text-foreground">
                          {request.product.brand} {request.product.model}
                        </h4>
                        {request.purpose === 'return' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            🔄 Devolucion
                          </span>
                        )}
                        {request.purpose === 'restock' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor('restock')}`}>
                            📦 Reposicion
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium
                             ${
                               request.status === 'courier_assigned'
                                 ? 'bg-success/10 text-success'
                                 : request.status === 'in_transit'
                                   ? 'bg-blue-100 text-blue-800'
                                   : 'bg-warning/10 text-warning'
                             }
                           `}
                      >
                        {request.pickup_type === 'corredor'
                          ? request.status === 'courier_assigned'
                            ? '✅ Corredor asignado'
                            : request.status === 'in_transit'
                              ? '🚚 En transito'
                              : '🔄 Esperando corredor'
                          : request.status === 'accepted'
                            ? request.purpose === 'return'
                              ? '⏳ Esperando que vendedor entregue'
                              : '⏳ Esperando vendedor'
                            : '✅ Listo para entrega'}
                      </span>
                    </div>

                    {/* Informacion especifica de pies separados */}
                    {request.product.inventory_type && request.product.inventory_type !== 'pair' && (
                      <div className="mb-3 p-3 bg-card border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getInventoryTypeColor(request.product.inventory_type)}`}
                          >
                            {request.product.inventory_type_label ||
                              (request.product.inventory_type === 'left_only'
                                ? '🦶 Pie Izquierdo'
                                : request.product.inventory_type === 'right_only'
                                  ? '🦶 Pie Derecho'
                                  : '🦶 Pies Separados')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            📦 {request.product.quantity} × {request.product.inventory_type_label}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        <img
                          src={
                            request.product.image_url ||
                            `https://via.placeholder.com/200x300/e5e7eb/6b7280?text=${encodeURIComponent(request.product.brand + ' ' + request.product.model)}`
                          }
                          alt={`${request.product.brand} ${request.product.model}`}
                          className="w-32 h-48 object-cover rounded-lg border border-border bg-muted"
                          onError={(e) => {
                            if (!e.currentTarget.dataset.fallback) {
                              e.currentTarget.dataset.fallback = 'true';
                              e.currentTarget.src = `https://via.placeholder.com/200x300/f3f4f6/9ca3af?text=${encodeURIComponent(request.product.brand)}`;
                            }
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-1">
                          Talla {request.product.size} • {request.product.quantity} unidad
                          {request.product.quantity > 1 ? 'es' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Solicitado por: {request.requester_info?.name || 'Usuario'}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-1">
                          <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
                          <span className="font-medium">De: {request.location.source_name}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-1">
                          <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
                          <span className="font-medium">A: {request.location.destination_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Informacion especifica segun pickup_type */}
                    {request.pickup_type === 'corredor' &&
                      request.status === 'courier_assigned' &&
                      request.courier_info?.assigned && (
                        <div className="mb-3 p-2 bg-primary/10 rounded-lg">
                          <p className="text-xs text-primary">
                            <Truck className="h-3 w-3 inline mr-1" />
                            Corredor:{' '}
                            <strong>
                              {request.courier_info.name || request.pickup_info.who || `ID: ${request.courier_info.id}`}
                            </strong>
                          </p>
                        </div>
                      )}

                    {request.pickup_type === 'vendedor' && request.status === 'accepted' && (
                      <div
                        className={`mb-3 p-2 rounded-lg border ${
                          request.purpose === 'return'
                            ? 'bg-muted/10 border-muted/20'
                            : 'bg-warning/10 border-warning/20'
                        }`}
                      >
                        <p
                          className={`text-xs font-medium ${
                            request.purpose === 'return' ? 'text-muted-foreground' : 'text-warning'
                          }`}
                        >
                          <User className="h-3 w-3 inline mr-1" />
                          <strong>Esperando al vendedor:</strong> {request.requester_info?.name || 'Usuario'}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            request.purpose === 'return' ? 'text-muted-foreground' : 'text-warning'
                          }`}
                        >
                          {request.purpose === 'return'
                            ? '🔄 El vendedor debe traer el producto para devolucion'
                            : 'El vendedor debe venir a recoger el producto personalmente'}
                        </p>
                      </div>
                    )}

                    {/* NUEVO: Devolucion entregada por vendedor - esperando confirmacion */}
                    {request.pickup_type === 'vendedor' &&
                      request.status === 'delivered' &&
                      request.purpose === 'return' && (
                        <div className="mb-3 p-2 bg-success/10 border border-success/20 rounded-lg">
                          <p className="text-xs text-success font-medium">
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            <strong>Devolucion entregada por vendedor</strong>
                          </p>
                          <p className="text-xs text-success mt-1">
                            🔍 Debes verificar el producto y confirmar la recepcion para restaurar el inventario
                          </p>
                        </div>
                      )}

                    {/* Botones de entrega segun pickup_type */}
                    {request.status === 'courier_assigned' &&
                      request.pickup_type === 'corredor' &&
                      request.purpose !== 'return' && (
                        <Button
                          onClick={() => onDeliverToCourier(request.id)}
                          disabled={actionLoading === request.id}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                          size="sm"
                        >
                          {actionLoading === request.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          🚚 Entregar a Corredor
                        </Button>
                      )}

                    {/* Boton para transferencia normal con vendedor - status accepted */}
                    {request.status === 'accepted' &&
                      request.pickup_type === 'vendedor' &&
                      request.purpose !== 'return' && (
                        <Button
                          onClick={() => onDeliverToVendor(request.id)}
                          disabled={actionLoading === request.id}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
                          size="sm"
                        >
                          {actionLoading === request.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <User className="h-4 w-4 mr-2" />
                          )}
                          👤 Entregar a Vendedor
                        </Button>
                      )}

                    {/* *** NUEVO: Boton para confirmar recepcion de devoluciones - Mobile *** */}
                    {request.pickup_type === 'vendedor' &&
                      request.purpose === 'return' &&
                      request.status === 'delivered' && (
                        <Button
                          onClick={() => onConfirmReturnReception(request.id)}
                          disabled={actionLoading === request.id}
                          className="w-full bg-success hover:bg-success/90 text-success-foreground text-sm"
                          size="sm"
                        >
                          {actionLoading === request.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          ✅ Confirmar Recepcion de Devolucion
                        </Button>
                      )}

                    {/* Boton para devoluciones por corredor */}
                    {request.purpose === 'return' &&
                      request.pickup_type === 'corredor' &&
                      request.status === 'delivered' && (
                        <Button
                          onClick={() => onConfirmReturnReception(request.id)}
                          disabled={actionLoading === request.id}
                          className="w-full bg-success hover:bg-success/90 text-success-foreground text-sm mt-2"
                          size="sm"
                        >
                          {actionLoading === request.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          ✅ Confirmar Recepcion
                        </Button>
                      )}
                  </div>

                  {/* DESKTOP VIEW */}
                  <div className="hidden md:block p-6">
                    {/* Status tag at the top for desktop */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-lg text-foreground">
                          {request.product.brand} {request.product.model} - Talla {request.product.size}
                        </h4>
                        {request.purpose === 'return' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted/10 text-muted-foreground">
                            🔄 Devolucion
                          </span>
                        )}
                        {request.purpose === 'restock' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor('restock')}`}>
                            📦 Reposicion
                          </span>
                        )}
                        {request.request_type && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getRequestTypeColor(request.request_type)}`}
                          >
                            {request.request_type === 'transfer' ? '📦 Transferencia' : '↩️ Devolucion'}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium
                             ${
                               request.status === 'courier_assigned'
                                 ? 'bg-success/10 text-success'
                                 : request.status === 'in_transit'
                                   ? 'bg-primary/10 text-primary'
                                   : 'bg-warning/10 text-warning'
                             }
                           `}
                      >
                        {request.pickup_type === 'corredor'
                          ? request.status === 'courier_assigned'
                            ? '✅ Corredor asignado'
                            : request.status === 'in_transit'
                              ? '🚚 En transito'
                              : '🔄 Esperando corredor'
                          : request.status === 'accepted'
                            ? request.purpose === 'return'
                              ? '⏳ Esperando que vendedor entregue'
                              : '⏳ Esperando vendedor'
                            : '✅ Listo para entrega'}
                      </span>
                    </div>

                    {/* Informacion especifica de pies separados */}
                    {request.product.inventory_type && request.product.inventory_type !== 'pair' && (
                      <div className="mb-4 p-4 bg-card border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${getInventoryTypeColor(request.product.inventory_type)}`}
                          >
                            {request.product.inventory_type_label ||
                              (request.product.inventory_type === 'left_only'
                                ? '🦶 Pie Izquierdo'
                                : request.product.inventory_type === 'right_only'
                                  ? '🦶 Pie Derecho'
                                  : '🦶 Pies Separados')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            📦 {request.product.quantity} × {request.product.inventory_type_label}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0 mr-4">
                        <img
                          src={
                            request.product.image_url ||
                            `https://via.placeholder.com/200x300/e5e7eb/6b7280?text=${encodeURIComponent(request.product.brand + ' ' + request.product.model)}`
                          }
                          alt={`${request.product.brand} ${request.product.model}`}
                          className="w-32 h-48 object-cover rounded-lg border border-border bg-muted shadow-sm"
                          onError={(e) => {
                            if (!e.currentTarget.dataset.fallback) {
                              e.currentTarget.dataset.fallback = 'true';
                              e.currentTarget.src = `https://via.placeholder.com/200x300/f3f4f6/9ca3af?text=${encodeURIComponent(request.product.brand)}`;
                            }
                          }}
                        />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                          <User className="h-4 w-4 inline mr-1" />
                          Solicitado por: <strong>{request.requester_info?.name || 'Usuario'}</strong>
                        </p>

                        <div className="mb-2">
                          <p className="text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            <strong>De:</strong> {request.location.source_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            <strong>A:</strong> {request.location.destination_name} (Local)
                          </p>
                        </div>

                        {request.status === 'courier_assigned' && request.courier_info?.assigned && (
                          <div className="mb-2">
                            <p className="text-sm text-primary">
                              <Truck className="h-4 w-4 inline mr-1" />
                              Corredor:{' '}
                              <strong>
                                {request.courier_info.name ||
                                  request.pickup_info.who ||
                                  `ID: ${request.courier_info.id}`}
                              </strong>
                            </p>
                          </div>
                        )}

                        <div className="space-y-2 text-sm text-muted-foreground">
                          {request.status_info && (
                            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-primary">{request.status_info.title}</span>
                                <span className="text-xs text-primary">{request.status_info.progress}%</span>
                              </div>
                              <p className="text-xs text-primary mb-1">{request.status_info.description}</p>
                              <p className="text-xs text-primary">
                                <strong>Siguiente paso:</strong> {request.status_info.next_step}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center space-x-4">
                            <span>
                              <Clock className="h-4 w-4 inline mr-1" />
                              Estado: {request.status}
                            </span>
                            <span>
                              📍 Proposito:{' '}
                              {request.purpose === 'cliente'
                                ? '🏃‍♂️ Cliente'
                                : request.purpose === 'pair_formation'
                                  ? '🔗 Formar Par'
                                  : '📦 Reposicion'}
                            </span>
                            <span>📦 Cantidad: {request.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {request.product.reference_code && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>📝 Codigo de referencia:</strong> {request.product.reference_code}
                        </p>
                      </div>
                    )}

                    {/* Informacion especifica segun pickup_type - Desktop */}
                    {request.pickup_type === 'corredor' &&
                      request.status === 'courier_assigned' &&
                      request.courier_info?.assigned && (
                        <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm text-primary">
                            <Truck className="h-4 w-4 inline mr-1" />
                            <strong>Corredor asignado:</strong>{' '}
                            {request.courier_info.name || request.pickup_info.who || `ID: ${request.courier_info.id}`}
                          </p>
                        </div>
                      )}

                    {request.pickup_type === 'vendedor' && request.status === 'accepted' && (
                      <div
                        className={`mb-4 p-3 rounded-lg border ${
                          request.purpose === 'return'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <p
                          className={`text-sm font-medium ${
                            request.purpose === 'return' ? 'text-orange-800' : 'text-yellow-800'
                          }`}
                        >
                          <User className="h-4 w-4 inline mr-1" />
                          <strong>Esperando al vendedor:</strong> {request.requester_info?.name || 'Usuario'}
                        </p>
                        <p
                          className={`text-sm mt-1 ${
                            request.purpose === 'return' ? 'text-orange-700' : 'text-yellow-700'
                          }`}
                        >
                          {request.purpose === 'return'
                            ? '🔄 El vendedor debe traer el producto para devolucion'
                            : 'El vendedor debe venir a recoger el producto personalmente'}
                        </p>
                      </div>
                    )}

                    {/* NUEVO: Devolucion entregada por vendedor - esperando confirmacion - Desktop */}
                    {request.pickup_type === 'vendedor' &&
                      request.status === 'delivered' &&
                      request.purpose === 'return' && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            <strong>Devolucion entregada por vendedor</strong>
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            🔍 Debes verificar el producto y confirmar la recepcion para restaurar el inventario
                          </p>
                        </div>
                      )}

                    {/* Botones de entrega segun pickup_type - Desktop */}
                    {request.status === 'courier_assigned' &&
                      request.pickup_type === 'corredor' &&
                      request.purpose !== 'return' && (
                        <div className="mt-4">
                          <Button
                            onClick={() => onDeliverToCourier(request.id)}
                            disabled={actionLoading === request.id}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {actionLoading === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            🚚 Entregar a Corredor (WH004)
                          </Button>
                        </div>
                      )}

                    {/* Boton para transferencia normal con vendedor - status accepted - Desktop */}
                    {request.status === 'accepted' &&
                      request.pickup_type === 'vendedor' &&
                      request.purpose !== 'return' && (
                        <div className="mt-4">
                          <Button
                            onClick={() => onDeliverToVendor(request.id)}
                            disabled={actionLoading === request.id}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            {actionLoading === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <User className="h-4 w-4 mr-2" />
                            )}
                            👤 Entregar a Vendedor (WH005)
                          </Button>
                        </div>
                      )}

                    {/* *** NUEVO: Boton para confirmar recepcion de devoluciones - Desktop *** */}
                    {request.pickup_type === 'vendedor' &&
                      request.purpose === 'return' &&
                      request.status === 'delivered' && (
                        <div className="mt-4">
                          <Button
                            onClick={() => onConfirmReturnReception(request.id)}
                            disabled={actionLoading === request.id}
                            className="w-full bg-success hover:bg-success/90 text-success-foreground"
                          >
                            {actionLoading === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            ✅ Confirmar Recepcion de Devolucion
                          </Button>
                        </div>
                      )}

                    {/* Boton para devoluciones por corredor */}
                    {request.purpose === 'return' &&
                      request.pickup_type === 'corredor' &&
                      request.status === 'delivered' && (
                        <div className="mt-4">
                          <Button
                            onClick={() => onConfirmReturnReception(request.id)}
                            disabled={actionLoading === request.id}
                            className="w-full bg-success hover:bg-success/90 text-success-foreground"
                          >
                            {actionLoading === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            ✅ Confirmar Recepcion de Devolucion
                          </Button>
                        </div>
                      )}

                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      <div className="flex justify-between items-center">
                        <span>
                          ID: {request.id} | Codigo: {request.product.reference_code}
                        </span>
                        <span>
                          Status: {request.status} | Corredor:{' '}
                          {request.courier_info?.name || request.pickup_info?.who || 'Sin asignar'}
                        </span>
                      </div>
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

export default AcceptedRequestsTab;
