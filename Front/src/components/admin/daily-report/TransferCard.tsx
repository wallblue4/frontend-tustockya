import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, User } from 'lucide-react';
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
  has_return_request?: boolean;
}

interface TransferCardProps {
  transfer: Transfer;
  formatDate: (date: string) => string;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'secondary' | 'primary' | 'error'> = {
  completed: 'success',
  selled: 'success',
  pending: 'warning',
  in_transit: 'primary',
  accepted: 'warning',
  picked_up: 'primary',
  delivered: 'primary',
  cancelled: 'error',
};

const statusLabelMap: Record<string, string> = {
  completed: 'Completado',
  selled: 'Vendido',
  pending: 'Pendiente',
  in_transit: 'En tránsito',
  accepted: 'Pendiente',
  picked_up: 'Recogida',
  delivered: 'Entregada',
  cancelled: 'Cancelado',
};

const inventoryTypeLabelMap: Record<string, string> = {
  pair: 'Par completo',
  left_only: 'Pie izquierdo',
  right_only: 'Pie derecho',
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const TransferCard: React.FC<TransferCardProps> = ({ transfer, formatDate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusVariant = statusVariantMap[transfer.status] || 'secondary';
  const borderColorMap: Record<string, string> = {
    completed: 'border-warning/40',
    selled: 'border-success/40',
    pending: 'border-warning/40',
    in_transit: 'border-warning/40',
    picked_up: 'border-warning/40',
    delivered: 'border-warning/40',
    accepted: 'border-warning/40',
    cancelled: 'border-destructive/40',
  };
  const borderColor =
    transfer.request_type === 'return' ? 'border-destructive/40' : borderColorMap[transfer.status] || 'border-border';

  const dateEntries = [
    { label: 'Solicitado', value: transfer.dates.requested_at },
    { label: 'Aceptado', value: transfer.dates.accepted_at },
    { label: 'Recogido', value: transfer.dates.picked_up_at },
    { label: 'Entregado', value: transfer.dates.delivered_at },
    { label: 'Recepción', value: transfer.dates.confirmed_reception_at },
  ].filter((e) => e.value);

  return (
    <div
      className={`border ${borderColor} rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-card`}
    >
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
              {transfer.request_type === 'return' ? (
                <Badge variant="error">Devolución</Badge>
              ) : transfer.status === 'completed' ? (
                <Badge variant="warning">Pendiente</Badge>
              ) : (
                <Badge variant={statusVariant}>{statusLabelMap[transfer.status] || transfer.status}</Badge>
              )}
              {transfer.dates.confirmed_reception_at && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatTime(transfer.dates.confirmed_reception_at)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Talla: {transfer.product.size}</span>
              {transfer.status !== 'selled' && transfer.inventory_type && (
                <>
                  <span>·</span>
                  <span>{inventoryTypeLabelMap[transfer.inventory_type] || transfer.inventory_type}</span>
                </>
              )}
            </div>
            <div className="flex flex-col gap-1 mt-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground w-7">De</span>
                <Badge variant={transfer.source_location.type === 'bodega' ? 'primary' : 'warning'}>
                  {transfer.source_location.name}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground w-7">Para</span>
                <Badge variant={transfer.destination_location.type === 'bodega' ? 'primary' : 'warning'}>
                  {transfer.destination_location.name}
                </Badge>
              </div>
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
            <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">{transfer.notes}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransferCard;
