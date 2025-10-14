// src/services/superadminAPI.ts - Superadmin Module API
const BACKEND_URL = 'http://localhost:8000';
//const BACKEND_URL = 'https://tustockya-api.onrender.com';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(error.detail || `Error ${response.status}`);
  }
  return response.json();
};

// ========== SUPERADMIN APIs ==========
export const superadminAPI = {
  // 1. SU000: Crear el primer superadmin del sistema (solo una vez)
  async setupFirstSuperadmin(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    secret_key: string;
  }) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/setup/first-superadmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // 2. SU001: Listar todas las empresas
  async getCompanies(filters?: {
    skip?: number;
    limit?: number;
    status?: 'active' | 'suspended' | 'trial';
    plan?: string;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.plan) params.append('plan', filters.plan);
    if (filters?.search) params.append('search', filters.search);

    const url = `${BACKEND_URL}/api/v1/superadmin/companies${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 3. SU001: Crear nueva empresa (tenant)
  async createCompany(companyData: {
    name: string;
    subdomain: string;
    email: string;
    legal_name?: string;
    tax_id?: string;
    phone?: string;
    subscription_plan?: 'basic' | 'professional' | 'enterprise' | 'custom';
    max_locations?: number;
    max_employees?: number;
    price_per_location?: number | string;
    billing_day?: number;
    subscription_ends_at?: string;
    settings?: object;
  }) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/companies`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(companyData)
    });
    return handleResponse(response);
  },

  // 4. SU001: Obtener detalles de una empresa
  async getCompany(companyId: number) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/companies/${companyId}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 5. SU001: Actualizar configuración de empresa
  async updateCompany(companyId: number, updateData: {
    name?: string;
    legal_name?: string;
    tax_id?: string;
    email?: string;
    phone?: string;
    subscription_plan?: 'basic' | 'professional' | 'enterprise' | 'custom';
    subscription_status?: 'active' | 'suspended' | 'cancelled' | 'trial' | 'overdue';
    max_locations?: number;
    max_employees?: number;
    price_per_location?: number | string;
    billing_day?: number;
    subscription_ends_at?: string;
    settings?: object;
    is_active?: boolean;
  }) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/companies/${companyId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData)
    });
    return handleResponse(response);
  },

  // 6. SU001: Eliminar empresa (soft delete)
  async deleteCompany(companyId: number) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/companies/${companyId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 7. SU005: Suspender empresa por incumplimiento de pago
  async suspendCompany(companyId: number, reason: string) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/companies/${companyId}/suspend`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(response);
  },

  // 8. SU005: Activar empresa suspendida
  async activateCompany(companyId: number) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/companies/${companyId}/activate`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 9. SU002: Cambiar plan de suscripción
  async changeSubscription(data: {
    company_id: number;
    new_plan: 'basic' | 'professional' | 'enterprise' | 'custom';
    new_max_locations: number;
    new_max_employees: number;
    new_price_per_location: number | string;
    effective_date: string;
    reason?: string;
  }) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/subscriptions/change`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // 10. SU002: Historial de cambios de suscripción
  async getSubscriptionHistory(companyId: number) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/subscriptions/${companyId}/history`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 11. SU002: Listar todas las facturas
  async getInvoices(filters?: {
    status?: 'pending' | 'paid' | 'overdue';
    skip?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());

    const url = `${BACKEND_URL}/api/v1/superadmin/invoices${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 12. SU002: Facturas de una empresa
  async getCompanyInvoices(companyId: number, status?: 'pending' | 'paid' | 'overdue') {
    const params = status ? new URLSearchParams({ status }) : '';
    const url = `${BACKEND_URL}/api/v1/superadmin/invoices/company/${companyId}${params ? '?' + params : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 13. SU002: Generar factura mensual
  async generateInvoice(companyId: number) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/invoices/generate/${companyId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 14. SU002: Marcar factura como pagada
  async markInvoiceAsPaid(invoiceId: number, data: {
    payment_method: string;
    payment_reference?: string;
    paid_at?: string;
  }) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/invoices/${invoiceId}/mark-paid`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // 15. SU003: Métricas globales del sistema
  async getGlobalMetrics() {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/metrics/global`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 16. SU003: Métricas detalladas de una empresa
  async getCompanyMetrics(companyId: number) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/metrics/company/${companyId}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 17. SU006: Reporte financiero consolidado
  async getFinancialReport(startDate: string, endDate: string) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/reports/financial?${params}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 18. Listar plantillas de planes disponibles
  async getPlans(activeOnly: boolean = true) {
    const params = new URLSearchParams({
      active_only: activeOnly.toString()
    });
    
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/plans?${params}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 19. Crear nueva plantilla de plan
  async createPlan(planData: {
    plan_code: string;
    display_name: string;
    max_locations: number;
    max_employees: number;
    price_per_location: number | string;
    description?: string;
    features?: object;
    sort_order?: number;
  }) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/plans`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(planData)
    });
    return handleResponse(response);
  },

  // 20. Health check del módulo de superadmin
  async getHealth() {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/health`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 21. SU001: Crear usuario Boss para una empresa
  async createBoss(companyId: number, bossData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/companies/${companyId}/boss`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bossData)
    });
    return handleResponse(response);
  },

  // 22. SU001: Obtener solo el usuario Boss de una empresa
  async getBoss(companyId: number) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/companies/${companyId}/boss`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 23. SU001: Obtener empresa con su usuario Boss
  async getCompanyWithBoss(companyId: number) {
    const response = await fetch(`${BACKEND_URL}/api/v1/superadmin/companies/${companyId}/with-boss`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

// Exportar como default para facilitar el import
export default superadminAPI;
