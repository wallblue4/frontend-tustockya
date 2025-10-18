// src/services/bossAPI.ts - Boss/Executive Module API

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

// ========== BOSS APIs ==========
export const bossAPI = {
  // 1. BS008/BS009: Crear nuevos locales de venta o bodegas
  async createLocation(locationData: {
    name: string;
    type: 'local' | 'bodega';
    address?: string;
    phone?: string;
    manager_name?: string;
    capacity?: number;
    notes?: string;
  }) {
    const response = await fetch(`${BACKEND_URL}/api/v1/boss/boss/locations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(locationData)
    });
    return handleResponse(response);
  },

  // 2. Listar todas las ubicaciones de la empresa
  async getLocations(includeInactive: boolean = false) {
    const params = new URLSearchParams({
      include_inactive: includeInactive.toString()
    });
    
    const response = await fetch(`${BACKEND_URL}/api/v1/boss/boss/locations?${params}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 3. BS001: Visualizar dashboard ejecutivo con KPIs principales
  async getDashboard(targetDate?: string) {
    const params = targetDate ? new URLSearchParams({ target_date: targetDate }) : '';
    const url = `${BACKEND_URL}/api/v1/boss/boss/dashboard${params ? '?' + params : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 4. BS002: Acceder a reportes de ventas consolidados
  async getSalesConsolidatedReport(filters: {
    start_date: string;
    end_date: string;
    location_ids?: number[];
    include_inactive?: boolean;
  }) {
    const response = await fetch(`${BACKEND_URL}/api/v1/boss/boss/reports/sales/consolidated`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(filters)
    });
    return handleResponse(response);
  },

  // 5. BS002: Reporte diario de ventas (atajo)
  async getDailySalesReport(reportDate?: string) {
    const params = reportDate ? new URLSearchParams({ report_date: reportDate }) : '';
    const url = `${BACKEND_URL}/api/v1/boss/boss/reports/sales/daily${params ? '?' + params : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 6. BS002: Reporte mensual de ventas (atajo)
  async getMonthlySalesReport(year: number, month: number) {
    const params = new URLSearchParams({
      year: year.toString(),
      month: month.toString()
    });
    
    const response = await fetch(`${BACKEND_URL}/api/v1/boss/boss/reports/sales/monthly?${params}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 7. BS003: Consultar inventario total por categorías
  async getConsolidatedInventory() {
    const response = await fetch(`${BACKEND_URL}/api/v1/boss/boss/inventory/consolidated`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 8. BS004: Revisar costos operativos y márgenes de ganancia
  async getFinancialAnalysis(startDate: string, endDate: string) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    
    const response = await fetch(`${BACKEND_URL}/api/v1/boss/boss/financial/analysis?${params}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 9. BS004: Análisis financiero mensual (atajo)
  async getMonthlyFinancialAnalysis(year: number, month: number) {
    const params = new URLSearchParams({
      year: year.toString(),
      month: month.toString()
    });
    
    const response = await fetch(`${BACKEND_URL}/api/v1/boss/boss/financial/monthly?${params}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 10. Health check del módulo Boss
  async getHealth() {
    const response = await fetch(`${BACKEND_URL}/api/v1/boss/boss/health`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // 11. Resumen ejecutivo rápido del negocio
  async getSummary() {
    const response = await fetch(`${BACKEND_URL}/api/v1/boss/boss/summary`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

// Exportar como default para facilitar el import
export default bossAPI;
