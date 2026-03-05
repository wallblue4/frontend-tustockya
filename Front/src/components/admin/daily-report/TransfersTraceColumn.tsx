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

  const transfersOnly = useMemo(
    () => filteredTransfers.filter((t) => t.request_type !== 'return'),
    [filteredTransfers]
  );
  const returnsOnly = useMemo(() => filteredTransfers.filter((t) => t.request_type === 'return'), [filteredTransfers]);

  const statusFilters: { key: string; label: string; activeClass: string; inactiveClass: string }[] = [
    {
      key: 'pending',
      label: 'En curso',
      activeClass: 'bg-warning text-white',
      inactiveClass: 'bg-warning/10 text-warning hover:bg-warning/20',
    },
    {
      key: 'accepted',
      label: 'Aceptadas',
      activeClass: 'bg-orange-500 text-white',
      inactiveClass: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
    },
    {
      key: 'completed',
      label: 'Completadas',
      activeClass: 'bg-primary text-white',
      inactiveClass: 'bg-primary/10 text-primary hover:bg-primary/20',
    },
    {
      key: 'selled',
      label: 'Vendidas',
      activeClass: 'bg-success text-white',
      inactiveClass: 'bg-success/10 text-success hover:bg-success/20',
    },
    {
      key: 'cancelled',
      label: 'Canceladas',
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

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of transfersOnly) {
      const key = ['in_transit', 'picked_up', 'delivered'].includes(t.status) ? 'pending' : t.status;
      counts[key] = (counts[key] || 0) + 1;
    }
    counts['returns'] = returnsOnly.length;
    return counts;
  }, [transfersOnly, returnsOnly]);

  const visibleTransfers = useMemo(() => {
    if (statusFilter === 'returns') return [];
    if (statusFilter === 'all') return transfersOnly;
    if (statusFilter === 'pending')
      return transfersOnly.filter((t) => ['pending', 'in_transit', 'picked_up', 'delivered'].includes(t.status));
    return transfersOnly.filter((t) => t.status === statusFilter);
  }, [transfersOnly, statusFilter]);

  const visibleReturns = useMemo(() => {
    if (statusFilter !== 'all' && statusFilter !== 'returns') return [];
    return returnsOnly;
  }, [returnsOnly, statusFilter]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 px-1">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Transferencias ({filteredTransfers.length})</h3>
        </div>
        {(transfersOnly.length > 0 || returnsOnly.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-7">
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
          No hay transferencias ni devoluciones para esta fecha
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
