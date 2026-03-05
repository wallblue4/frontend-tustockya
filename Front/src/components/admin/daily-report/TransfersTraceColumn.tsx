import React, { useState, useMemo } from 'react';
import { Truck, Undo2 } from 'lucide-react';
import TransferCard from './TransferCard';
import LocationSearchSelect from './LocationSearchSelect';

interface TransferLocation {
  id: number;
  name: string;
  type: 'local' | 'bodega';
}

interface TransferProduct {
  reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  image_url?: string | null;
}

interface TransferDates {
  requested_at: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  confirmed_reception_at: string | null;
}

interface TransferParticipant {
  id: number | null;
  name: string | null;
}

interface TransferParticipants {
  requester: TransferParticipant;
  courier: TransferParticipant;
  warehouse_keeper: TransferParticipant;
}

interface Transfer {
  transfer_id: number;
  source_location: TransferLocation;
  destination_location: TransferLocation;
  product: TransferProduct;
  status: string;
  dates: TransferDates;
  participants: TransferParticipants;
  notes: string;
  pickup_type: 'seller' | 'corredor';
  request_type: string;
  inventory_type: string;
  has_return_request?: boolean;
}

interface Location {
  id: number;
  name: string;
  type: string;
}

interface TransfersTraceColumnProps {
  transfers: Transfer[];
  loading: boolean;
  formatDate: (date: string) => string;
  locations: Location[];
}

const TransfersTraceColumn: React.FC<TransfersTraceColumnProps> = ({ transfers, loading, formatDate, locations }) => {
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTransfers = useMemo(() => {
    if (!locationFilter) return transfers;
    const locId = parseInt(locationFilter);
    return transfers.filter((t) => t.source_location.id === locId || t.destination_location.id === locId);
  }, [transfers, locationFilter]);

  // Pendientes: completed but not selled and not returns, excluding those with pending return request
  const pendingTransfers = useMemo(
    () =>
      filteredTransfers.filter((t) => t.status === 'completed' && t.request_type !== 'return' && !t.has_return_request),
    [filteredTransfers]
  );
  // Vendidos: selled
  const selledTransfers = useMemo(() => filteredTransfers.filter((t) => t.status === 'selled'), [filteredTransfers]);
  // Devoluciones: returns with status completed
  const completedReturns = useMemo(
    () => filteredTransfers.filter((t) => t.request_type === 'return' && t.status === 'completed'),
    [filteredTransfers]
  );

  const statusFilters: {
    key: string;
    label: string;
    activeClass: string;
    inactiveClass: string;
    disabledClass: string;
  }[] = [
    {
      key: 'pending',
      label: 'Pendientes',
      activeClass: 'bg-warning text-white',
      inactiveClass: 'bg-warning/10 text-warning hover:bg-warning/20',
      disabledClass: 'bg-muted/30 text-muted-foreground/50',
    },
    {
      key: 'selled',
      label: 'Vendidos',
      activeClass: 'bg-success text-white',
      inactiveClass: 'bg-success/10 text-success hover:bg-success/20',
      disabledClass: 'bg-muted/30 text-muted-foreground/50',
    },
    {
      key: 'returns',
      label: 'Devoluciones',
      activeClass: 'bg-destructive text-white',
      inactiveClass: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
      disabledClass: 'bg-muted/30 text-muted-foreground/50',
    },
  ];

  const statusCounts: Record<string, number> = useMemo(
    () => ({
      pending: pendingTransfers.length,
      selled: selledTransfers.length,
      returns: completedReturns.length,
    }),
    [pendingTransfers, selledTransfers, completedReturns]
  );

  const totalCount = pendingTransfers.length + selledTransfers.length + completedReturns.length;

  const visibleTransfers = useMemo(() => {
    if (statusFilter === 'returns') return [];
    if (statusFilter === 'all') return [...pendingTransfers, ...selledTransfers];
    if (statusFilter === 'pending') return pendingTransfers;
    if (statusFilter === 'selled') return selledTransfers;
    return [];
  }, [pendingTransfers, selledTransfers, statusFilter]);

  const visibleReturns = useMemo(() => {
    if (statusFilter !== 'all' && statusFilter !== 'returns') return [];
    return completedReturns;
  }, [completedReturns, statusFilter]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 px-1">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Pedidos ({totalCount})</h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-7">
          {statusFilters.map((f) => {
            const count = statusCounts[f.key] || 0;
            const isDisabled = count === 0;
            const isActive = statusFilter === f.key;
            return (
              <button
                key={f.key}
                disabled={isDisabled}
                onClick={() => setStatusFilter(isActive ? 'all' : f.key)}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  isDisabled ? f.disabledClass : isActive ? f.activeClass : f.inactiveClass
                } ${isDisabled ? 'cursor-not-allowed' : ''}`}
              >
                {count} {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3">
        <LocationSearchSelect
          locations={locations}
          value={locationFilter}
          onChange={setLocationFilter}
          placeholder="Todas las ubicaciones"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted/30 h-24 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No hay pedidos ni devoluciones para esta fecha
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {/* Transferencias */}
          {visibleTransfers.map((transfer) => (
            <TransferCard key={transfer.transfer_id} transfer={transfer} formatDate={formatDate} />
          ))}

          {/* Devoluciones */}
          {visibleReturns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1 pt-2 border-t border-border">
                <Undo2 className="h-4 w-4 text-destructive" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Devoluciones
                </span>
              </div>
              {visibleReturns.map((transfer) => (
                <TransferCard key={transfer.transfer_id} transfer={transfer} formatDate={formatDate} />
              ))}
            </div>
          )}

          {visibleTransfers.length === 0 && visibleReturns.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">No hay resultados para este filtro</div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransfersTraceColumn;
