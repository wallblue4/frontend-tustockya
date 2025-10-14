import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  DollarSign, 
  FileText, 
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2, 
  Ban,
  CheckCircle,
  Search,
  AlertCircle,
  Package,
  Activity,
  CreditCard,
  BarChart3,
  Shield
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { superadminAPI } from '../../services/superadminAPI';

type TabType = 'overview' | 'companies' | 'subscriptions' | 'invoices' | 'plans' | 'reports' | 'setup';

interface GlobalMetrics {
  total_companies: number;
  active_companies: number;
  suspended_companies: number;
  trial_companies: number;
  total_locations: number;
  total_employees: number;
  monthly_recurring_revenue: string;
  pending_invoices_amount: string;
  overdue_invoices_amount: string;
  companies_near_limit: number;
  subscriptions_expiring_soon: number;
  overdue_payments: number;
  new_companies_this_month: number;
  cancelled_companies_this_month: number;
}

interface Company {
  id: number;
  name: string;
  subdomain: string;
  email: string;
  subscription_plan: string;
  subscription_status: string;
  current_locations_count: number;
  current_employees_count: number;
  monthly_cost: string;
  next_billing_date?: string;
  is_active: boolean;
  created_at: string;
  max_locations?: number;
  max_employees?: number;
}

interface CompanyMetrics {
  company_id: number;
  company_name: string;
  locations_count: number;
  locations_limit: number;
  locations_usage_percent: number;
  employees_count: number;
  employees_limit: number;
  employees_usage_percent: number;
  current_plan: string;
  monthly_cost: string;
  subscription_status: string;
}

interface Plan {
  id: number;
  plan_code: string;
  display_name: string;
  description?: string;
  max_locations: number;
  max_employees: number;
  price_per_location: string;
  features?: any;
  is_active: boolean;
  sort_order: number;
}

interface Invoice {
  id: number;
  company_id: number;
  company_name: string;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue';
  due_date: string;
  paid_at: string | null;
  created_at: string;
  payment_method?: string;
  payment_reference?: string;
}

