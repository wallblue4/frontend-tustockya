export type UserRole = 'superuser' | 'administrador' | 'bodeguero' | 'seller' | 'corredor' | 'public';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  token?: string;
  token_type?: string;
  location_id?: number;
  // Puedes agregar location_name si lo usas en el dashboard
  location_name?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  sizes: Size[];
  images: string[];
  rating: number;
  reviews: number;
  brand: string;
  category: string;
}

export interface Size {
  size: string;
  available: number;
  location?: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  sellerId: string;
}

export interface DeliveryRequest {
  id: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  status: 'pending' | 'approved' | 'in-transit' | 'delivered';
  requester: string;
  runner?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Statistic {
  label: string;
  value: number;
  change: number;
  period: string;
}

// Interfaz para la respuesta de la API de login
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    location_id: number;
    is_active: boolean;
    location_name: string;
  };
}

// Interfaz para las credenciales de login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Tipos para el inventario
export interface InventorySize {
  size: string;
  quantity: number;
  quantity_exhibition: number;
}

export interface InventoryProduct {
  success: boolean;
  message: string;
  timestamp: string;
  product_id: number;
  reference_code: string;
  description: string;
  brand: string;
  model: string;
  color_info: string | null;
  video_url: string | null;
  image_url: string;
  total_quantity: number;
  location_name: string;
  unit_price: string;
  box_price: string;
  is_active: number;
  sizes: InventorySize[];
  created_at: string;
  updated_at: string;
}

export interface InventoryLocation {
  location_name: string;
  location_id: number;
  products: InventoryProduct[];
}

export interface InventoryResponse {
  success: boolean;
  message: string;
  locations: InventoryLocation[];
}

// Tipos para el sistema de transportes/corredores
export interface TransportLocation {
  id: number;
  name: string;
  type: 'bodega' | 'local';
  address: string;
  phone: string | null;
}

export interface AssignedTransport {
  id: number;
  status: 'courier_assigned' | 'in_transit' | 'delivered' ;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  product_image: string;
  purpose: 'cliente' | 'return';
  courier_accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  estimated_pickup_time: number | null;
  courier_notes: string | null;
  pickup_notes: string | null;
  source_location: TransportLocation;
  destination_location: TransportLocation;
}

export interface CourierStats {
  total_transports: number;
  in_progress: number;
  completed: number;
  completion_rate: number;
}

export interface MyTransportsResponse {
  success: boolean;
  message: string;
  timestamp: string;
  my_transports: AssignedTransport[];
  count: number;
  courier_stats: CourierStats;
}

// Tipos para el endpoint pending-transfers
export interface PendingTransferItem {
  id: number;
  status: 'pending' | 'accepted' | 'courier_assigned' | 'in_transit' | 'delivered' | 'completed';
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  purpose: 'cliente' | 'return';
  priority: 'high' | 'normal';
  requested_at: string;
  time_elapsed: string;
  pickup_type: 'corredor' | 'vendedor';
  next_action: string;
  product_image: string;
  courier_name: string | null;
  warehouse_keeper_name: string | null;
}

export interface PendingTransfersSummary {
  total_transfers: number;
  requiring_confirmation: number;
  urgent_items: number;
  normal_items: number;
}

export interface PendingTransfersResponse {
  success: boolean;
  message: string;
  timestamp: string;
  pending_transfers: PendingTransferItem[];
  urgent_count: number;
  normal_count: number;
  total_pending: number;
  summary: PendingTransfersSummary;
  attention_needed: PendingTransferItem[];
}