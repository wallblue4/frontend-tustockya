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
    // CRÍTICO: NO incluir Content-Type para FormData
    // El navegador debe configurar automáticamente:
    // Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
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
  start_date?: string;
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
  start_date: string;
  end_date: string;
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

// ========== INTERFACES DE COSTOS ==========

interface CostConfigurationCreate {
  location_id: number;
  cost_type: 'arriendo' | 'servicios' | 'nomina' | 'mercancia' | 'comisiones' | 'transporte' | 'otros';
  amount: number | string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  description: string;
  start_date: string;
  end_date?: string;
}

interface CostConfigurationUpdate {
  amount?: number | string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  description?: string;
  is_active?: boolean;
  end_date?: string;
}

interface UpdateAmountRequest {
  new_amount: number | string;
  effective_date: string;
  reason?: string;
}

interface CostPaymentCreate {
  cost_configuration_id: number;
  due_date: string;
  payment_amount: number | string;
  payment_date: string;
  payment_method: string;
  payment_reference?: string;
  notes?: string;
}

// ========== 1. GESTIÓN DE USUARIOS (5 endpoints) ==========

// POST /api/v1/admin/admin/users
export const createUser = async (userData: UserCreate) => {
  // location_id debe ser número o undefined
  const payload = {
    email: userData.email,
    password: userData.password,
    first_name: userData.first_name,
    last_name: userData.last_name,
    role: userData.role,
    location_id: typeof userData.location_id === 'string' ? parseInt(userData.location_id) : userData.location_id
  };
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/users
export const fetchManagedUsers = async (params?: {
  role?: 'vendedor' | 'bodeguero' | 'corredor';
  location_id?: number;
  is_active?: boolean;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.append('role', params.role);
  if (params?.location_id) searchParams.append('location_id', params.location_id.toString());
  if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/users?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/available-locations-for-users
export const fetchAvailableLocationsForUsers = async (role?: 'vendedor' | 'bodeguero' | 'corredor') => {
  const searchParams = new URLSearchParams();
  if (role) searchParams.append('role', role);

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/available-locations-for-users?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// PUT /api/v1/admin/admin/users/{user_id}
export const updateUser = async (userId: number, userData: UserUpdate) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/users/assign-location
export const assignUserToLocation = async (assignmentData: UserAssignment) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/users/assign-location`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(assignmentData),
  });
  return handleResponse(response);
};

// ========== 2. GESTIÓN DE UBICACIONES (2 endpoints) ==========

// GET /api/v1/admin/admin/locations
export const fetchManagedLocations = async (locationType?: 'local' | 'bodega') => {
  const searchParams = new URLSearchParams();
  if (locationType) searchParams.append('location_type', locationType);

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/locations?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/locations/{location_id}/stats
export const fetchLocationStatistics = async (locationId: number, startDate: string, endDate: string) => {
  const searchParams = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/locations/${locationId}/stats?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 3. GESTIÓN DE COSTOS (14 endpoints) ==========

// POST /api/v1/admin/admin/costs - Crear configuración de costo
export const createCostConfiguration = async (costData: CostConfigurationCreate) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(costData),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/costs - Obtener configuraciones
export const fetchCostConfigurations = async (params?: {
  location_id?: number;
  cost_type?: 'arriendo' | 'servicios' | 'nomina' | 'mercancia' | 'comisiones' | 'transporte' | 'otros';
}) => {
  const searchParams = new URLSearchParams();
  if (params?.location_id) searchParams.append('location_id', params.location_id.toString());
  if (params?.cost_type) searchParams.append('cost_type', params.cost_type);

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/costs/operational-dashboard - Dashboard operativo
export const fetchOperationalDashboard = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/operational-dashboard`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/costs/{cost_id} - Obtener configuración específica
export const fetchCostConfiguration = async (costId: number) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/${costId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// PUT /api/v1/admin/admin/costs/{cost_id} - Actualizar configuración
export const updateCostConfiguration = async (costId: number, costData: CostConfigurationUpdate) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/${costId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(costData),
  });
  return handleResponse(response);
};

// DELETE /api/v1/admin/admin/costs/{cost_id} - Eliminar configuración
export const deleteCostConfiguration = async (costId: number, forceDelete?: boolean) => {
  const searchParams = new URLSearchParams();
  if (forceDelete !== undefined) searchParams.append('force_delete', forceDelete.toString());

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/${costId}?${searchParams.toString()}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// PATCH /api/v1/admin/admin/costs/{cost_id}/update-amount - Actualizar monto
export const updateCostAmount = async (costId: number, updateData: UpdateAmountRequest) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/${costId}/update-amount`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updateData),
  });
  return handleResponse(response);
};

// PATCH /api/v1/admin/admin/costs/{cost_id}/deactivate - Desactivar configuración
export const deactivateCostConfiguration = async (costId: number, endDate?: string) => {
  const searchParams = new URLSearchParams();
  if (endDate) searchParams.append('end_date', endDate);

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/${costId}/deactivate?${searchParams.toString()}`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/costs/payments - Registrar pago
export const createCostPayment = async (paymentData: CostPaymentCreate) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/payments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(paymentData),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/costs/locations/{location_id}/dashboard - Dashboard por ubicación
export const fetchLocationCostDashboard = async (locationId: number) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/locations/${locationId}/dashboard`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/costs/{cost_id}/deletion-analysis - Análisis de eliminación
export const fetchCostDeletionAnalysis = async (costId: number) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/${costId}/deletion-analysis`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/costs/alerts/overdue - Alertas vencidas
export const fetchOverdueAlerts = async (locationId?: number) => {
  const searchParams = new URLSearchParams();
  if (locationId) searchParams.append('location_id', locationId.toString());

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/alerts/overdue?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/costs/upcoming-payments - Pagos próximos
export const fetchUpcomingPayments = async (daysAhead: number = 7, locationId?: number) => {
  const searchParams = new URLSearchParams();
  searchParams.append('days_ahead', daysAhead.toString());
  if (locationId) searchParams.append('location_id', locationId.toString());

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/upcoming-payments?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/costs/health - Estado del módulo
export const fetchCostsModuleHealth = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/costs/health`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 4. VENTAS AL POR MAYOR (1 endpoint) ==========

// POST /api/v1/admin/admin/wholesale-sales
export const processWholesaleSale = async (saleData: WholesaleSaleCreate) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/wholesale-sales`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(saleData),
  });
  return handleResponse(response);
};

// ========== 5. REPORTES (1 endpoint) ==========

// POST /api/v1/admin/admin/reports/sales
export const generateSalesReports = async (reportFilter: ReportFilter) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/reports/sales`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(reportFilter),
  });
  return handleResponse(response);
};

// ========== 6. ALERTAS DE INVENTARIO (1 endpoint) ==========

// POST /api/v1/admin/admin/inventory-alerts
export const configureInventoryAlert = async (alertData: InventoryAlert) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/inventory-alerts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(alertData),
  });
  return handleResponse(response);
};

// ========== 7. DESCUENTOS (2 endpoints) ==========

// GET /api/v1/admin/admin/discount-requests/pending
export const fetchPendingDiscountRequests = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/discount-requests/pending`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/discount-requests/approve
export const approveDiscountRequest = async (approvalData: DiscountApproval) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/discount-requests/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(approvalData),
  });
  return handleResponse(response);
};