export const SuperuserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para métricas globales (Endpoint 15)
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);
  
  // Estado para empresas (Endpoints 2, 3, 4, 5, 6, 7, 8)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyMetrics, setCompanyMetrics] = useState<CompanyMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Estado para crear empresa
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    subdomain: '',
    email: '',
    legal_name: '',
    tax_id: '',
    phone: '',
    subscription_plan: 'basic' as 'basic' | 'professional' | 'enterprise' | 'custom',
    max_locations: 3,
    max_employees: 10,
    price_per_location: 50
  });
  
  // Estado para Boss (Endpoints 21, 22, 23)
  const [newBoss, setNewBoss] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  
  // Estado para suscripciones (Endpoints 9, 10)
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
  const [showChangeSubscription, setShowChangeSubscription] = useState(false);
  const [subscriptionChange, setSubscriptionChange] = useState({
    company_id: 0,
    new_plan: 'basic' as 'basic' | 'professional' | 'enterprise' | 'custom',
    new_max_locations: 5,
    new_max_employees: 15,
    new_price_per_location: 75,
    effective_date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  
  // Estado para facturas (Endpoints 11, 12, 13, 14)
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('');
  
  // Estado para planes (Endpoints 18, 19)
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    plan_code: '',
    display_name: '',
    description: '',
    max_locations: 5,
    max_employees: 15,
    price_per_location: 60,
    features: {},
    sort_order: 0
  });
  
  // Estado para reportes (Endpoint 17)
  const [financialReport, setFinancialReport] = useState<any>(null);
  const [reportDates, setReportDates] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  
  // Estado para setup primer superadmin (Endpoint 1)
  const [setupData, setSetupData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    secret_key: ''
  });
  
  // Health check (Endpoint 20)
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Cargar métricas globales al iniciar (Endpoint 15)
  useEffect(() => {
    loadGlobalMetrics();
    checkHealth();
  }, []);

  // Cargar datos según la tab activa
  useEffect(() => {
    switch (activeTab) {
      case 'overview':
        loadGlobalMetrics();
        break;
      case 'companies':
        loadCompanies();
        break;
      case 'invoices':
        loadInvoices();
        break;
      case 'plans':
        loadPlans();
        break;
      default:
        break;
    }
  }, [activeTab, searchTerm, statusFilter, invoiceStatusFilter]);

  // ========== FUNCIONES PARA MÉTRICAS (Endpoint 15, 16) ==========
  const loadGlobalMetrics = async () => {
    try {
      setLoading(true);
      const data = await superadminAPI.getGlobalMetrics();
      setGlobalMetrics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyMetrics = async (companyId: number) => {
    try {
      const data = await superadminAPI.getCompanyMetrics(companyId);
      setCompanyMetrics(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ========== FUNCIONES PARA EMPRESAS (Endpoints 2, 3, 4, 5, 6, 7, 8) ==========
  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superadminAPI.getCompanies({
        search: searchTerm || undefined,
        status: (statusFilter as 'active' | 'suspended' | 'trial' | undefined) || undefined,
        limit: 100
      });
      console.log('🏢 Datos recibidos del endpoint de empresas:', data);
      // El endpoint retorna directamente un array de empresas
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('❌ Error cargando empresas:', err);
      setError(err.message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await superadminAPI.createCompany(newCompany);
      setShowCreateCompany(false);
      setNewCompany({
        name: '',
        subdomain: '',
        email: '',
        legal_name: '',
        tax_id: '',
        phone: '',
        subscription_plan: 'basic',
        max_locations: 3,
        max_employees: 10,
        price_per_location: 50
      });
      loadCompanies();
      alert('Empresa creada exitosamente');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const viewCompanyDetails = async (companyId: number) => {
    try {
      const data = await superadminAPI.getCompany(companyId);
      setSelectedCompany(data);
      loadCompanyMetrics(companyId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteCompany = async (companyId: number) => {
    if (window.confirm('¿Está seguro de eliminar esta empresa?')) {
      try {
        await superadminAPI.deleteCompany(companyId);
        loadCompanies();
        alert('Empresa eliminada exitosamente');
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const suspendCompany = async (companyId: number) => {
    const reason = prompt('Ingrese la razón de la suspensión:');
    if (reason) {
      try {
        await superadminAPI.suspendCompany(companyId, reason);
        loadCompanies();
        alert('Empresa suspendida exitosamente');
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const activateCompany = async (companyId: number) => {
    try {
      await superadminAPI.activateCompany(companyId);
      loadCompanies();
      alert('Empresa activada exitosamente');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // ========== FUNCIONES PARA BOSS (Endpoints 21, 22, 23) ==========
  const createBoss = async (e: React.FormEvent, companyId: number) => {
    e.preventDefault();
    try {
      await superadminAPI.createBoss(companyId, newBoss);
      setNewBoss({ email: '', password: '', first_name: '', last_name: '' });
      alert('Usuario Boss creado exitosamente');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getBoss = async (companyId: number) => {
    try {
      const boss = await superadminAPI.getBoss(companyId);
      alert(`Boss: ${boss.full_name} (${boss.email})`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getCompanyWithBoss = async (companyId: number) => {
    try {
      const data = await superadminAPI.getCompanyWithBoss(companyId);
      console.log('Company with Boss:', data);
      setSelectedCompany(data.company);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ========== FUNCIONES PARA SUSCRIPCIONES (Endpoints 9, 10) ==========
  const changeSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superadminAPI.changeSubscription(subscriptionChange);
      setShowChangeSubscription(false);
      alert('Plan de suscripción cambiado exitosamente');
      loadCompanies();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const loadSubscriptionHistory = async (companyId: number) => {
    try {
      const data = await superadminAPI.getSubscriptionHistory(companyId);
      setSubscriptionHistory(data.history || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ========== FUNCIONES PARA FACTURAS (Endpoints 11, 12, 13, 14) ==========
  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superadminAPI.getInvoices({
        status: (invoiceStatusFilter as 'pending' | 'paid' | 'overdue' | undefined) || undefined,
        limit: 100
      });
      console.log('📄 Datos recibidos del endpoint de facturas:', data);
      console.log('📄 Es array?:', Array.isArray(data));
      
      // El endpoint retorna directamente un array de facturas
      const invoicesData = Array.isArray(data) ? data : (data.invoices || []);
      console.log('📄 Facturas procesadas:', invoicesData);
      setInvoices(invoicesData);
    } catch (err: any) {
      console.error('❌ Error cargando facturas:', err);
      setError(err.message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyInvoices = async (companyId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await superadminAPI.getCompanyInvoices(companyId);
      // El endpoint retorna directamente un array de facturas o un objeto con invoices
      setInvoices(Array.isArray(data) ? data : (data.invoices || []));
      setActiveTab('invoices');
    } catch (err: any) {
      setError(err.message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async (companyId: number) => {
    try {
      await superadminAPI.generateInvoice(companyId);
      loadInvoices();
      alert('Factura generada exitosamente');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const markInvoiceAsPaid = async (invoiceId: number, paymentMethod: string, paymentReference: string) => {
    try {
      await superadminAPI.markInvoiceAsPaid(invoiceId, {
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        paid_at: new Date().toISOString()
      });
      loadInvoices();
      alert('Factura marcada como pagada');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // ========== FUNCIONES PARA PLANES (Endpoints 18, 19) ==========
  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await superadminAPI.getPlans(true);
      setPlans(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superadminAPI.createPlan(newPlan);
      setShowCreatePlan(false);
      setNewPlan({
        plan_code: '',
        display_name: '',
        description: '',
        max_locations: 5,
        max_employees: 15,
        price_per_location: 60,
        features: {},
        sort_order: 0
      });
      loadPlans();
      alert('Plan creado exitosamente');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // ========== FUNCIONES PARA REPORTES (Endpoint 17) ==========
  const loadFinancialReport = async () => {
    try {
      setLoading(true);
      const data = await superadminAPI.getFinancialReport(
        reportDates.start_date,
        reportDates.end_date
      );
      setFinancialReport(data.report || data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== FUNCIONES PARA SETUP (Endpoint 1) ==========
  const setupFirstSuperadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superadminAPI.setupFirstSuperadmin(setupData);
      alert('Primer superadmin creado exitosamente');
      setSetupData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        secret_key: ''
      });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // ========== HEALTH CHECK (Endpoint 20) ==========
  const checkHealth = async () => {
    try {
      const data = await superadminAPI.getHealth();
      setHealthStatus(data);
    } catch (err: any) {
      console.error('Health check failed:', err);
    }
  };

  // ========== RENDERIZADO DE TABS ==========
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Métricas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Empresas</p>
                <p className="text-2xl font-bold">{globalMetrics?.total_companies || 0}</p>
                <p className="text-xs text-success">Activas: {globalMetrics?.active_companies || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold">${globalMetrics?.monthly_recurring_revenue || '0'}</p>
                <p className="text-xs text-muted-foreground">Ingreso mensual recurrente</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagos Vencidos</p>
                <p className="text-2xl font-bold">{globalMetrics?.overdue_payments || 0}</p>
                <p className="text-xs text-error">${globalMetrics?.overdue_invoices_amount || '0'}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-error" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ubicaciones</p>
                <p className="text-2xl font-bold">{globalMetrics?.total_locations || 0}</p>
                <p className="text-xs text-muted-foreground">{globalMetrics?.total_employees || 0} empleados</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas y Notificaciones */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Alertas y Notificaciones</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {globalMetrics?.companies_near_limit ? (
              <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-md">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Empresas cerca del límite</p>
                  <p className="text-sm text-muted-foreground">
                    {globalMetrics.companies_near_limit} empresas están cerca de sus límites
                  </p>
                </div>
              </div>
            ) : null}
            
            {globalMetrics?.subscriptions_expiring_soon ? (
              <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-md">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Suscripciones por vencer</p>
                  <p className="text-sm text-muted-foreground">
                    {globalMetrics.subscriptions_expiring_soon} suscripciones vencen pronto
                  </p>
                </div>
              </div>
            ) : null}

            {globalMetrics?.suspended_companies ? (
              <div className="flex items-center gap-3 p-3 bg-error/10 rounded-md">
                <Ban className="h-5 w-5 text-error" />
                <div>
                  <p className="font-medium">Empresas suspendidas</p>
                  <p className="text-sm text-muted-foreground">
                    {globalMetrics.suspended_companies} empresas suspendidas
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Health Status */}
      {healthStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Estado del Sistema</h2>
              <Activity className={`h-6 w-6 ${healthStatus.status === 'ok' ? 'text-success' : 'text-error'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Módulo: {healthStatus.module} - Estado: {healthStatus.status}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCompaniesTab = () => (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                icon={<Search className="h-5 w-5" />}
                placeholder="Buscar por nombre, subdominio o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'active', label: 'Activos' },
                { value: 'suspended', label: 'Suspendidos' },
                { value: 'trial', label: 'Trial' }
              ]}
            />
            <Button onClick={() => setShowCreateCompany(!showCreateCompany)}>
              <Plus className="h-4 w-4 mr-2" /> Nueva Empresa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulario crear empresa */}
      {showCreateCompany && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Crear Nueva Empresa</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCompany} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                required
              />
              <Input
                label="Subdominio"
                value={newCompany.subdomain}
                onChange={(e) => setNewCompany({ ...newCompany, subdomain: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={newCompany.email}
                onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                required
              />
              <Input
                label="Razón Social"
                value={newCompany.legal_name}
                onChange={(e) => setNewCompany({ ...newCompany, legal_name: e.target.value })}
              />
              <Input
                label="NIT/RUT"
                value={newCompany.tax_id}
                onChange={(e) => setNewCompany({ ...newCompany, tax_id: e.target.value })}
              />
              <Input
                label="Teléfono"
                value={newCompany.phone}
                onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
              />
              <Select
                label="Plan"
                value={newCompany.subscription_plan}
                onChange={(e) => setNewCompany({ ...newCompany, subscription_plan: e.target.value as any })}
                options={[
                  { value: 'basic', label: 'Básico' },
                  { value: 'professional', label: 'Professional' },
                  { value: 'enterprise', label: 'Enterprise' },
                  { value: 'custom', label: 'Personalizado' }
                ]}
              />
              <Input
                label="Máximo Ubicaciones"
                type="number"
                value={newCompany.max_locations}
                onChange={(e) => setNewCompany({ ...newCompany, max_locations: parseInt(e.target.value) })}
              />
              <Input
                label="Máximo Empleados"
                type="number"
                value={newCompany.max_employees}
                onChange={(e) => setNewCompany({ ...newCompany, max_employees: parseInt(e.target.value) })}
              />
              <Input
                label="Precio por Ubicación"
                type="number"
                value={newCompany.price_per_location}
                onChange={(e) => setNewCompany({ ...newCompany, price_per_location: parseFloat(e.target.value) })}
              />
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Empresa'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateCompany(false)}>
                  Cancelar
              </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de empresas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Empresas ({companies.length})</h2>
            {loading && <span className="text-sm text-muted-foreground">Cargando...</span>}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando empresas...</p>
            </div>
          ) : companies.length > 0 ? (
            <div className="space-y-4">
              {companies.map((company) => (
                <div key={company.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Header con nombre y badges */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Building2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{company.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {company.subdomain}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {company.email}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            company.subscription_status === 'active' ? 'bg-success/20 text-success' :
                            company.subscription_status === 'suspended' ? 'bg-error/20 text-error' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {company.subscription_status === 'active' ? 'Activo' :
                             company.subscription_status === 'suspended' ? 'Suspendido' : 
                             company.subscription_status}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                            {company.subscription_plan}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Información financiera */}
                    <div className="text-left md:text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-primary">${parseFloat(company.monthly_cost).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">por mes</p>
                      {company.next_billing_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Próximo: {new Date(company.next_billing_date).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/20 rounded-md">
                    <div>
                      <p className="text-xs text-muted-foreground">Ubicaciones</p>
                      <p className="font-semibold">{company.current_locations_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Empleados</p>
                      <p className="font-semibold">{company.current_employees_count}</p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => viewCompanyDetails(company.id)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Ver</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => getCompanyWithBoss(company.id)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Boss</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => loadCompanyInvoices(company.id)}
                      className="flex-1 sm:flex-initial"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Facturas</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => generateInvoice(company.id)}
                      className="flex-1 sm:flex-initial"
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Generar</span>
                    </Button>
                    {company.subscription_status === 'suspended' ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => activateCompany(company.id)}
                        className="flex-1 sm:flex-initial"
                      >
                        <CheckCircle className="h-4 w-4 text-success mr-1" />
                        <span className="hidden sm:inline">Activar</span>
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => suspendCompany(company.id)}
                        className="flex-1 sm:flex-initial"
                      >
                        <Ban className="h-4 w-4 text-warning mr-1" />
                        <span className="hidden sm:inline">Suspender</span>
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteCompany(company.id)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Trash2 className="h-4 w-4 text-error mr-1" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground">No hay empresas para mostrar</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm || statusFilter 
                  ? 'Intenta cambiar los filtros de búsqueda' 
                  : 'Crea tu primera empresa para comenzar'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        
      {/* Detalles y métricas de empresa seleccionada */}
      {selectedCompany && companyMetrics && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Detalles: {selectedCompany.name}</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Uso de Ubicaciones</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${companyMetrics.locations_usage_percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {companyMetrics.locations_count}/{companyMetrics.locations_limit}
                  </span>
                </div>
              </div>
                    <div>
                <p className="text-sm text-muted-foreground">Uso de Empleados</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full" 
                      style={{ width: `${companyMetrics.employees_usage_percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {companyMetrics.employees_count}/{companyMetrics.employees_limit}
                  </span>
                </div>
                    </div>
                    <div>
                <p className="text-sm text-muted-foreground">Costo Mensual</p>
                <p className="text-2xl font-bold">${companyMetrics.monthly_cost}</p>
              </div>
            </div>

            {/* Formulario para crear Boss */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-4">Crear Usuario Boss</h3>
              <form onSubmit={(e) => createBoss(e, selectedCompany.id)} className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={newBoss.email}
                  onChange={(e) => setNewBoss({ ...newBoss, email: e.target.value })}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={newBoss.password}
                  onChange={(e) => setNewBoss({ ...newBoss, password: e.target.value })}
                  required
                />
                <Input
                  label="Nombre"
                  value={newBoss.first_name}
                  onChange={(e) => setNewBoss({ ...newBoss, first_name: e.target.value })}
                  required
                />
                <Input
                  label="Apellido"
                  value={newBoss.last_name}
                  onChange={(e) => setNewBoss({ ...newBoss, last_name: e.target.value })}
                  required
                />
                <div className="col-span-2 flex gap-2">
                  <Button type="submit">Crear Boss</Button>
                  <Button type="button" variant="outline" onClick={() => getBoss(selectedCompany.id)}>
                    Ver Boss Actual
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSubscriptionsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Gestión de Suscripciones</h2>
            <Button onClick={() => setShowChangeSubscription(!showChangeSubscription)}>
              <Plus className="h-4 w-4 mr-2" /> Cambiar Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showChangeSubscription && (
            <form onSubmit={changeSubscription} className="grid grid-cols-2 gap-4 mb-6 p-4 border rounded-lg">
              <Input
                label="ID Empresa"
                type="number"
                value={subscriptionChange.company_id}
                onChange={(e) => setSubscriptionChange({ ...subscriptionChange, company_id: parseInt(e.target.value) })}
                required
              />
              <Select
                label="Nuevo Plan"
                value={subscriptionChange.new_plan}
                onChange={(e) => setSubscriptionChange({ ...subscriptionChange, new_plan: e.target.value as any })}
                options={[
                  { value: 'basic', label: 'Básico' },
                  { value: 'professional', label: 'Professional' },
                  { value: 'enterprise', label: 'Enterprise' },
                  { value: 'custom', label: 'Personalizado' }
                ]}
              />
              <Input
                label="Máximo Ubicaciones"
                type="number"
                value={subscriptionChange.new_max_locations}
                onChange={(e) => setSubscriptionChange({ ...subscriptionChange, new_max_locations: parseInt(e.target.value) })}
              />
              <Input
                label="Máximo Empleados"
                type="number"
                value={subscriptionChange.new_max_employees}
                onChange={(e) => setSubscriptionChange({ ...subscriptionChange, new_max_employees: parseInt(e.target.value) })}
              />
              <Input
                label="Precio por Ubicación"
                type="number"
                value={subscriptionChange.new_price_per_location}
                onChange={(e) => setSubscriptionChange({ ...subscriptionChange, new_price_per_location: parseFloat(e.target.value) })}
              />
              <Input
                label="Fecha Efectiva"
                type="date"
                value={subscriptionChange.effective_date}
                onChange={(e) => setSubscriptionChange({ ...subscriptionChange, effective_date: e.target.value })}
              />
              <div className="col-span-2">
                <Input
                  label="Razón"
                  value={subscriptionChange.reason}
                  onChange={(e) => setSubscriptionChange({ ...subscriptionChange, reason: e.target.value })}
                  placeholder="Motivo del cambio..."
                />
              </div>
              <div className="col-span-2 flex gap-2">
                <Button type="submit">Cambiar Suscripción</Button>
                <Button type="button" variant="outline" onClick={() => setShowChangeSubscription(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {/* Historial */}
          {subscriptionHistory.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-3">Historial de Cambios</h3>
              <div className="space-y-2">
                {subscriptionHistory.map((item, idx) => (
                  <div key={idx} className="p-3 bg-muted/20 rounded">
                    <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <Input
              label="Ver historial de empresa (ID)"
              type="number"
              placeholder="Ingrese ID de empresa"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const companyId = parseInt((e.target as HTMLInputElement).value);
                  if (companyId) loadSubscriptionHistory(companyId);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-warning/20 text-warning',
      paid: 'bg-success/20 text-success',
      overdue: 'bg-error/20 text-error'
    };
    const labels = {
      pending: 'Pendiente',
      paid: 'Pagado',
      overdue: 'Vencido'
    };
    return { class: badges[status as keyof typeof badges] || badges.pending, label: labels[status as keyof typeof labels] || status };
  };

  const renderInvoicesTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Gestión de Facturas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {invoices.length} factura{invoices.length !== 1 ? 's' : ''} encontrada{invoices.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Select
              value={invoiceStatusFilter}
              onChange={(e) => setInvoiceStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'pending', label: 'Pendientes' },
                { value: 'paid', label: 'Pagadas' },
                { value: 'overdue', label: 'Vencidas' }
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando facturas...</p>
            </div>
          ) : invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => {
                const statusBadge = getStatusBadge(invoice.status);
                const isOverdue = invoice.status === 'overdue' || (invoice.status === 'pending' && new Date(invoice.due_date) < new Date());
                
                return (
                  <div 
                    key={invoice.id} 
                    className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                      isOverdue ? 'border-error/50 bg-error/5' : ''
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Información principal */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
                            <p className="text-sm text-muted-foreground">{invoice.company_name}</p>
                          </div>
                        </div>
                        
                        {/* Detalles de la factura */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Período</p>
                            <p className="font-medium">
                              {new Date(invoice.billing_period_start).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Monto Total</p>
                            <p className="font-semibold text-lg text-primary">
                              ${invoice.total_amount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Vencimiento</p>
                            <p className={`font-medium ${isOverdue ? 'text-error' : ''}`}>
                              {formatDate(invoice.due_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Estado</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusBadge.class}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>

                        {/* Información de pago si existe */}
                        {invoice.paid_at && (
                          <div className="mt-3 p-2 bg-success/10 rounded text-sm">
                            <p className="text-success">
                              ✓ Pagado el {formatDate(invoice.paid_at)}
                              {invoice.payment_method && ` • Método: ${invoice.payment_method}`}
                              {invoice.payment_reference && ` • Ref: ${invoice.payment_reference}`}
                            </p>
                          </div>
                        )}

                        {/* Advertencia si está vencida */}
                        {isOverdue && !invoice.paid_at && (
                          <div className="mt-3 p-2 bg-error/10 rounded text-sm">
                            <p className="text-error">
                              ⚠️ Factura vencida - Acción requerida
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-2">
                        {invoice.status !== 'paid' && (
                          <Button 
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              const method = prompt('Método de pago:');
                              if (method) {
                                const reference = prompt('Referencia del pago (opcional):');
                                markInvoiceAsPaid(invoice.id, method, reference || '');
                              }
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar Pagada
                          </Button>
                        )}
                        
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const companyId = invoice.company_id;
                            setActiveTab('companies');
                            viewCompanyDetails(companyId);
                          }}
                        >
                          <Building2 className="h-4 w-4 mr-2" />
                          Ver Empresa
                        </Button>
                      </div>
                    </div>

                    {/* Footer con fechas */}
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex justify-between">
                      <span>Creada: {formatDate(invoice.created_at)}</span>
                      <span>Empresa ID: {invoice.company_id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground">No hay facturas para mostrar</p>
              <p className="text-sm text-muted-foreground mt-2">
                {invoiceStatusFilter 
                  ? 'Intenta cambiar el filtro de estado' 
                  : 'Las facturas aparecerán aquí cuando se generen'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas de facturas */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pendiente</p>
                  <p className="text-2xl font-bold text-warning">
                    ${invoices
                      .filter(inv => inv.status === 'pending')
                      .reduce((sum, inv) => sum + inv.total_amount, 0)
                      .toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {invoices.filter(inv => inv.status === 'pending').length} facturas
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cobrado</p>
                  <p className="text-2xl font-bold text-success">
                    ${invoices
                      .filter(inv => inv.status === 'paid')
                      .reduce((sum, inv) => sum + inv.total_amount, 0)
                      .toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {invoices.filter(inv => inv.status === 'paid').length} facturas
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Vencido</p>
                  <p className="text-2xl font-bold text-error">
                    ${invoices
                      .filter(inv => inv.status === 'overdue' || (inv.status === 'pending' && new Date(inv.due_date) < new Date()))
                      .reduce((sum, inv) => sum + inv.total_amount, 0)
                      .toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {invoices.filter(inv => inv.status === 'overdue' || (inv.status === 'pending' && new Date(inv.due_date) < new Date())).length} facturas
                  </p>
                </div>
                <Ban className="h-8 w-8 text-error" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderPlansTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Plantillas de Planes</h2>
            <Button onClick={() => setShowCreatePlan(!showCreatePlan)}>
              <Plus className="h-4 w-4 mr-2" /> Nuevo Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCreatePlan && (
            <form onSubmit={createPlan} className="grid grid-cols-2 gap-4 mb-6 p-4 border rounded-lg">
              <Input
                label="Código del Plan"
                value={newPlan.plan_code}
                onChange={(e) => setNewPlan({ ...newPlan, plan_code: e.target.value })}
                required
              />
              <Input
                label="Nombre para Mostrar"
                value={newPlan.display_name}
                onChange={(e) => setNewPlan({ ...newPlan, display_name: e.target.value })}
                required
              />
              <div className="col-span-2">
                <Input
                  label="Descripción"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                />
              </div>
              <Input
                label="Máximo Ubicaciones"
                type="number"
                value={newPlan.max_locations}
                onChange={(e) => setNewPlan({ ...newPlan, max_locations: parseInt(e.target.value) })}
              />
              <Input
                label="Máximo Empleados"
                type="number"
                value={newPlan.max_employees}
                onChange={(e) => setNewPlan({ ...newPlan, max_employees: parseInt(e.target.value) })}
              />
              <Input
                label="Precio por Ubicación"
                type="number"
                value={newPlan.price_per_location}
                onChange={(e) => setNewPlan({ ...newPlan, price_per_location: parseFloat(e.target.value) })}
              />
              <Input
                label="Orden"
                type="number"
                value={newPlan.sort_order}
                onChange={(e) => setNewPlan({ ...newPlan, sort_order: parseInt(e.target.value) })}
              />
              <div className="col-span-2 flex gap-2">
                <Button type="submit">Crear Plan</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreatePlan(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{plan.display_name}</h3>
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                <div className="space-y-1 text-sm">
                  <p>Código: <span className="font-medium">{plan.plan_code}</span></p>
                  <p>Ubicaciones: <span className="font-medium">{plan.max_locations}</span></p>
                  <p>Empleados: <span className="font-medium">{plan.max_employees}</span></p>
                  <p>Precio: <span className="font-medium">${plan.price_per_location}/ubicación</span></p>
                  <p>Estado: <span className={plan.is_active ? 'text-success' : 'text-error'}>
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </span></p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Reporte Financiero Consolidado</h2>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input
              label="Fecha Inicio"
              type="date"
              value={reportDates.start_date}
              onChange={(e) => setReportDates({ ...reportDates, start_date: e.target.value })}
            />
            <Input
              label="Fecha Fin"
              type="date"
              value={reportDates.end_date}
              onChange={(e) => setReportDates({ ...reportDates, end_date: e.target.value })}
            />
            <Button onClick={loadFinancialReport} className="mt-auto">
              <BarChart3 className="h-4 w-4 mr-2" /> Generar Reporte
            </Button>
          </div>

          {financialReport && (
            <div className="p-4 bg-muted/20 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(financialReport, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSetupTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Setup Primer Superadmin</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-warning font-medium">
              ⚠️ Advertencia: Este endpoint solo debe usarse una vez durante la instalación inicial del sistema.
            </p>
          </div>

          <form onSubmit={setupFirstSuperadmin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={setupData.email}
              onChange={(e) => setSetupData({ ...setupData, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              value={setupData.password}
              onChange={(e) => setSetupData({ ...setupData, password: e.target.value })}
              required
            />
            <Input
              label="Nombre"
              value={setupData.first_name}
              onChange={(e) => setSetupData({ ...setupData, first_name: e.target.value })}
              required
            />
            <Input
              label="Apellido"
              value={setupData.last_name}
              onChange={(e) => setSetupData({ ...setupData, last_name: e.target.value })}
              required
            />
            <Input
              label="Clave Secreta"
              type="password"
              value={setupData.secret_key}
              onChange={(e) => setSetupData({ ...setupData, secret_key: e.target.value })}
              placeholder="Clave secreta de instalación"
              required
            />
            <Button type="submit">
              Crear Primer Superadmin
            </Button>
          </form>
          </CardContent>
        </Card>
    </div>
  );

  return (
    <DashboardLayout title="Panel de Superadmin">
      <div className="px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-error font-medium">{error}</p>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="mb-8 flex gap-3 overflow-x-auto pb-2 pt-4">
          <Button
            variant={activeTab === 'overview' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('overview')}
            className="px-4 py-3 min-w-fit"
          >
            <TrendingUp className="h-4 w-4 mr-2" /> Dashboard
          </Button>
          <Button
            variant={activeTab === 'companies' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('companies')}
            className="px-4 py-3 min-w-fit"
          >
            <Building2 className="h-4 w-4 mr-2" /> Empresas
          </Button>
          <Button
            variant={activeTab === 'subscriptions' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('subscriptions')}
            className="px-4 py-3 min-w-fit"
          >
            <CreditCard className="h-4 w-4 mr-2" /> Suscripciones
          </Button>
          <Button
            variant={activeTab === 'invoices' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('invoices')}
            className="px-4 py-3 min-w-fit"
          >
            <FileText className="h-4 w-4 mr-2" /> Facturas
          </Button>
          <Button
            variant={activeTab === 'plans' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('plans')}
            className="px-4 py-3 min-w-fit"
          >
            <Package className="h-4 w-4 mr-2" /> Planes
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('reports')}
            className="px-4 py-3 min-w-fit"
          >
            <BarChart3 className="h-4 w-4 mr-2" /> Reportes
          </Button>
          <Button
            variant={activeTab === 'setup' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('setup')}
            className="px-4 py-3 min-w-fit"
          >
            <Settings className="h-4 w-4 mr-2" /> Setup
          </Button>
        </div>

        {/* Tab Content */}
        <div className="pb-8">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'companies' && renderCompaniesTab()}
          {activeTab === 'subscriptions' && renderSubscriptionsTab()}
          {activeTab === 'invoices' && renderInvoicesTab()}
          {activeTab === 'plans' && renderPlansTab()}
          {activeTab === 'reports' && renderReportsTab()}
          {activeTab === 'setup' && renderSetupTab()}
        </div>
      </div>
    </DashboardLayout>
  );
};
