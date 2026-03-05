import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Bell,
  AlertCircle,
  Store,
  Package,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { EmptyState } from '../../components/admin/ErrorState';
import { LoadingSkeleton } from '../../components/admin/LoadingSkeleton';
import { fetchAdminDashboard, fetchDashboardMetrics } from '../../services/adminAPI';
import { formatCurrency } from '../../utils/formatters';
import type { DashboardData, MetricsData } from '../../types/admin';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);

  const loadDashboardData = async () => {
    try {
      const [dashboardResponse, metricsResponse] = await Promise.all([
        fetchAdminDashboard().catch((err) => {
          console.warn('Dashboard endpoint failed:', err);
          return null;
        }),
        fetchDashboardMetrics().catch((err) => {
          console.warn('Metrics endpoint failed:', err);
          return null;
        }),
      ]);
      if (dashboardResponse) setDashboardData(dashboardResponse);
      if (metricsResponse) setMetricsData(metricsResponse);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData(null);
      setMetricsData(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadDashboardData().finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Panel de Administración</h2>
        <Button onClick={() => loadDashboardData()} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas Hoy"
          value={
            metricsData?.total_sales_today
              ? formatCurrency(parseFloat(metricsData.total_sales_today))
              : formatCurrency(0)
          }
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Ventas del Mes"
          value={
            metricsData?.total_sales_month
              ? formatCurrency(parseFloat(metricsData.total_sales_month))
              : formatCurrency(0)
          }
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <StatsCard
          title="Usuarios Activos"
          value={metricsData?.active_users?.toString() || '0'}
          icon={<Users className="h-6 w-6" />}
        />
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Button
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => navigate('/administrador/usuarios')}
            >
              <Users className="h-5 w-5" />
              <span>Gestionar Usuarios</span>
            </Button>
            <Button
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => navigate('/administrador/inventario')}
            >
              <Package className="h-5 w-5" />
              <span>Ver Inventario</span>
            </Button>
            <Button
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => navigate('/administrador/mayoreo')}
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Ventas Mayoreo</span>
            </Button>
            <Button
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => navigate('/administrador/analiticas')}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Análisis</span>
            </Button>
            <Button
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => navigate('/administrador/costos')}
            >
              <DollarSign className="h-5 w-5" />
              <span>Ver Costos</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Ubicaciones Gestionadas</h3>
            </CardHeader>
            <CardContent>
              {dashboardData.managed_locations?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.managed_locations.map((location: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg">
                      <div>
                        <p className="font-medium">{location.location_name}</p>
                        <p className="text-sm text-gray-600">{location.location_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(parseFloat(location.daily_sales || 0))}</p>
                        <p className="text-xs text-gray-500">Ventas diarias</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No hay ubicaciones asignadas"
                  description="No tienes ubicaciones bajo tu gestión"
                  icon={<Store className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {metricsData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{metricsData.low_stock_alerts}</p>
              <p className="text-sm text-gray-600">Alertas de Stock Bajo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Bell className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{metricsData.pending_discount_approvals}</p>
              <p className="text-sm text-gray-600">Descuentos Pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{metricsData.avg_performance_score.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Score Promedio</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
