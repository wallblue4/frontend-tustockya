import React from 'react';
import { Package, Send, Filter, ChevronDown, ChevronUp, User, MapPin, Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { PendingRequest } from '../../types/warehouse';
import {
  getPriorityColor,
  getPurposeColor,
  getInventoryTypeColor,
  getRequestTypeColor,
  formatTimeWaiting,
  formatPrice,
} from '../../utils/warehouseUtils';

interface PendingRequestsTabProps {
  filteredPendingRequests: PendingRequest[];
  priorityFilter: 'all' | 'high' | 'normal';
  setPriorityFilter: (filter: 'all' | 'high' | 'normal') => void;
  purposeFilter: 'all' | 'cliente' | 'restock' | 'return';
  setPurposeFilter: (filter: 'all' | 'cliente' | 'restock' | 'return') => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  actionLoading: number | null;
  onAcceptRequest: (requestId: number) => void;
}

const PendingRequestsTab: React.FC<PendingRequestsTabProps> = ({
  filteredPendingRequests,
  priorityFilter,
  setPriorityFilter,
  purposeFilter,
  setPurposeFilter,
  showFilters,
  setShowFilters,
  searchTerm,
  setSearchTerm,
  actionLoading,
  onAcceptRequest,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
          <h2 className="text-lg md:text-xl font-semibold flex items-center">
            <Package className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2" />
            Solicitudes Pendientes
          </h2>

          {/* Controles de filtros - RESPONSIVE */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} size="sm" className="sm:hidden">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>

            <div
              className={`flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 ${showFilters ? 'block' : 'hidden sm:flex'}`}
            >
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="px-2 py-1 md:px-3 md:py-2 border border-border rounded-md text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
              >
                <option value="all">Todas las prioridades</option>
                <option value="high">🔥 Urgentes</option>
                <option value="normal">📦 Normales</option>
              </select>

              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value as any)}
                className="px-2 py-1 md:px-3 md:py-2 border border-border rounded-md text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
              >
                <option value="all">Todos los propósitos</option>
                <option value="cliente">🏃‍♂️ Cliente presente</option>
                <option value="restock">📦 Reposición</option>
                <option value="return">🔄 Devoluciones</option>
              </select>
            </div>
          </div>
        </div>
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
        {filteredPendingRequests.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <Package className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base md:text-lg font-medium">
              {priorityFilter !== 'all' || purposeFilter !== 'all'
                ? 'No hay solicitudes que coincidan con los filtros'
                : 'No hay solicitudes pendientes'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {priorityFilter !== 'all' || purposeFilter !== 'all'
                ? 'Prueba ajustando los filtros de búsqueda'
                : 'Las nuevas solicitudes de transferencia aparecerán aquí automáticamente.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {filteredPendingRequests.map((request) => (
              <div
                key={request.id}
                className={`border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 ${
                  request.purpose === 'return' || request.request_type === 'return'
                    ? 'border-orange-300 bg-orange-50/30 dark:bg-orange-950/10'
                    : request.purpose === 'restock'
                      ? 'border-blue-300 bg-blue-50/30 dark:bg-blue-950/10'
                      : 'border-red-300 bg-red-50/30 dark:bg-red-950/10'
                }`}
              >
                {/* MOBILE COMPACT VIEW */}
                <div className="md:hidden">
                  <div className="p-4">
                    {/* Header con etiquetas de prioridad y propósito */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority_level)}`}
                        >
                          {request.priority_level === 'URGENT' || request.priority === 'high'
                            ? '🔥 URGENTE'
                            : '📦 Normal'}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(request.purpose)}`}
                        >
                          {request.purpose === 'cliente'
                            ? '🏃‍♂️ Cliente'
                            : request.purpose === 'restock'
                              ? '📦 Reposición'
                              : request.purpose === 'pair_formation'
                                ? '🔗 Formar Par'
                                : '↩️ Devolución'}
                        </span>
                        {request.request_type && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getRequestTypeColor(request.request_type)}`}
                          >
                            {request.request_type === 'transfer' ? '📦 Transferencia' : '↩️ Devolución'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Información específica de pies separados */}
                    {request.inventory_type && request.inventory_type !== 'pair' && (
                      <div className="mb-4 p-3 bg-card border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getInventoryTypeColor(request.inventory_type)}`}
                          >
                            {request.inventory_type_label ||
                              (request.inventory_type === 'left_only'
                                ? '🦶 Pie Izquierdo'
                                : request.inventory_type === 'right_only'
                                  ? '🦶 Pie Derecho'
                                  : '🦶 Pies Separados')}
                          </span>
                        </div>
                        {request.preparation_instruction && (
                          <p className="text-xs text-muted-foreground mt-2">{request.preparation_instruction}</p>
                        )}
                      </div>
                    )}

                    {/* Layout horizontal: Imagen vertical a la izquierda, info a la derecha */}
                    <div className="flex space-x-4 mb-4">
                      {/* Imagen vertical */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-48 rounded-lg overflow-hidden border border-border">
                          <img
                            src={request.product_info?.image_url || request.product_info?.image}
                            alt={`${request.brand} ${request.model}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (!e.currentTarget.dataset.fallback) {
                                e.currentTarget.dataset.fallback = 'true';
                                e.currentTarget.src = `https://via.placeholder.com/200x260/f3f4f6/9ca3af?text=${encodeURIComponent(request.brand)}`;
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Información del producto */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-foreground mb-2 leading-tight">
                          {request.brand} {request.model}
                        </h3>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-primary">Talla {request.size}</span>
                            <span className="text-sm text-muted-foreground">
                              {request.quantity} unidad{request.quantity > 1 ? 'es' : ''}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-foreground">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium truncate">
                              Solicitante: {request.requester_info?.name || 'Usuario'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
                            <span className="font-medium">De: {request.location_info?.from?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
                            <span className="font-medium">A: {request.location_info?.to?.name || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Estado de disponibilidad compacto */}
                        <div
                          className={`p-2 rounded text-center ${
                            (request.product_info?.stock_available ?? 0) > 0
                              ? 'bg-success/10 text-success border border-success/20'
                              : 'bg-error/10 text-error border border-error/20'
                          }`}
                        >
                          <div className="text-xs font-medium">
                            {(request.product_info?.stock_available ?? 0) > 0 ? '✅ Disponible' : '❌ Sin stock'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Stock: {request.product_info?.stock_available ?? 0}
                          </div>
                          {request.product_info?.unit_price && (
                            <div className="text-xs font-medium text-success mt-1">
                              {formatPrice(request.product_info.unit_price)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => onAcceptRequest(request.id)}
                        disabled={
                          request.request_type === 'transfer'
                            ? !((request.product_info?.stock_available ?? 0) > 0) || actionLoading === request.id
                            : actionLoading === request.id
                        }
                        className="flex-1 bg-success hover:bg-success/90 disabled:opacity-50 text-sm"
                        size="sm"
                      >
                        {actionLoading === request.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        ✅ Aceptar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* DESKTOP FULL VIEW */}
                <div className="hidden md:block p-6">
                  {/* Header con etiquetas */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(request.priority_level)}`}
                      >
                        {request.priority_level === 'URGENT' ? '🔥 URGENTE' : '📦 Normal'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPurposeColor(request.purpose)}`}
                      >
                        {request.purpose === 'cliente'
                          ? '🏃‍♂️ Cliente Presente'
                          : request.purpose === 'pair_formation'
                            ? '🔗 Formar Par'
                            : '📦 Reposición'}
                      </span>
                      {request.request_type && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getRequestTypeColor(request.request_type)}`}
                        >
                          {request.request_type === 'transfer' ? '📦 Transferencia' : '↩️ Devolución'}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        ⏱️ {request.time_elapsed || formatTimeWaiting(request.requested_at)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">ID #{request.id}</div>
                  </div>

                  {/* Información específica de pies separados */}
                  {request.inventory_type && request.inventory_type !== 'pair' && (
                    <div className="mb-6 p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getInventoryTypeColor(request.inventory_type)}`}
                        >
                          {request.inventory_type_label ||
                            (request.inventory_type === 'left_only'
                              ? '🦶 Pie Izquierdo'
                              : request.inventory_type === 'right_only'
                                ? '🦶 Pie Derecho'
                                : '🦶 Pies Separados')}
                        </span>
                        {request.urgent_action && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error border border-error/20">
                            ⚡ Acción Urgente
                          </span>
                        )}
                      </div>
                      {request.preparation_instruction && (
                        <p className="text-sm text-muted-foreground">{request.preparation_instruction}</p>
                      )}
                    </div>
                  )}

                  {/* Layout horizontal: Imagen vertical a la izquierda, información a la derecha */}
                  <div className="flex space-x-6">
                    {/* Imagen del producto vertical */}
                    <div className="flex-shrink-0">
                      <div className="w-48 h-64 rounded-xl overflow-hidden border border-border shadow-sm">
                        <img
                          src={
                            request.product_info?.image_url ||
                            request.product_info?.image ||
                            `https://via.placeholder.com/300x400/e5e7eb/6b7280?text=${encodeURIComponent(request.brand + ' ' + request.model)}`
                          }
                          alt={`${request.brand} ${request.model}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (!e.currentTarget.dataset.fallback) {
                              e.currentTarget.dataset.fallback = 'true';
                              e.currentTarget.src = `https://via.placeholder.com/300x400/f3f4f6/9ca3af?text=${encodeURIComponent(request.brand)}`;
                            }
                          }}
                        />
                      </div>
                      {request.product_info?.unit_price && (
                        <p className="text-center mt-3 font-medium text-success text-lg">
                          💰 {formatPrice(request.product_info.unit_price)}
                        </p>
                      )}
                    </div>

                    {/* Información del producto */}
                    <div className="flex-1 space-y-6">
                      <div>
                        <h3 className="text-3xl font-bold text-foreground mb-3 leading-tight">
                          {request.brand} {request.model}
                        </h3>

                        {request.product_color && (
                          <p className="text-lg text-muted-foreground mb-4">
                            🎨 <strong>Color:</strong> {request.product_color}
                          </p>
                        )}

                        <div className="grid grid-cols-4 gap-4 mb-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-xl font-bold text-blue-600">{request.size}</div>
                            <div className="text-sm text-blue-600 font-medium">Talla</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-xl font-bold text-green-600">{request.quantity}</div>
                            <div className="text-sm text-green-600 font-medium">Cantidad</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-xl font-bold text-purple-600">
                              {request.available_stock ?? request.stock_info?.available_stock ?? 0}
                            </div>
                            <div className="text-sm text-purple-600 font-medium">Stock</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-lg font-bold text-gray-600">📦</div>
                            <div className="text-sm text-gray-600 font-medium">Producto</div>
                          </div>
                        </div>

                        {/* Cliente */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-lg">
                                Solicitante:{' '}
                                {request.requester_first_name
                                  ? `${request.requester_first_name} ${request.requester_last_name}`
                                  : request.requester_name || 'Usuario'}
                              </div>
                              <div className="text-sm text-gray-500">Cliente</div>
                            </div>
                          </div>
                        </div>

                        {/* Origen y Destino */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div>
                                <div className="text-sm text-gray-500">Origen</div>
                                <div className="font-medium text-gray-900">
                                  {request.location_info?.from?.name || request.source_location_name || 'N/A'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                              <div>
                                <div className="text-sm text-gray-500">Destino</div>
                                <div className="font-medium text-gray-900">
                                  {request.location_info?.to?.name || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Código de referencia */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                          <div className="text-sm text-gray-500 mb-1">Código de referencia</div>
                          <div className="font-mono font-medium text-gray-900">{request.sneaker_reference_code}</div>
                        </div>

                        {/* Estado de disponibilidad */}
                        <div
                          className={`p-4 rounded-lg border-2 mb-6 ${
                            (request.product_info?.stock_available ?? 0) > 0
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span
                              className={`text-lg font-medium ${
                                (request.product_info?.stock_available ?? 0) > 0 ? 'text-green-700' : 'text-red-700'
                              }`}
                            >
                              {(request.product_info?.stock_available ?? 0) > 0 ? '✅ Disponible' : '❌ No disponible'}
                            </span>
                            <span className="text-sm text-gray-600">
                              Stock disponible: {request.product_info?.stock_available ?? 0} unidades
                            </span>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                            <p className="text-sm">
                              <strong>📝 Notas:</strong> {request.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <Button
                            onClick={() => onAcceptRequest(request.id)}
                            disabled={
                              request.request_type === 'transfer'
                                ? !((request.product_info?.stock_available ?? 0) > 0) || actionLoading === request.id
                                : actionLoading === request.id
                            }
                            className="flex-1 bg-success hover:bg-success/90 disabled:opacity-50"
                          >
                            {actionLoading === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            ✅ Aceptar y Preparar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingRequestsTab;
