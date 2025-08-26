
const BACKEND_URL = 'https://tustockya-api.onrender.com';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const getFormDataHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`
    // No incluir Content-Type para FormData, el browser lo maneja automáticamente
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(error.detail || `Error ${response.status}`);
  }
  return response.json();
};

// ========== INTERFACES ==========

interface UserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'vendedor' | 'bodeguero' | 'corredor';
  location_id?: number;
}

interface UserUpdate {
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  location_id?: number;
}

interface UserAssignment {
  user_id: number;
  location_id: number;
  role_in_location?: string;
  start_date?: string; // ISO date
  notes?: string;
}

interface CostConfiguration {
  location_id: number;
  cost_type: 'arriendo' | 'servicios' | 'nomina' | 'mercancia' | 'comisiones' | 'transporte' | 'otros';
  amount: number;
  frequency: string;
  description: string;
  is_active: boolean;
  effective_date: string; // ISO date
}

interface WholesaleSaleCreate {
  customer_name: string;
  customer_document: string;
  customer_phone?: string;
  location_id: number;
  items: Array<any>;
  discount_percentage?: number;
  payment_method: string;
  notes?: string;
}

interface ReportFilter {
  location_ids?: number[];
  start_date: string; // ISO date
  end_date: string; // ISO date
  user_ids?: number[];
  product_categories?: string[];
  sale_type?: string;
}

interface InventoryAlert {
  location_id: number;
  alert_type: 'inventario_minimo' | 'stock_agotado' | 'producto_vencido';
  threshold_value: number;
  product_reference?: string;
  notification_emails: string[];
  is_active: boolean;
}

interface DiscountApproval {
  discount_request_id: number;
  approved: boolean;
  admin_notes?: string;
  max_discount_override?: number;
}

interface ProductModelAssignment {
  product_reference: string;
  assigned_warehouses: number[];
  distribution_rules?: any;
  priority_warehouse_id?: number;
  min_stock_per_warehouse?: number;
  max_stock_per_warehouse?: number;
}

interface TransferRequestComplete {
  source_location_id: number;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  purpose: string;
  pickup_type: string;
  destination_type: string;
  notes?: string;
}

interface DiscountRequestCreate {
  amount: number;
  reason: string;
}

interface ReturnRequestCreate {
  original_transfer_id: number;
  notes?: string;
}

// ========== USUARIOS ==========
// ===================== USUARIOS =====================
// Endpoints para gestión de usuarios: crear, listar, actualizar y asignar usuarios a ubicaciones.

// POST /admin/users
export const createUser = async (userData: UserCreate) => {
  const response = await fetch(`${BACKEND_URL}/admin/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

