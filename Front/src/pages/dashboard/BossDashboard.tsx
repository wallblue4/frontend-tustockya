import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Users, 
  BarChart2, 
  Calendar,
  Store,
  Warehouse,
  ShoppingBag,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
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
  XCircle,
  Upload,
  FileImage,
  Video,
  MapPin,
  Box,
  Truck,
  Target,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

type BossView = 
  | 'dashboard' 
  | 'inventory' 
  | 'costs' 
  | 'assignments' 
  | 'analytics' 
  | 'supply'
  | 'balance';

interface SalesData {
  daily: {
    total: number;
    pairs: number;
    boxes: number;
    locations: Array<{
      name: string;
      sales: number;
      pairs: number;
    }>;
  };
  monthly: {
    total: number;
    pairs: number;
    boxes: number;
    growth: number;
  };
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

interface Cost {
  id: string;
  type: 'fixed' | 'variable';
  category: string;
  description: string;
  amount: number;
  location?: string;
  dueDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  frequency: 'monthly' | 'weekly' | 'daily';
}

interface Assignment {
  id: string;
  type: 'admin-locations' | 'warehouse-manager' | 'seller-location' | 'runner-location';
  userId: string;
  userName: string;
  userRole: string;
  assignedTo: string[];
  createdAt: string;
}

export const BossDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<BossView>('dashboard');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - En producción vendría de la API
  const [salesData, setSalesData] = useState<SalesData>({
    daily: {
      total: 4250000,
      pairs: 28,
      boxes: 3,
      locations: [
        { name: 'Local Centro', sales: 1800000, pairs: 12 },
        { name: 'Local Norte', sales: 1450000, pairs: 9 },
        { name: 'Local Sur', sales: 1000000, pairs: 7 }
      ]
    },
    monthly: {
      total: 89500000,
      pairs: 587,
      boxes: 73,
      growth: 15.3
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>([
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
  ]);

  const [costs, setCosts] = useState<Cost[]>([
    {
      id: '1',
      type: 'fixed',
      category: 'Arriendo',
      description: 'Arriendo Local Centro',
      amount: 2500000,
      location: 'Local Centro',
      dueDate: '2024-02-28',
      status: 'pending',
      frequency: 'monthly'
    },
    {
      id: '2',
      type: 'variable',
      category: 'Servicios',
      description: 'Electricidad Todas las Sedes',
      amount: 850000,
      dueDate: '2024-02-15',
      status: 'paid',
      frequency: 'monthly'
    },
    {
      id: '3',
      type: 'variable',
      category: 'Mercancía',
      description: 'Compra Nike - Lote Febrero',
      amount: 25000000,
      dueDate: '2024-02-20',
      status: 'overdue',
      frequency: 'monthly'
    }
  ]);

  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: '1',
      type: 'admin-locations',
      userId: 'admin-1',
      userName: 'Juan Pérez',
      userRole: 'Administrador',
      assignedTo: ['Local Centro', 'Local Norte'],
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      type: 'warehouse-manager',
      userId: 'wh-1',
      userName: 'María García',
      userRole: 'Bodeguero',
      assignedTo: ['Bodega Principal', 'Bodega Norte'],
      createdAt: '2024-01-20'
    },
    {
      id: '3',
      type: 'seller-location',
      userId: 'seller-1',
      userName: 'Carlos López',
      userRole: 'Vendedor',
      assignedTo: ['Local Centro'],
      createdAt: '2024-02-01'
    }
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const totalInventoryPairs = inventory.reduce((sum, item) => sum + item.totalPairs, 0);
  const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const pendingCosts = costs.filter(cost => cost.status === 'pending' || cost.status === 'overdue');

  const renderDashboardView = () => (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header con refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Panel Ejecutivo</h2>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas del Día"
          value={formatCurrency(salesData.daily.total)}
          change={12.5}
          period="vs ayer"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Ventas del Mes"
          value={formatCurrency(salesData.monthly.total)}
          change={salesData.monthly.growth}
          period="vs mes anterior"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <StatsCard
          title="Pares Vendidos Hoy"
          value={salesData.daily.pairs.toString()}
          change={8.3}
          icon={<Package className="h-6 w-6" />}
        />
        <StatsCard
          title="Cajas Vendidas Hoy"
          value={salesData.daily.boxes.toString()}
          change={15.2}
          icon={<Box className="h-6 w-6" />}
        />
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por local */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Ventas por Local (Hoy)</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.daily.locations.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Store className="h-6 w-6 text-primary" />
                    <div>
                      <h4 className="font-medium">{location.name}</h4>
                      <p className="text-sm text-gray-600">{location.pairs} pares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(location.sales)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumen de inventario */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Resumen de Inventario</h3>
              <Button size="sm" onClick={() => setCurrentView('inventory')}>
                <Eye className="h-4 w-4 mr-1" />
                Ver Todo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{totalInventoryPairs}</p>
                  <p className="text-sm text-gray-600">Total Pares</p>
                </div>
                <div className="text-center p-4 bg-secondary/10 rounded-lg">
                  <Warehouse className="h-8 w-8 text-secondary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{inventory.length}</p>
                  <p className="text-sm text-gray-600">Referencias</p>
                </div>
              </div>
              <div className="space-y-2">
                {inventory.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span>{item.brand} {item.model}</span>
                    <span className="font-medium">{item.totalPairs} pares</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
              onClick={() => setCurrentView('supply')}
            >
              <Upload className="h-5 w-5" />
              <span>Abastecer</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => setCurrentView('assignments')}
            >
              <Users className="h-5 w-5" />
              <span>Asignaciones</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => setCurrentView('costs')}
            >
              <BarChart2 className="h-5 w-5" />
              <span>Ver Costos</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => setCurrentView('analytics')}
            >
              <PieChart className="h-5 w-5" />
              <span>Métricas</span>
            </Button>
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2 text-xs"
              onClick={() => setCurrentView('balance')}
            >
              <Target className="h-5 w-5" />
              <span>Balance</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertas importantes */}
      {pendingCosts.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center text-warning">
              <AlertCircle className="h-5 w-5 mr-2" />
              Alertas Importantes
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingCosts.slice(0, 3).map((cost) => (
                <div key={cost.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium">{cost.description}</p>
                    <p className="text-sm text-gray-600">
                      {cost.status === 'overdue' ? 'Vencido' : 'Vence'}: {cost.dueDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-error">{formatCurrency(cost.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderInventoryView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Gestión de Inventario</h2>
        <Button onClick={() => setCurrentView('supply')}>
          <Plus className="h-4 w-4 mr-2" />
          Abastecer Stock
        </Button>
      </div>

      {/* Resumen de inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalInventoryPairs}</p>
            <p className="text-sm text-gray-600">Total Pares</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Warehouse className="h-8 w-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold">{inventory.filter(item => item.sizes.some(s => s.locationType === 'warehouse')).length}</p>
            <p className="text-sm text-gray-600">En Bodegas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Store className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{inventory.filter(item => item.sizes.some(s => s.locationType === 'store')).length}</p>
            <p className="text-sm text-gray-600">En Exhibición</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de inventario */}
      <div className="space-y-4">
        {inventory.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
                {/* Imagen del producto */}
                <div className="flex-shrink-0">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={`${item.brand} ${item.model}`}
                      className="w-full lg:w-32 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full lg:w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Información del producto */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{item.brand} {item.model}</h3>
                      <p className="text-gray-600">Ref: {item.reference}</p>
                      <p className="text-sm text-gray-500">Total: {item.totalPairs} pares</p>
                    </div>
                    <div className="flex space-x-2 mt-2 sm:mt-0">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Detalles
                      </Button>
                    </div>
                  </div>

                  {/* Desglose por tallas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {item.sizes.map((sizeInfo, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Talla {sizeInfo.size}</span>
                          <span className="text-sm font-bold">{sizeInfo.quantity}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <div className="flex items-center">
                            {sizeInfo.locationType === 'warehouse' ? 
                              <Warehouse className="h-3 w-3 mr-1" /> : 
                              <Store className="h-3 w-3 mr-1" />
                            }
                            <span>{sizeInfo.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCostsView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-xl font-semibold">Costos Operativos</h2>

      {/* Resumen de costos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Building className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(costs.filter(c => c.type === 'fixed').reduce((sum, c) => sum + c.amount, 0))}</p>
            <p className="text-sm text-gray-600">Costos Fijos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(costs.filter(c => c.type === 'variable').reduce((sum, c) => sum + c.amount, 0))}</p>
            <p className="text-sm text-gray-600">Costos Variables</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
            <p className="text-2xl font-bold">{pendingCosts.length}</p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de costos */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Detalle de Costos - Último Mes</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costs.map((cost) => (
              <div key={cost.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg space-y-2 sm:space-y-0">
                <div className="flex items-start space-x-4">
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
                    <p className="text-sm text-gray-600">{cost.category}</p>
                    {cost.location && (
                      <p className="text-xs text-gray-500">{cost.location}</p>
                    )}
                    {cost.dueDate && (
                      <p className="text-xs text-gray-500">Vence: {formatDate(cost.dueDate)}</p>
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

  const renderAssignmentsView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Gestión de Asignaciones</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Asignación
        </Button>
      </div>

      {/* Tipos de asignaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <Users className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold">Admins a Locales</h3>
          <p className="text-sm text-gray-600">Asignar administradores</p>
        </Card>
        <Card className="text-center p-4">
          <Warehouse className="h-8 w-8 text-secondary mx-auto mb-2" />
          <h3 className="font-semibold">Bodegueros</h3>
          <p className="text-sm text-gray-600">Asignar a bodegas</p>
        </Card>
        <Card className="text-center p-4">
          <Store className="h-8 w-8 text-success mx-auto mb-2" />
          <h3 className="font-semibold">Vendedores</h3>
          <p className="text-sm text-gray-600">Asignar a locales</p>
        </Card>
        <Card className="text-center p-4">
          <Truck className="h-8 w-8 text-warning mx-auto mb-2" />
          <h3 className="font-semibold">Corredores</h3>
          <p className="text-sm text-gray-600">Asignar a locales</p>
        </Card>
      </div>

      {/* Lista de asignaciones actuales */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Asignaciones Actuales</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg space-y-2 sm:space-y-0">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{assignment.userName}</h4>
                    <p className="text-sm text-gray-600">{assignment.userRole}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {assignment.assignedTo.map((location, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {location}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Creado: {formatDate(assignment.createdAt)}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-error hover:text-error">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSupplyView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-xl font-semibold">Abastecer Inventario</h2>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Nuevo Stock</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del producto */}
            <div className="space-y-4">
              <Input label="Referencia" placeholder="Ej: NK-AM90-003" />
              <Input label="Marca" placeholder="Ej: Nike" />
              <Input label="Modelo" placeholder="Ej: Air Max 90" />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen del Producto
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <FileImage className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Subir imagen</p>
                  <input type="file" accept="image/*" className="hidden" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video del Producto (Opcional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Video className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Subir video</p>
                  <input type="file" accept="video/*" className="hidden" />
                </div>
              </div>
            </div>

            {/* Tallas y ubicaciones */}
            <div className="space-y-4">
              <h4 className="font-medium">Tallas y Ubicaciones</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'].map((size) => (
                  <div key={size} className="grid grid-cols-3 gap-2">
                    <Input placeholder={`Talla ${size}`} value={size} disabled />
                    <Input placeholder="Cantidad" type="number" min="0" />
                    <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                      <option value="">Ubicación</option>
                      <option value="bodega-principal">Bodega Principal</option>
                      <option value="bodega-norte">Bodega Norte</option>
                      <option value="local-centro">Local Centro</option>
                      <option value="local-norte">Local Norte</option>
                      <option value="local-sur">Local Sur</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <Button variant="outline">Cancelar</Button>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Agregar al Inventario
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Métricas y Balance Histórico</h2>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline">Hoy</Button>
          <Button size="sm" variant="outline">Semana</Button>
          <Button size="sm" variant="outline">Mes</Button>
        </div>
      </div>

      {/* Métricas principales */}
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

      {/* Gráfico placeholder */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Tendencia de Ventas - Últimos 30 Días</h3>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Gráfico de tendencias aparecerá aquí</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de ventas detalladas */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Ventas Detalladas - Hoy</h3>
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
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Ubicación</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Método</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-4 text-sm">Nike Air Max 90</td>
                  <td className="py-2 px-4 text-sm">9.5</td>
                  <td className="py-2 px-4 text-sm">14:30</td>
                  <td className="py-2 px-4 text-sm">Local Centro</td>
                  <td className="py-2 px-4 text-sm">Exhibición</td>
                  <td className="py-2 px-4 text-sm">Tarjeta</td>
                  <td className="py-2 px-4 text-sm font-medium">{formatCurrency(180000)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-sm">Adidas Ultraboost</td>
                  <td className="py-2 px-4 text-sm">8</td>
                  <td className="py-2 px-4 text-sm">13:15</td>
                  <td className="py-2 px-4 text-sm">Local Norte</td>
                  <td className="py-2 px-4 text-sm">Bodega</td>
                  <td className="py-2 px-4 text-sm">Efectivo</td>
                  <td className="py-2 px-4 text-sm font-medium">{formatCurrency(220000)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-sm">Puma Suede Classic</td>
                  <td className="py-2 px-4 text-sm">10</td>
                  <td className="py-2 px-4 text-sm">12:45</td>
                  <td className="py-2 px-4 text-sm">Local Sur</td>
                  <td className="py-2 px-4 text-sm">Exhibición</td>
                  <td className="py-2 px-4 text-sm">Transferencia</td>
                  <td className="py-2 px-4 text-sm font-medium">{formatCurrency(150000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBalanceView = () => (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-xl font-semibold">Balance Histórico</h2>

      {/* Resumen de balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(89500000)}</p>
            <p className="text-sm text-gray-600">Ingresos Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-8 w-8 text-error mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(totalCosts)}</p>
            <p className="text-sm text-gray-600">Costos Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(89500000 - totalCosts)}</p>
            <p className="text-sm text-gray-600">Utilidad Neta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <PieChart className="h-8 w-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(((89500000 - totalCosts) / 89500000) * 100)}%</p>
            <p className="text-sm text-gray-600">Margen</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de balance */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Balance Mensual</h3>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Gráfico de balance aparecerá aquí</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'inventory': return renderInventoryView();
      case 'costs': return renderCostsView();
      case 'assignments': return renderAssignmentsView();
      case 'supply': return renderSupplyView();
      case 'analytics': return renderAnalyticsView();
      case 'balance': return renderBalanceView();
      default: return renderDashboardView();
    }
  };

  return (
    <DashboardLayout title={
      currentView === 'dashboard' ? 'Panel Ejecutivo - BOSS' :
      currentView === 'inventory' ? 'Gestión de Inventario' :
      currentView === 'costs' ? 'Costos Operativos' :
      currentView === 'assignments' ? 'Gestión de Asignaciones' :
      currentView === 'supply' ? 'Abastecer Inventario' :
      currentView === 'analytics' ? 'Métricas y Análisis' :
      'Balance Histórico'
    }>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation tabs - Solo visible en móvil */}
        <div className="lg:hidden bg-white border-b sticky top-0 z-10">
          <div className="flex overflow-x-auto px-4 py-2 space-x-2">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="h-4 w-4" /> },
              { key: 'inventory', label: 'Inventario', icon: <Package className="h-4 w-4" /> },
              { key: 'costs', label: 'Costos', icon: <DollarSign className="h-4 w-4" /> },
              { key: 'assignments', label: 'Asignaciones', icon: <Users className="h-4 w-4" /> },
              { key: 'supply', label: 'Abastecer', icon: <Upload className="h-4 w-4" /> },
              { key: 'analytics', label: 'Métricas', icon: <PieChart className="h-4 w-4" /> },
              { key: 'balance', label: 'Balance', icon: <Target className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key as BossView)}
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
                  { key: 'dashboard', label: 'Panel Ejecutivo', icon: <BarChart2 className="h-5 w-5" /> },
                  { key: 'inventory', label: 'Gestión de Inventario', icon: <Package className="h-5 w-5" /> },
                  { key: 'costs', label: 'Costos Operativos', icon: <DollarSign className="h-5 w-5" /> },
                  { key: 'assignments', label: 'Gestión de Asignaciones', icon: <Users className="h-5 w-5" /> },
                  { key: 'supply', label: 'Abastecer Inventario', icon: <Upload className="h-5 w-5" /> },
                  { key: 'analytics', label: 'Métricas y Análisis', icon: <PieChart className="h-5 w-5" /> },
                  { key: 'balance', label: 'Balance Histórico', icon: <Target className="h-5 w-5" /> },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setCurrentView(item.key as BossView)}
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