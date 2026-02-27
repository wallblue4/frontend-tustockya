import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import SalesDayColumn from './SalesDayColumn';
import DiscountApprovalsColumn from './DiscountApprovalsColumn';
import TransfersTraceColumn from './TransfersTraceColumn';
import LocationSearchSelect from './LocationSearchSelect';
import {
  fetchDailySalesTraceability,
  fetchDailyTransfersTraceability,
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
  const [targetDate, setTargetDate] = useState(getTodayISO());
  const [salesLocationFilter, setSalesLocationFilter] = useState('');

  const [salesData, setSalesData] = useState<DailySaleTraceability[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  const [transfersData, setTransfersData] = useState<DailyTransferTraceability[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [transfersError, setTransfersError] = useState<string | null>(null);

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

  const fetchAll = useCallback(() => {
    fetchSales();
    fetchTransfers();
    loadNotifications();
  }, [fetchSales, fetchTransfers, loadNotifications]);

  useEffect(() => {
    fetchAll();
  }, [targetDate]);

  useEffect(() => {
    fetchSales();
  }, [salesLocationFilter]);

  return (
    <div className="space-y-4 p-4 md:p-6 bg-background min-h-screen">
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

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Sales */}
        <div className="bg-card border border-border rounded-xl p-4 min-h-[400px]">
          <SalesDayColumn
            sales={salesData}
            loading={salesLoading}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            setReceiptPreviewUrl={setReceiptPreviewUrl}
          />
        </div>

        {/* Column 2: Discount Approvals */}
        <div className="bg-card border border-border rounded-xl p-4 min-h-[400px]">
          <DiscountApprovalsColumn
            discounts={notifications.discounts}
            handleApproveDiscount={handleApproveDiscount}
            loadNotifications={loadNotifications}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </div>

        {/* Column 3: Transfers */}
        <div className="bg-card border border-border rounded-xl p-4 min-h-[400px]">
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
