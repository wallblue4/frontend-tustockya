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
import { vendorAPI } from '../../services/api';
import { formatCurrency, formatDate, capitalize } from '../../utils/formatters';
import { LoadingSkeleton, TableSkeleton, CardSkeleton } from '../../components/admin/LoadingSkeleton';
import { ErrorState, EmptyState } from '../../components/admin/ErrorState';
import { CreateUserModal } from '../../components/admin/CreateUserModal';
import { EditUserModal } from '../../components/admin/EditUserModal';
import { CreateCostModal } from '../../components/admin/CreateCostModal';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { FullScreenCameraCapture } from '../../components/admin/FullScreenCameraCapture'; // Asegúrate de que esta ruta sea correcta

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
  is_active: boolean;
  created_at: string;
}

interface Cost {
  id: number;
  category: string;
  amount: number;
  description: string;
  location_name: string;
  created_at: string;
}

interface Location {
  id: number;
  name: string;
  type: string;
  address: string;
}

interface Notifications {
  discounts: any[];
  returns: any[];
  inventory: any[];
}

interface InventoryItem {
  id: string;
  reference: string;
  brand: string;
  model: string;
  image?: string;
  video?: string;
  sizes: Array<{
    size: string;
    quantity: number;
    location: string;
    locationType: 'warehouse' | 'store';
  }>;
  totalPairs: number;
}

interface WholesaleOrder {
  id: string;
  customer_name: string;
  customer_document: string;
  customer_phone?: string;
  items: Array<{
    reference_code: string;
    brand: string;
    model: string;
    quantity: number;
    unit_price: number;
  }>;
  total_amount: number;
  discount_percentage?: number;
  payment_method: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  created_at: string;
  location_name: string;
}

