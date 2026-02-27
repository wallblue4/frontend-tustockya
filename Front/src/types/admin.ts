export type AdminView = 'dashboard' | 'users' | 'costs' | 'locations' | 'wholesale' | 'notifications' | 'reports' | 'inventory' | 'analytics' | 'transfers' | 'daily-report';

export interface DashboardData {
  admin_name: string;
  managed_locations: any[];
  daily_summary: any;
  pending_tasks: any;
  performance_overview: any;
  alerts_summary: any;
  recent_activities: any[];
}

export interface AssignedLocation {
  id: number;
  name: string;
  type: string;
}

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  assigned_locations: AssignedLocation[];
  is_active: boolean;
  created_at: string;
}

export interface AdminLocation {
  id: number;
  name: string;
  type: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  assigned_users_count: number;
  total_products: number;
  total_inventory_value: string;
}

export interface Notifications {
  discounts: any[];
  returns: any[];
  inventory: any[];
}

export interface WholesaleOrder {
  id: number;
  customer_name: string;
  customer_document: string;
  customer_phone?: string;
  location_id: number;
  location_name: string;
  total_amount: string;
  discount_amount: string;
  final_amount: string;
  payment_method: string;
  sale_date: string;
  processed_by_user_id: number;
  processed_by_name: string;
  items_count: number;
  notes: string | null;
}

export interface ProductoMayoreo {
  id: number;
  user_id: number;
  company_id: number;
  modelo: string;
  foto?: string;
  tallas?: string;
  cantidad_cajas_disponibles: number;
  pares_por_caja: number;
  precio: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VentaMayoreo {
  id: number;
  mayoreo_id: number;
  user_id: number;
  company_id: number;
  cantidad_cajas_vendidas: number;
  precio_unitario_venta: number;
  total_venta: number;
  fecha_venta: string;
  notas?: string;
  created_at: string;
  mayoreo_producto?: ProductoMayoreo;
}

export interface EstadisticasMayoreo {
  success: boolean;
  message: string;
  total_productos: number;
  total_cajas_disponibles: number;
  valor_total_inventario: number;
  total_ventas: number;
  valor_total_ventas: number;
}

export interface MetricsData {
  total_sales_today: string;
  total_sales_month: string;
  active_users: number;
  pending_transfers: number;
  low_stock_alerts: number;
  pending_discount_approvals: number;
  avg_performance_score: number;
}

export interface OperationalDashboard {
  summary: {
    total_locations: number;
    total_overdue_amount: string;
    total_upcoming_amount: string;
    critical_alerts_count: number;
  };
  locations_status: Array<{
    location_id: number;
    location_name: string;
    monthly_costs: string;
    overdue_amount: string;
    overdue_count: number;
    upcoming_count: number;
    status: 'ok' | 'attention' | 'critical';
  }>;
  critical_alerts: Array<{
    location_name: string;
    cost_type: string;
    amount: string;
    days_overdue: number;
    priority: 'low' | 'medium' | 'high';
    due_date: string;
  }>;
  upcoming_week: Array<{
    location_name: string;
    cost_type: string;
    amount: string;
    due_date: string;
    days_until_due: number;
  }>;
  monthly_summary: {
    total_monthly_costs: string;
    total_paid_this_month: string;
    total_pending_this_month: string;
  };
}
