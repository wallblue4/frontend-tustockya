import React, { useState } from 'react';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface DiscountRequest {
  id: number;
  requester_name?: string;
  seller_name?: string;
  location_name?: string;
  reason?: string;
  discount_amount?: number;
  discount_percentage?: number;
  original_price?: number;
  final_price?: number;
  requested_at?: string;
  created_at?: string;
  status?: string;
  product_name?: string;
  brand?: string;
  model?: string;
  size?: string;
}

interface DiscountCardProps {
  discount: DiscountRequest;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  handleApproveDiscount: (discountId: number, approved: boolean, notes?: string) => void;
}

const DiscountCard: React.FC<DiscountCardProps> = ({ discount, formatCurrency, formatDate, handleApproveDiscount }) => {
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const isFromSale = discount.status === 'from_sale';
  const isPending = !discount.status || discount.status === 'pending' || discount.status === 'pendiente';
  const isApproved = discount.status === 'approved' || discount.status === 'aprobado';
  const _isRejected = discount.status === 'rejected' || discount.status === 'rechazado';
  const statusVariant = isFromSale ? 'secondary' : isPending ? 'warning' : isApproved ? 'success' : 'error';
  const statusLabel = isFromSale
    ? 'Venta con descuento'
    : isPending
      ? 'Pendiente'
      : isApproved
        ? 'Aprobado'
        : 'Rechazado';

  const sellerName = discount.requester_name || discount.seller_name || 'Desconocido';
  const dateStr = discount.requested_at || discount.created_at;

  return (
    <div
      className={`border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-card ${isPending ? 'border-warning/40' : 'border-border'}`}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{sellerName}</p>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        {discount.location_name && <p className="text-xs text-muted-foreground">{discount.location_name}</p>}

        {(discount.brand || discount.product_name) && (
          <p className="text-xs text-foreground">
            {discount.brand && discount.model
              ? `${discount.brand} ${discount.model}${discount.size ? ` T${discount.size}` : ''}`
              : discount.product_name}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs">
          {discount.original_price != null && (
            <span className="text-muted-foreground line-through">{formatCurrency(discount.original_price)}</span>
          )}
          {discount.discount_amount != null && (
            <span className="font-semibold text-warning">-{formatCurrency(discount.discount_amount)}</span>
          )}
          {discount.discount_percentage != null && (
            <span className="font-semibold text-warning">-{discount.discount_percentage}%</span>
          )}
          {discount.final_price != null && (
            <span className="font-bold text-foreground">{formatCurrency(discount.final_price)}</span>
          )}
        </div>

        {discount.reason && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-warning/30 pl-2">{discount.reason}</p>
        )}

        {dateStr && <p className="text-xs text-muted-foreground">{formatDate(dateStr)}</p>}

        {isPending && (
          <div className="pt-2 border-t border-border space-y-2">
            {showNotes && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas del admin (opcional)..."
                className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded-md
                  text-foreground placeholder:text-muted-foreground resize-none
                  focus:outline-none focus:ring-1 focus:ring-primary/50"
                rows={2}
              />
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs flex-shrink-0"
                onClick={() => setShowNotes(!showNotes)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleApproveDiscount(discount.id, false, notes || undefined)}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Rechazar
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleApproveDiscount(discount.id, true, notes || undefined)}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Aprobar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountCard;