export const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
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

  const [inventoryFilters, setInventoryFilters] = useState({
    search: '',
    brand: '',
    location: '',
    stockLevel: ''
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
    } else if (currentView === 'inventory') {
      loadInventory(inventoryFilters);
    } else if (currentView === 'wholesale') {
      loadWholesaleOrders(wholesaleFilters);
    }
  }, [currentView]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDashboardData(),
        loadLocations()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Cargar datos del dashboard principal usando vendorAPI disponible
      const [sales, expenses] = await Promise.all([
        vendorAPI.getTodaySales(),
        vendorAPI.getTodayExpenses()
      ]);
      
      // Usar datos mock para dashboard hasta que adminAPI esté disponible
      const mockDashboardData: DashboardData = {
        totalSales: sales.total || 4250000,
        totalExpenses: expenses.total || 850000,
        totalUsers: 15,
        totalLocations: 3,
        salesGrowth: 12.5,
        expensesGrowth: -5.2,
        recentSales: sales.sales || [],
        recentExpenses: expenses.expenses || [],
        topProducts: [
          { name: 'Nike Air Max 90', sales: 25, revenue: 4500000 },
          { name: 'Adidas Ultraboost', sales: 18, revenue: 3960000 },
          { name: 'Puma Suede Classic', sales: 15, revenue: 2250000 }
        ],
        lowStockProducts: [
          { name: 'Nike Air Force 1', stock: 2, min_stock: 5 },
          { name: 'Adidas Stan Smith', stock: 3, min_stock: 8 }
        ]
      };
      
      setDashboardData(mockDashboardData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadUsers = async (filters = {}) => {
    try {
      // Usar función mock hasta que adminAPI esté disponible
      const mockUsers = [
        {
          id: 1,
          first_name: 'Juan',
          last_name: 'Pérez',
          email: 'juan@tennis.com',
          role: 'vendedor',
          location_name: 'Local Centro',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          first_name: 'María',
          last_name: 'García',
          email: 'maria@tennis.com',
          role: 'bodeguero',
          location_name: 'Bodega Principal',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          first_name: 'Carlos',
          last_name: 'López',
          email: 'carlos@tennis.com',
          role: 'corredor',
          location_name: 'Local Norte',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCosts = async (filters = {}) => {
    try {
      // Usar la función correcta del API
      const response = await vendorAPI.getTodayExpenses();
      setCosts(response.data || []);
    } catch (error) {
      console.error('Error loading costs:', error);
    }
  };

  const loadLocations = async () => {
    try {
      // Usar función mock hasta que adminAPI esté disponible
      const mockLocations = [
        { id: 1, name: 'Local Centro', type: 'local', address: 'Centro Comercial Plaza' },
        { id: 2, name: 'Local Norte', type: 'local', address: 'Zona Norte Ciudad' },
        { id: 3, name: 'Local Sur', type: 'local', address: 'Zona Sur Ciudad' },
        { id: 4, name: 'Bodega Principal', type: 'bodega', address: 'Zona Industrial' },
        { id: 5, name: 'Bodega Norte', type: 'bodega', address: 'Zona Industrial Norte' }
      ];
      setLocations(mockLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadInventory = async (filters = {}) => {
    try {
      // Mock data para inventario
      const mockInventory: InventoryItem[] = [
        {
          id: '1',
          reference: 'NK-AM90-001',
          brand: 'Nike',
          model: 'Air Max 90',
          image: 'https://images.pexels.com/photos/2385477/pexels-photo-2385477.jpeg?auto=compress&cs=tinysrgb&w=300',
          sizes: [
            { size: '8', quantity: 15, location: 'Bodega Principal', locationType: 'warehouse' },
            { size: '8.5', quantity: 8, location: 'Local Centro', locationType: 'store' },
            { size: '9', quantity: 12, location: 'Bodega Norte', locationType: 'warehouse' },
            { size: '9.5', quantity: 5, location: 'Local Norte', locationType: 'store' }
          ],
          totalPairs: 40
        },
        {
          id: '2',
          reference: 'AD-UB22-002',
          brand: 'Adidas',
          model: 'Ultraboost 22',
          image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=300',
          sizes: [
            { size: '7.5', quantity: 20, location: 'Bodega Principal', locationType: 'warehouse' },
            { size: '8', quantity: 18, location: 'Bodega Principal', locationType: 'warehouse' },
            { size: '9', quantity: 10, location: 'Local Sur', locationType: 'store' }
          ],
          totalPairs: 48
        }
      ];
      setInventory(mockInventory);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const loadWholesaleOrders = async (filters = {}) => {
    try {
      // Mock data para órdenes mayoristas
      const mockWholesaleOrders: WholesaleOrder[] = [
        {
          id: '1',
          customer_name: 'Deportes El Campeón',
          customer_document: '900123456-7',
          customer_phone: '+57 300 1234567',
          items: [
            {
              reference_code: 'NK-AM90-001',
              brand: 'Nike',
              model: 'Air Max 90',
              quantity: 12,
              unit_price: 180000
            },
            {
              reference_code: 'AD-UB22-002',
              brand: 'Adidas',
              model: 'Ultraboost 22',
              quantity: 8,
              unit_price: 220000
            }
          ],
          total_amount: 3920000,
          discount_percentage: 15,
          payment_method: 'transferencia',
          status: 'pending',
          created_at: new Date().toISOString(),
          location_name: 'Bodega Principal'
        }
      ];
      setWholesaleOrders(mockWholesaleOrders);
    } catch (error) {
      console.error('Error loading wholesale orders:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      // Usar datos mock hasta que adminAPI esté disponible
      const mockDiscounts = [
        {
          id: 1,
          amount: 50000,
          reason: 'Cliente frecuente',
          created_at: new Date().toISOString(),
          status: 'pending'
        }
      ];
      
      const mockReturns = [
        {
          id: 1,
          message: 'Producto defectuoso',
          created_at: new Date().toISOString(),
          status: 'pending'
        }
      ];
      
      setNotifications({
        discounts: mockDiscounts,
        returns: mockReturns,
        inventory: []
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      // Simular creación hasta que adminAPI esté disponible
      const newUser = {
        id: Date.now(),
        ...userData,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setUsers(prev => [...prev, newUser]);
      await loadUsers(userFilters);
      setShowCreateUserModal(false);
      alert('Usuario creado exitosamente');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error al crear usuario');
    }
  };

  const handleUpdateUser = async (userId: number, userData: any) => {
    try {
      // Simular actualización hasta que adminAPI esté disponible
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...userData } : user
      ));
      await loadUsers(userFilters);
      setEditingUser(null);
      setShowEditUserModal(false);
      alert('Usuario actualizado exitosamente');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error al actualizar usuario');
    }
  };

  const handleCreateCost = async (costData: any) => {
    try {
      // Usar la función correcta del API
      await vendorAPI.createExpense(costData);
      await loadCosts();
      setShowCreateCostModal(false);
      alert('Costo registrado exitosamente');
    } catch (error) {
      console.error('Error creating cost:', error);
      alert('Error al registrar costo');
    }
  };

  const handleCreateWholesaleOrder = async (orderData: any) => {
    try {
      // Simular creación hasta que adminAPI esté disponible
      const newOrder = {
        id: Date.now().toString(),
        ...orderData,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      setWholesaleOrders(prev => [...prev, newOrder]);
      setShowCreateWholesaleModal(false);
      alert('Orden mayorista creada exitosamente');
    } catch (error) {
      console.error('Error creating wholesale order:', error);
      alert('Error al crear orden mayorista');
    }
  };

  const renderDashboardView = () => {
    if (!dashboardData) return <LoadingSkeleton />;

    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Panel de Administración</h2>
          <Button onClick={() => window.location.reload()} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Ventas del Día"
            value={formatCurrency(dashboardData.totalSales)}
            change={dashboardData.salesGrowth}
            period="vs ayer"
            icon={<DollarSign className="h-6 w-6" />}
          />
          <StatsCard
            title="Gastos del Día"
            value={formatCurrency(dashboardData.totalExpenses)}
            change={dashboardData.expensesGrowth}
            period="vs ayer"
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
              <div className="space-y-4">
                {dashboardData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} unidades</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Productos con Stock Bajo</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.lowStockProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">Stock actual: {product.stock}</p>
                    </div>
                    <Badge variant="warning">Bajo Stock</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Ventas Recientes</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.recentSales.slice(0, 5).map((sale, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">Venta #{sale.id}</p>
                      <p className="text-sm text-gray-600">{formatDate(sale.created_at)}</p>
                    </div>
                    <p className="font-semibold text-success">{formatCurrency(sale.total)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Gastos Recientes</h3>
            </CardHeader>
            <CardContent>
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
                onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="vendedor">Vendedor</option>
                <option value="bodeguero">Bodeguero</option>
                <option value="corredor">Corredor</option>
              </select>
              <select
                value={userFilters.location}
                onChange={(e) => setUserFilters(prev => ({ ...prev, location: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas las ubicaciones</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id.toString()}>{location.name}</option>
                ))}
              </select>
              <select
                value={userFilters.status}
                onChange={(e) => setUserFilters(prev => ({ ...prev, status: e.target.value }))}
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
                        <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'}>
                          {capitalize(user.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.location_name}
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
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderInventoryView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Gestión de Inventario</h2>
        <Button onClick={() => {/* Abrir modal agregar stock */}}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Stock
        </Button>
      </div>
      {/* Formulario de nuevo producto */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Agregar Nuevo Stock</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input placeholder="Ej: NK-AM90-001" />
              <Input placeholder="Ej: Nike" />
              <Input placeholder="Ej: Air Max 90" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen del Producto
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video del Producto (Opcional)
                </label>
                <FullScreenCameraCapture
                  onVideoRecorded={(url, blob) => {
                    console.log("Video listo:", url, blob);
                    // Aquí puedes manejar el blob para subirlo al backend
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Tallas y Ubicaciones</h4>
              <div className="space-y-3">
                {['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5'].map((size) => (
                  <div key={size} className="grid grid-cols-3 gap-2">
                    <Input placeholder={`Talla ${size}`} value={size} disabled />
                    <Input placeholder="Cantidad" type="number" />
                    <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Ubicación</option>
                      <option value="bodega-principal">Bodega Principal</option>
                      <option value="local-centro">Local Centro</option>
                      <option value="local-norte">Local Norte</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button>
              <Package2 className="h-4 w-4 mr-2" />
              Agregar al Inventario
            </Button>
          </div>
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
                        <span className="font-medium">{item.brand} {item.model}</span>
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
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" variant="outline">Hoy</Button>
            <Button size="sm" variant="outline">Semana</Button>
            <Button size="sm" variant="outline">Mes</Button>
          </div>
        </div>

        {/* Analytics Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(89500000)}</p>
              <p className="text-sm text-gray-600">Ventas Totales (Mes)</p>
              <div className="flex items-center justify-center mt-1">
                <ArrowUp className="h-3 w-3 text-success mr-1" />
                <span className="text-xs text-success">+15.3%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">587</p>
              <p className="text-sm text-gray-600">Pares Vendidos (Mes)</p>
              <div className="flex items-center justify-center mt-1">
                <ArrowUp className="h-3 w-3 text-success mr-1" />
                <span className="text-xs text-success">+8.7%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Box className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">73</p>
              <p className="text-sm text-gray-600">Cajas Vendidas (Mes)</p>
              <div className="flex items-center justify-center mt-1">
                <ArrowUp className="h-3 w-3 text-success mr-1" />
                <span className="text-xs text-success">+22.1%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">92%</p>
              <p className="text-sm text-gray-600">Efectividad</p>
              <div className="flex items-center justify-center mt-1">
                <ArrowUp className="h-3 w-3 text-success mr-1" />
                <span className="text-xs text-success">+3.2%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Tendencia de Ventas - Últimos 30 Días</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Gráfico de tendencias aparecerá aquí</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Distribución por Ubicación</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Gráfico de distribución aparecerá aquí</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Table */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Rendimiento por Ubicación</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Ubicación</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Ventas</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Pares</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Promedio</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Crecimiento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-sm">Local Centro</td>
                    <td className="py-2 px-4 text-sm font-medium">{formatCurrency(1800000)}</td>
                    <td className="py-2 px-4 text-sm">12</td>
                    <td className="py-2 px-4 text-sm">{formatCurrency(150000)}</td>
                    <td className="py-2 px-4 text-sm text-success">+18%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-sm">Local Norte</td>
                    <td className="py-2 px-4 text-sm font-medium">{formatCurrency(1450000)}</td>
                    <td className="py-2 px-4 text-sm">9</td>
                    <td className="py-2 px-4 text-sm">{formatCurrency(161000)}</td>
                    <td className="py-2 px-4 text-sm text-success">+12%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-sm">Local Sur</td>
                    <td className="py-2 px-4 text-sm font-medium">{formatCurrency(1000000)}</td>
                    <td className="py-2 px-4 text-sm">7</td>
                    <td className="py-2 px-4 text-sm">{formatCurrency(143000)}</td>
                    <td className="py-2 px-4 text-sm text-error">-5%</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
                onChange={(e) => setCostFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas las categorías</option>
                <option value="servicios">Servicios</option>
                <option value="suministros">Suministros</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="otros">Otros</option>
              </select>
              <select
                value={costFilters.location}
                onChange={(e) => setCostFilters(prev => ({ ...prev, location: e.target.value }))}
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
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
                        <Badge variant="secondary">{capitalize(cost.category)}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {formatCurrency(cost.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cost.location_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(cost.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                      <Badge variant={location.type === 'local' ? 'primary' : 'secondary'}>
                        {location.type === 'local' ? 'Local' : 'Bodega'}
                      </Badge>
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
                        <p className="text-sm text-gray-700 mb-2">{notification.reason || notification.message}</p>
                        {notification.amount && (
                          <p className="text-sm font-medium">Monto: {formatCurrency(notification.amount)}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">{formatDate(notification.created_at)}</p>
                      </div>
                      {notification.type === 'discount' && (
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="text-success">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button size="sm" variant="outline" className="text-error">
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
              <Button size="sm" className="w-full">Generar</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-secondary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Rendimiento de Usuarios</h3>
              <p className="text-sm text-gray-600 mb-4">Performance por vendedor y ubicación</p>
              <Button size="sm" className="w-full">Generar</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-success mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Reporte de Inventario</h3>
              <p className="text-sm text-gray-600 mb-4">Estado actual del inventario</p>
              <Button size="sm" className="w-full">Generar</Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Reportes Recientes</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Ventas Enero 2024', type: 'Ventas', date: '2024-02-01', size: '2.3 MB' },
                { name: 'Inventario Q4 2023', type: 'Inventario', date: '2024-01-15', size: '1.8 MB' },
                { name: 'Performance Diciembre', type: 'Usuarios', date: '2024-01-05', size: '945 KB' }
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-gray-600">{report.type} • {report.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{report.date}</span>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
            locations={locations}
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
            locations={locations}
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
