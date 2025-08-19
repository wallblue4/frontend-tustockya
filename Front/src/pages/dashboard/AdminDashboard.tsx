import React, { useState, useEffect } from 'react';
/*import {
  fetchAllUsers,
  fetchAllLocations,
  fetchAllWarehouses,
  fetchAllCosts,
  fetchAllWholesaleOrders
} from '../../services/adminAPI';*/
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import FullScreenCameraCapture from '../../components/admin/FullScreenCameraCapture';
import { 
  Users, 
  Store, 
  Warehouse, 
  DollarSign, 
  ShoppingBag, 
  Package2, 
  BarChart2,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Bell,
  Calendar,
  MapPin,
  CreditCard,
  AlertCircle,
  Eye,
  Filter,
  Download,
  Search,
  Building,
  UserPlus,
  Settings,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';


type AdminView = 
  | 'dashboard' 
  | 'users' 
  | 'locations' 
  | 'warehouses' 
  | 'costs' 
  | 'wholesale' 
  | 'analytics' 
  | 'inventory' 
  | 'notifications';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'seller' | 'runner' | 'warehouse';
  location: string;
  warehouse?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  manager: string;
  status: 'active' | 'inactive';
  salesCount: number;
  revenue: number;
}

interface Warehouse {
  id: string;
  name: string;
  address: string;
  manager: string;
  capacity: number;
  currentStock: number;
  status: 'active' | 'inactive';
}

interface Cost {
  id: string;
  type: 'fixed' | 'variable';
  category: string;
  description: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'daily';
  location?: string;
  dueDate?: string;
  status: 'paid' | 'pending' | 'overdue';
}