// GET /admin/users
export const fetchAllUsers = async (params?: {
  role?: string;
  location_id?: number;
  is_active?: boolean;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.append('role', params.role);
  if (params?.location_id) searchParams.append('location_id', params.location_id.toString());
  if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

  const response = await fetch(`${BACKEND_URL}/admin/users?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// PUT /admin/users/{user_id}
export const updateUser = async (userId: number, userData: UserUpdate) => {
  const response = await fetch(`${BACKEND_URL}/admin/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

// POST /admin/users/assign-location
export const assignUserToLocation = async (assignmentData: UserAssignment) => {
  const response = await fetch(`${BACKEND_URL}/admin/users/assign-location`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(assignmentData),
  });
  return handleResponse(response);
};

// ========== UBICACIONES ==========
// ===================== UBICACIONES =====================
// Endpoints para gestión de ubicaciones: listar locales/bodegas y obtener estadísticas por ubicación.

// GET /admin/locations
export const fetchAllLocations = async (locationType?: 'local' | 'bodega') => {
  const searchParams = new URLSearchParams();
  if (locationType) searchParams.append('location_type', locationType);

  const response = await fetch(`${BACKEND_URL}/admin/locations?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /admin/locations/{location_id}/stats
export const fetchLocationStats = async (locationId: number, startDate: string, endDate: string) => {
  const searchParams = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(`${BACKEND_URL}/admin/locations/${locationId}/stats?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== COSTOS ==========
// ===================== COSTOS =====================
// Endpoints para gestión de costos: crear y listar costos por localización y tipo.

// POST /admin/costs
export const createCostConfiguration = async (costData: CostConfiguration) => {
  const response = await fetch(`${BACKEND_URL}/admin/costs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(costData),
  });
  return handleResponse(response);
};

// GET /admin/costs
export const fetchAllCosts = async (params?: {
  location_id?: number;
  cost_type?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.location_id) searchParams.append('location_id', params.location_id.toString());
  if (params?.cost_type) searchParams.append('cost_type', params.cost_type);

  const response = await fetch(`${BACKEND_URL}/admin/costs?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== VENTAS AL POR MAYOR ==========
// ===================== VENTAS AL POR MAYOR =====================
// Endpoints para ventas al por mayor: registrar y listar órdenes de venta mayoreo.

// POST /admin/wholesale-sales
export const createWholesaleSale = async (saleData: WholesaleSaleCreate) => {
  const response = await fetch(`${BACKEND_URL}/admin/wholesale-sales`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(saleData),
  });
  return handleResponse(response);
};

// GET /admin/wholesale-orders (manteniendo compatibilidad con el código existente)
export const fetchAllWholesaleOrders = async () => {
  const response = await fetch(`${BACKEND_URL}/admin/wholesale-orders`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== REPORTES ==========
// ===================== REPORTES =====================
// Endpoints para generación de reportes de ventas por filtros avanzados.

// POST /admin/reports/sales
export const generateSalesReport = async (reportFilter: ReportFilter) => {
  const response = await fetch(`${BACKEND_URL}/admin/reports/sales`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(reportFilter),
  });
  return handleResponse(response);
};

// ========== ALERTAS DE INVENTARIO ==========
// ===================== ALERTAS DE INVENTARIO =====================
// Endpoints para crear alertas de inventario (stock bajo, producto vencido, etc).

// POST /admin/inventory-alerts
export const createInventoryAlert = async (alertData: InventoryAlert) => {
  const response = await fetch(`${BACKEND_URL}/admin/inventory-alerts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(alertData),
  });
  return handleResponse(response);
};

// ========== DESCUENTOS ==========
// ===================== DESCUENTOS =====================
// Endpoints para gestión de descuentos: solicitudes pendientes y aprobación/rechazo.

// GET /admin/discount-requests/pending
export const fetchPendingDiscountRequests = async () => {
  const response = await fetch(`${BACKEND_URL}/admin/discount-requests/pending`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// POST /admin/discount-requests/approve
export const approveDiscountRequest = async (approvalData: DiscountApproval) => {
  const response = await fetch(`${BACKEND_URL}/admin/discount-requests/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(approvalData),
  });
  return handleResponse(response);
};

// ========== TRANSFERENCIAS ==========
// ===================== TRANSFERENCIAS =====================
// Endpoints para obtener resumen de transferencias realizadas.

// GET /admin/transfers/overview
export const fetchTransfersOverview = async () => {
  const response = await fetch(`${BACKEND_URL}/admin/transfers/overview`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== PERFORMANCE ==========
// ===================== PERFORMANCE =====================
// Endpoints para obtener métricas de desempeño de usuarios por fechas y rol.

// GET /admin/performance/users
export const fetchUserPerformance = async (params: {
  start_date: string;
  end_date: string;
  user_ids?: number[];
  role?: string;
}) => {
  const searchParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  
  if (params.user_ids?.length) {
    params.user_ids.forEach(id => searchParams.append('user_ids', id.toString()));
  }
  if (params.role) searchParams.append('role', params.role);

  const response = await fetch(`${BACKEND_URL}/admin/performance/users?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== ASIGNACIÓN DE MODELOS ==========
// ===================== ASIGNACIÓN DE MODELOS =====================
// Endpoints para asignar modelos de producto a bodegas y reglas de distribución.

// POST /admin/product-assignments
export const createProductAssignment = async (assignmentData: ProductModelAssignment) => {
  const response = await fetch(`${BACKEND_URL}/admin/product-assignments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(assignmentData),
  });
  return handleResponse(response);
};

// ========== DASHBOARD ==========
// ===================== DASHBOARD =====================
// Endpoints para obtener el resumen y métricas detalladas del dashboard de administrador.

// GET /admin/dashboard
export const fetchAdminDashboard = async () => {
  const response = await fetch(`${BACKEND_URL}/admin/dashboard`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /admin/dashboard/metrics
export const fetchDashboardMetrics = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/api/v1/admin/dashboard/metrics`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== INVENTARIO POR VIDEO IA ==========
// ===================== INVENTARIO POR VIDEO IA =====================
// Endpoints para registrar inventario usando video y datos asociados.

// POST /admin/inventory/video-entry
export const createVideoInventoryEntry = async (inventoryData: {
  warehouse_location_id: number;
  estimated_quantity: number;
  product_brand?: string;
  product_model?: string;
  expected_sizes?: string;
  notes?: string;
  video_file: File;
}) => {
  const formData = new FormData();
  formData.append('warehouse_location_id', inventoryData.warehouse_location_id.toString());
  formData.append('estimated_quantity', inventoryData.estimated_quantity.toString());
  
  if (inventoryData.product_brand) {
    formData.append('product_brand', inventoryData.product_brand);
  }
  if (inventoryData.product_model) {
    formData.append('product_model', inventoryData.product_model);
  }
  if (inventoryData.expected_sizes) {
    formData.append('expected_sizes', inventoryData.expected_sizes);
  }
  if (inventoryData.notes) {
    formData.append('notes', inventoryData.notes);
  }
  
  formData.append('video_file', inventoryData.video_file);

  const response = await fetch(`${BACKEND_URL}/admin/inventory/video-entry`, {
    method: 'POST',
    headers: getFormDataHeaders(),
    body: formData,
  });
  return handleResponse(response);
};

// ========== ENDPOINTS ADICIONALES (de la primera solicitud) ==========
// ===================== VENTAS Y GASTOS DIARIOS =====================
// Endpoints para obtener ventas y gastos diarios, registrar gastos y ventas pendientes de confirmación.

// VENTAS
// ===================== TRANSFERENCIAS Y DEVOLUCIONES =====================
// Endpoints para solicitar transferencias, descuentos, devoluciones y gestionar notificaciones relacionadas.
export const fetchTodaySales = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/sales/today`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const fetchPendingConfirmationSales = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/sales/pending-confirmation`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GASTOS
export const createExpense = async (expenseData: {
  concept: string;
  amount: number;
  notes?: string;
  receipt_image?: File;
}) => {
  const formData = new FormData();
  formData.append('concept', expenseData.concept);
  formData.append('amount', expenseData.amount.toString());
  
  if (expenseData.notes) {
    formData.append('notes', expenseData.notes);
  }
  
  if (expenseData.receipt_image) {
    formData.append('receipt_image', expenseData.receipt_image);
  }

  const response = await fetch(`${BACKEND_URL}/api/v1/expenses/create`, {
    method: 'POST',
    headers: getFormDataHeaders(),
    body: formData,
  });
  return handleResponse(response);
};

export const fetchTodayExpenses = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/expenses/today`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// TRANSFERENCIAS
export const requestTransfer = async (transferData: TransferRequestComplete) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/transfers/request`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ transfer_data: transferData }),
  });
  return handleResponse(response);
};

export const fetchMyTransferRequests = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/transfers/my-requests`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// DESCUENTOS (solicitudes individuales)
export const requestDiscount = async (discountData: DiscountRequestCreate) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/discounts/request`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ discount_data: discountData }),
  });
  return handleResponse(response);
};

export const fetchMyDiscountRequests = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/discounts/my-requests`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// DEVOLUCIONES
export const requestReturn = async (returnData: ReturnRequestCreate) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/returns/request`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ return_data: returnData }),
  });
  return handleResponse(response);
};

export const fetchReturnNotifications = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/notifications/returns`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const markReturnNotificationAsRead = async (notificationId: number) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/notifications/returns/${notificationId}/mark-read`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(response);
};