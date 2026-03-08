import type { ReactNode } from 'react';

export type WarehouseTab = 'pending' | 'accepted' | 'inventory' | 'stats' | 'returns' | 'history';

export interface PendingRequest {
  source_location_name: string;
  id: number;
  requester_name?: string;
  requester_first_name?: string;
  requester_last_name?: string;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  purpose: 'cliente' | 'restock' | 'return' | 'pair_formation';
  priority: 'high' | 'normal';
  priority_level: 'URGENT' | 'NORMAL';
  requested_at: string;
  time_waiting?: string;
  can_fulfill?: boolean;
  available_stock?: number;
  notes?: string;
  product_image?: string;
  product_price?: string;
  product_color?: string;
  request_type?: 'transfer' | 'return';
  inventory_type?: 'pair' | 'left_only' | 'right_only' | 'both_feet';
  inventory_type_label?: string;
  preparation_instruction?: string;
  urgent_action?: boolean;
  time_elapsed?: string;
  requester_info?: {
    name: string;
    email: string;
  };
  location_info?: {
    from: {
      id: number;
      name: string;
      address: string;
    };
    to: {
      id: number;
      name: string;
      address: string;
    };
  };
  product_info?: {
    image_url?: string;
    image?: string;
    unit_price: number;
    box_price: number;
    stock_available: number;
    description: string;
  };
  stock_info?: {
    can_fulfill: boolean;
    available_stock: number;
  };
}

export interface AcceptedRequest {
  id: number;
  status: 'accepted' | 'in_transit' | 'courier_assigned' | 'delivered';
  status_info?: {
    title: string;
    description: string;
    action_required: string;
    next_step: string;
    progress: number;
  };
  request_type: 'transfer' | 'return';
  request_type_display: string;
  product: {
    reference_code: string;
    brand: string;
    model: string;
    size: string;
    quantity: number;
    inventory_type: 'pair' | 'left_only' | 'right_only' | 'both_feet';
    inventory_type_label: string;
    image_url: string;
    stock_available: number;
  };
  purpose: 'cliente' | 'restock' | 'return' | 'pair_formation';
  purpose_display: string;
  urgent_action: boolean;
  pickup_type: 'corredor' | 'vendedor';
  pickup_info: {
    type: string;
    type_display: string;
    who: string;
    description: string;
    requires_courier?: boolean;
    courier_assigned?: boolean;
    courier_id?: number;
  };
  courier_info?: {
    id: number;
    name: string;
    assigned: boolean;
    status: string;
  } | null;
  requester_info: {
    id: number;
    name: string;
    role: string;
  };
  location: {
    source_id: number;
    source_name: string;
    destination_name: string;
  };
  requested_at: string;
  accepted_at: string;
  time_since_accepted: string;
  notes?: string | null;
  warehouse_notes?: string | null;

  // Campos legacy para compatibilidad
  sneaker_reference_code?: string;
  brand?: string;
  model?: string;
  size?: string;
  quantity?: number;
  product_image?: string;
  source_location_name?: string;
  destination_location_name?: string;
}

export interface TransferHistoryItem {
  inventory_type: ReactNode;
  id: number;
  status: string;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  purpose: string;
  pickup_type: string;
  requested_at: string;
  accepted_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  source_location_name?: string;
  source_location_address?: string;
  product_image?: string;
  request_type?: string;
  product_info?: {
    image_url?: string;
    brand?: string;
    model?: string;
  };
  pickup_info?: {
    type?: string;
    name?: string;
  };
  source_location?: string;
  destination_location?: string;
  requester_name?: string;
}

export interface WarehouseStats {
  totalRequests: number;
  urgentRequests: number;
  averageResponseTime: string;
  completionRate: number;
  totalStockValue: number;
}
