//api.ts
import { API_BASE_URL } from '../config/env'

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

// Headers for FormData requests (no Content-Type needed, browser sets it automatically)
const getFormDataHeaders = () => {
  const token = getAuthToken();
  return {
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
    console.log('API Request:', { url, method: config.method, body: config.body });
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error Response:', { status: response.status, data });
      throw new Error(data.message || JSON.stringify(data) || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// FormData API request function for sales endpoint
const apiFormDataRequest = async (endpoint: string, formData: FormData) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    method: 'POST',
    headers: getFormDataHeaders(),
    body: formData,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      const err: any = new Error(data.message || data.detail || 'API request failed');
      err.detail = data.detail || null;
      throw err;
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
  reference?: string | null;
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
  receipt_image?: File | null; // Now expects File object, not base64 string
  notes?: string;
  requires_confirmation?: boolean;
}

interface SaleConfirmation {
  sale_id: number; // Backend expects number, not string
  confirmed: boolean;
  confirmation_notes?: string; // Backend expects confirmation_notes, not notes
}

// ExpenseData interface - Ahora usando FormData directamente
// interface ExpenseData {
//   concept: string;
//   amount: number;
//   receipt_image?: File; // Ahora sería File en lugar de string
//   notes?: string;
// }

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

// NEW: Type definitions for the updated scan response structure
interface ScanBrandExtraction {
  original_brand: string;
  final_brand: string;
  extraction_method: string;
}

interface ScanReference {
  code: string;
  brand: string;
  model: string;
  color: string;
  description: string;
  photo: string;
}

interface ScanAvailabilitySummary {
  current_location: {
    has_stock: boolean;
    total_stock: number;
    available_sizes: string[];
    locations_count: number;
  };
  other_locations: {
    has_stock: boolean;
    total_stock: number;
    additional_sizes: string[];
    locations_count: number;
    can_request_transfer: boolean;
  };
  total_system: {
    total_stock: number;
    total_locations: number;
    all_available_sizes: string[];
  };
}

interface ScanAvailability {
  summary: ScanAvailabilitySummary;
  recommended_action: string;
  action_type: string;
  can_sell_now: boolean;
  can_request_transfer: boolean;
}

interface ScanLocationItem {
  location: string;
  size: string;
  quantity: number;
  location_id: number;
}

interface ScanLocations {
  current_location: ScanLocationItem[];
  other_locations: ScanLocationItem[];
  total_locations_found: number;
}

interface ScanPricing {
  unit_price: number;
  box_price: number;
  has_pricing: boolean;
}

interface ScanSuggestions {
  can_add_to_inventory: boolean;
  can_search_suppliers: boolean;
  similar_products_available: boolean;
}

interface ScanMatch {
  rank: number;
  similarity_score: number;
  confidence_percentage: number;
  confidence_level: string;
  reference: ScanReference;
  availability: ScanAvailability;
  locations: ScanLocations;
  pricing: ScanPricing;
  classification_source: string;
  inventory_source: string;
  brand_extraction: ScanBrandExtraction;
  suggestions: ScanSuggestions;
  original_db_id: number;
  image_path: string;
}

interface ScanResults {
  best_match: ScanMatch;
  alternative_matches: ScanMatch[];
  total_matches_found: number;
}

interface ScanAvailabilitySummaryResponse {
  products_available_locally: number;
  products_requiring_transfer: number;
  products_classified_only: number;
  total_locations_with_stock: number;
  can_sell_immediately: boolean;
  transfer_options_available: boolean;
  classification_successful: boolean;
}

interface ScanImageInfo {
  filename: string;
  size_bytes: number;
  content_type: string;
}

interface ScanClassificationService {
  service: string;
  url: string;
  model: string;
  total_database_matches: number;
}

interface ScanInventoryService {
  source: string;
  locations_searched: string;
  include_transfer_options: boolean;
  search_strategy: string;
}

interface ScanScannedBy {
  user_id: number;
  email: string;
  name: string;
  role: string;
  location_id: number;
}

// NEW: Complete scan response interface
export interface ScanResponse {
  success: boolean;
  scan_timestamp: string;
  scanned_by: ScanScannedBy;
  user_location: string;
  results: ScanResults;
  availability_summary: ScanAvailabilitySummaryResponse;
  processing_time_ms: number;
  image_info: ScanImageInfo;
  classification_service: ScanClassificationService;
  inventory_service: ScanInventoryService;
}

// Vendor API endpoints

// Auth API - CORREGIDO para coincidir con backend

// ESTE ES EL LOGUEO PARA LOS 3 ROLES (CORREDOR, SELLER, BODEGUERO)
/*
export const authAPI = {
  login: (credentials: { email: string; password: string }) => 
    apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getCurrentUser: () => apiRequest('/api/v1/auth/me'),                   
};
*/      

export const authAPI = {
  login: (credentials: { email: string; password: string }) => 
  apiRequest('/api/v1/auth/auth/login-json', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password
    }),
  }),
  getCurrentUser: () => apiRequest('/api/v1/auth/auth/me'),
};



