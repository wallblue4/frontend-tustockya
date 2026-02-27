import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Truck } from 'lucide-react';
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

const TransfersTraceColumn: React.FC<TransfersTraceColumnProps> = ({
  transfers,
  loading,
  formatDate,
  locations,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [locationFilter, setLocationFilter] = useState('');

  const filteredTransfers = useMemo(() => {
    if (!locationFilter) return transfers;
    const locId = parseInt(locationFilter);
    return transfers.filter(
      (t) => t.source_location.id === locId || t.destination_location.id === locId
    );
  }, [transfers, locationFilter]);

  const groupedTransfers = useMemo(() => {
    const groups: Record<string, { reference: string; brand: string; model: string; transfers: Transfer[]; totalQuantity: number; completedCount: number; pendingCount: number }> = {};

    for (const transfer of filteredTransfers) {
      const key = transfer.product.reference_code || `${transfer.product.brand}-${transfer.product.model}`;
      if (!groups[key]) {
        groups[key] = {
          reference: transfer.product.reference_code,
          brand: transfer.product.brand,
          model: transfer.product.model,
          transfers: [],
          totalQuantity: 0,
          completedCount: 0,
          pendingCount: 0,
        };
      }
      groups[key].transfers.push(transfer);
      groups[key].totalQuantity += transfer.product.quantity;
      if (transfer.status === 'completed') {
        groups[key].completedCount++;
      } else {
        groups[key].pendingCount++;
      }
    }

    return Object.entries(groups).sort((a, b) => b[1].totalQuantity - a[1].totalQuantity);
  }, [filteredTransfers]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Transferencias</h3>
        </div>
        {filteredTransfers.length > 0 && (
          <span className="text-sm text-muted-foreground">{filteredTransfers.length}</span>
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
          No hay transferencias para esta fecha
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {groupedTransfers.map(([key, group]) => {
            const isCollapsed = collapsedGroups.has(key);
            return (
              <div key={key} className="space-y-2">
                <button
                  onClick={() => toggleGroup(key)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col items-start gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {group.brand} {group.model}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {group.totalQuantity} uds · {group.transfers.length} transf.
                      {group.completedCount > 0 && <span className="text-success"> · {group.completedCount} completadas</span>}
                      {group.pendingCount > 0 && <span className="text-warning"> · {group.pendingCount} en curso</span>}
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-2 pl-2">
                    {group.transfers.map((transfer) => (
                      <TransferCard
                        key={transfer.transfer_id}
                        transfer={transfer}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransfersTraceColumn;
