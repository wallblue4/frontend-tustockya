import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import DiscountCard from './DiscountCard';

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

interface DiscountApprovalsColumnProps {
  discounts: DiscountRequest[];
  handleApproveDiscount: (discountId: number, approved: boolean, notes?: string) => void;
  loadNotifications: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

const DiscountApprovalsColumn: React.FC<DiscountApprovalsColumnProps> = ({
  discounts,
  handleApproveDiscount,
  loadNotifications,
  formatCurrency,
  formatDate,
}) => {
  const pendingCount = discounts.filter(
    (d) => !d.status || d.status === 'pending' || d.status === 'pendiente'
  ).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          <h3 className="text-base font-semibold text-foreground">Descuentos</h3>
          {pendingCount > 0 && (
            <Badge variant="warning">{pendingCount}</Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={loadNotifications}
          className="text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {discounts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No hay solicitudes de descuento pendientes
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {discounts.map((discount) => (
            <DiscountCard
              key={discount.id}
              discount={discount}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              handleApproveDiscount={handleApproveDiscount}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscountApprovalsColumn;
