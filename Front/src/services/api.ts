const API_BASE_URL = 'http://localhost:8001';

// Get token from localStorage
const getAuthToken = () => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return userData.token; // Assuming token is stored in user object
  }
  return null;
};

// Common headers for API requests
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Type definitions to match backend expectations
interface PaymentMethod {
  type: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
  amount: number;
  reference?: string;
}

interface SaleItem {
  sneaker_reference_code: string;
  brand: string;
  model: string;
  color?: string;
  size: string; // Backend expects string
  quantity: number;
  unit_price: number;
}

interface SaleData {
  items: SaleItem[];
  total_amount: number;
  payment_methods: PaymentMethod[];
  receipt_image?: string;
  notes?: string;
  requires_confirmation?: boolean;
}

interface SaleConfirmation {
  sale_id: number; // Backend expects number, not string
  confirmed: boolean;
  confirmation_notes?: string; // Backend expects confirmation_notes, not notes
}

interface ExpenseData {
  concept: string;
  amount: number;
  receipt_image?: string;
  notes?: string;
}

interface TransferData {
  source_location_id: number;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string; // Backend expects string
  quantity: number;
  purpose: 'exhibition' | 'sale'; // Backend expects these exact values
  pickup_type: 'vendedor' | 'corredor';
  destination_type: 'bodega' | 'exhibicion';
  notes?: string;
}

interface DiscountData {
  amount: number;
  reason: string;
}

interface ReturnData {
  original_transfer_id: number;
  notes?: string;
}



// Vendor API endpoints

// Auth API - CORREGIDO para coincidir con backend
export const authAPI = {
  login: (credentials: { email: string; password: string }) => 
    apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getCurrentUser: () => apiRequest('/api/v1/auth/me'),
};

export const vendorAPI = {
  // Dashboard
  getDashboard: () => apiRequest('/api/v1/vendor/dashboard'),
  
  // Scanning
  scanProduct: (imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return apiRequest('/api/v1/classify/scan', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      body: formData,
    });
  },
  
  // Sales - CORREGIDO para coincidir con backend
  createSale: (saleData: SaleData) => apiRequest('/api/v1/sales/create', {
    method: 'POST',
    body: JSON.stringify(saleData),
  }),
  getTodaySales: () => apiRequest('/api/v1/sales/today'),
  getPendingConfirmation: () => apiRequest('/api/v1/sales/pending-confirmation'),
  
  // CORREGIDO: Backend espera { sale_id: number, confirmed: boolean, confirmation_notes?: string }
  confirmSale: (saleId: number, confirmed: boolean, confirmationNotes?: string) => 
    apiRequest('/api/v1/sales/confirm', {
      method: 'POST',
      body: JSON.stringify({ 
        sale_id: saleId, // number, no string
        confirmed: confirmed, // boolean requerido
        confirmation_notes: confirmationNotes // confirmation_notes, no notes
      }),
    }),
  
  // Expenses - CORREGIDO para coincidir con backend
  createExpense: (expenseData: ExpenseData) => apiRequest('/api/v1/expenses/create', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  }),
  getTodayExpenses: () => apiRequest('/api/v1/expenses/today'),
  
  // Transfers - CORREGIDO para coincidir con backend
  getLocations: () => apiRequest('/api/v1/locations'),
  requestTransfer: (transferData: TransferData) => apiRequest('/api/v1/transfers/request', {
    method: 'POST',
    body: JSON.stringify(transferData),
  }),
  getMyTransferRequests: () => apiRequest('/api/v1/transfers/my-requests'),
  
  // Discounts - CORREGIDO para coincidir con backend
  requestDiscount: (discountData: DiscountData) => 
    apiRequest('/api/v1/discounts/request', {
      method: 'POST',
      body: JSON.stringify(discountData),
    }),
  getMyDiscountRequests: () => apiRequest('/api/v1/discounts/my-requests'),
  
  // Returns - CORREGIDO para coincidir con backend
  requestReturn: (returnData: ReturnData) => 
    apiRequest('/api/v1/returns/request', {
      method: 'POST',
      body: JSON.stringify(returnData),
    }),
  
  // Notifications
  getReturnNotifications: () => apiRequest('/api/v1/notifications/returns'),
  markReturnAsRead: (notificationId: string) => apiRequest(`/api/v1/notifications/returns/${notificationId}/mark-read`, {
    method: 'POST',
  }),
  
  // Admin - CORREGIDO para coincidir con backend
  createTestData: () => apiRequest('/api/v1/admin/create-test-data', {
    method: 'POST',
  }),
};



// Health Check API - CORREGIDO para coincidir con backend
export const healthAPI = {
  healthCheck: () => apiRequest('/health'),
  rootEndpoint: () => apiRequest('/'),
  classifyHealth: () => apiRequest('/api/v1/classify/health'),
};

// Helper function to create sale data in correct format
export const createSaleData = (
  items: SaleItem[],
  paymentMethods: PaymentMethod[],
  options: {
    receiptImage?: string;
    notes?: string;
    requiresConfirmation?: boolean;
  } = {}
): SaleData => {
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  
  return {
    items,
    total_amount: totalAmount,
    payment_methods: paymentMethods,
    receipt_image: options.receiptImage,
    notes: options.notes,
    requires_confirmation: options.requiresConfirmation || false
  };
};

// Helper function to create transfer data in correct format
export const createTransferData = (
  sneakerInfo: {
    reference_code: string;
    brand: string;
    model: string;
    size: string;
  },
  transferDetails: {
    source_location_id: number;
    quantity: number;
    purpose: 'exhibition' | 'sale';
    pickup_type: 'vendedor' | 'corredor';
    destination_type: 'bodega' | 'exhibicion';
    notes?: string;
  }
): TransferData => {
  return {
    source_location_id: transferDetails.source_location_id,
    sneaker_reference_code: sneakerInfo.reference_code,
    brand: sneakerInfo.brand,
    model: sneakerInfo.model,
    size: sneakerInfo.size, // Asegurar que sea string
    quantity: transferDetails.quantity,
    purpose: transferDetails.purpose,
    pickup_type: transferDetails.pickup_type,
    destination_type: transferDetails.destination_type,
    notes: transferDetails.notes
  };
};

// Helper function to validate payment methods sum matches total
export const validatePaymentMethods = (paymentMethods: PaymentMethod[], totalAmount: number): boolean => {
  const totalPayments = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.abs(totalPayments - totalAmount) <= 0.01; // 1 cent tolerance
};

// Format currency in Colombian Pesos
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date
export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};