export const vendorAPI = {
  // Dashboard
  getDashboard: () => {
    return apiRequest('/api/v1/vendor/dashboard')
  },
  
  // Scanning - UPDATED to return the new scan response structure
  scanProduct: (imageFile: File): Promise<ScanResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return apiFormDataRequest('/api/v1/classify/scan', formData);
  },

  // Search by brand/model text
  searchProducts: (brand: string, model: string, limit: number = 5) => {
    const params = new URLSearchParams();
    if (brand) params.append('brand', brand);
    if (model) params.append('model', model);
    params.append('limit', limit.toString());
    return apiRequest(`/api/v1/classify/search?${params.toString()}`);
  },
  
  // Sales - ACTUALIZADO para usar FormData según el endpoint
  createSale: (saleData: SaleData) => {
    const formData = new FormData();
    
    // Convert items array to JSON string
    formData.append('items', JSON.stringify(saleData.items));
    
    // Add total amount
    formData.append('total_amount', saleData.total_amount.toString());
    
    // Convert payment methods array to JSON string
    formData.append('payment_methods', JSON.stringify(saleData.payment_methods));
    
    // Add optional fields
    if (saleData.notes) {
      formData.append('notes', saleData.notes);
    }
    
    // Add requires_confirmation (default to false if not provided)
    formData.append('requires_confirmation', (saleData.requires_confirmation || false).toString());
    
    // Add receipt image if provided
    if (saleData.receipt_image) {
      formData.append('receipt_image', saleData.receipt_image);
    }
    
    return apiFormDataRequest('/api/v1/sales/create', formData);
  },
  
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
  
  // Expenses - ACTUALIZADO para usar FormData
  createExpense: (formData: FormData) => {
    console.log('API createExpense - FormData recibido:');
    // Log FormData contents for debugging
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`- ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`- ${key}: ${value}`);
      }
    }
    
    return apiFormDataRequest('/api/v1/expenses/create', formData);
  },
  getTodayExpenses: () => apiRequest('/api/v1/expenses/today'),
  
  // Transfers - CORREGIDO para coincidir con backend
  getLocations: () => apiRequest('/api/v1/locations'),
  requestTransfer: (transferData: TransferData) => apiRequest('/api/v1/transfers/request', {
    method: 'POST',
    body: JSON.stringify(transferData),
  }),
  requestSingleFoot: (singleFootData: {
    source_location_id: number;
    destination_location_id: number;
    sneaker_reference_code: string;
    size: string;
    foot_side: 'left' | 'right';
    quantity: number;
    purpose: string;
    pickup_type: string;
    notes?: string;
  }) => apiRequest('/api/v1/transfers/request-single-foot', {
    method: 'POST',
    body: JSON.stringify(singleFootData),
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

  // Warehouse: daily transfer history for the warehouse keeper
  getWarehouseDailyTransferHistory: () => apiRequest('/api/v1/warehouse/daily-transfer-history'),
  
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
    receiptImage?: File | null; // Changed from string to File
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

// NEW: Helper function to convert ScanMatch to ProductOption format (for compatibility)
export const convertScanMatchToProductOption = (match: ScanMatch, index: number = 0) => {
  return {
    id: match.original_db_id.toString(),
    brand: match.reference.brand,
    model: match.reference.model,
    code: match.reference.code,
    description: match.reference.description,
    confidence: Math.round(match.confidence_percentage),
    image: match.reference.photo || match.image_path || null,
    rank: match.rank,
    similarity_score: match.similarity_score,
    confidence_level: match.confidence_level,
    original_db_id: match.original_db_id,
    color: match.reference.color,
    // Convert new availability structure to old format for compatibility
    availability: {
      in_stock: match.availability.can_sell_now,
      can_sell: match.availability.can_sell_now,
      can_request_from_other_locations: match.availability.can_request_transfer,
      recommended_action: match.availability.recommended_action
    },
    // Convert new structure to old inventory format for compatibility
    inventory: {
      local_info: {
        location_number: 10, // From scanned_by.location_id in the example
        location_name: 'Local #10' // From user_location in the example
      },
      pricing: {
        unit_price: match.pricing.unit_price,
        box_price: match.pricing.box_price
      },
      stock_by_size: [], // No detailed size info in new structure, will be empty
      total_stock: match.availability.summary.total_system.total_stock,
      total_exhibition: 0, // Not available in new structure
      available_sizes: match.availability.summary.total_system.all_available_sizes,
      other_locations: match.locations.other_locations
    }
  };
};

// NEW: Helper function to convert full scan response to product options array
export const convertScanResponseToProductOptions = (scanResponse: ScanResponse) => {
  const options = [];
  
  // Add best match first
  if (scanResponse.results.best_match) {
    options.push(convertScanMatchToProductOption(scanResponse.results.best_match, 0));
  }
  
  // Add alternative matches
  if (scanResponse.results.alternative_matches) {
    scanResponse.results.alternative_matches.forEach((match, index) => {
      options.push(convertScanMatchToProductOption(match, index + 1));
    });
  }
  
  return options;
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