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

  // Interfaces para devoluciones - ACTUALIZADAS según especificación
  export interface ReturnRequestCreate {
    original_transfer_id: number;
    reason: 'no_sale' | 'damaged' | 'wrong_product' | 'customer_return' | 'other';
    quantity_to_return: number;
    product_condition: 'good' | 'damaged' | 'unusable';
    pickup_type: 'corredor' | 'vendedor';
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
    message: string;
    return_id: number;
    original_transfer_id: number;
    status: 'pending' | 'accepted' | 'courier_assigned' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
    pickup_type: 'corredor' | 'vendedor';
    estimated_return_time: string;
    workflow_steps: string[];
    next_action: string;
  }

  export interface ReturnAcceptResponse {
    success: boolean;
    message: string;
    request_id: number;
    status: string;
    warehouse_location: string;
    next_step: string;
  }

  export interface ReturnCourierAcceptResponse {
    success: boolean;
    message: string;
    request_id: number;
    status: string;
    pickup_location: string;
    delivery_location: string;
    estimated_pickup_time: number;
  }

  export interface ReturnPickupResponse {
    success: boolean;
    message: string;
    request_id: number;
    status: string;
    picked_up_at: string;
    destination: string;
  }

  export interface ReturnDeliveryResponse {
    success: boolean;
    message: string;
    request_id: number;
    status: string;
    delivered_at: string;
    next_step: string;
  }

  export interface ReturnReceptionResponse {
    success: boolean;
    message: string;
    return_id: number;
    original_transfer_id: number;
    received_quantity: number;
    product_condition: string;
    inventory_restored: boolean;
    warehouse_location: string;
    inventory_change: {
      product_id: number;
      product_size_id: number;
      product_reference: string;
      product_name: string;
      size: string;
      quantity_returned: number;
      quantity_before: number;
      quantity_after: number;
      location: string;
      change_type: string;
    };
  }

  export interface ReturnVendorDeliveryResponse {
    success: boolean;
    message: string;
    return_id: number;
    original_transfer_id: number;
    status: string;
    delivered_at: string;
    pickup_type: string;
    warehouse_location: string;
    product_info: {
      reference_code: string;
      brand: string;
      model: string;
      size: string;
      quantity: number;
    };
    vendor_info: {
      vendor_id: number;
      delivery_notes: string;
    };
    next_step: string;
    pending_action: {
      who: string;
      what: string;
      endpoint: string;
    };
  }