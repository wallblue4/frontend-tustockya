export type UserRole = 'superuser' | 'admin' | 'warehouse' | 'seller' | 'runner' | 'public';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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