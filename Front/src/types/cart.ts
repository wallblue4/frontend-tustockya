// src/types/cart.ts

export interface CartItem {
  id: string;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  color?: string;
  size: string;
  quantity: number;
  max_stock: number;
  source_location_id: number;
  destination_location_id: number;
  location_name: string;
  unit_price: number;
  image?: string;
  pickup_type: 'vendedor' | 'corredor';
  transfer_type: 'pair' | 'left_foot' | 'right_foot';
  // Populated after submission
  transfer_id?: number;
  transfer_status?: string;
}

export interface AddItemResult {
  success: boolean;
  message: string;
}

export interface CartAddedFeedback {
  itemName: string;
  size: string;
  quantity: number;
}

export type CartPhase = 'building' | 'submitted' | 'tracking' | 'ready_to_sell';

export interface TransferCartState {
  items: CartItem[];
  phase: CartPhase;
  cartGroupId: string | null;
}

export interface TransferCartContextType {
  items: CartItem[];
  phase: CartPhase;
  cartGroupId: string | null;

  // Cart building (only in 'building' phase)
  addItem: (item: Omit<CartItem, 'id'>) => AddItemResult;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  // Submission
  submitCart: () => Promise<void>;

  // Tracking
  refreshTransferStatuses: () => Promise<void>;

  // Computed
  totalItems: number;
  totalQuantity: number;
  allTransfersCompleted: boolean;
  completedTransferIds: number[];
  pendingCount: number;
  isCartEmpty: boolean;

  // Feedback
  lastAddedFeedback: CartAddedFeedback | null;
}
