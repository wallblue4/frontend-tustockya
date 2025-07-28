// src/types/transfers.ts
export interface TransferRequest {
    id: number;
    status: 'pending' | 'accepted' | 'courier_assigned' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
    sneaker_reference_code: string;
    brand: string;
    model: string;
    size: string;
    quantity: number;
    purpose: 'cliente' | 'restock';
    priority: 'high' | 'normal';
    requested_at: string;
    time_elapsed: string;
    next_action: string;
    courier_name?: string;
    estimated_arrival?: string;
    notes?: string;
  }
  
  export interface PendingReception {
    id: number;
    sneaker_reference_code: string;
    brand: string;
    model: string;
    size: string;
    quantity: number;
    courier_name: string;
    delivered_at: string;
    hours_since_delivery: number;
    requires_urgent_confirmation: boolean;
    delivery_notes?: string;
  }
  
  export interface Notification {
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    action?: {
      label: string;
      onClick: () => void;
    };
  }
  
  export interface PollingData {
    pending?: TransferRequest[];
    receptions?: PendingReception[];
    available?: any[];
    assigned?: any[];
    accepted?: any[];
  }