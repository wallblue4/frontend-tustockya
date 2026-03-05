import React from 'react';
import { Eye } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface SaleItem {
  product_reference: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  unit_price: number;
}

interface Sale {
  sale_id: number;
  location_name: string;
  seller_name: string;
  total_amount: number;
  sale_date: string;
  items: SaleItem[];
  receipt_image?: string | null;
}

interface SaleCardProps {
  sale: Sale;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  setReceiptPreviewUrl: (url: string | null) => void;
}

const SaleCard: React.FC<SaleCardProps> = ({ sale, formatCurrency, formatDate, setReceiptPreviewUrl }) => {
  return (
    <div className="border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-card">
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{sale.seller_name}</p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(sale.sale_date)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{sale.location_name}</span>
          <span className="text-sm font-bold text-primary">{formatCurrency(sale.total_amount)}</span>
        </div>

        <div className="space-y-1.5 border-t border-border pt-2">
          {sale.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-medium text-foreground truncate">
                  {item.brand} {item.model}
                </span>
                <Badge variant="secondary">T{item.size}</Badge>
                {/* TODO: Badge indicating if sold pair was exhibition, bodega, or other source */}
                {/* <Badge variant="warning">Exhibición</Badge> */}
                {/* <Badge variant="secondary">Bodega</Badge> */}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-muted-foreground">x{item.quantity}</span>
                <span className="font-medium text-foreground">{formatCurrency(item.unit_price)}</span>
              </div>
            </div>
          ))}
        </div>

        {sale.receipt_image && (
          <div className="pt-1 border-t border-border">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => setReceiptPreviewUrl(sale.receipt_image!)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Ver recibo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleCard;
