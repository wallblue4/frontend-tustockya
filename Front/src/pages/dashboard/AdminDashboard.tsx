import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  MapPin, 
  Package,
  Package2,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Store,
  Warehouse,
  ShoppingBag,
  Upload,
  Video,
  FileImage,
  Calendar,
  Target,
  PieChart,
  Activity,
  Building,
  Box,
  Truck,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Settings,
  Download
} from 'lucide-react';

// Import ONLY adminAPI functions
import {
  fetchAllUsers,
  fetchAllLocations,
  fetchAllCosts,
  fetchDashboardMetrics,
  fetchAdminDashboard,
  fetchAdminStatistics,
  fetchPendingDiscountRequests,
  createUser,
  updateUser,
  createWholesaleSale,
  createInventoryAlert,
  approveDiscountRequest,
  generateSalesReport,
  fetchUserPerformance,
  fetchTransfersOverview,
  createVideoInventoryEntry,
  fetchVideoProcessingHistory,
  assignUserToLocation,
  fetchAvailableLocationsForUsers,
  fetchMyAssignedLocations,
  canManageLocation
} from '../../services/adminAPI';

import { formatCurrency, formatDate, capitalize } from '../../utils/formatters';
import { LoadingSkeleton, TableSkeleton, CardSkeleton } from '../../components/admin/LoadingSkeleton';
import { ErrorState, EmptyState } from '../../components/admin/ErrorState';
import { CreateUserModal } from '../../components/admin/CreateUserModal';
import { EditUserModal } from '../../components/admin/EditUserModal';
import { CreateCostModal } from '../../components/admin/CreateCostModal';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { FullScreenCameraCapture } from '../../components/admin/FullScreenCameraCapture';

type AdminView = 'dashboard' | 'users' | 'costs' | 'locations' | 'wholesale' | 'notifications' | 'reports' | 'inventory' | 'analytics';

interface DashboardData {
  totalSales: number;
  totalExpenses: number;
  totalUsers: number;
  totalLocations: number;
  salesGrowth: number;
  expensesGrowth: number;
  recentSales: any[];
  recentExpenses: any[];
  topProducts: any[];
  lowStockProducts: any[];
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  location_name: string;
  location_id: number;
  is_active: boolean;
  created_at: string;
}

interface Cost {
  id: number;
  cost_type: string;
  amount: number;
  description: string;
  location_name: string;
  location_id: number;
  frequency: string;
  is_active: boolean;
  created_at: string;
}

interface Location {
  id: number;
  name: string;
  type: string;
  address: string;
  is_active: boolean;
}

interface Notifications {
  discounts: any[];
  returns: any[];
  inventory: any[];
}

interface WholesaleOrder {
  id: number;
  customer_name: string;
  customer_document: string;
  customer_phone?: string;
  items: Array<{
    reference_code: string;
    quantity: number;
    unit_price: number;
  }>;
  total_amount: number;
  discount_percentage?: number;
  payment_method: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  created_at: string;
  location_name: string;
  location_id: number;
}