// ========== 8. TRANSFERENCIAS (1 endpoint) ==========

// GET /api/v1/admin/admin/transfers/overview
export const fetchTransfersOverview = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/transfers/overview`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 9. PERFORMANCE (1 endpoint) ==========

// GET /api/v1/admin/admin/performance/users
export const fetchUsersPerformance = async (params: {
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

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/performance/users?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 10. ASIGNACIÓN DE PRODUCTOS (2 endpoints) ==========

// POST /api/v1/admin/admin/product-assignments
export const assignProductModelToWarehouses = async (assignmentData: ProductModelAssignment) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/product-assignments`, {
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

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/product-assignments?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 11. DASHBOARD (2 endpoints) ==========

// GET /api/v1/admin/admin/dashboard
export const fetchAdminDashboard = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/dashboard`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/dashboard/metrics
export const fetchDashboardMetrics = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/dashboard/metrics`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 12. SISTEMA (4 endpoints) ==========

// GET /api/v1/admin/admin/health
export const fetchAdminModuleHealth = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/health`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/statistics
export const fetchAdminStatistics = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/statistics`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/system/init-additional-tables
export const initializeAdditionalTables = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/system/init-additional-tables`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/system/overview
export const fetchSystemOverview = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/system/overview`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 13. INVENTARIO POR VIDEO IA (4 endpoints) ==========

// POST /api/v1/admin/admin/inventory/video-entry
export const processVideoInventoryEntry = async (inventoryData: {
  warehouse_location_id: number;
  size_quantities_json: string; // JSON de tallas y cantidades
  unit_price: number;
  video_file: File;
  product_brand?: string | null;
  product_model?: string | null;
  box_price?: number | null;
  notes?: string | null;
  reference_image?: File | null;
}) => {
  const formData = new FormData();
  
  // ORDEN EXACTO según el curl correcto:
  
  // 1. warehouse_location_id (obligatorio)
  formData.append('warehouse_location_id', inventoryData.warehouse_location_id.toString());
  
  // 2. size_quantities_json (obligatorio)
  formData.append('size_quantities_json', inventoryData.size_quantities_json);
  
  // 3. product_brand (opcional pero siempre presente)
  const productBrand = inventoryData.product_brand?.trim() || '';
  formData.append('product_brand', productBrand);
  
  // 4. product_model (opcional pero siempre presente)
  const productModel = inventoryData.product_model?.trim() || '';
  formData.append('product_model', productModel);
  
  // 5. notes (opcional pero siempre presente)
  const notes = inventoryData.notes?.trim() || '';
  formData.append('notes', notes);
  
  // 6. reference_image (siempre presente)
  if (inventoryData.reference_image && inventoryData.reference_image instanceof File) {
    formData.append('reference_image', inventoryData.reference_image);
  } else {
    // Crear un archivo vacío pequeño en lugar de blob vacío
    const emptyFile = new File([''], 'empty.jpg', { type: 'image/jpeg' });
    formData.append('reference_image', emptyFile);
  }
  
  // 7. video_file (obligatorio)
  formData.append('video_file', inventoryData.video_file);
  
  // 8. unit_price (obligatorio)
  formData.append('unit_price', inventoryData.unit_price.toString());
  
  // 9. box_price (opcional pero siempre presente)
  const boxPrice = inventoryData.box_price || 0;
  formData.append('box_price', boxPrice.toString());

  // Log detallado de lo que se está enviando (en orden de envío)
  console.log('=== PAYLOAD COMPLETO PARA API (ORDEN CORRECTO) ===');
  console.log('1. warehouse_location_id:', inventoryData.warehouse_location_id);
  console.log('2. size_quantities_json:', inventoryData.size_quantities_json);
  console.log('3. product_brand:', productBrand || '(vacío)');
  console.log('4. product_model:', productModel || '(vacío)');
  console.log('5. notes:', notes || '(vacío)');
  if (inventoryData.reference_image && inventoryData.reference_image instanceof File) {
    console.log('6. reference_image: File presente -', inventoryData.reference_image.name, inventoryData.reference_image.size, 'bytes');
  } else {
    console.log('6. reference_image: Archivo vacío (no se tomó foto)');
  }
  console.log('7. video_file (size):', inventoryData.video_file.size, 'bytes');
  console.log('7. video_file (type):', inventoryData.video_file.type);
  console.log('8. unit_price:', inventoryData.unit_price);
  console.log('9. box_price:', boxPrice);
  
  // Log de FormData contents
  console.log('=== FORMDATA CONTENTS ===');
  const expectedFields = [
    'warehouse_location_id', 'size_quantities_json', 'product_brand', 
    'product_model', 'notes', 'reference_image', 'video_file', 
    'unit_price', 'box_price'
  ];
  
  const actualFields = [];
  for (let [key, value] of formData.entries()) {
    actualFields.push(key);
    if (value instanceof File) {
      console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
    } else {
      console.log(`${key}: ${value}`);
    }
  }
  
  // Verificar que todos los campos esperados estén presentes
  const missingFields = expectedFields.filter(field => !actualFields.includes(field));
  const extraFields = actualFields.filter(field => !expectedFields.includes(field));
  
  console.log('Campos esperados:', expectedFields.length);
  console.log('Campos actuales:', actualFields.length);
  if (missingFields.length > 0) {
    console.error('⚠️  CAMPOS FALTANTES:', missingFields);
  }
  if (extraFields.length > 0) {
    console.warn('⚠️  CAMPOS EXTRA:', extraFields);
  }
  if (missingFields.length === 0 && extraFields.length === 0) {
    console.log('✅ TODOS LOS CAMPOS ESTÁN PRESENTES');
  }
  console.log('================================');

  // Preparar headers mínimos (SOLO Authorization)
  const headers = getFormDataHeaders();
  console.log('=== HEADERS ENVIADOS ===');
  console.log('Headers que se enviarán:', headers);
  console.log('IMPORTANTE: Content-Type será configurado automáticamente por el navegador');
  console.log('Esto genera el curl correcto con --form en lugar de --data-raw');
  console.log('');
  console.log('Curl equivalente esperado:');
  console.log(`curl --location '${BACKEND_URL}/api/v1/admin/admin/inventory/video-entry' \\`);
  console.log(`--header 'Authorization: Bearer ${headers.Authorization?.replace('Bearer ', '')}' \\`);
  console.log(`--form 'warehouse_location_id="${inventoryData.warehouse_location_id}"' \\`);
  console.log(`--form 'size_quantities_json="${inventoryData.size_quantities_json}"' \\`);
  console.log(`--form 'product_brand="${productBrand}"' \\`);
  console.log(`--form 'product_model="${productModel}"' \\`);
  console.log(`--form 'notes="${notes}"' \\`);
  console.log(`--form 'reference_image=@file' \\`);
  console.log(`--form 'video_file=@file' \\`);
  console.log(`--form 'unit_price="${inventoryData.unit_price}"' \\`);
  console.log(`--form 'box_price="${boxPrice}"'`);
  console.log('========================');

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/inventory/video-entry`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });
  
  console.log('=== RESPUESTA DEL SERVIDOR ===');
  console.log('Status:', response.status);
  console.log('Status Text:', response.statusText);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  
  // Clonar la respuesta para poder leerla dos veces
  const responseClone = response.clone();
  const responseText = await responseClone.text();
  console.log('Response Body (raw):', responseText);
  console.log('==============================');
  
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

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/inventory/video-entries?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/inventory/video-entries/{video_id}
export const fetchVideoProcessingDetails = async (videoId: number) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/inventory/video-entries/${videoId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/video-jobs/{job_id}/status
export const fetchVideoJobStatus = async (jobId: number) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/video-jobs/${jobId}/status`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 14. WEBHOOKS Y CALLBACKS (2 endpoints) ==========

// POST /api/v1/admin/admin/video-processing-complete
export const videoProcessingCompleteWebhook = async (webhookData: {
  job_id: number;
  status: string;
  results: string;
}) => {
  const formData = new URLSearchParams();
  formData.append('job_id', webhookData.job_id.toString());
  formData.append('status', webhookData.status);
  formData.append('results', webhookData.results);

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/video-processing-complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData,
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/video-callback
export const videoProcessingCallback = async (callbackData: {
  job_id: number;
  status: string;
  results: string;
}) => {
  const formData = new URLSearchParams();
  formData.append('job_id', callbackData.job_id.toString());
  formData.append('status', callbackData.status);
  formData.append('results', callbackData.results);

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/video-callback`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData,
  });
  return handleResponse(response);
};

// ========== 15. ASIGNACIONES DE ADMINISTRADOR (5 endpoints) ==========

// POST /api/v1/admin/admin/admin-assignments
export const assignAdminToLocation = async (assignmentData: AdminLocationAssignmentCreate) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/admin-assignments`, {
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

  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/admin-assignments?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// POST /api/v1/admin/admin/admin-assignments/bulk
export const assignAdminToMultipleLocations = async (assignmentData: AdminLocationAssignmentBulk) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/admin-assignments/bulk`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(assignmentData),
  });
  return handleResponse(response);
};

// DELETE /api/v1/admin/admin/admin-assignments/{admin_id}/{location_id}
export const removeAdminAssignment = async (adminId: number, locationId: number) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/admin-assignments/${adminId}/${locationId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/my-locations
export const fetchMyAssignedLocations = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/my-locations`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 16. UTILIDADES ADMINISTRATIVAS (4 endpoints) ==========

// GET /api/v1/admin/admin/can-manage-location/{location_id}
export const canManageLocation = async (locationId: number) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/can-manage-location/${locationId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/available-admins
export const fetchAvailableAdministrators = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/available-admins`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/unassigned-locations
export const fetchUnassignedLocations = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/unassigned-locations`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// GET /api/v1/admin/admin/diagnosis/microservice-connection
export const testMicroserviceConnection = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/diagnosis/microservice-connection`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 17. DIAGNÓSTICO (1 endpoint) ==========

// GET /api/v1/admin/admin/diagnosis/job-logs/{job_id}
export const fetchJobLogs = async (jobId: number) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/admin/diagnosis/job-logs/${jobId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};