interface WholesaleOrder {
  id: string;
  client: string;
  items: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
  paid: number;
  pending: number;
  status: 'completed' | 'partial' | 'pending';
  dueDate: string;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data - En producción vendría de la API
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Juan Pérez',
      email: 'juan@tennis.com',
      role: 'seller',
      location: 'Local Centro',
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'María García',
      email: 'maria@tennis.com',
      role: 'warehouse',
      location: 'Local Norte',
      warehouse: 'Bodega Principal',
      status: 'active',
      createdAt: '2024-02-10'
    },
    {
      id: '3',
      name: 'Carlos López',
      email: 'carlos@tennis.com',
      role: 'runner',
      location: 'Zona Centro',
      status: 'active',
      createdAt: '2024-03-05'
    }
  ]);

  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      name: 'Local Centro',
      address: 'Calle 123 #45-67, Centro',
      manager: 'Juan Pérez',
      status: 'active',
      salesCount: 156,
      revenue: 2450000
    },
    {
      id: '2',
      name: 'Local Norte',
      address: 'Av. Norte #89-12, Norte',
      manager: 'Ana Rodríguez',
      status: 'active',
      salesCount: 98,
      revenue: 1890000
    }
  ]);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([
    {
      id: '1',
      name: 'Bodega Principal',
      address: 'Zona Industrial #123',
      manager: 'María García',
      capacity: 5000,
      currentStock: 3200,
      status: 'active'
    },
    {
      id: '2',
      name: 'Bodega Norte',
      address: 'Av. Industrial #456',
      manager: 'Pedro Martínez',
      capacity: 3000,
      currentStock: 1800,
      status: 'active'
    }
  ]);

  const [costs, setCosts] = useState<Cost[]>([
    {
      id: '1',
      type: 'fixed',
      category: 'Arriendo',
      description: 'Arriendo Local Centro',
      amount: 2500000,
      frequency: 'monthly',
      location: 'Local Centro',
      dueDate: '2024-01-31',
      status: 'paid'
    },
    {
      id: '2',
      type: 'variable',
      category: 'Servicios',
      description: 'Electricidad Local Norte',
      amount: 450000,
      frequency: 'monthly',
      location: 'Local Norte',
      dueDate: '2024-02-15',
      status: 'pending'
    },
    {
      id: '3',
      type: 'variable',
      category: 'Mercancía',
      description: 'Compra Nike - Lote 001',
      amount: 15000000,
      frequency: 'monthly',
      dueDate: '2024-02-20',
      status: 'overdue'
    }
  ]);

  const [wholesaleOrders, setWholesaleOrders] = useState<WholesaleOrder[]>([
    {
      id: 'WS-001',
      client: 'Deportes El Campeón',
      items: [
        { product: 'Nike Air Max 90', quantity: 50, unitPrice: 180000 },
        { product: 'Adidas Ultraboost', quantity: 30, unitPrice: 220000 }
      ],
      total: 15600000,
      paid: 10000000,
      pending: 5600000,
      status: 'partial',
      dueDate: '2024-02-28',
      createdAt: '2024-01-15'
    }
  ]);

  // Estadísticas principales
  const totalRevenue = locations.reduce((sum, loc) => sum + loc.revenue, 0);
  const totalSales = locations.reduce((sum, loc) => sum + loc.salesCount, 0);
  const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const pendingPayments = costs.filter(cost => cost.status === 'pending' || cost.status === 'overdue').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderDashboardView = () => (
    <div className="space-y-6 p-4 md:p-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas Totales Diarias"
          value={formatCurrency(totalRevenue)}
          change={12.5}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Pares Vendidos"
          value={totalSales.toString()}
          change={8.3}
          icon={<Package2 className="h-6 w-6" />}
        />
        <StatsCard
          title="Costos Totales"
          value={formatCurrency(totalCosts)}
          change={-5.2}
          icon={<TrendingDown className="h-6 w-6" />}
        />
        <StatsCard
          title="Pagos Pendientes"
          value={pendingPayments.toString()}
          change={0}
          icon={<AlertCircle className="h-6 w-6" />}
        />
      </div>

      {/* Acciones rápidas */}
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
              <UserPlus className="h-5 w-5" />
              <span>Crear Usuario</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => setCurrentView('locations')}
            >
              <Store className="h-5 w-5" />
              <span>Gestionar Locales</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => setCurrentView('costs')}
            >
              <DollarSign className="h-5 w-5" />
              <span>Registrar Costos</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => setCurrentView('wholesale')}
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Venta Mayoreo</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => setCurrentView('inventory')}
            >
              <Package2 className="h-5 w-5" />
              <span>Agregar Stock</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen por locales */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Resumen por Locales</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locations.map((location) => (
              <div key={location.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Store className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">{location.name}</h4>
                    <p className="text-sm text-gray-600">{location.manager}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(location.revenue)}</p>
                  <p className="text-sm text-gray-600">{location.salesCount} ventas</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertas y notificaciones */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Alertas Importantes
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {costs.filter(cost => cost.status === 'overdue').map((cost) => (
              <div key={cost.id} className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">{cost.description}</p>
                  <p className="text-sm text-red-600">Vencido - {formatCurrency(cost.amount)}</p>
                </div>
              </div>
            ))}
            {costs.filter(cost => cost.status === 'pending').map((cost) => (
              <div key={cost.id} className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-800">{cost.description}</p>
                  <p className="text-sm text-yellow-600">Vence: {cost.dueDate} - {formatCurrency(cost.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsersView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
        <Button onClick={() => {/* Abrir modal crear usuario */}}>
          <UserPlus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todos los roles</option>
              <option value="seller">Vendedores</option>
              <option value="warehouse">Bodegueros</option>
              <option value="runner">Corredores</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rol:</span>
                  <span className="font-medium capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Local:</span>
                  <span className="font-medium">{user.location}</span>
                </div>
                {user.warehouse && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Bodega:</span>
                    <span className="font-medium">{user.warehouse}</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderLocationsView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Gestión de Locales</h2>
        <Button onClick={() => {/* Abrir modal crear local */}}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Local
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Store className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">{location.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {location.address}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  location.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {location.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{location.salesCount}</p>
                  <p className="text-sm text-gray-600">Ventas</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-success">{formatCurrency(location.revenue)}</p>
                  <p className="text-sm text-gray-600">Ingresos</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">Encargado:</span>
                <span className="font-medium">{location.manager}</span>
              </div>

              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  Ver Detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderWarehousesView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Gestión de Bodegas</h2>
        <Button onClick={() => {/* Abrir modal crear bodega */}}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Bodega
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {warehouses.map((warehouse) => (
          <Card key={warehouse.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Warehouse className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">{warehouse.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {warehouse.address}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  warehouse.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {warehouse.status === 'active' ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Capacidad utilizada</span>
                  <span className="text-sm font-medium">
                    {warehouse.currentStock} / {warehouse.capacity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(warehouse.currentStock / warehouse.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">Encargado:</span>
                <span className="font-medium">{warehouse.manager}</span>
              </div>

              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Package2 className="h-3 w-3 mr-1" />
                  Ver Stock
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCostsView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Gestión de Costos</h2>
        <Button onClick={() => {/* Abrir modal crear costo */}}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Costo
        </Button>
      </div>

      {/* Resumen de costos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(costs.filter(c => c.type === 'fixed').reduce((sum, c) => sum + c.amount, 0))}</p>
            <p className="text-sm text-gray-600">Costos Fijos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(costs.filter(c => c.type === 'variable').reduce((sum, c) => sum + c.amount, 0))}</p>
            <p className="text-sm text-gray-600">Costos Variables</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
            <p className="text-2xl font-bold">{costs.filter(c => c.status === 'overdue').length}</p>
            <p className="text-sm text-gray-600">Pagos Vencidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de costos */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Todos los Costos</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costs.map((cost) => (
              <div key={cost.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    cost.type === 'fixed' ? 'bg-blue-100' : 'bg-orange-100'
                  }`}>
                    {cost.type === 'fixed' ? 
                      <Building className="h-5 w-5 text-blue-600" /> : 
                      <Activity className="h-5 w-5 text-orange-600" />
                    }
                  </div>
                  <div>
                    <h4 className="font-semibold">{cost.description}</h4>
                    <p className="text-sm text-gray-600">{cost.category} • {cost.location}</p>
                    {cost.dueDate && (
                      <p className="text-xs text-gray-500">Vence: {cost.dueDate}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(cost.amount)}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cost.status === 'paid' ? 'bg-green-100 text-green-800' :
                    cost.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {cost.status === 'paid' ? 'Pagado' : 
                     cost.status === 'pending' ? 'Pendiente' : 'Vencido'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWholesaleView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Ventas al Por Mayor</h2>
        <Button onClick={() => {/* Abrir modal crear venta mayoreo */}}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Venta Mayoreo
        </Button>
      </div>

      {/* Resumen de ventas mayoreo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <p className="text-2xl font-bold">{formatCurrency(wholesaleOrders.reduce((sum, order) => sum + order.paid, 0))}</p>
            <p className="text-sm text-gray-600">Total Cobrado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(wholesaleOrders.reduce((sum, order) => sum + order.pending, 0))}</p>
            <p className="text-sm text-gray-600">Saldo Pendiente</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de órdenes mayoreo */}
      <div className="space-y-4">
        {wholesaleOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{order.client}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status === 'completed' ? 'Completado' :
                       order.status === 'partial' ? 'Parcial' : 'Pendiente'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product} × {item.quantity}</span>
                        <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold ml-2">{formatCurrency(order.total)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pagado:</span>
                      <span className="font-bold ml-2 text-success">{formatCurrency(order.paid)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pendiente:</span>
                      <span className="font-bold ml-2 text-warning">{formatCurrency(order.pending)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Vence:</span>
                      <span className="font-bold ml-2">{order.dueDate}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 lg:ml-6">
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Registrar Pago
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-xl font-semibold">Métricas y Análisis</h2>
      
      {/* Filtros de tiempo */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline">Hoy</Button>
            <Button size="sm" variant="outline">Esta Semana</Button>
            <Button size="sm" variant="outline">Este Mes</Button>
            <Button size="sm" variant="outline">Personalizado</Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart2 className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">254</p>
            <p className="text-sm text-gray-600">Pares Vendidos Hoy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package2 className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm text-gray-600">Cajas Vendidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(4250000)}</p>
            <p className="text-sm text-gray-600">Ventas del Día</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <PieChart className="h-8 w-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold">85%</p>
            <p className="text-sm text-gray-600">Efectividad</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico placeholder */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Ventas por Local - Últimos 7 Días</h3>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Gráfico de ventas aparecerá aquí</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de ventas detalladas */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Ventas Detalladas</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Producto</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Talla</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Hora</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Local</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Método Pago</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-4 text-sm">Nike Air Max 90</td>
                  <td className="py-2 px-4 text-sm">9.5</td>
                  <td className="py-2 px-4 text-sm">14:30</td>
                  <td className="py-2 px-4 text-sm">Local Centro</td>
                  <td className="py-2 px-4 text-sm">Tarjeta</td>
                  <td className="py-2 px-4 text-sm font-medium">{formatCurrency(180000)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-sm">Adidas Ultraboost</td>
                  <td className="py-2 px-4 text-sm">8</td>
                  <td className="py-2 px-4 text-sm">13:15</td>
                  <td className="py-2 px-4 text-sm">Local Norte</td>
                  <td className="py-2 px-4 text-sm">Efectivo</td>
                  <td className="py-2 px-4 text-sm font-medium">{formatCurrency(220000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
              <Input label="Referencia del Producto" placeholder="Ej: NK-AM90-001" />
              <Input label="Marca" placeholder="Ej: Nike" />
              <Input label="Modelo" placeholder="Ej: Air Max 90" />
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

  const renderNotificationsView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-xl font-semibold">Centro de Notificaciones</h2>
      
      <div className="space-y-4">
        {/* Notificaciones de pagos próximos */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Clock className="h-5 w-5 mr-2 text-warning" />
              Pagos Próximos a Vencer
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costs.filter(cost => cost.status === 'pending').map((cost) => (
                <div key={cost.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-medium">{cost.description}</p>
                    <p className="text-sm text-gray-600">Vence: {cost.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(cost.amount)}</p>
                    <Button size="sm" className="mt-1">Marcar como Pagado</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones de stock bajo */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-error" />
              Alertas de Stock Bajo
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <p className="font-medium">Nike Air Max 90 - Talla 9.5</p>
                  <p className="text-sm text-gray-600">Local Centro - Solo 2 unidades</p>
                </div>
                <Button size="sm" variant="outline">Reabastecer</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'users': return renderUsersView();
      case 'locations': return renderLocationsView();
      case 'warehouses': return renderWarehousesView();
      case 'costs': return renderCostsView();
      case 'wholesale': return renderWholesaleView();
      case 'analytics': return renderAnalyticsView();
      case 'inventory': return renderInventoryView();
      case 'notifications': return renderNotificationsView();
      default: return renderDashboardView();
    }
  };

  return (
    <DashboardLayout title={
      currentView === 'dashboard' ? 'Panel de Administrador' :
      currentView === 'users' ? 'Gestión de Usuarios' :
      currentView === 'locations' ? 'Gestión de Locales' :
      currentView === 'warehouses' ? 'Gestión de Bodegas' :
      currentView === 'costs' ? 'Gestión de Costos' :
      currentView === 'wholesale' ? 'Ventas al Por Mayor' :
      currentView === 'analytics' ? 'Métricas y Análisis' :
      currentView === 'inventory' ? 'Gestión de Inventario' :
      'Centro de Notificaciones'
    }>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation tabs - Solo visible en móvil */}
        <div className="lg:hidden bg-white border-b sticky top-0 z-10">
          <div className="flex overflow-x-auto px-4 py-2 space-x-2">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="h-4 w-4" /> },
              { key: 'users', label: 'Usuarios', icon: <Users className="h-4 w-4" /> },
              { key: 'locations', label: 'Locales', icon: <Store className="h-4 w-4" /> },
              { key: 'warehouses', label: 'Bodegas', icon: <Warehouse className="h-4 w-4" /> },
              { key: 'costs', label: 'Costos', icon: <DollarSign className="h-4 w-4" /> },
              { key: 'wholesale', label: 'Mayoreo', icon: <ShoppingBag className="h-4 w-4" /> },
              { key: 'analytics', label: 'Análisis', icon: <PieChart className="h-4 w-4" /> },
              { key: 'inventory', label: 'Inventario', icon: <Package2 className="h-4 w-4" /> },
              { key: 'notifications', label: 'Alertas', icon: <Bell className="h-4 w-4" /> },
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

        {/* Sidebar navigation - Solo visible en desktop */}
        <div className="hidden lg:flex">
          <div className="w-64 bg-white shadow-sm h-screen fixed left-0 top-16 overflow-y-auto">
            <div className="p-4">
              <nav className="space-y-2">
                {[
                  { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="h-5 w-5" /> },
                  { key: 'users', label: 'Gestión de Usuarios', icon: <Users className="h-5 w-5" /> },
                  { key: 'locations', label: 'Gestión de Locales', icon: <Store className="h-5 w-5" /> },
                  { key: 'warehouses', label: 'Gestión de Bodegas', icon: <Warehouse className="h-5 w-5" /> },
                  { key: 'costs', label: 'Gestión de Costos', icon: <DollarSign className="h-5 w-5" /> },
                  { key: 'wholesale', label: 'Ventas al Por Mayor', icon: <ShoppingBag className="h-5 w-5" /> },
                  { key: 'analytics', label: 'Métricas y Análisis', icon: <PieChart className="h-5 w-5" /> },
                  { key: 'inventory', label: 'Gestión de Inventario', icon: <Package2 className="h-5 w-5" /> },
                  { key: 'notifications', label: 'Centro de Notificaciones', icon: <Bell className="h-5 w-5" /> },
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
      </div>
    </DashboardLayout>
  );
};