export const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [wholesaleOrders, setWholesaleOrders] = useState<WholesaleOrder[]>([]);
  const [notifications, setNotifications] = useState<Notifications>({
    discounts: [],
    returns: [],
    inventory: []
  });

  // Modal states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showCreateCostModal, setShowCreateCostModal] = useState(false);
  const [showCreateWholesaleModal, setShowCreateWholesaleModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Filter states
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '',
    location: '',
    status: ''
  });

  const [costFilters, setCostFilters] = useState({
    search: '',
    category: '',
    location: '',
    dateFrom: '',
    dateTo: ''
  });

  const [wholesaleFilters, setWholesaleFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentView === 'users') {
      loadUsers(userFilters);
    } else if (currentView === 'costs') {
      loadCosts(costFilters);
    } else if (currentView === 'notifications') {
      loadNotifications();
    } else if (currentView === 'wholesale') {
      loadWholesaleOrders(wholesaleFilters);
    }
  }, [currentView]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        loadDashboardData(),
        loadLocations(),
        loadAvailableLocations()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Use proper adminAPI endpoints
      const [dashboardResponse, metricsResponse, statisticsResponse] = await Promise.all([
        fetchAdminDashboard(),
        fetchDashboardMetrics(),
        fetchAdminStatistics()
      ]);
      
      setDashboardData({
        totalSales: dashboardResponse.total_sales || metricsResponse.total_sales || 0,
        totalExpenses: dashboardResponse.total_expenses || metricsResponse.total_expenses || 0,
        totalUsers: dashboardResponse.total_users || metricsResponse.total_users || 0,
        totalLocations: dashboardResponse.total_locations || metricsResponse.total_locations || 0,
        salesGrowth: dashboardResponse.sales_growth || metricsResponse.sales_growth || 0,
        expensesGrowth: dashboardResponse.expenses_growth || metricsResponse.expenses_growth || 0,
        recentSales: dashboardResponse.recent_sales || [],
        recentExpenses: dashboardResponse.recent_expenses || [],
        topProducts: dashboardResponse.top_products || metricsResponse.top_products || [],
        lowStockProducts: dashboardResponse.low_stock_products || metricsResponse.low_stock_products || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty data instead of mock data
      setDashboardData({
        totalSales: 0,
        totalExpenses: 0,
        totalUsers: 0,
        totalLocations: 0,
        salesGrowth: 0,
        expensesGrowth: 0,
        recentSales: [],
        recentExpenses: [],
        topProducts: [],
        lowStockProducts: []
      });
    }
  };

  const loadUsers = async (filters = {}) => {
    try {
      const params: any = {};
      
      if (filters.role && filters.role !== '') {
        params.role = filters.role as 'vendedor' | 'bodeguero' | 'corredor';
      }
      
      if (filters.location && filters.location !== '') {
        params.location_id = parseInt(filters.location);
      }
      
      if (filters.status && filters.status !== '') {
        params.is_active = filters.status === 'active';
      }

      const response = await fetchAllUsers(params);
      setUsers(response.users || response || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadCosts = async (filters = {}) => {
    try {
      const params: any = {};
      
      if (filters.location && filters.location !== '') {
        params.location_id = parseInt(filters.location);
      }
      
      if (filters.category && filters.category !== '') {
        params.cost_type = filters.category as any;
      }

      const response = await fetchAllCosts(params);
      setCosts(response.costs || response || []);
    } catch (error) {
      console.error('Error loading costs:', error);
      setCosts([]);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await fetchAllLocations();
      setLocations(response.locations || response || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      setLocations([]);
    }
  };

  const loadAvailableLocations = async () => {
    try {
      const response = await fetchAvailableLocationsForUsers();
      setAvailableLocations(response.locations || response || []);
    } catch (error) {
      console.error('Error loading available locations:', error);
      setAvailableLocations([]);
    }
  };

  const loadWholesaleOrders = async (filters = {}) => {
    try {
      // Note: There's no fetchAllWholesaleOrders in the provided API
      // This would need to be implemented or use a different approach
      setWholesaleOrders([]);
    } catch (error) {
      console.error('Error loading wholesale orders:', error);
      setWholesaleOrders([]);
    }
  };

  const loadNotifications = async () => {
    try {
      const [discountsResponse] = await Promise.all([
        fetchPendingDiscountRequests(),
        // Note: fetchReturnNotifications is not in the provided API
        // This would need to be implemented
      ]);
      
      setNotifications({
        discounts: discountsResponse.requests || discountsResponse || [],
        returns: [], // Would need proper endpoint
        inventory: []
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications({
        discounts: [],
        returns: [],
        inventory: []
      });
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      await createUser({
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        location_id: userData.locationId ? parseInt(userData.locationId) : undefined
      });
      
      await loadUsers(userFilters);
      setShowCreateUserModal(false);
      alert('Usuario creado exitosamente');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error al crear usuario: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleUpdateUser = async (userId: number, userData: any) => {
    try {
      await updateUser(userId, {
        first_name: userData.firstName,
        last_name: userData.lastName,
        is_active: userData.isActive,
        location_id: userData.locationId ? parseInt(userData.locationId) : undefined
      });
      
      await loadUsers(userFilters);
      setEditingUser(null);
      setShowEditUserModal(false);
      alert('Usuario actualizado exitosamente');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error al actualizar usuario: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleCreateCost = async (costData: any) => {
    try {
      // Note: There's no createCostConfiguration in the provided API
      // This would need to be implemented or use createInventoryAlert for inventory costs
      alert('Función de crear costos no disponible aún');
    } catch (error) {
      console.error('Error creating cost:', error);
      alert('Error al registrar costo: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleCreateWholesaleOrder = async (orderData: any) => {
    try {
      await createWholesaleSale({
        customer_name: orderData.customerName,
        customer_document: orderData.customerDocument,
        customer_phone: orderData.customerPhone,
        location_id: orderData.locationId,
        items: orderData.items,
        discount_percentage: orderData.discountPercentage,
        payment_method: orderData.paymentMethod,
        notes: orderData.notes
      });
      
      await loadWholesaleOrders(wholesaleFilters);
      setShowCreateWholesaleModal(false);
      alert('Orden mayorista creada exitosamente');
    } catch (error) {
      console.error('Error creating wholesale order:', error);
      alert('Error al crear orden mayorista: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleApproveDiscount = async (discountId: number, approved: boolean, notes?: string) => {
    try {
      await approveDiscountRequest({
        discount_request_id: discountId,
        approved: approved,
        admin_notes: notes
      });
      
      await loadNotifications();
      alert(approved ? 'Descuento aprobado exitosamente' : 'Descuento rechazado');
    } catch (error) {
      console.error('Error processing discount:', error);
      alert('Error al procesar descuento: ' + (error.message || 'Error desconocido'));
    }
  };

  const renderDashboardView = () => {
    if (!dashboardData) return <LoadingSkeleton />;

    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Panel de Administración</h2>
          <Button onClick={() => loadDashboardData()} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Ventas Totales"
            value={formatCurrency(dashboardData.totalSales)}
            change={dashboardData.salesGrowth}
            period="crecimiento"
            icon={<DollarSign className="h-6 w-6" />}
          />
          <StatsCard
            title="Gastos Totales"
            value={formatCurrency(dashboardData.totalExpenses)}
            change={dashboardData.expensesGrowth}
            period="crecimiento"
            icon={<TrendingDown className="h-6 w-6" />}
          />
          <StatsCard
            title="Usuarios Activos"
            value={dashboardData.totalUsers.toString()}
            icon={<Users className="h-6 w-6" />}
          />
          <StatsCard
            title="Ubicaciones"
            value={dashboardData.totalLocations.toString()}
            icon={<Store className="h-6 w-6" />}
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Button 
                className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
                onClick={() => setCurrentView('users')}
              >
                <Users className="h-5 w-5" />
                <span>Gestionar Usuarios</span>
              </Button>
              <Button 
                className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
                onClick={() => setCurrentView('inventory')}
              >
                <Package className="h-5 w-5" />
                <span>Ver Inventario</span>
              </Button>
              <Button 
                className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
                onClick={() => setCurrentView('wholesale')}
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Ventas Mayoreo</span>
              </Button>
              <Button 
                className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
                onClick={() => setCurrentView('analytics')}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Análisis</span>
              </Button>
              <Button 
                className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
                onClick={() => setCurrentView('costs')}
              >
                <DollarSign className="h-5 w-5" />
                <span>Ver Costos</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Productos Más Vendidos</h3>
            </CardHeader>
            <CardContent>
              {dashboardData.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product.name || product.model}</p>
                        <p className="text-sm text-gray-600">{product.sales || product.quantity} unidades</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(product.revenue || product.total)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No hay datos de productos"
                  description="No se encontraron productos más vendidos"
                  icon={<Package className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Productos con Stock Bajo</h3>
            </CardHeader>
            <CardContent>
              {dashboardData.lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.lowStockProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name || product.model}</p>
                        <p className="text-sm text-gray-600">Stock actual: {product.stock || product.current_stock}</p>
                      </div>
                      <Badge variant="warning">Bajo Stock</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No hay alertas de stock"
                  description="Todos los productos tienen stock adecuado"
                  icon={<CheckCircle className="h-12 w-12 text-success" />}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Actividad Reciente</h3>
            </CardHeader>
            <CardContent>
              {dashboardData.recentSales.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentSales.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{activity.description || `Actividad #${activity.id}`}</p>
                        <p className="text-sm text-gray-600">{formatDate(activity.created_at)}</p>
                      </div>
                      <p className="font-semibold text-success">
                        {activity.amount ? formatCurrency(activity.amount) : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No hay actividad reciente"
                  description="No se encontró actividad reciente"
                  icon={<Activity className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Gastos Recientes</h3>
            </CardHeader>
            <CardContent>
              {dashboardData.recentExpenses.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentExpenses.slice(0, 5).map((expense, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-600">{formatDate(expense.created_at)}</p>
                      </div>
                      <p className="font-semibold text-error">-{formatCurrency(expense.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No hay gastos recientes"
                  description="No se encontraron gastos recientes"
                  icon={<DollarSign className="h-12 w-12 text-gray-400" />}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderUsersView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <Button onClick={() => setShowCreateUserModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Usuario
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={userFilters.search}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <select
                value={userFilters.role}
                onChange={(e) => {
                  setUserFilters(prev => ({ ...prev, role: e.target.value }));
                  loadUsers({ ...userFilters, role: e.target.value });
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos los roles</option>
                <option value="vendedor">Vendedor</option>
                <option value="bodeguero">Bodeguero</option>
                <option value="corredor">Corredor</option>
              </select>
              <select
                value={userFilters.location}
                onChange={(e) => {
                  setUserFilters(prev => ({ ...prev, location: e.target.value }));
                  loadUsers({ ...userFilters, location: e.target.value });
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas las ubicaciones</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id.toString()}>{location.name}</option>
                ))}
              </select>
              <select
                value={userFilters.status}
                onChange={(e) => {
                  setUserFilters(prev => ({ ...prev, status: e.target.value }));
                  loadUsers({ ...userFilters, status: e.target.value });
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-medium">{user.first_name} {user.last_name}</p>
                            <p className="text-sm text-gray-600">ID: {user.id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary">
                            {capitalize(user.role)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.location_name || 'Sin asignar'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={user.is_active ? 'success' : 'error'}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingUser(user);
                              setShowEditUserModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No hay usuarios"
                description="No se encontraron usuarios con los filtros aplicados"
                icon={<Users className="h-12 w-12 text-gray-400" />}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCostsView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold">Gestión de Costos</h2>
          <Button onClick={() => setShowCreateCostModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Costo
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar costos..."
                  value={costFilters.search}
                  onChange={(e) => setCostFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <select
                value={costFilters.category}
                onChange={(e) => {
                  setCostFilters(prev => ({ ...prev, category: e.target.value }));
                  loadCosts({ ...costFilters, category: e.target.value });
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas las categorías</option>
                <option value="arriendo">Arriendo</option>
                <option value="servicios">Servicios</option>
                <option value="nomina">Nómina</option>
                <option value="mercancia">Mercancía</option>
                <option value="comisiones">Comisiones</option>
                <option value="transporte">Transporte</option>
                <option value="otros">Otros</option>
              </select>
              <select
                value={costFilters.location}
                onChange={(e) => {
                  setCostFilters(prev => ({ ...prev, location: e.target.value }));
                  loadCosts({ ...costFilters, location: e.target.value });
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas las ubicaciones</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id.toString()}>{location.name}</option>
                ))}
              </select>
              <Input
                type="date"
                value={costFilters.dateFrom}
                onChange={(e) => setCostFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                placeholder="Fecha desde"
              />
              <Input
                type="date"
                value={costFilters.dateTo}
                onChange={(e) => setCostFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                placeholder="Fecha hasta"
              />
            </div>
          </CardContent>
        </Card>

        {/* Costs Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(costs.reduce((sum, cost) => sum + cost.amount, 0))}</p>
              <p className="text-sm text-gray-600">Total Costos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{costs.length}</p>
              <p className="text-sm text-gray-600">Registros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(costs.reduce((sum, cost) => sum + cost.amount, 0) / Math.max(costs.length, 1))}</p>
              <p className="text-sm text-gray-600">Promedio</p>
            </CardContent>
          </Card>
        </div>

        {/* Costs Table */}
        <Card>
          <CardContent className="p-0">
            {costs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frecuencia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {costs.map((cost) => (
                      <tr key={cost.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-medium">{cost.description}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary">{capitalize(cost.cost_type)}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold">
                          {formatCurrency(cost.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cost.location_name || 'General'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {capitalize(cost.frequency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={cost.is_active ? 'success' : 'error'}>
                            {cost.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No hay costos registrados"
                description="No se encontraron costos con los filtros aplicados"
                icon={<DollarSign className="h-12 w-12 text-gray-400" />}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLocationsView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold">Gestión de Ubicaciones</h2>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Ubicación
          </Button>
        </div>

        {/* Location Types Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Store className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{locations.filter(l => l.type === 'local').length}</p>
              <p className="text-sm text-gray-600">Locales de Venta</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Warehouse className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">{locations.filter(l => l.type === 'bodega').length}</p>
              <p className="text-sm text-gray-600">Bodegas</p>
            </CardContent>
          </Card>
        </div>

        {/* Locations List */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Todas las Ubicaciones</h3>
          </CardHeader>
          <CardContent>
            {locations.length > 0 ? (
              <div className="space-y-4">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${
                        location.type === 'local' ? 'bg-primary/10' : 'bg-secondary/10'
                      }`}>
                        {location.type === 'local' ? 
                          <Store className="h-6 w-6 text-primary" /> : 
                          <Warehouse className="h-6 w-6 text-secondary" />
                        }
                      </div>
                      <div>
                        <h4 className="font-semibold">{location.name}</h4>
                        <p className="text-sm text-gray-600">{location.address}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={location.type === 'local' ? 'primary' : 'secondary'}>
                            {location.type === 'local' ? 'Local' : 'Bodega'}
                          </Badge>
                          <Badge variant={location.is_active ? 'success' : 'error'}>
                            {location.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Stats
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay ubicaciones"
                description="No se encontraron ubicaciones registradas"
                icon={<MapPin className="h-12 w-12 text-gray-400" />}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderNotificationsView = () => {
    const allNotifications = [
      ...notifications.discounts.map(n => ({ ...n, type: 'discount' })),
      ...notifications.returns.map(n => ({ ...n, type: 'return' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
      <div className="space-y-6 p-4 md:p-6">
        <h2 className="text-2xl font-bold">Notificaciones</h2>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{notifications.discounts.length}</p>
              <p className="text-sm text-gray-600">Descuentos Pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
              <p className="text-2xl font-bold">{notifications.returns.length}</p>
              <p className="text-sm text-gray-600">Devoluciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Bell className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{allNotifications.length}</p>
              <p className="text-sm text-gray-600">Total Notificaciones</p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Todas las Notificaciones</h3>
          </CardHeader>
          <CardContent>
            {allNotifications.length === 0 ? (
              <EmptyState
                title="No hay notificaciones"
                description="No tienes notificaciones pendientes en este momento"
                icon={<Bell className="h-12 w-12 text-gray-400" />}
              />
            ) : (
              <div className="space-y-4">
                {allNotifications.map((notification: any) => (
                  <div key={`${notification.type}-${notification.id}`} className={`p-4 rounded-lg border-l-4 ${
                    notification.type === 'discount' 
                      ? 'bg-warning/10 border-warning' 
                      : 'bg-error/10 border-error'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {notification.type === 'discount' ? (
                            <AlertCircle className="h-5 w-5 text-warning" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-error" />
                          )}
                          <span className="font-medium">
                            {notification.type === 'discount' ? 'Solicitud de Descuento' : 'Devolución'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {notification.reason || notification.message || notification.notes}
                        </p>
                        {notification.amount && (
                          <p className="text-sm font-medium">Monto: {formatCurrency(notification.amount)}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">{formatDate(notification.created_at)}</p>
                      </div>
                      {notification.type === 'discount' && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-success"
                            onClick={() => handleApproveDiscount(notification.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-error"
                            onClick={() => handleApproveDiscount(notification.id, false, 'Rechazado por administrador')}
                          >
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderInventoryView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Gestión de Inventario</h2>
        <Button onClick={() => {/* Implementar modal agregar stock */}}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Stock por Video
        </Button>
      </div>
      
      {/* Video Inventory Form */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Registrar Inventario por Video</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Seleccionar Bodega</option>
                {locations.filter(l => l.type === 'bodega').map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
              <Input placeholder="Cantidad Estimada" type="number" />
              <Input placeholder="Marca (Opcional)" />
              <Input placeholder="Modelo (Opcional)" />
              <Input placeholder="Tallas Esperadas (Ej: 8,8.5,9)" />
              <textarea 
                placeholder="Notas adicionales"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grabar Video del Inventario
                </label>
                <FullScreenCameraCapture
                  onVideoRecorded={async (url, blob) => {
                    console.log("Video listo para subir:", url, blob);
                    // Aquí implementar la llamada a createVideoInventoryEntry
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button>
              <Video className="h-4 w-4 mr-2" />
              Procesar Video de Inventario
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing History */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Historial de Procesamiento</h3>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Sin historial de videos"
            description="No hay videos de inventario procesados aún"
            icon={<Video className="h-12 w-12 text-gray-400" />}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderWholesaleView = () => {
    const totalWholesaleAmount = wholesaleOrders.reduce((sum, order) => sum + order.total_amount, 0);

    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold">Ventas al Por Mayor</h2>
          <Button onClick={() => setShowCreateWholesaleModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden Mayorista
          </Button>
        </div>

        {/* Wholesale Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <ShoppingBag className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{wholesaleOrders.length}</p>
              <p className="text-sm text-gray-600">Órdenes Totales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(totalWholesaleAmount)}</p>
              <p className="text-sm text-gray-600">Valor Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{wholesaleOrders.filter(o => o.status === 'confirmed').length}</p>
              <p className="text-sm text-gray-600">Confirmadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{wholesaleOrders.filter(o => o.status === 'pending').length}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </CardContent>
          </Card>
        </div>

        {/* Wholesale Orders List */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Órdenes Mayoristas</h3>
          </CardHeader>
          <CardContent>
            {wholesaleOrders.length > 0 ? (
              <div className="space-y-4">
                {wholesaleOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={
                            order.status === 'confirmed' ? 'success' :
                            order.status === 'pending' ? 'warning' :
                            order.status === 'delivered' ? 'primary' : 'error'
                          }>
                            {order.status === 'confirmed' ? 'Confirmada' :
                             order.status === 'pending' ? 'Pendiente' :
                             order.status === 'delivered' ? 'Entregada' : 'Cancelada'}
                          </Badge>
                          <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
                        </div>
                        
                        <h4 className="font-semibold text-lg">{order.customer_name}</h4>
                        <p className="text-sm text-gray-600">
                          {order.customer_document} | {order.customer_phone}
                        </p>
                        <p className="text-sm text-gray-600">Ubicación: {order.location_name}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(order.total_amount)}</p>
                        {order.discount_percentage && (
                          <p className="text-sm text-success">Descuento: {order.discount_percentage}%</p>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 mb-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <span className="font-medium">{item.reference_code}</span>
                          <span className="text-gray-600"> - {item.quantity} unidades × {formatCurrency(item.unit_price)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                      {order.status === 'pending' && (
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay órdenes mayoristas"
                description="No se encontraron órdenes de venta al por mayor"
                icon={<ShoppingBag className="h-12 w-12 text-gray-400" />}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAnalyticsView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold">Análisis y Métricas</h2>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => generateSalesReport({
              start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              end_date: new Date().toISOString()
            })}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" variant="outline">Hoy</Button>
            <Button size="sm" variant="outline">Semana</Button>
            <Button size="sm" variant="outline">Mes</Button>
          </div>
        </div>

        {/* Analytics Placeholder */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Métricas de Rendimiento</h3>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Análisis en desarrollo"
              description="Las métricas detalladas estarán disponibles próximamente"
              icon={<BarChart3 className="h-12 w-12 text-gray-400" />}
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderReportsView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h2 className="text-2xl font-bold">Reportes y Análisis</h2>

        {/* Report Types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Reporte de Ventas</h3>
              <p className="text-sm text-gray-600 mb-4">Análisis detallado de ventas por período</p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => generateSalesReport({
                  start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                  end_date: new Date().toISOString()
                })}
              >
                Generar
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-secondary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Rendimiento de Usuarios</h3>
              <p className="text-sm text-gray-600 mb-4">Performance por vendedor y ubicación</p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => fetchUserPerformance({
                  start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                  end_date: new Date().toISOString()
                })}
              >
                Generar
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Truck className="h-12 w-12 text-success mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Reporte de Transferencias</h3>
              <p className="text-sm text-gray-600 mb-4">Resumen de transferencias entre ubicaciones</p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => fetchTransfersOverview()}
              >
                Generar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Reports Placeholder */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Reportes Generados</h3>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No hay reportes generados"
              description="Los reportes aparecerán aquí una vez generados"
              icon={<FileText className="h-12 w-12 text-gray-400" />}
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'users':
        return renderUsersView();
      case 'costs':
        return renderCostsView();
      case 'inventory':
        return renderInventoryView();
      case 'wholesale':
        return renderWholesaleView();
      case 'analytics':
        return renderAnalyticsView();
      case 'locations':
        return renderLocationsView();
      case 'notifications':
        return renderNotificationsView();
      case 'reports':
        return renderReportsView();
      default:
        return renderDashboardView();
    }
  };

  if (loading && currentView === 'dashboard') {
    return (
      <DashboardLayout title="Panel de Administración">
        <LoadingSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Panel de Administración">
        <ErrorState 
          title="Error al cargar datos"
          description={error}
          icon={<AlertCircle className="h-12 w-12 text-error" />}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Panel de Administración">
      <div className="min-h-screen bg-gray-50">
        {/* Navigation tabs - Mobile */}
        <div className="lg:hidden bg-white border-b sticky top-0 z-10">
          <div className="flex overflow-x-auto px-4 py-2 space-x-2">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
              { key: 'users', label: 'Usuarios', icon: <Users className="h-4 w-4" /> },
              { key: 'inventory', label: 'Inventario', icon: <Package className="h-4 w-4" /> },
              { key: 'wholesale', label: 'Mayoreo', icon: <ShoppingBag className="h-4 w-4" /> },
              { key: 'costs', label: 'Costos', icon: <DollarSign className="h-4 w-4" /> },
              { key: 'analytics', label: 'Análisis', icon: <PieChart className="h-4 w-4" /> },
              { key: 'notifications', label: 'Notificaciones', icon: <Bell className="h-4 w-4" /> },
              { key: 'reports', label: 'Reportes', icon: <FileText className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key as AdminView)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  currentView === tab.key
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar navigation - Desktop */}
        <div className="hidden lg:flex">
          <div className="w-64 bg-white shadow-sm h-screen fixed left-0 top-16 overflow-y-auto">
            <div className="p-4">
              <nav className="space-y-2">
                {[
                  { key: 'dashboard', label: 'Panel Principal', icon: <BarChart3 className="h-5 w-5" /> },
                  { key: 'users', label: 'Gestión de Usuarios', icon: <Users className="h-5 w-5" /> },
                  { key: 'inventory', label: 'Gestión de Inventario', icon: <Package className="h-5 w-5" /> },
                  { key: 'wholesale', label: 'Ventas Mayoristas', icon: <ShoppingBag className="h-5 w-5" /> },
                  { key: 'costs', label: 'Gestión de Costos', icon: <DollarSign className="h-5 w-5" /> },
                  { key: 'analytics', label: 'Análisis y Métricas', icon: <PieChart className="h-5 w-5" /> },
                  { key: 'locations', label: 'Ubicaciones', icon: <MapPin className="h-5 w-5" /> },
                  { key: 'notifications', label: 'Notificaciones', icon: <Bell className="h-5 w-5" /> },
                  { key: 'reports', label: 'Reportes', icon: <FileText className="h-5 w-5" /> },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setCurrentView(item.key as AdminView)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                      currentView === item.key
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.key === 'notifications' && (notifications.discounts.length + notifications.returns.length) > 0 && (
                      <span className="ml-auto bg-error text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notifications.discounts.length + notifications.returns.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          <div className="ml-64 flex-1">
            {renderCurrentView()}
          </div>
        </div>

        {/* Content for mobile */}
        <div className="lg:hidden">
          {renderCurrentView()}
        </div>

        {/* Modals */}
        {showCreateUserModal && (
          <CreateUserModal 
            onClose={() => setShowCreateUserModal(false)}
            onSubmit={handleCreateUser}
            locations={availableLocations}
          />
        )}

        {showEditUserModal && editingUser && (
          <EditUserModal 
            user={editingUser}
            onClose={() => {
              setShowEditUserModal(false);
              setEditingUser(null);
            }}
            onSubmit={(userData) => handleUpdateUser(editingUser.id, userData)}
            locations={availableLocations}
          />
        )}

        {showCreateCostModal && (
          <CreateCostModal 
            onClose={() => setShowCreateCostModal(false)}
            onSubmit={handleCreateCost}
            locations={locations}
          />
        )}
      </div>
    </DashboardLayout>
  );
};