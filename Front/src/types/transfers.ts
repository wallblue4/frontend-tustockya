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

  // Interfaces para devoluciones
  export interface ReturnRequestCreate {
    original_transfer_id: number;
    notes?: string;
  }

  export interface ReturnRequest {
    id: number;
    original_transfer_id: number;
    requester_id: number;
    source_location_id: number;
    destination_location_id: number;
    sneaker_reference_code: string;
    size: string;
    quantity: number;
    notes?: string;
    requested_at: string;
    status: 'pending' | 'accepted' | 'courier_assigned' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  }

  export interface ReturnResponse {
    success: boolean;
    return_request_id: number;
    message: string;
    return_timestamp: string;
    return_details: {
      original_transfer_id: number;
      sneaker_info: {
        reference: string;
        brand: string;
        model: string;
        size: string;
        quantity: number;
      };
      return_from: string;
      return_to: string;
      original_purpose: string;
      notes?: string;
    };
    status: string;
    workflow: string;
  }