import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import {
  DollarSign,
  FileText,
  Plus,
  Edit,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Building,
  Calendar,
  Settings
} from 'lucide-react';
import { EmptyState } from '../../components/admin/ErrorState';
import { CreateCostModal } from '../../components/admin/CreateCostModal';
import {
  fetchOperationalDashboard,
  fetchCostConfigurations,
  createCostConfiguration,
  updateCostConfiguration,
  deleteCostConfiguration,
  deactivateCostConfiguration,
  createCostPayment
} from '../../services/adminAPI';
import { formatCurrency, formatDate, capitalize } from '../../utils/formatters';
import { useAdmin } from '../../context/AdminContext';
import type { OperationalDashboard } from '../../types/admin';

export const CostsPage: React.FC = () => {
  const { locations } = useAdmin();

  // Data
  const [operationalData, setOperationalData] = useState<OperationalDashboard | null>(null);

  // Filters
  const [costFilters, setCostFilters] = useState({
    search: '',
    category: '' as '' | 'arriendo' | 'servicios' | 'nomina' | 'mercancia' | 'comisiones' | 'transporte' | 'otros',
    location: '',
    dateFrom: '',
    dateTo: ''
  });

  // Cost configurations list
  const [costConfigurations, setCostConfigurations] = useState<any[]>([]);
  const [costConfigurationsLoading, setCostConfigurationsLoading] = useState(false);
  const [showCostsList, setShowCostsList] = useState(false);

  // Create cost modal
  const [showCreateCostModal, setShowCreateCostModal] = useState(false);

  // Edit cost modal
  const [showEditCostModal, setShowEditCostModal] = useState(false);
  const [editingCost, setEditingCost] = useState<any>(null);
  const [editCostLoading, setEditCostLoading] = useState(false);
  const [editCostFormData, setEditCostFormData] = useState({
    amount: '',
    frequency: '' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual',
    description: '',
    is_active: true
  });

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingCost, setPayingCost] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    due_date: '',
    payment_amount: '',
    payment_date: '',
    payment_method: 'efectivo' as 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque',
    payment_reference: '',
    notes: ''
  });

  const todayISO = new Date().toISOString().split('T')[0];

  // ─── Load data on mount ────────────────────────────────────────────
  useEffect(() => {
    loadCosts();
  }, []);

  // ─── Reload cost configurations when filters change ────────────────
  useEffect(() => {
    if (showCostsList) {
      loadCostConfigurations();
    }
  }, [costFilters.category, costFilters.location]);

  // ─── Handler: load operational dashboard ───────────────────────────
  const loadCosts = async () => {
    try {
      const response = await fetchOperationalDashboard();
      setOperationalData(response);
    } catch (error) {
      console.error('Error loading operational dashboard:', error);
      setOperationalData(null);
    }
  };

  // ─── Handler: load cost configurations list ────────────────────────
  const loadCostConfigurations = async () => {
    setCostConfigurationsLoading(true);
    try {
      const params: any = {};
      if (costFilters.location) {
        params.location_id = parseInt(costFilters.location);
      }
      if (costFilters.category) {
        params.cost_type = costFilters.category;
      }

      const response = await fetchCostConfigurations(params);
      console.log('Respuesta de fetchCostConfigurations:', response);
      const configs = Array.isArray(response) ? response : response.data || response.configurations || [];
      console.log('Configuraciones procesadas:', configs);
      setCostConfigurations(configs);
    } catch (error: any) {
      console.error('Error loading cost configurations:', error);
      setCostConfigurations([]);
    } finally {
      setCostConfigurationsLoading(false);
    }
  };

  // ─── Handler: create cost ──────────────────────────────────────────
  const handleCreateCost = async (costData: any) => {
    try {
      if (!costData.location_id) {
        alert('Por favor selecciona una ubicacion valida');
        return;
      }

      const apiData = {
        location_id: parseInt(costData.location_id.toString()),
        cost_type: mapCostTypeToAPI(costData.category),
        amount: parseFloat(costData.amount.toString()),
        frequency: mapFrequencyToAPI(costData.frequency),
        description: costData.description,
        start_date: new Date().toISOString().split('T')[0],
        end_date: costData.due_date || undefined
      };

      console.log('Enviando datos al API:', apiData);

      const response = await createCostConfiguration(apiData);

      console.log('Respuesta del API:', response);

      if (response && (response.id || response.success !== false)) {
        await loadCosts();
        setShowCreateCostModal(false);
        alert(
          `Costo registrado exitosamente!\n\nID: ${response.id}\nDescripcion: ${response.description}\nMonto: ${formatCurrency(parseFloat(response.amount))}\nTipo: ${capitalize(response.cost_type)}`
        );
      } else {
        throw new Error('La respuesta del servidor no indica exito');
      }
    } catch (error: any) {
      console.error('Error creating cost:', error);
      alert('Error al registrar costo: ' + (error.message || 'Error desconocido'));
    }
  };

  // ─── Handler: delete cost ──────────────────────────────────────────
  const handleDeleteCost = async (costId: number, forceDelete = false) => {
    try {
      const confirmation = window.confirm('Estas seguro de que deseas eliminar este costo?');
      if (!confirmation) return;

      await deleteCostConfiguration(costId, forceDelete);
      await loadCosts();
      alert('Costo eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting cost:', error);
      alert('Error al eliminar costo: ' + (error.message || 'Error desconocido'));
    }
  };

  // ─── Handler: deactivate cost ──────────────────────────────────────
  const handleDeactivateCost = async (costId: number, endDate?: string) => {
    try {
      const confirmation = window.confirm('Estas seguro de que deseas desactivar este costo?');
      if (!confirmation) return;

      await deactivateCostConfiguration(costId, endDate);
      await loadCosts();
      await loadCostConfigurations();
      alert('Costo desactivado exitosamente');
    } catch (error: any) {
      console.error('Error deactivating cost:', error);
      alert('Error al desactivar costo: ' + (error.message || 'Error desconocido'));
    }
  };

  // ─── Handler: open edit cost modal ─────────────────────────────────
  const handleOpenEditCostModal = (cost: any) => {
    setEditingCost(cost);
    setEditCostFormData({
      amount: cost.amount?.toString() || '',
      frequency: cost.frequency || 'monthly',
      description: cost.description || '',
      is_active: cost.is_active !== false
    });
    setShowEditCostModal(true);
  };

  // ─── Handler: update cost ──────────────────────────────────────────
  const handleUpdateCost = async () => {
    if (!editingCost) return;

    setEditCostLoading(true);
    try {
      const updateData: any = {};

      if (editCostFormData.amount && editCostFormData.amount !== editingCost.amount?.toString()) {
        updateData.amount = parseFloat(editCostFormData.amount);
      }
      if (editCostFormData.frequency && editCostFormData.frequency !== editingCost.frequency) {
        updateData.frequency = editCostFormData.frequency;
      }
      if (editCostFormData.description && editCostFormData.description !== editingCost.description) {
        updateData.description = editCostFormData.description;
      }
      if (editCostFormData.is_active !== editingCost.is_active) {
        updateData.is_active = editCostFormData.is_active;
      }

      if (Object.keys(updateData).length === 0) {
        alert('No hay cambios para guardar');
        setEditCostLoading(false);
        return;
      }

      await updateCostConfiguration(editingCost.id, updateData);
      await loadCosts();
      await loadCostConfigurations();

      setShowEditCostModal(false);
      setEditingCost(null);
      alert('Costo actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating cost:', error);
      alert('Error al actualizar costo: ' + (error.message || 'Error desconocido'));
    } finally {
      setEditCostLoading(false);
    }
  };

  // ─── Handler: open payment modal ───────────────────────────────────
  const handleOpenPaymentModal = (cost: any) => {
    setPayingCost(cost);
    setPaymentFormData({
      due_date: todayISO,
      payment_amount: cost.amount?.toString() || '',
      payment_date: todayISO,
      payment_method: 'efectivo',
      payment_reference: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  // ─── Handler: register payment ─────────────────────────────────────
  const handleRegisterPayment = async () => {
    if (!payingCost) return;

    if (!paymentFormData.payment_amount || parseFloat(paymentFormData.payment_amount) <= 0) {
      alert('Por favor ingresa un monto de pago valido');
      return;
    }

    setPaymentLoading(true);
    try {
      const paymentData = {
        cost_configuration_id: payingCost.id,
        due_date: paymentFormData.due_date || todayISO,
        payment_amount: parseFloat(paymentFormData.payment_amount),
        payment_date: paymentFormData.payment_date || todayISO,
        payment_method: paymentFormData.payment_method,
        payment_reference: paymentFormData.payment_reference || undefined,
        notes: paymentFormData.notes || undefined
      };

      await createCostPayment(paymentData);
      await loadCosts();
      await loadCostConfigurations();

      setShowPaymentModal(false);
      setPayingCost(null);
      alert(
        `Pago registrado exitosamente!\n\nMonto: ${formatCurrency(parseFloat(paymentFormData.payment_amount))}\nMetodo: ${paymentFormData.payment_method}`
      );
    } catch (error: any) {
      console.error('Error registering payment:', error);
      alert('Error al registrar pago: ' + (error.message || 'Error desconocido'));
    } finally {
      setPaymentLoading(false);
    }
  };

  // ─── Helper: frequency label in Spanish ────────────────────────────
  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      'daily': 'Diario',
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'quarterly': 'Trimestral',
      'annual': 'Anual'
    };
    return labels[frequency] || frequency;
  };

  // ─── Helper: map cost type to API values ───────────────────────────
  const mapCostTypeToAPI = (category: string): 'arriendo' | 'servicios' | 'nomina' | 'mercancia' | 'comisiones' | 'transporte' | 'otros' => {
    const mapping: Record<string, 'arriendo' | 'servicios' | 'nomina' | 'mercancia' | 'comisiones' | 'transporte' | 'otros'> = {
      // Costos Fijos
      'Arriendo': 'arriendo',
      'Servicios Publicos': 'servicios',
      'Internet': 'servicios',
      'Seguros': 'otros',
      'Nomina': 'nomina',
      'Otros Fijos': 'otros',
      // Costos Variables
      'Mercancia': 'mercancia',
      'Transporte': 'transporte',
      'Publicidad': 'otros',
      'Mantenimiento': 'otros',
      'Suministros': 'otros',
      'Otros Variables': 'otros'
    };
    return mapping[category] || 'otros';
  };

  // ─── Helper: map frequency to API values ───────────────────────────
  const mapFrequencyToAPI = (frequency: string): 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' => {
    const mapping: Record<string, 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'> = {
      'diario': 'daily',
      'semanal': 'weekly',
      'mensual': 'monthly',
      'trimestral': 'quarterly',
      'anual': 'annual'
    };
    return mapping[frequency] || 'monthly';
  };

  // ═══════════════════════════════════════════════════════════════════
  // JSX
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-foreground">Gestion de Costos</h2>
        <div className="flex space-x-2">
          <Button
            variant={showCostsList ? 'default' : 'outline'}
            onClick={() => {
              setShowCostsList(!showCostsList);
              if (!showCostsList) {
                loadCostConfigurations();
              }
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            {showCostsList ? 'Ocultar Lista' : 'Ver Costos Configurados'}
          </Button>
          <Button onClick={() => setShowCreateCostModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Costo
          </Button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              value={costFilters.category}
              onChange={(e) => {
                const category = e.target.value as typeof costFilters.category;
                setCostFilters(prev => ({ ...prev, category }));
              }}
              options={[
                { value: '', label: 'Todas las categorias' },
                { value: 'arriendo', label: 'Arriendo' },
                { value: 'servicios', label: 'Servicios' },
                { value: 'nomina', label: 'Nomina' },
                { value: 'mercancia', label: 'Mercancia' },
                { value: 'comisiones', label: 'Comisiones' },
                { value: 'transporte', label: 'Transporte' },
                { value: 'otros', label: 'Otros' },
              ]}
            />
            <Select
              value={costFilters.location}
              onChange={(e) => {
                setCostFilters(prev => ({ ...prev, location: e.target.value }));
              }}
              options={[
                { value: '', label: 'Todas las ubicaciones' },
                ...locations.map(location => ({ value: location.id.toString(), label: location.name }))
              ]}
            />
            <Button onClick={() => { loadCosts(); loadCostConfigurations(); }} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Costs configurations list ───────────────────────────────── */}
      {showCostsList && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Costos Configurados
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({costConfigurations.length} registros)
              </span>
            </h3>
          </CardHeader>
          <CardContent>
            {costConfigurationsLoading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Cargando configuraciones...</span>
              </div>
            ) : costConfigurations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full bg-card text-foreground border border-border rounded-lg overflow-hidden">
                  <thead className="bg-popover text-popover-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Ubicacion</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripcion</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Frecuencia</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {costConfigurations.map((cost) => (
                      <tr key={cost.id} className={!cost.is_active ? 'bg-muted/30 opacity-60' : ''}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                          #{cost.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium">{cost.location_name || `Ubicacion ${cost.location_id}`}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className="bg-accent text-accent-foreground border border-border">
                            {capitalize(cost.cost_type)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate" title={cost.description}>
                          {cost.description || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-primary">
                          {formatCurrency(parseFloat(cost.amount))}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {getFrequencyLabel(cost.frequency)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={cost.is_active ? 'success' : 'secondary'}>
                            {cost.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex space-x-1 flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditCostModal(cost)}
                              title="Editar costo"
                              className="p-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success border-success hover:bg-success/10 p-2"
                              onClick={() => handleOpenPaymentModal(cost)}
                              title="Registrar pago"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                            {cost.is_active && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-warning border-warning hover:bg-warning/10 p-2"
                                onClick={() => handleDeactivateCost(cost.id)}
                                title="Desactivar costo"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-error border-error hover:bg-error/10 p-2"
                              onClick={() => handleDeleteCost(cost.id)}
                              title="Eliminar costo"
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No hay costos configurados"
                description="Registra tu primer costo usando el boton 'Registrar Costo'"
                icon={<DollarSign className="h-12 w-12 text-gray-400" />}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Operational summary cards ───────────────────────────────── */}
      {operationalData && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {formatCurrency(parseFloat(operationalData.monthly_summary.total_monthly_costs))}
              </p>
              <p className="text-sm text-gray-600">Costos Mensuales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {formatCurrency(parseFloat(operationalData.summary.total_overdue_amount))}
              </p>
              <p className="text-sm text-gray-600">Monto Vencido</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{operationalData.summary.critical_alerts_count}</p>
              <p className="text-sm text-gray-600">Alertas Criticas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{operationalData.summary.total_locations}</p>
              <p className="text-sm text-gray-600">Ubicaciones</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Location status cards ───────────────────────────────────── */}
      {operationalData && (() => {
        let filteredLocations = operationalData.locations_status;

        if (costFilters.location) {
          const selectedLocation = locations.find(loc => loc.id.toString() === costFilters.location);
          if (selectedLocation) {
            filteredLocations = filteredLocations.filter(location => location.location_name === selectedLocation.name);
          }
        }

        return filteredLocations.length > 0 ? (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-foreground">
                Estado de Costos por Ubicacion
                {costFilters.location && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (Filtrado: {filteredLocations.length} de {operationalData.locations_status.length})
                  </span>
                )}
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLocations.map((location) => (
                  <div key={location.location_id} className={`p-4 rounded-lg border-l-4 bg-card text-foreground border-border ${location.status === 'ok' ? 'border-success' :
                    location.status === 'attention' ? 'border-warning' :
                      'border-error'
                    }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-foreground">{location.location_name}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Costos Mensuales</p>
                            <p className="font-semibold text-foreground">{formatCurrency(parseFloat(location.monthly_costs))}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Monto Vencido</p>
                            <p className="font-semibold text-error">{formatCurrency(parseFloat(location.overdue_amount))}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Cuentas Vencidas</p>
                            <p className="font-semibold text-foreground">{location.overdue_count}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Proximos Pagos</p>
                            <p className="font-semibold text-foreground">{location.upcoming_count}</p>
                          </div>
                        </div>
                      </div>
                      <Badge variant={
                        location.status === 'ok' ? 'success' :
                          location.status === 'attention' ? 'warning' : 'error'
                      }>
                        {location.status === 'ok' ? 'OK' :
                          location.status === 'attention' ? 'Atencion' : 'Critico'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <EmptyState
                title="No hay ubicaciones"
                description="No se encontraron ubicaciones con los filtros aplicados"
                icon={<Building className="h-12 w-12 text-gray-400" />}
              />
            </CardContent>
          </Card>
        );
      })()}

      {/* ── Upcoming payments ───────────────────────────────────────── */}
      {operationalData && (() => {
        let filteredUpcoming = operationalData.upcoming_week;

        if (costFilters.category) {
          filteredUpcoming = filteredUpcoming.filter(payment => payment.cost_type === costFilters.category);
        }

        if (costFilters.location) {
          const selectedLocation = locations.find(loc => loc.id.toString() === costFilters.location);
          if (selectedLocation) {
            filteredUpcoming = filteredUpcoming.filter(payment => payment.location_name === selectedLocation.name);
          }
        }

        return filteredUpcoming.length > 0 ? (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-foreground">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Pagos Proximos (Esta Semana)
                {(costFilters.category || costFilters.location) && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (Filtrados: {filteredUpcoming.length} de {operationalData.upcoming_week.length})
                  </span>
                )}
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUpcoming.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-card text-foreground border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{payment.location_name}</p>
                      <p className="text-sm text-muted-foreground">{capitalize(payment.cost_type)}</p>
                      <p className="text-xs text-muted-foreground">Vence: {formatDate(payment.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatCurrency(parseFloat(payment.amount))}</p>
                      <p className="text-sm text-primary">
                        {payment.days_until_due === 0 ? 'Hoy' :
                          payment.days_until_due === 1 ? 'Manana' :
                            `En ${payment.days_until_due} dias`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* ── Critical alerts ─────────────────────────────────────────── */}
      {operationalData && (() => {
        let filteredAlerts = operationalData.critical_alerts;

        if (costFilters.category) {
          filteredAlerts = filteredAlerts.filter(alert => alert.cost_type === costFilters.category);
        }

        if (costFilters.location) {
          const selectedLocation = locations.find(loc => loc.id.toString() === costFilters.location);
          if (selectedLocation) {
            filteredAlerts = filteredAlerts.filter(alert => alert.location_name === selectedLocation.name);
          }
        }

        return filteredAlerts.length > 0 ? (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center text-foreground">
                <AlertCircle className="h-5 w-5 mr-2 text-error" />
                Alertas Criticas - Pagos Vencidos
                {(costFilters.category || costFilters.location) && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (Filtradas: {filteredAlerts.length} de {operationalData.critical_alerts.length})
                  </span>
                )}
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full bg-card text-foreground border border-border rounded-lg overflow-hidden">
                  <thead className="bg-popover text-popover-foreground">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ubicacion</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tipo de Costo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Dias Vencido</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha Vencimiento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Prioridad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((alert, index) => (
                      <tr key={index} className={
                        alert.priority === 'high' ? 'bg-error/10' :
                          alert.priority === 'medium' ? 'bg-warning/10' : 'bg-muted/10'
                      }>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-medium text-foreground">{alert.location_name}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-accent text-accent-foreground border border-border">{capitalize(alert.cost_type)}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-error">
                          {formatCurrency(parseFloat(alert.amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-error">
                          {alert.days_overdue} dias
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatDate(alert.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={
                            alert.priority === 'high' ? 'error' :
                              alert.priority === 'medium' ? 'warning' : 'secondary'
                          }>
                            {alert.priority === 'high' ? 'Alta' :
                              alert.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <EmptyState
                title="No hay alertas criticas"
                description={
                  (costFilters.category || costFilters.location)
                    ? "No se encontraron alertas con los filtros aplicados"
                    : "No hay alertas criticas en este momento"
                }
                icon={<AlertCircle className="h-12 w-12 text-gray-400" />}
              />
            </CardContent>
          </Card>
        );
      })()}

      {/* ── No data state ───────────────────────────────────────────── */}
      {!operationalData && (
        <Card>
          <CardContent>
            <EmptyState
              title="Cargando informacion de costos"
              description="Esperando datos del dashboard operacional"
              icon={<DollarSign className="h-12 w-12 text-gray-400" />}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Create Cost Modal ───────────────────────────────────────── */}
      {showCreateCostModal && (
        <CreateCostModal
          onClose={() => setShowCreateCostModal(false)}
          onSubmit={handleCreateCost}
          locations={locations}
        />
      )}

      {/* ── Edit Cost Modal ─────────────────────────────────────────── */}
      {showEditCostModal && editingCost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4 border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Editar Costo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditCostModal(false);
                  setEditingCost(null);
                }}
              >
                ×
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Costo #{editingCost.id}</p>
                <p className="font-medium">{editingCost.location_name || `Ubicacion ${editingCost.location_id}`}</p>
                <p className="text-sm">{capitalize(editingCost.cost_type)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Monto</label>
                <Input
                  type="number"
                  value={editCostFormData.amount}
                  onChange={(e) => setEditCostFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Frecuencia</label>
                <Select
                  value={editCostFormData.frequency}
                  onChange={(e) => setEditCostFormData(prev => ({
                    ...prev,
                    frequency: e.target.value as typeof editCostFormData.frequency
                  }))}
                  options={[
                    { value: 'daily', label: 'Diario' },
                    { value: 'weekly', label: 'Semanal' },
                    { value: 'monthly', label: 'Mensual' },
                    { value: 'quarterly', label: 'Trimestral' },
                    { value: 'annual', label: 'Anual' }
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Descripcion</label>
                <Input
                  type="text"
                  value={editCostFormData.description}
                  onChange={(e) => setEditCostFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripcion del costo"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editCostFormData.is_active}
                  onChange={(e) => setEditCostFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-border"
                />
                <label htmlFor="is_active" className="text-sm text-foreground">Costo activo</label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditCostModal(false);
                  setEditingCost(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateCost}
                disabled={editCostLoading}
              >
                {editCostLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Registration Modal ──────────────────────────────── */}
      {showPaymentModal && payingCost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4 border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Registrar Pago</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPayingCost(null);
                }}
              >
                ×
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Pago para:</p>
                <p className="font-medium">{payingCost.location_name || `Ubicacion ${payingCost.location_id}`}</p>
                <p className="text-sm">{capitalize(payingCost.cost_type)} - {payingCost.description}</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {formatCurrency(parseFloat(payingCost.amount))}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Fecha de Vencimiento</label>
                <Input
                  type="date"
                  value={paymentFormData.due_date}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Monto del Pago</label>
                <Input
                  type="number"
                  value={paymentFormData.payment_amount}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, payment_amount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Fecha de Pago</label>
                <Input
                  type="date"
                  value={paymentFormData.payment_date}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Metodo de Pago</label>
                <Select
                  value={paymentFormData.payment_method}
                  onChange={(e) => setPaymentFormData(prev => ({
                    ...prev,
                    payment_method: e.target.value as typeof paymentFormData.payment_method
                  }))}
                  options={[
                    { value: 'efectivo', label: 'Efectivo' },
                    { value: 'transferencia', label: 'Transferencia' },
                    { value: 'tarjeta', label: 'Tarjeta' },
                    { value: 'cheque', label: 'Cheque' }
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Referencia de Pago (opcional)</label>
                <Input
                  type="text"
                  value={paymentFormData.payment_reference}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, payment_reference: e.target.value }))}
                  placeholder="Ej: Numero de transferencia, recibo, etc."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notas (opcional)</label>
                <Input
                  type="text"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales del pago"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPayingCost(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRegisterPayment}
                disabled={paymentLoading}
                className="bg-success hover:bg-success/90"
              >
                {paymentLoading ? 'Registrando...' : 'Registrar Pago'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostsPage;
