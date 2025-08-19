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