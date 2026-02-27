import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, RefreshCw } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import SalesDayColumn from './SalesDayColumn';
import DiscountApprovalsColumn from './DiscountApprovalsColumn';
import TransfersTraceColumn from './TransfersTraceColumn';
import LocationSearchSelect from './LocationSearchSelect';
import {
  fetchDailySalesTraceability,
  fetchDailyTransfersTraceability,
  fetchAllDiscountRequests,
} from '../../../services/adminAPI';
import type {
  DailySaleTraceability,
  DailyTransferTraceability,
} from '../../../services/adminAPI';

interface Location {
  id: number;
  name: string;
  type: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  assigned_users_count: number;
  total_products: number;
  total_inventory_value: string;
}

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

interface Notifications {
  discounts: DiscountRequest[];
  returns: any[];
  inventory: any[];
}

interface DailyReportViewProps {
  locations: Location[];
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  setReceiptPreviewUrl: (url: string | null) => void;
  handleApproveDiscount: (discountId: number, approved: boolean, notes?: string) => void;
  notifications: Notifications;
  loadNotifications: () => void;
}

const getTodayISO = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const DailyReportView: React.FC<DailyReportViewProps> = ({
  locations,
  formatCurrency,
  formatDate,
  setReceiptPreviewUrl,
  handleApproveDiscount,
  notifications,
  loadNotifications,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetDate = searchParams.get('fecha') || getTodayISO();
  const setTargetDate = (date: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (date === getTodayISO()) {
        next.delete('fecha');
      } else {
        next.set('fecha', date);
      }
      return next;
    }, { replace: true });
  };
  const [salesLocationFilter, setSalesLocationFilter] = useState('');

  const [salesData, setSalesData] = useState<DailySaleTraceability[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  const [transfersData, setTransfersData] = useState<DailyTransferTraceability[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [transfersError, setTransfersError] = useState<string | null>(null);

  const [apiDiscounts, setApiDiscounts] = useState<DiscountRequest[]>([]);

  const localLocations = locations.filter(
    (loc) => loc.type?.toLowerCase() === 'local'
  );

  const fetchSales = useCallback(async () => {
    setSalesLoading(true);
    setSalesError(null);
    try {
      if (salesLocationFilter) {
        try {
          const data = await fetchDailySalesTraceability({
            target_date: targetDate,
            location_id: parseInt(salesLocationFilter),
          });
          setSalesData(data ? (Array.isArray(data) ? data : data.sales || []) : []);
        } catch (e: any) {
          if (e.message?.includes('JSON') || e.message?.includes('json')) {
            setSalesData([]);
          } else {
            throw e;
          }
        }
      } else {
        const allSales: DailySaleTraceability[] = [];
        for (const loc of localLocations) {
          try {
            const data = await fetchDailySalesTraceability({
              target_date: targetDate,
              location_id: loc.id,
            });
            const sales = Array.isArray(data) ? data : data.sales || [];
            allSales.push(...sales);
          } catch {
            // Skip locations that error
          }
        }
        setSalesData(allSales);
      }
    } catch (err: any) {
      setSalesError(err.message || 'Error al cargar ventas');
    } finally {
      setSalesLoading(false);
    }
  }, [targetDate, salesLocationFilter, localLocations]);

  const fetchTransfers = useCallback(async () => {
    setTransfersLoading(true);
    setTransfersError(null);
    try {
      const data = await fetchDailyTransfersTraceability({
        target_date: targetDate,
      });
      if (!data) {
        setTransfersData([]);
      } else {
        setTransfersData(Array.isArray(data) ? data : data.transfers || []);
      }
    } catch (err: any) {
      const msg = err.message || '';
      // Empty JSON body or network failures — treat as no data available
      if (msg.includes('JSON') || msg.includes('json') || msg.includes('Failed to fetch')) {
        setTransfersData([]);
      } else {
        setTransfersError(msg || 'Error al cargar transferencias');
      }
    } finally {
      setTransfersLoading(false);
    }
  }, [targetDate]);

  const fetchDiscounts = useCallback(async () => {
    try {
      const data = await fetchAllDiscountRequests();
      const list = Array.isArray(data) ? data : data.requests || data.data || [];
      setApiDiscounts(
        list.map((d: any) => ({
          id: d.id,
          requester_name: d.requester_name,
          location_name: d.location_name,
          reason: d.reason,
          discount_amount: d.discount_amount,
          original_price: d.original_amount,
          requested_at: d.requested_at,
          status: d.status,
          admin_notes: d.admin_notes,
        } as DiscountRequest))
      );
    } catch {
      setApiDiscounts([]);
    }
  }, []);

  const fetchAll = useCallback(() => {
    fetchSales();
    fetchTransfers();
    fetchDiscounts();
  }, [fetchSales, fetchTransfers, fetchDiscounts]);

  useEffect(() => {
    fetchAll();
  }, [targetDate]);

  useEffect(() => {
    fetchSales();
  }, [salesLocationFilter]);

  return (
    <div className="flex flex-col p-4 md:p-6 bg-background h-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Reporte del Día</h2>
          <p className="text-sm text-muted-foreground">
            Consolidado de ventas, descuentos y transferencias
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              max={getTodayISO()}
              className="w-auto"
            />
          </div>
          <div className="w-48">
            <LocationSearchSelect
              locations={localLocations}
              value={salesLocationFilter}
              onChange={setSalesLocationFilter}
              placeholder="Todos los locales"
              filterType="all"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAll}
            disabled={salesLoading || transfersLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${(salesLoading || transfersLoading) ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Error banners */}
      {salesError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2 text-sm text-destructive">
          Ventas: {salesError}
        </div>
      )}
      {transfersError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2 text-sm text-destructive">
          Transferencias: {transfersError}
        </div>
      )}

      {/* 3-Column Grid — stretch to fill remaining height */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col min-h-0 overflow-hidden">
          <SalesDayColumn
            sales={salesData}
            loading={salesLoading}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            setReceiptPreviewUrl={setReceiptPreviewUrl}
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col min-h-0 overflow-hidden">
          <DiscountApprovalsColumn
            discounts={(() => {
              // Generar cards de descuento implícitos desde ventas
              const saleDiscounts: DiscountRequest[] = salesData
                .map((sale) => {
                  const itemsSubtotal = sale.items.reduce(
                    (sum, item) => sum + item.unit_price * item.quantity,
                    0
                  );
                  const discountAmount = itemsSubtotal - sale.total_amount;
                  if (discountAmount <= 0) return null;
                  return {
                    id: -(sale.sale_id),
                    requester_name: sale.seller_name,
                    seller_name: sale.seller_name,
                    location_name: sale.location_name,
                    discount_amount: discountAmount,
                    original_price: itemsSubtotal,
                    final_price: sale.total_amount,
                    requested_at: sale.sale_date,
                    status: 'from_sale',
                    brand: sale.items[0]?.brand,
                    model: sale.items[0]?.model,
                    size: sale.items.map((i) => i.size).join(', '),
                  } as DiscountRequest;
                })
                .filter((d): d is DiscountRequest => d !== null);

              // Combinar: primero API (pending, approved, rejected), luego de ventas
              return [...apiDiscounts, ...saleDiscounts];
            })()}
            handleApproveDiscount={async (id, approved, notes) => {
              handleApproveDiscount(id, approved, notes);
              // Refrescar descuentos después de aprobar/rechazar
              setTimeout(fetchDiscounts, 500);
            }}
            loadNotifications={fetchDiscounts}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col min-h-0 overflow-hidden">
          <TransfersTraceColumn
            transfers={transfersData}
            loading={transfersLoading}
            formatDate={formatDate}
            locations={locations}
          />
        </div>
      </div>
    </div>
  );
};

export default DailyReportView;
