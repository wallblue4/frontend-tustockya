import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  BarChart2, 
  Store,
  Warehouse,
  AlertCircle,
  Plus,
  Edit,
  Building,
  PieChart,
  Box,
  Target,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Loader2,
  X,
  Check,
  Calendar
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import bossAPI from '../../services/bossAPI';

type BossView = 
  | 'dashboard' 
  | 'locations'
  | 'inventory' 
  | 'financial' 
  | 'sales'
  | 'analytics';

export const BossDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<BossView>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para datos del backend
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [salesReport, setSalesReport] = useState<any>(null);

  // Estados para modales y formularios
  const [showCreateLocationModal, setShowCreateLocationModal] = useState(false);
  const [createLocationLoading, setCreateLocationLoading] = useState(false);
  const [locationFormData, setLocationFormData] = useState({
    name: '',
    type: 'local' as 'local' | 'bodega',
    address: '',
    phone: '',
    manager_name: '',
    capacity: '',
    notes: ''
  });

  // Estados para selectores de fecha
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Recargar datos cuando cambia la vista
  useEffect(() => {
    loadViewData(currentView);
  }, [currentView]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar dashboard principal
      const dashboard = await bossAPI.getDashboard();
      setDashboardData(dashboard);
    } catch (err: any) {
      console.error('Error cargando datos iniciales:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadViewData = async (view: BossView) => {
    try {
      switch (view) {
        case 'locations':
          const locs = await bossAPI.getLocations(false);
          setLocations(locs);
          break;
        case 'inventory':
          const inv = await bossAPI.getConsolidatedInventory();
          setInventoryData(inv);
          break;
        case 'financial':
          const today = new Date();
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const fin = await bossAPI.getFinancialAnalysis(
            firstDay.toISOString().split('T')[0],
            today.toISOString().split('T')[0]
          );
          setFinancialData(fin);
          break;
        case 'sales':
          const sales = await bossAPI.getDailySalesReport();
          setSalesReport(sales);
          break;
      }
    } catch (err: any) {
      console.error(`Error cargando datos de ${view}:`, err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
      await loadViewData(currentView);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  // Función para crear nueva ubicación
  const handleCreateLocation = async () => {
    setCreateLocationLoading(true);
    try {
      const dataToSend: any = {
        name: locationFormData.name,
        type: locationFormData.type,
      };

      if (locationFormData.address) dataToSend.address = locationFormData.address;
      if (locationFormData.phone) dataToSend.phone = locationFormData.phone;
      if (locationFormData.manager_name) dataToSend.manager_name = locationFormData.manager_name;
      if (locationFormData.capacity) dataToSend.capacity = parseInt(locationFormData.capacity);
      if (locationFormData.notes) dataToSend.notes = locationFormData.notes;

      await bossAPI.createLocation(dataToSend);
      
      // Recargar ubicaciones
      const locs = await bossAPI.getLocations(false);
      setLocations(locs);
      
      // Cerrar modal y resetear formulario
      setShowCreateLocationModal(false);
      setLocationFormData({
        name: '',
        type: 'local',
        address: '',
        phone: '',
        manager_name: '',
        capacity: '',
        notes: ''
      });
      
      alert('Ubicación creada exitosamente');
    } catch (err: any) {
      console.error('Error creando ubicación:', err);
      alert('Error al crear ubicación: ' + (err.message || 'Error desconocido'));
    } finally {
      setCreateLocationLoading(false);
    }
  };

  // Función para cargar reporte de ventas mensual
  const handleLoadMonthlySales = async () => {
    try {
      const report = await bossAPI.getMonthlySalesReport(selectedYear, selectedMonth);
      setSalesReport(report);
    } catch (err: any) {
      console.error('Error cargando reporte mensual:', err);
    }
  };

  // Función para cargar análisis financiero mensual
  const handleLoadMonthlyFinancial = async () => {
    try {
      const analysis = await bossAPI.getMonthlyFinancialAnalysis(selectedYear, selectedMonth);
      setFinancialData(analysis);
    } catch (err: any) {
      console.error('Error cargando análisis financiero mensual:', err);
    }
  };

  // Función para cargar reporte consolidado con filtros
  const handleLoadConsolidatedSales = async () => {
    try {
      const report = await bossAPI.getSalesConsolidatedReport({
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      setSalesReport(report);
    } catch (err: any) {
      console.error('Error cargando reporte consolidado:', err);
    }
  };

  // Vista del Dashboard Principal
  const renderDashboardView = () => {
    if (!dashboardData) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    const kpis = dashboardData.kpis || {};
    const locations = dashboardData.locations_performance || [];
    const alerts = dashboardData.alerts || [];
    const financial = dashboardData.financial_summary || {};

    return (
    <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Panel Ejecutivo - {dashboardData.company_name}</h2>
            <p className="text-muted-foreground">Bienvenido, {dashboardData.boss_name}</p>
          </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

        {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(kpis).map(([key, kpi]: [string, any]) => (
        <StatsCard
              key={key}
              title={kpi.label}
              value={kpi.value}
              change={kpi.change_percentage}
              period={kpi.trend || ''}
              icon={
                key.includes('sales') || key.includes('revenue') ? <DollarSign className="h-6 w-6" /> :
                key.includes('location') ? <Store className="h-6 w-6" /> :
                key.includes('inventory') ? <Package className="h-6 w-6" /> :
                key.includes('margin') || key.includes('profit') ? <TrendingUp className="h-6 w-6" /> :
                <BarChart2 className="h-6 w-6" />
              }
            />
          ))}
      </div>

        {/* Performance por Locales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
              <h3 className="text-lg font-semibold">Performance por Local</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {locations.slice(0, 5).map((location: any) => (
                  <div key={location.location_id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                      {location.location_type === 'bodega' ? 
                        <Warehouse className="h-6 w-6 text-primary" /> :
                    <Store className="h-6 w-6 text-primary" />
                      }
                    <div>
                        <h4 className="font-medium">{location.location_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {location.active_users} usuarios • {location.pending_transfers} transferencias
                        </p>
                    </div>
                  </div>
                  <div className="text-right">
                      <p className="font-bold">{formatCurrency(location.daily_sales || location.monthly_sales)}</p>
                      <p className="text-sm text-muted-foreground">Score: {location.efficiency_score}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

          {/* Resumen Financiero */}
        <Card>
          <CardHeader>
              <h3 className="text-lg font-semibold">Resumen Financiero</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{formatCurrency(financial.total_revenue || 0)}</p>
                    <p className="text-sm text-muted-foreground">Ingresos</p>
                </div>
                <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-secondary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{financial.margin_percentage || 0}%</p>
                    <p className="text-sm text-muted-foreground">Margen</p>
                </div>
              </div>
                <div className="p-4 bg-success/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Utilidad Neta</span>
                    <span className="text-xl font-bold text-success">{formatCurrency(financial.net_profit || 0)}</span>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <Card className="border-warning bg-warning/5">
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-warning">
                <AlertCircle className="h-5 w-5 mr-2" />
                Alertas Importantes ({alerts.length})
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-card rounded-lg border border-border">
                    <AlertCircle className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'error' ? 'text-destructive' :
                      alert.severity === 'warning' ? 'text-warning' :
                      'text-primary'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">{alert.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
                onClick={() => setCurrentView('locations')}
            >
                <Store className="h-5 w-5" />
                <span>Locales</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
                onClick={() => setCurrentView('inventory')}
            >
                <Package className="h-5 w-5" />
                <span>Inventario</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
                onClick={() => setCurrentView('financial')}
            >
                <DollarSign className="h-5 w-5" />
                <span>Finanzas</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
                onClick={() => setCurrentView('sales')}
            >
                <BarChart2 className="h-5 w-5" />
                <span>Ventas</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
                onClick={() => setCurrentView('analytics')}
            >
                <PieChart className="h-5 w-5" />
                <span>Análisis</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  };

  // Vista de Locales
  const renderLocationsView = () => {
    return (
    <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Gestión de Locales y Bodegas</h2>
          <Button onClick={() => setShowCreateLocationModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
            Nueva Ubicación
        </Button>
      </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location: any) => (
              <Card key={location.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {location.type === 'bodega' ? 
                        <Warehouse className="h-8 w-8 text-primary" /> :
                        <Store className="h-8 w-8 text-success" />
                      }
                    <div>
                        <h3 className="font-semibold">{location.name}</h3>
                        <span className="text-xs px-2 py-1 bg-primary/10 rounded-full">
                          {location.type}
                        </span>
                    </div>
                    </div>
                      <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                      </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    {location.address && (
                      <p className="text-muted-foreground">📍 {location.address}</p>
                    )}
                    {location.phone && (
                      <p className="text-muted-foreground">📞 {location.phone}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
                      <div className="text-center">
                        <p className="font-bold">{location.total_users}</p>
                        <p className="text-xs text-muted-foreground">Usuarios</p>
                        </div>
                      <div className="text-center">
                        <p className="font-bold">{location.total_products}</p>
                        <p className="text-xs text-muted-foreground">Productos</p>
                          </div>
                      <div className="text-center">
                        <p className="font-bold text-xs">{formatCurrency(location.total_inventory_value)}</p>
                        <p className="text-xs text-muted-foreground">Inventario</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
        )}
    </div>
  );
  };

  // Vista de Inventario
  const renderInventoryView = () => {
    if (!inventoryData) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    const hasInventoryData = inventoryData.total_products > 0 || inventoryData.total_units > 0;

    if (!hasInventoryData) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4 p-4">
          <Package className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No hay datos de inventario</h3>
          <p className="text-muted-foreground text-center">
            No se encontró inventario disponible en el sistema.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Datos
          </Button>
        </div>
      );
    }

    return (
    <div className="space-y-6 p-4 md:p-6">
        <h2 className="text-xl font-semibold">Inventario Consolidado</h2>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
              <Store className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{inventoryData.total_locations}</p>
              <p className="text-sm text-muted-foreground">Ubicaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">{inventoryData.total_products}</p>
              <p className="text-sm text-muted-foreground">Productos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
              <Box className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{inventoryData.total_units}</p>
              <p className="text-sm text-muted-foreground">Unidades</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(inventoryData.total_value)}</p>
              <p className="text-sm text-muted-foreground">Valor Total</p>
          </CardContent>
        </Card>
      </div>

        {/* Por Marca */}
      <Card>
        <CardHeader>
            <h3 className="text-lg font-semibold">Inventario por Marca</h3>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
              {inventoryData.by_brand?.map((brand: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{brand.category_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {brand.total_units} unidades en {brand.locations_count} locales
                    </p>
                  </div>
                <div className="text-right">
                    <p className="font-bold">{formatCurrency(brand.total_value)}</p>
                    <p className="text-sm text-muted-foreground">
                      {brand.percentage_of_total ? brand.percentage_of_total.toFixed(1) : '0.0'}%
                    </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

        {/* Por Ubicación */}
      <Card>
        <CardHeader>
            <h3 className="text-lg font-semibold">Inventario por Ubicación</h3>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
              {inventoryData.by_location?.map((location: any) => (
                <div key={location.location_id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {location.location_type === 'bodega' ? 
                        <Warehouse className="h-6 w-6 text-primary" /> :
                        <Store className="h-6 w-6 text-success" />
                      }
                  <div>
                        <h4 className="font-semibold">{location.location_name}</h4>
                        <p className="text-sm text-muted-foreground">{location.location_type}</p>
                  </div>
                </div>
                    {location.low_stock_items > 0 && (
                      <span className="px-2 py-1 bg-warning/20 text-warning text-xs rounded-full">
                        {location.low_stock_items} stock bajo
                  </span>
                    )}
                    </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold">{location.total_products}</p>
                      <p className="text-xs text-muted-foreground">Productos</p>
                  </div>
                    <div>
                      <p className="text-xl font-bold">{location.total_units}</p>
                      <p className="text-xs text-muted-foreground">Unidades</p>
                </div>
                    <div>
                      <p className="text-lg font-bold">{formatCurrency(location.total_value)}</p>
                      <p className="text-xs text-muted-foreground">Valor</p>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

        {/* Alertas de Stock */}
        {(inventoryData.low_stock_alerts > 0 || inventoryData.out_of_stock_alerts > 0) && (
          <Card className="border-warning">
        <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-warning">
                <AlertCircle className="h-5 w-5 mr-2" />
                Alertas de Inventario
              </h3>
        </CardHeader>
        <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <p className="text-2xl font-bold text-warning">{inventoryData.low_stock_alerts}</p>
                  <p className="text-sm text-foreground">Stock Bajo</p>
                </div>
                <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-2xl font-bold text-destructive">{inventoryData.out_of_stock_alerts}</p>
                  <p className="text-sm text-foreground">Sin Stock</p>
              </div>
                <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-2xl font-bold text-primary">{inventoryData.overstocked_alerts}</p>
                  <p className="text-sm text-foreground">Sobre Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
  };

  // Vista Financiera
  const renderFinancialView = () => {
    if (!financialData) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
      );
    }

    const hasFinancialData = financialData.total_revenue || financialData.total_costs || 
                             (financialData.locations_financials && financialData.locations_financials.length > 0);

    if (!hasFinancialData) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4 p-4">
          <DollarSign className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No hay datos financieros disponibles</h3>
          <p className="text-muted-foreground text-center">
            No se encontraron datos financieros para el período seleccionado.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Datos
            </Button>
    </div>
  );
    }

    return (
    <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Análisis Financiero</h2>
              <p className="text-muted-foreground">{financialData.analysis_period}</p>
            </div>
          </div>

          {/* Filtros de Fecha */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Rango de Fechas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-end space-x-2">
                  <Button 
                    onClick={async () => {
                      const analysis = await bossAPI.getFinancialAnalysis(dateRange.start, dateRange.end);
                      setFinancialData(analysis);
                    }} 
                    className="flex-1"
                  >
                    Aplicar Filtro
                  </Button>
                  <Button onClick={handleLoadMonthlyFinancial} variant="outline" className="flex-1">
                    Ver Mes Actual
        </Button>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

        {/* Resumen General */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(financialData.total_revenue)}</p>
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
              <TrendingDown className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(financialData.total_costs)}</p>
              <p className="text-sm text-muted-foreground">Costos Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(financialData.net_profit)}</p>
              <p className="text-sm text-muted-foreground">Utilidad Neta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {financialData.overall_margin_percentage ? financialData.overall_margin_percentage.toFixed(1) : '0.0'}%
              </p>
              <p className="text-sm text-muted-foreground">Margen</p>
          </CardContent>
        </Card>
      </div>

        {/* Costos por Tipo */}
      <Card>
        <CardHeader>
            <h3 className="text-lg font-semibold">Desglose de Costos</h3>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
              {Object.entries(financialData.costs_by_type || {}).map(([type, amount]: [string, any]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-primary" />
                    <span className="font-medium capitalize">{type}</span>
                  </div>
                  <span className="font-bold">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

        {/* Performance por Locales */}
      <Card>
        <CardHeader>
            <h3 className="text-lg font-semibold">Performance Financiero por Local</h3>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              {financialData.locations_financials?.map((location: any) => (
                <div key={location.location_id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
              <div>
                      <h4 className="font-semibold">{location.location_name}</h4>
                      <p className="text-sm text-muted-foreground">{location.location_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        {location.profit_margin_percentage ? location.profit_margin_percentage.toFixed(1) : '0.0'}%
                      </p>
                      <p className="text-xs text-muted-foreground">Margen</p>
                </div>
              </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                      <p className="text-muted-foreground">Ventas</p>
                      <p className="font-semibold">{formatCurrency(location.total_sales)}</p>
                </div>
                    <div>
                      <p className="text-muted-foreground">Costos</p>
                      <p className="font-semibold">{formatCurrency(location.operational_costs)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Utilidad</p>
                      <p className="font-semibold text-success">{formatCurrency(location.gross_profit)}</p>
              </div>
            </div>

                  {location.cost_breakdown && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Desglose de Costos:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(location.cost_breakdown).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{key}:</span>
                            <span className="font-medium">{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            </div>
                  )}
          </div>
              ))}
          </div>
        </CardContent>
      </Card>

        {/* Mejor y Peor Performance */}
        {(financialData.best_performing_location || financialData.worst_performing_location) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {financialData.best_performing_location && (
              <Card className="border-success">
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center text-success">
                    <ArrowUp className="h-5 w-5 mr-2" />
                    Mejor Performance
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{financialData.best_performing_location.location_name}</p>
                  <p className="text-2xl font-bold text-success mt-2">
                    {financialData.best_performing_location.profit_margin}%
                  </p>
                  <p className="text-sm text-muted-foreground">Margen de Ganancia</p>
                </CardContent>
              </Card>
            )}
            
            {financialData.worst_performing_location && (
              <Card className="border-warning">
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center text-warning">
                    <ArrowDown className="h-5 w-5 mr-2" />
                    Requiere Atención
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{financialData.worst_performing_location.location_name}</p>
                  <p className="text-2xl font-bold text-warning mt-2">
                    {financialData.worst_performing_location.profit_margin}%
                  </p>
                  <p className="text-sm text-muted-foreground">Margen de Ganancia</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
    </div>
  );
  };

  // Vista de Ventas
  const renderSalesView = () => {
    if (!salesReport) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    // Verificar si hay datos de ventas
    const hasData = salesReport.total_sales || salesReport.total_transactions || 
                    (salesReport.sales_by_location && salesReport.sales_by_location.length > 0);

    if (!hasData) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4 p-4">
          <BarChart2 className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No hay datos de ventas disponibles</h3>
          <p className="text-muted-foreground text-center">
            No se encontraron datos de ventas para el período seleccionado.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Datos
          </Button>
        </div>
      );
    }

    return (
    <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Reporte de Ventas</h2>
              <p className="text-muted-foreground">{salesReport.report_period || 'Período no especificado'}</p>
        </div>
      </div>

          {/* Filtros de Fecha */}
        <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Rango de Fechas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Mes/Año</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-3 py-2 border border-border rounded-md bg-card text-foreground"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2000, i).toLocaleDateString('es-CO', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                    />
                  </div>
                </div>
                <div className="flex items-end space-x-2">
                  <Button onClick={handleLoadConsolidatedSales} className="flex-1">
                    Filtrar Rango
                  </Button>
                  <Button onClick={handleLoadMonthlySales} variant="outline" className="flex-1">
                    Filtrar Mes
                  </Button>
                </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(salesReport.total_sales || 0)}</p>
              <p className="text-sm text-muted-foreground">Ventas Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
              <BarChart2 className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">{salesReport.total_transactions || 0}</p>
              <p className="text-sm text-muted-foreground">Transacciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(salesReport.average_ticket || 0)}</p>
              <p className="text-sm text-muted-foreground">Ticket Promedio</p>
          </CardContent>
        </Card>
      </div>

        {/* Ventas por Local */}
        {salesReport.sales_by_location && salesReport.sales_by_location.length > 0 && (
      <Card>
        <CardHeader>
              <h3 className="text-lg font-semibold">Ventas por Local</h3>
        </CardHeader>
        <CardContent>
              <div className="space-y-3">
                {salesReport.sales_by_location.map((location: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{location.location_name || 'Sin nombre'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {location.transactions_count || 0} transacciones • Ticket: {formatCurrency(location.average_ticket || 0)}
                      </p>
            </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(location.total_sales || 0)}</p>
                      <p className="text-sm text-success">
                        {location.percentage_of_total ? location.percentage_of_total.toFixed(1) : '0.0'}%
                      </p>
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
        )}

        {/* Top Vendedores */}
        {salesReport.top_sellers && salesReport.top_sellers.length > 0 && (
      <Card>
        <CardHeader>
              <h3 className="text-lg font-semibold">Top Vendedores</h3>
        </CardHeader>
        <CardContent>
              <div className="space-y-3">
                {salesReport.top_sellers.map((seller: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {index + 1}
      </div>
                      <div>
                        <h4 className="font-medium">{seller.user_name || 'Sin nombre'}</h4>
                        <p className="text-sm text-muted-foreground">{seller.location_name || 'Sin ubicación'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(seller.total_sales || 0)}</p>
                      <p className="text-sm text-muted-foreground">{seller.transactions_count || 0} ventas</p>
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
        )}

        {/* Top Productos */}
        {salesReport.top_products && salesReport.top_products.length > 0 && (
        <Card>
        <CardHeader>
              <h3 className="text-lg font-semibold">Productos Más Vendidos</h3>
        </CardHeader>
        <CardContent>
              <div className="space-y-3">
                {salesReport.top_products.map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.brand || 'Sin marca'} {product.model || ''}</h4>
                      <p className="text-sm text-muted-foreground">
                        Ref: {product.reference_code || 'N/A'} • {product.units_sold || 0} unidades
                      </p>
            </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(product.total_revenue || 0)}</p>
                      <p className="text-sm text-muted-foreground">Precio prom: {formatCurrency(product.average_price || 0)}</p>
                    </div>
                  </div>
                ))}
          </div>
          </CardContent>
        </Card>
        )}

        {/* Métodos de Pago */}
        {salesReport.payment_methods_breakdown && (
      <Card>
        <CardHeader>
              <h3 className="text-lg font-semibold">Métodos de Pago</h3>
        </CardHeader>
        <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(salesReport.payment_methods_breakdown).map(([method, amount]: [string, any]) => (
                  <div key={method} className="text-center p-3 bg-muted/20 rounded-lg">
                    <p className="text-lg font-bold">{formatCurrency(amount)}</p>
                    <p className="text-sm text-muted-foreground capitalize">{method}</p>
            </div>
                ))}
          </div>
        </CardContent>
      </Card>
        )}
    </div>
  );
  };

  // Vista de Analytics
  const renderAnalyticsView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h2 className="text-xl font-semibold">Análisis y Métricas</h2>
        
        <Card>
          <CardContent className="p-8 text-center">
            <PieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              Funcionalidades de análisis avanzado disponibles próximamente
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Gráficos, tendencias y análisis predictivo
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCurrentView = () => {
    if (loading && !dashboardData) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error && !dashboardData) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <p className="text-lg font-semibold">Error al cargar datos</p>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadInitialData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      );
    }

    switch (currentView) {
      case 'locations': return renderLocationsView();
      case 'inventory': return renderInventoryView();
      case 'financial': return renderFinancialView();
      case 'sales': return renderSalesView();
      case 'analytics': return renderAnalyticsView();
      default: return renderDashboardView();
    }
  };

  return (
    <DashboardLayout title={
      currentView === 'dashboard' ? 'Panel Ejecutivo - BOSS' :
      currentView === 'locations' ? 'Gestión de Locales' :
      currentView === 'inventory' ? 'Inventario Consolidado' :
      currentView === 'financial' ? 'Análisis Financiero' :
      currentView === 'sales' ? 'Reporte de Ventas' :
      'Análisis y Métricas'
    }>
      <div className="min-h-screen bg-background">
        {/* Navigation tabs - Solo visible en móvil */}
        <div className="lg:hidden bg-card border-b border-border sticky top-0 z-10">
          <div className="flex overflow-x-auto px-4 py-2 space-x-2">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="h-4 w-4" /> },
              { key: 'locations', label: 'Locales', icon: <Store className="h-4 w-4" /> },
              { key: 'inventory', label: 'Inventario', icon: <Package className="h-4 w-4" /> },
              { key: 'financial', label: 'Finanzas', icon: <DollarSign className="h-4 w-4" /> },
              { key: 'sales', label: 'Ventas', icon: <TrendingUp className="h-4 w-4" /> },
              { key: 'analytics', label: 'Análisis', icon: <PieChart className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key as BossView)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  currentView === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar navigation - Solo visible en desktop */}
        <div className="hidden lg:flex">
          <div className="w-64 bg-card shadow-xl border-r border-border h-screen fixed left-0 top-16 overflow-y-auto">
            <div className="p-4">
              <nav className="space-y-2">
                {[
                  { key: 'dashboard', label: 'Panel Ejecutivo', icon: <BarChart2 className="h-5 w-5" /> },
                  { key: 'locations', label: 'Gestión de Locales', icon: <Store className="h-5 w-5" /> },
                  { key: 'inventory', label: 'Inventario Consolidado', icon: <Package className="h-5 w-5" /> },
                  { key: 'financial', label: 'Análisis Financiero', icon: <DollarSign className="h-5 w-5" /> },
                  { key: 'sales', label: 'Reporte de Ventas', icon: <TrendingUp className="h-5 w-5" /> },
                  { key: 'analytics', label: 'Análisis y Métricas', icon: <PieChart className="h-5 w-5" /> },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setCurrentView(item.key as BossView)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                      currentView === item.key
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted/20'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
          <div className="ml-64 flex-1">
            {renderCurrentView()}
          </div>
        </div>

        {/* Content for mobile */}
        <div className="lg:hidden">
          {renderCurrentView()}
        </div>

        {/* Modal para crear ubicación */}
        {showCreateLocationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Nueva Ubicación</h2>
                  <button
                    onClick={() => setShowCreateLocationModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Nombre */}
                  <Input
                    label="Nombre *"
                    value={locationFormData.name}
                    onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                    placeholder="Ej: Local Centro"
                    required
                  />

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tipo de Ubicación *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setLocationFormData({ ...locationFormData, type: 'local' })}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 ${
                          locationFormData.type === 'local'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Store className="h-8 w-8" />
                        <span className="font-medium">Local de Venta</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationFormData({ ...locationFormData, type: 'bodega' })}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 ${
                          locationFormData.type === 'bodega'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Warehouse className="h-8 w-8" />
                        <span className="font-medium">Bodega</span>
                      </button>
                    </div>
                  </div>

                  {/* Dirección */}
                  <Input
                    label="Dirección"
                    value={locationFormData.address}
                    onChange={(e) => setLocationFormData({ ...locationFormData, address: e.target.value })}
                    placeholder="Ej: Calle 123 #45-67"
                  />

                  {/* Teléfono */}
                  <Input
                    label="Teléfono"
                    value={locationFormData.phone}
                    onChange={(e) => setLocationFormData({ ...locationFormData, phone: e.target.value })}
                    placeholder="Ej: +57 300 1234567"
                  />

                  {/* Nombre del Encargado */}
                  <Input
                    label="Nombre del Encargado"
                    value={locationFormData.manager_name}
                    onChange={(e) => setLocationFormData({ ...locationFormData, manager_name: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                  />

                  {/* Capacidad (solo para bodegas) */}
                  {locationFormData.type === 'bodega' && (
                    <Input
                      label="Capacidad (unidades)"
                      type="number"
                      value={locationFormData.capacity}
                      onChange={(e) => setLocationFormData({ ...locationFormData, capacity: e.target.value })}
                      placeholder="Ej: 1000"
                    />
                  )}

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Notas
                    </label>
                    <textarea
                      value={locationFormData.notes}
                      onChange={(e) => setLocationFormData({ ...locationFormData, notes: e.target.value })}
                      placeholder="Información adicional..."
                      className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateLocationModal(false)}
                    disabled={createLocationLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateLocation}
                    disabled={!locationFormData.name || createLocationLoading}
                  >
                    {createLocationLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Crear Ubicación
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
