import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Truck, Calendar, ChevronDown, ChevronUp, Warehouse, Store, Info } from 'lucide-react';
import { EmptyState } from '../../components/admin/ErrorState';
import { fetchDailyTransfersTraceability } from '../../services/adminAPI';
import type { DailyTransferTraceability } from '../../services/adminAPI';
import { formatDate } from '../../utils/formatters';
import { todayLocal } from '../../utils/date';

const todayISO = todayLocal();

const statusVariantMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  accepted: 'warning',
  in_transit: 'primary',
  picked_up: 'primary',
  delivered: 'primary',
  completed: 'success',
  selled: 'success',
  cancelled: 'error',
};

const statusLabelMap: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Pendiente',
  in_transit: 'En tránsito',
  picked_up: 'Recogida',
  delivered: 'Entregada',
  completed: 'Completada',
  selled: 'Vendido',
  cancelled: 'Cancelado',
};

const statusFilters: { key: string; label: string; activeClass: string; inactiveClass: string }[] = [
  {
    key: 'pending',
    label: 'Pendientes',
    activeClass: 'bg-warning text-white',
    inactiveClass: 'bg-warning/10 text-warning hover:bg-warning/20',
  },
  {
    key: 'in_transit',
    label: 'En tránsito',
    activeClass: 'bg-primary text-white',
    inactiveClass: 'bg-primary/10 text-primary hover:bg-primary/20',
  },
  {
    key: 'delivered',
    label: 'Entregadas',
    activeClass: 'bg-primary text-white',
    inactiveClass: 'bg-primary/10 text-primary hover:bg-primary/20',
  },
  {
    key: 'completed',
    label: 'Completadas',
    activeClass: 'bg-success text-white',
    inactiveClass: 'bg-success/10 text-success hover:bg-success/20',
  },
  {
    key: 'selled',
    label: 'Vendidos',
    activeClass: 'bg-success text-white',
    inactiveClass: 'bg-success/10 text-success hover:bg-success/20',
  },
  {
    key: 'cancelled',
    label: 'Cancelados',
    activeClass: 'bg-destructive text-white',
    inactiveClass: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  },
  {
    key: 'returns',
    label: 'Devoluciones',
    activeClass: 'bg-destructive text-white',
    inactiveClass: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  },
];

const lifecycleSteps = [
  { status: 'Pendiente', description: 'Bodeguero está pendiente de aceptar la transferencia' },
  { status: 'Aceptada', description: 'Bodeguero aceptó la transferencia' },
  { status: 'En tránsito', description: 'Bodeguero se la pasa al corredor' },
  { status: 'Entregada', description: 'Bodeguero o corredor la entregan al vendedor' },
  { status: 'Completada', description: 'Vendedor confirma que la recibió' },
];

const getPickupTypeLabel = (type: string): string => {
  switch (type) {
    case 'seller':
      return 'Vendedor';
    case 'corredor':
      return 'Corredor';
    default:
      return type;
  }
};

