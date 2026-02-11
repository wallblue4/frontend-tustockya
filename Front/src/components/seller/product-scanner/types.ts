export interface StockBySizeInfo {
  size: string;
  quantity_stock: number;
  quantity_exhibition: number;
  location: string;
}

export interface InventoryInfo {
  local_info: {
    location_number: number;
    location_name: string;
  };
  pricing: {
    unit_price: number;
    box_price: number;
  };
  stock_by_size: StockBySizeInfo[];
  total_stock: number;
  total_exhibition: number;
  available_sizes: string[];
  other_locations: any[];
}

export interface AvailabilityInfo {
  in_stock: boolean;
  can_sell: boolean;
  can_request_from_other_locations: boolean;
  recommended_action: string;
}

export interface ProductOption {
  id: string;
  brand: string;
  model: string;
  code: string;
  description: string;
  confidence: number;
  image?: string;
  rank: number;
  similarity_score: number;
  confidence_level: string;
  original_db_id: number;
  inventory: InventoryInfo;
  availability: AvailabilityInfo;
  color: string;
}

export interface SizeInfo {
  size: string;
  location: string;
  location_number?: number;
  location_id?: number;
  location_name?: string;
  location_type?: 'local' | 'bodega';
  storage_type: 'warehouse' | 'display';
  quantity: number;
  unit_price: number;
  box_price: number;
  total_quantity: number;
  pairs?: number;
  left_feet?: number;
  right_feet?: number;
  can_sell?: boolean;
  can_form_pair?: boolean;
  missing_foot?: 'left' | 'right' | null;
  formation_opportunities?: any[];
  suggestions?: any[];
}

export interface SelectedProductDetails {
  product: ProductOption;
  sizes: SizeInfo[];
}
