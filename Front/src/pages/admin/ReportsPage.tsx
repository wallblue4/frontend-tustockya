import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { BarChart3, Calendar, Download } from 'lucide-react';
import { EmptyState } from '../../components/admin/ErrorState';
import { useAdmin } from '../../context/AdminContext';
import { generateSalesReports, fetchDailySalesTraceability } from '../../services/adminAPI';
import type { DailySaleTraceability } from '../../services/adminAPI';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { todayLocal, daysAgoLocal } from '../../utils/date';

export const ReportsPage: React.FC = () => {
  const { locations, setReceiptPreviewUrl } = useAdmin();
  const todayISO = todayLocal();

  const [dailyTraceabilityFilters, setDailyTraceabilityFilters] = useState({
    target_date: todayISO,
    location_id: '',
  });
  const [dailyTraceabilityData, setDailyTraceabilityData] = useState<DailySaleTraceability[]>([]);
  const [dailyTraceabilityLoading, setDailyTraceabilityLoading] = useState(false);
  const [dailyTraceabilityError, setDailyTraceabilityError] = useState<string | null>(null);

  const localLocations = locations.filter((location) => location.type?.toLowerCase() === 'local');

  const handleFetchDailyTraceability = async () => {
    if (!dailyTraceabilityFilters.location_id) {
      setDailyTraceabilityError('Por favor selecciona un local.');
      return;
    }
    setDailyTraceabilityLoading(true);
    setDailyTraceabilityError(null);
    try {
      const response = await fetchDailySalesTraceability({
        target_date: dailyTraceabilityFilters.target_date,
        location_id: parseInt(dailyTraceabilityFilters.location_id, 10),
      });
      const normalizedData: DailySaleTraceability[] = Array.isArray(response)
        ? response
        : response.data || response.sales || [];
      setDailyTraceabilityData(normalizedData);
    } catch (error: any) {
      console.error('Error fetching daily sales traceability:', error);
      setDailyTraceabilityError(error.message || 'Error al obtener la trazabilidad diaria de ventas.');
      setDailyTraceabilityData([]);
    } finally {
      setDailyTraceabilityLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-foreground">Ventas y Trazabilidad</h2>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow lg:col-span-3">
          <CardContent className="p-6 space-y-6 text-left">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Trazabilidad diaria de ventas</h3>
                  <p className="text-sm text-gray-600">Consulta las ventas detalladas por fecha y local</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const report = await generateSalesReports({
                      start_date: daysAgoLocal(30),
                      end_date: todayLocal(),
                    });
                    console.log('Sales report:', report);
                    alert('Reporte de ventas generado - revisar consola');
                  } catch (error) {
                    console.error('Error generating sales report:', error);
                    alert('Error al generar reporte de ventas');
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar últimos 30 días
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  Fecha
                </label>
                <Input
                  type="date"
                  value={dailyTraceabilityFilters.target_date}
                  onChange={(e) => setDailyTraceabilityFilters((prev) => ({ ...prev, target_date: e.target.value }))}
                  max={todayISO}
                />
              </div>

              <div className="space-y-1 md:col-span-1 lg:col-span-2">
                <label className="text-sm font-medium text-foreground">Local</label>
                <Select
                  value={dailyTraceabilityFilters.location_id}
                  onChange={(e) => setDailyTraceabilityFilters((prev) => ({ ...prev, location_id: e.target.value }))}
                  options={[
                    { value: '', label: 'Selecciona un local' },
                    ...localLocations.map((location) => ({
                      value: location.id.toString(),
                      label: `${location.name}`,
                    })),
                  ]}
                />
                <p className="text-xs text-muted-foreground">
                  Solo se muestran ubicaciones con tipo <span className="font-semibold">local</span>.
                </p>
              </div>

              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={handleFetchDailyTraceability}
                  disabled={
                    dailyTraceabilityLoading ||
                    !dailyTraceabilityFilters.location_id ||
                    !dailyTraceabilityFilters.target_date
                  }
                >
                  {dailyTraceabilityLoading ? 'Consultando...' : 'Consultar'}
                </Button>
              </div>
            </div>

            {dailyTraceabilityError && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-md p-3">
                {dailyTraceabilityError}
              </div>
            )}

            <div className="space-y-4">
              {dailyTraceabilityLoading ? (
                <p className="text-sm text-muted-foreground">Obteniendo información del backend...</p>
              ) : dailyTraceabilityData.length > 0 ? (
                dailyTraceabilityData.map((sale) => (
                  <div key={sale.sale_id} className="border border-border rounded-lg p-4 bg-card/50">
                    <div className="flex flex-wrap justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-foreground">{sale.location_name}</p>
                        <p className="text-sm text-muted-foreground">Vendedor: {sale.seller_name}</p>
                      </div>
                      <div className="text-right space-y-2 flex flex-col items-end">
                        <p className="text-sm text-muted-foreground">Total vendido</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(sale.total_amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {(sale as any).payments?.[0]?.payment_type || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(sale.sale_date)}</p>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-border pt-3 space-y-3">
                      {sale.items.map((item, index) => (
                        <div key={`${sale.sale_id}-${index}`} className="flex flex-wrap justify-between text-sm gap-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {item.brand} · {item.model}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-foreground">
                              Talla {item.size} · {item.quantity} uds · C/U = {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                          {sale.receipt_image && (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => setReceiptPreviewUrl(sale.receipt_image!)}
                            >
                              Ver recibo
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Sin resultados"
                  description="Selecciona una fecha y un local, luego presiona consultar para ver la trazabilidad del día."
                  icon={<Calendar className="h-10 w-10 text-gray-400" />}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
