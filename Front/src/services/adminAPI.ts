const BACKEND_URL = 'https://tustockya-api.onrender.com/api/v1/admin/admin';

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

interface WholesaleSaleCreate {
  customer_name: string;
  customer_document: string;
  customer_phone?: string;
  location_id: number;
  items: Array<{
    reference_code: string;
    quantity: number;
    unit_price: number;
  }>;
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
  sale_type?: 'detalle' | 'mayor';
}

interface InventoryAlert {
  location_id: number;
  alert_type: 'inventario_minimo' | 'stock_agotado' | 'producto_vencido';
  threshold_value: number;
  product_reference?: string;
  notification_emails: string[];
  is_active?: boolean;
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

interface AdminLocationAssignmentCreate {
  admin_id: number;
  location_id: number;
  notes?: string;
}

interface AdminLocationAssignmentBulk {
  admin_id: number;
  location_ids: number[];
  notes?: string;
}

// ========== GESTIÓN DE USUARIOS ==========

// POST /api/v1/admin/admin/users
export const createUser = async (userData: UserCreate) => {
  const response = await fetch(`${BACKEND_URL}/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/users
export const fetchAllUsers = async (params?: {
  role?: 'vendedor' | 'bodeguero' | 'corredor';
  location_id?: number;
  is_active?: boolean;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.append('role', params.role);
  if (params?.location_id) searchParams.append('location_id', params.location_id.toString());
  if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

  const response = await fetch(`${BACKEND_URL}/users?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// PUT /api/v1/admin/admin/users/{user_id}
export const updateUser = async (userId: number, userData: UserUpdate) => {
  const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/users/assign-location
export const assignUserToLocation = async (assignmentData: UserAssignment) => {
  const response = await fetch(`${BACKEND_URL}/users/assign-location`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(assignmentData),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/available-locations-for-users
export const fetchAvailableLocationsForUsers = async (role?: 'vendedor' | 'bodeguero' | 'corredor') => {
  const searchParams = new URLSearchParams();
  if (role) searchParams.append('role', role);

  const response = await fetch(`${BACKEND_URL}/available-locations-for-users?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== GESTIÓN DE UBICACIONES ==========

// GET /api/v1/admin/admin/locations
export const fetchAllLocations = async (locationType?: 'local' | 'bodega') => {
  const searchParams = new URLSearchParams();
  if (locationType) searchParams.append('location_type', locationType);

  const response = await fetch(`${BACKEND_URL}/locations?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/locations/{location_id}/stats
export const fetchLocationStats = async (locationId: number, startDate: string, endDate: string) => {
  const searchParams = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(`${BACKEND_URL}/locations/${locationId}/stats?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/my-locations
export const fetchMyAssignedLocations = async () => {
  const response = await fetch(`${BACKEND_URL}/my-locations`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/can-manage-location/{location_id}
export const canManageLocation = async (locationId: number) => {
  const response = await fetch(`${BACKEND_URL}/can-manage-location/${locationId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== ASIGNACIONES DE ADMINISTRADORES (Solo BOSS) ==========

// POST /api/v1/admin/admin/admin-assignments
export const assignAdminToLocation = async (assignmentData: AdminLocationAssignmentCreate) => {
  const response = await fetch(`${BACKEND_URL}/admin-assignments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(assignmentData),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/admin-assignments
export const fetchAdminAssignments = async (adminId?: number) => {
  const searchParams = new URLSearchParams();
  if (adminId) searchParams.append('admin_id', adminId.toString());

  const response = await fetch(`${BACKEND_URL}/admin-assignments?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/admin-assignments/bulk
export const assignAdminToMultipleLocations = async (assignmentData: AdminLocationAssignmentBulk) => {
  const response = await fetch(`${BACKEND_URL}/admin-assignments/bulk`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(assignmentData),
  });
  return handleResponse(response);
};

// DELETE /api/v1/admin/admin/admin-assignments/{admin_id}/{location_id}
export const removeAdminAssignment = async (adminId: number, locationId: number) => {
  const response = await fetch(`${BACKEND_URL}/admin-assignments/${adminId}/${locationId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/available-admins
export const fetchAvailableAdministrators = async () => {
  const response = await fetch(`${BACKEND_URL}/available-admins`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/unassigned-locations
export const fetchUnassignedLocations = async () => {
  const response = await fetch(`${BACKEND_URL}/unassigned-locations`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== VENTAS Y DESCUENTOS ==========

// POST /api/v1/admin/admin/wholesale-sales
export const createWholesaleSale = async (saleData: WholesaleSaleCreate) => {
  const response = await fetch(`${BACKEND_URL}/wholesale-sales`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(saleData),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/discount-requests/pending
export const fetchPendingDiscountRequests = async () => {
  const response = await fetch(`${BACKEND_URL}/discount-requests/pending`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/discount-requests/approve
export const approveDiscountRequest = async (approvalData: DiscountApproval) => {
  const response = await fetch(`${BACKEND_URL}/discount-requests/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(approvalData),
  });
  return handleResponse(response);
};

// ========== REPORTES Y ANALYTICS ==========

// POST /api/v1/admin/admin/reports/sales
export const generateSalesReport = async (reportFilter: ReportFilter) => {
  const response = await fetch(`${BACKEND_URL}/reports/sales`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(reportFilter),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/performance/users
export const fetchUserPerformance = async (params: {
  start_date: string;
  end_date: string;
  user_ids?: number[];
  role?: 'vendedor' | 'bodeguero' | 'corredor';
}) => {
  const searchParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  
  if (params.user_ids?.length) {
    params.user_ids.forEach(id => searchParams.append('user_ids', id.toString()));
  }
  if (params.role) searchParams.append('role', params.role);

  const response = await fetch(`${BACKEND_URL}/performance/users?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/transfers/overview
export const fetchTransfersOverview = async () => {
  const response = await fetch(`${BACKEND_URL}/transfers/overview`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== GESTIÓN DE INVENTARIO ==========

// POST /api/v1/admin/admin/inventory/video-entry
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

  const response = await fetch(`${BACKEND_URL}/inventory/video-entry`, {
    method: 'POST',
    headers: getFormDataHeaders(),
    body: formData,
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/inventory/video-entries
export const fetchVideoProcessingHistory = async (params?: {
  limit?: number;
  status?: string;
  warehouse_id?: number;
  date_from?: string;
  date_to?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.status) searchParams.append('status', params.status);
  if (params?.warehouse_id) searchParams.append('warehouse_id', params.warehouse_id.toString());
  if (params?.date_from) searchParams.append('date_from', params.date_from);
  if (params?.date_to) searchParams.append('date_to', params.date_to);

  const response = await fetch(`${BACKEND_URL}/inventory/video-entries?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/inventory/video-entries/{video_id}
export const fetchVideoProcessingDetails = async (videoId: number) => {
  const response = await fetch(`${BACKEND_URL}/inventory/video-entries/${videoId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/product-assignments
export const createProductAssignment = async (assignmentData: ProductModelAssignment) => {
  const response = await fetch(`${BACKEND_URL}/product-assignments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(assignmentData),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/product-assignments
export const fetchProductAssignments = async (params?: {
  product_reference?: string;
  warehouse_id?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.product_reference) searchParams.append('product_reference', params.product_reference);
  if (params?.warehouse_id) searchParams.append('warehouse_id', params.warehouse_id.toString());

  const response = await fetch(`${BACKEND_URL}/product-assignments?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== CONFIGURACIÓN Y ALERTAS ==========

// GET /api/v1/admin/admin/costs
export const fetchAllCosts = async (params?: {
  location_id?: number;
  cost_type?: 'arriendo' | 'servicios' | 'nomina' | 'mercancia' | 'comisiones' | 'transporte' | 'otros';
}) => {
  const searchParams = new URLSearchParams();
  if (params?.location_id) searchParams.append('location_id', params.location_id.toString());
  if (params?.cost_type) searchParams.append('cost_type', params.cost_type);

  const response = await fetch(`${BACKEND_URL}/costs?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/inventory-alerts
export const createInventoryAlert = async (alertData: InventoryAlert) => {
  const response = await fetch(`${BACKEND_URL}/inventory-alerts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(alertData),
  });
  return handleResponse(response);
};

// ========== DASHBOARD Y MÉTRICAS ==========

// GET /api/v1/admin/admin/dashboard
export const fetchAdminDashboard = async () => {
  const response = await fetch(`${BACKEND_URL}/dashboard`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/dashboard/metrics
export const fetchDashboardMetrics = async () => {
  const response = await fetch(`${BACKEND_URL}/dashboard/metrics`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/statistics
export const fetchAdminStatistics = async () => {
  const response = await fetch(`${BACKEND_URL}/statistics`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== SISTEMA Y DIAGNÓSTICO ==========

// GET /api/v1/admin/admin/health
export const fetchAdminModuleHealth = async () => {
  const response = await fetch(`${BACKEND_URL}/health`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/system/overview
export const fetchSystemOverview = async () => {
  const response = await fetch(`${BACKEND_URL}/system/overview`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/system/init-additional-tables
export const initializeAdditionalTables = async () => {
  const response = await fetch(`${BACKEND_URL}/system/init-additional-tables`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/diagnosis/microservice-connection
export const testMicroserviceConnection = async () => {
  const response = await fetch(`${BACKEND_URL}/diagnosis/microservice-connection`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/diagnosis/job-logs/{job_id}
export const fetchJobLogs = async (jobId: number) => {
  const response = await fetch(`${BACKEND_URL}/diagnosis/job-logs/${jobId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/video-jobs/{job_id}/status
export const fetchVideoJobStatus = async (jobId: number) => {
  const response = await fetch(`${BACKEND_URL}/video-jobs/${jobId}/status`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};