export const TransfersPage: React.FC = () => {
  const [transfersTraceabilityFilters, setTransfersTraceabilityFilters] = useState<{ target_date: string }>({
    target_date: todayISO,
  });
  const [transfersTraceabilityData, setTransfersTraceabilityData] = useState<DailyTransferTraceability[]>([]);
  const [transfersTraceabilityLoading, setTransfersTraceabilityLoading] = useState<boolean>(false);
  const [transfersTraceabilityError, setTransfersTraceabilityError] = useState<string | null>(null);
  const [expandedTransfers, setExpandedTransfers] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const transfersOnly = useMemo(
    () => transfersTraceabilityData.filter((t) => t.request_type !== 'return'),
    [transfersTraceabilityData]
  );
  const returnsOnly = useMemo(
    () => transfersTraceabilityData.filter((t) => t.request_type === 'return'),
    [transfersTraceabilityData]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of transfersOnly) {
      const key = ['accepted', 'picked_up'].includes(t.status) ? 'pending' : t.status;
      counts[key] = (counts[key] || 0) + 1;
    }
    counts['returns'] = returnsOnly.length;
    return counts;
  }, [transfersOnly, returnsOnly]);

  const visibleTransfers = useMemo(() => {
    if (statusFilter === 'returns') return [];
    if (statusFilter === 'all') return transfersOnly;
    if (statusFilter === 'pending')
      return transfersOnly.filter((t) => ['pending', 'accepted', 'picked_up'].includes(t.status));
    return transfersOnly.filter((t) => t.status === statusFilter);
  }, [transfersOnly, statusFilter]);

  const visibleReturns = useMemo(() => {
    if (statusFilter !== 'all' && statusFilter !== 'returns') return [];
    return returnsOnly;
  }, [returnsOnly, statusFilter]);

  const toggleTransferExpansion = (transferId: number) => {
    setExpandedTransfers((prev) => {
      const next = new Set(prev);
      if (next.has(transferId)) {
        next.delete(transferId);
      } else {
        next.add(transferId);
      }
      return next;
    });
  };

  const handleFetchTransfersTraceability = async () => {
    if (!transfersTraceabilityFilters.target_date) {
      setTransfersTraceabilityError('Debe seleccionar una fecha.');
      return;
    }

    setTransfersTraceabilityLoading(true);
    setTransfersTraceabilityError(null);

    try {
      const response = await fetchDailyTransfersTraceability({
        target_date: transfersTraceabilityFilters.target_date,
      });

      const normalized = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.transfers)
            ? response.transfers
            : [];

      setTransfersTraceabilityData(normalized);
    } catch (err: any) {
      setTransfersTraceabilityError(err?.message || 'Error al obtener la trazabilidad de transferencias.');
    } finally {
      setTransfersTraceabilityLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-2xl font-bold">Trazabilidad de Transferencias</h2>

      <Card>
        <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center space-x-3">
          <Truck className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Transferencias del Dia ({transfersTraceabilityData.length})</h3>
        </div>
        <CardContent>
          {/* Lifecycle explanation */}
          <div className="mb-5 p-4 bg-muted/20 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Ciclo de vida de una transferencia</span>
            </div>
            <ol className="space-y-1.5 text-xs text-muted-foreground">
              {lifecycleSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-semibold text-foreground min-w-[90px]">
                    {i + 1}. {step.status}:
                  </span>
                  <span>{step.description}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Date filter */}
          <div className="flex flex-col sm:flex-row items-end gap-4 mb-6">
            <div className="flex-1 w-full sm:w-auto">
              <Input
                label="Fecha"
                type="date"
                value={transfersTraceabilityFilters.target_date}
                onChange={(e) =>
                  setTransfersTraceabilityFilters((prev) => ({
                    ...prev,
                    target_date: e.target.value,
                  }))
                }
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>
            <Button onClick={handleFetchTransfersTraceability} isLoading={transfersTraceabilityLoading}>
              Consultar
            </Button>
          </div>

          {/* Status filter buttons */}
          {transfersTraceabilityData.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {statusFilters.map((f) => {
                const count = statusCounts[f.key] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(statusFilter === f.key ? 'all' : f.key)}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      statusFilter === f.key ? f.activeClass : f.inactiveClass
                    }`}
                  >
                    {count} {f.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Error display */}
          {transfersTraceabilityError && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {transfersTraceabilityError}
            </div>
          )}

          {/* Transfer cards */}
          {visibleTransfers.length > 0 || visibleReturns.length > 0 ? (
            <div className="space-y-4">
              {[...visibleTransfers, ...visibleReturns].map((transfer) => {
                const isExpanded = expandedTransfers.has(transfer.transfer_id);
                const borderColorMap: Record<string, string> = {
                  completed: 'border-success/40',
                  selled: 'border-success/40',
                  pending: 'border-warning/40',
                  accepted: 'border-warning/40',
                  in_transit: 'border-primary/40',
                  picked_up: 'border-primary/40',
                  delivered: 'border-primary/40',
                  cancelled: 'border-destructive/40',
                };
                const borderColor =
                  transfer.request_type === 'return'
                    ? 'border-destructive/40'
                    : borderColorMap[transfer.status] || 'border-border';

                return (
                  <div key={transfer.transfer_id} className={`border ${borderColor} rounded-lg overflow-hidden`}>
                    {/* Collapsed row */}
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
                      onClick={() => toggleTransferExpansion(transfer.transfer_id)}
                    >
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Truck className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">
                            {transfer.product.brand} {transfer.product.model}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {transfer.request_type === 'return' && <Badge variant="error">Devolución</Badge>}
                            <Badge variant={statusVariantMap[transfer.status] || 'secondary'}>
                              {statusLabelMap[transfer.status] || transfer.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">T{transfer.product.size}</span>
                            <span className="text-xs text-muted-foreground">{transfer.product.quantity} uds</span>
                            <span className="text-xs text-muted-foreground">
                              {getPickupTypeLabel(transfer.pickup_type)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/5 p-4 space-y-5">
                        {/* Product details */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Producto</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Referencia:</span>{' '}
                              <span className="font-medium">{transfer.product.reference_code}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Marca:</span>{' '}
                              <span className="font-medium">{transfer.product.brand}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Modelo:</span>{' '}
                              <span className="font-medium">{transfer.product.model}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Talla:</span>{' '}
                              <span className="font-medium">{transfer.product.size}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cantidad:</span>{' '}
                              <span className="font-medium">{transfer.product.quantity}</span>
                            </div>
                          </div>
                        </div>

                        {/* Type info */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tipo inventario:</span>{' '}
                            <span className="font-medium">{transfer.inventory_type}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tipo solicitud:</span>{' '}
                            <span className="font-medium">{transfer.request_type}</span>
                          </div>
                        </div>

                        {/* Source & destination */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Ubicaciones</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                              <div
                                className={`p-2 rounded-lg ${transfer.source_location.type === 'bodega' ? 'bg-secondary/10' : 'bg-primary/10'}`}
                              >
                                {transfer.source_location.type === 'bodega' ? (
                                  <Warehouse className="h-5 w-5 text-secondary" />
                                ) : (
                                  <Store className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Origen</p>
                                <p className="font-medium text-sm">{transfer.source_location.name}</p>
                                <Badge
                                  variant={transfer.source_location.type === 'bodega' ? 'secondary' : 'primary'}
                                  className="mt-1"
                                >
                                  {transfer.source_location.type === 'bodega' ? 'Bodega' : 'Local'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                              <div
                                className={`p-2 rounded-lg ${transfer.destination_location.type === 'bodega' ? 'bg-secondary/10' : 'bg-primary/10'}`}
                              >
                                {transfer.destination_location.type === 'bodega' ? (
                                  <Warehouse className="h-5 w-5 text-secondary" />
                                ) : (
                                  <Store className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Destino</p>
                                <p className="font-medium text-sm">{transfer.destination_location.name}</p>
                                <Badge
                                  variant={transfer.destination_location.type === 'bodega' ? 'secondary' : 'primary'}
                                  className="mt-1"
                                >
                                  {transfer.destination_location.type === 'bodega' ? 'Bodega' : 'Local'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Participants */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Participantes</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <div className="p-3 border border-border rounded-lg">
                              <p className="text-xs text-muted-foreground">Solicitante</p>
                              <p className="font-medium">{transfer.participants.requester.name || 'N/A'}</p>
                              {transfer.participants.requester.id && (
                                <p className="text-xs text-muted-foreground">
                                  ID: {transfer.participants.requester.id}
                                </p>
                              )}
                            </div>
                            <div className="p-3 border border-border rounded-lg">
                              <p className="text-xs text-muted-foreground">Corredor</p>
                              <p className="font-medium">{transfer.participants.courier.name || 'N/A'}</p>
                              {transfer.participants.courier.id && (
                                <p className="text-xs text-muted-foreground">ID: {transfer.participants.courier.id}</p>
                              )}
                            </div>
                            <div className="p-3 border border-border rounded-lg">
                              <p className="text-xs text-muted-foreground">Bodeguero</p>
                              <p className="font-medium">{transfer.participants.warehouse_keeper.name || 'N/A'}</p>
                              {transfer.participants.warehouse_keeper.id && (
                                <p className="text-xs text-muted-foreground">
                                  ID: {transfer.participants.warehouse_keeper.id}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Fechas</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Solicitada:</span>{' '}
                              <span className="font-medium">
                                {transfer.dates.requested_at ? formatDate(transfer.dates.requested_at) : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Aceptada:</span>{' '}
                              <span className="font-medium">
                                {transfer.dates.accepted_at ? formatDate(transfer.dates.accepted_at) : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Recogida:</span>{' '}
                              <span className="font-medium">
                                {transfer.dates.picked_up_at ? formatDate(transfer.dates.picked_up_at) : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Entregada:</span>{' '}
                              <span className="font-medium">
                                {transfer.dates.delivered_at ? formatDate(transfer.dates.delivered_at) : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Recepcion confirmada:</span>{' '}
                              <span className="font-medium">
                                {transfer.dates.confirmed_reception_at
                                  ? formatDate(transfer.dates.confirmed_reception_at)
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {transfer.notes && (
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2">Notas</h4>
                            <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">{transfer.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : transfersTraceabilityData.length > 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">No hay resultados para este filtro</div>
          ) : (
            !transfersTraceabilityLoading && (
              <EmptyState
                title="Sin transferencias"
                description="No se encontraron transferencias para la fecha seleccionada. Seleccione una fecha y presione Consultar."
                icon={<Truck className="h-12 w-12 text-muted-foreground mx-auto" />}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};
