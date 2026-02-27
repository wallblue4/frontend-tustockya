import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Calendar, User } from 'lucide-react';
import { Badge } from '../../ui/Badge';

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

interface TransferCardProps {
  transfer: Transfer;
  formatDate: (date: string) => string;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'secondary' | 'primary' | 'error'> = {
  completed: 'success',
  pending: 'warning',
  in_transit: 'primary',
  accepted: 'primary',
  picked_up: 'primary',
  delivered: 'primary',
  cancelled: 'error',
};

const TransferCard: React.FC<TransferCardProps> = ({ transfer, formatDate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusVariant = statusVariantMap[transfer.status] || 'secondary';
  const borderColor = transfer.status === 'completed' ? 'border-success/30' : 'border-border';

  const dateEntries = [
    { label: 'Solicitado', value: transfer.dates.requested_at },
    { label: 'Aceptado', value: transfer.dates.accepted_at },
    { label: 'Recogido', value: transfer.dates.picked_up_at },
    { label: 'Entregado', value: transfer.dates.delivered_at },
    { label: 'Recepción', value: transfer.dates.confirmed_reception_at },
  ].filter((e) => e.value);

  return (
    <div className={`border ${borderColor} rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-card`}>
      <div
        className="p-3 cursor-pointer hover:bg-muted/10 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {transfer.product.brand} {transfer.product.model}
              </p>
              <Badge variant={statusVariant}>{transfer.status}</Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>T{transfer.product.size}</span>
              <span>·</span>
              <span>{transfer.product.quantity} uds</span>
              <span>·</span>
              <span>{transfer.pickup_type === 'corredor' ? 'Corredor' : 'Vendedor'}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <Badge variant={transfer.source_location.type === 'bodega' ? 'warning' : 'primary'}>
                {transfer.source_location.name}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <Badge variant={transfer.destination_location.type === 'bodega' ? 'warning' : 'primary'}>
                {transfer.destination_location.name}
              </Badge>
            </div>
          </div>
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border bg-muted/5 p-3 space-y-3">
          {transfer.inventory_type && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Tipo inventario:</span>
              <Badge variant="secondary">{transfer.inventory_type}</Badge>
            </div>
          )}

          {transfer.request_type && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Tipo solicitud:</span>
              <span className="text-foreground">{transfer.request_type}</span>
            </div>
          )}

          {dateEntries.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Línea de tiempo
              </p>
              {dateEntries.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between text-xs pl-4">
                  <span className="text-muted-foreground">{entry.label}</span>
                  <span className="text-foreground">{formatDate(entry.value!)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <User className="h-3 w-3" /> Participantes
            </p>
            {transfer.participants.requester?.name && (
              <div className="flex items-center justify-between text-xs pl-4">
                <span className="text-muted-foreground">Solicitante</span>
                <span className="text-foreground">{transfer.participants.requester.name}</span>
              </div>
            )}
            {transfer.participants.courier?.name && (
              <div className="flex items-center justify-between text-xs pl-4">
                <span className="text-muted-foreground">Corredor</span>
                <span className="text-foreground">{transfer.participants.courier.name}</span>
              </div>
            )}
            {transfer.participants.warehouse_keeper?.name && (
              <div className="flex items-center justify-between text-xs pl-4">
                <span className="text-muted-foreground">Bodeguero</span>
                <span className="text-foreground">{transfer.participants.warehouse_keeper.name}</span>
              </div>
            )}
          </div>

          {transfer.notes && (
            <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
              {transfer.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransferCard;
