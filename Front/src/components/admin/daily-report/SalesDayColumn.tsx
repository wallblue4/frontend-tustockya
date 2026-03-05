import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import SaleCard from './SaleCard';

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
  location_id: number;
  location_name: string;
  seller_id: number;
  seller_name: string;
  total_amount: number;
  sale_date: string;
  items: SaleItem[];
  receipt_image?: string | null;
}

interface SalesDayColumnProps {
  sales: Sale[];
  loading: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  setReceiptPreviewUrl: (url: string | null) => void;
}

const SalesDayColumn: React.FC<SalesDayColumnProps> = ({
  sales,
  loading,
  formatCurrency,
  formatDate,
  setReceiptPreviewUrl,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const groupedSales = useMemo(() => {
    const groups: Record<
      string,
      { reference: string; brand: string; model: string; sales: Sale[]; totalItems: number; totalRevenue: number }
    > = {};

    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.product_reference || `${item.brand}-${item.model}`;
        if (!groups[key]) {
          groups[key] = {
            reference: item.product_reference,
            brand: item.brand,
            model: item.model,
            sales: [],
            totalItems: 0,
            totalRevenue: 0,
          };
        }
        if (!groups[key].sales.find((s) => s.sale_id === sale.sale_id)) {
          groups[key].sales.push(sale);
        }
        groups[key].totalItems += item.quantity;
        groups[key].totalRevenue += item.unit_price * item.quantity;
      }
    }

    return Object.entries(groups).sort((a, b) => b[1].totalItems - a[1].totalItems);
  }, [sales]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalSalesAmount = useMemo(() => sales.reduce((sum, s) => sum + s.total_amount, 0), [sales]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Ventas del Día</h3>
        </div>
        {sales.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {sales.length} ventas ·{' '}
            <span className="font-semibold text-foreground">{formatCurrency(totalSalesAmount)}</span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted/30 h-24 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No hay ventas registradas para esta fecha</div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {groupedSales.map(([key, group]) => {
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
                      {group.totalItems} uds · {group.sales.length} ventas · {formatCurrency(group.totalRevenue)}
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
                    {group.sales.map((sale) => (
                      <SaleCard
                        key={sale.sale_id}
                        sale={sale}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        setReceiptPreviewUrl={setReceiptPreviewUrl}
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

export default SalesDayColumn;
