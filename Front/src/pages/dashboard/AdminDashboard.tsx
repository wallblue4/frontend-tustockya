import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  MapPin, 
  Package,
  Plus,
  Edit,
  Eye,
  Store,
  Warehouse,
  ShoppingBag,
  Video,
  Calendar,
  PieChart,
  Activity,
  Building,
  Truck,
  RefreshCw,
  Settings,
  Download
} from 'lucide-react';

// Import ALL correct adminAPI functions
import {
  // Dashboard & Metrics
  fetchAdminDashboard,
  fetchDashboardMetrics,
  
  // Users Management (5 endpoints)
  createUser,
  fetchManagedUsers,
  fetchAvailableLocationsForUsers,
  updateUser,
  
  // Locations Management (2 endpoints)
  fetchManagedLocations,
  fetchLocationStatistics,
  
  // Costs Management (14 endpoints)
  createCostConfiguration,
  fetchCostConfigurations,
  fetchOperationalDashboard,
  fetchCostConfiguration,
  deleteCostConfiguration,
  deactivateCostConfiguration,
  fetchLocationCostDashboard,
  fetchOverdueAlerts,
  fetchUpcomingPayments,
  fetchCostsModuleHealth,
  
  // Wholesale Sales (1 endpoint)
  
  // Reports (1 endpoint)
  generateSalesReports,
  
  // Inventory Alerts (1 endpoint)
  configureInventoryAlert,
  
  // Discounts (2 endpoints)
  fetchPendingDiscountRequests,
  approveDiscountRequest,
  
  // Transfers (1 endpoint)
  fetchTransfersOverview,
  
  // Performance (1 endpoint)
  fetchUsersPerformance,
  
  // Product Assignments (2 endpoints)
  fetchProductAssignments,
  
  // Video Inventory (4 endpoints)
  processVideoInventoryEntry,
  fetchVideoProcessingHistory,
  
  // System (4 endpoints)
  fetchAdminModuleHealth,
  fetchSystemOverview,
  
  // Utilities (4 endpoints)
  testMicroserviceConnection
} from '../../services/adminAPI';

// Import Mayoreo API functions
import {
  crearProductoMayoreo,
  listarProductosMayoreo,
  actualizarProductoMayoreo,
  eliminarProductoMayoreo,
  registrarVentaMayoreo,
  listarVentasMayoreo,
  obtenerVentasProductoMayoreo,
  obtenerEstadisticasMayoreo,
  checkMayoreoHealth
} from '../../services/adminMayoreoAPI';

import { formatCurrency, formatDate, capitalize } from '../../utils/formatters';
import { LoadingSkeleton } from '../../components/admin/LoadingSkeleton';
import { ErrorState, EmptyState } from '../../components/admin/ErrorState';
import { CreateUserModal } from '../../components/admin/CreateUserModal';
import { EditUserModal } from '../../components/admin/EditUserModal';
import { CreateCostModal } from '../../components/admin/CreateCostModal';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { FullScreenCameraCapture } from '../../components/admin/FullScreenCameraCapture';
import { FullScreenPhotoCapture } from '../../components/admin/FullScreenPhotoCapture';

type AdminView = 'dashboard' | 'users' | 'costs' | 'locations' | 'wholesale' | 'notifications' | 'reports' | 'inventory' | 'analytics';

interface DashboardData {
  admin_name: string;
  managed_locations: any[];
  daily_summary: any;
  pending_tasks: any;
  performance_overview: any;
  alerts_summary: any;
  recent_activities: any[];
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  location_id: number | null;
  location_name: string | null;
  is_active: boolean;
  created_at: string;
}
interface Location {
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

interface ProductoMayoreo {
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

interface VentaMayoreo {
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

interface EstadisticasMayoreo {
  success: boolean;
  message: string;
  total_productos: number;
  total_cajas_disponibles: number;
  valor_total_inventario: number;
  total_ventas: number;
  valor_total_ventas: number;
}

interface MetricsData {
  total_sales_today: string;
  total_sales_month: string;
  active_users: number;
  pending_transfers: number;
  low_stock_alerts: number;
  pending_discount_approvals: number;
  avg_performance_score: number;
}

interface OperationalDashboard {
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

export const AdminDashboard: React.FC = () => {
  // Estado para el formulario de inventario por video
  const [videoInventoryForm, setVideoInventoryForm] = useState({
    product_brand: '',
    product_model: '',
    unit_price: 0,
    box_price: 0,
    sizes_distribution: [
      {
        size: '',
        pairs: [{ location_id: 0, quantity: 0 }],
        left_feet: [] as Array<{ location_id: number; quantity: number }>,
        right_feet: [] as Array<{ location_id: number; quantity: number }>
      }
    ],
    reference_image: null as File | null,
    video_file: null as File | null
  });
  
  // Estados para preview de archivos capturados
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);
  
  // Limpiar URLs de blob al desmontar el componente para evitar memory leaks
  React.useEffect(() => {
    return () => {
      if (capturedPhotoUrl) {
        URL.revokeObjectURL(capturedPhotoUrl);
      }
      if (capturedVideoUrl) {
        URL.revokeObjectURL(capturedVideoUrl);
      }
    };
  }, [capturedPhotoUrl, capturedVideoUrl]);
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states with proper typing
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [operationalData, setOperationalData] = useState<OperationalDashboard | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [wholesaleOrders] = useState<WholesaleOrder[]>([]);
  const [notifications, setNotifications] = useState<Notifications>({
    discounts: [],
    returns: [],
    inventory: []
  });

  // Mayoreo states
  const [productosMayoreo, setProductosMayoreo] = useState<ProductoMayoreo[]>([]);
  const [ventasMayoreo, setVentasMayoreo] = useState<VentaMayoreo[]>([]);
  const [estadisticasMayoreo, setEstadisticasMayoreo] = useState<EstadisticasMayoreo | null>(null);
  const [selectedProductoMayoreo, setSelectedProductoMayoreo] = useState<ProductoMayoreo | null>(null);

  // Modal states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showCreateCostModal, setShowCreateCostModal] = useState(false);
  const [showCreateProductoMayoreoModal, setShowCreateProductoMayoreoModal] = useState(false);
  const [showEditProductoMayoreoModal, setShowEditProductoMayoreoModal] = useState(false);
  const [showRegistrarVentaMayoreoModal, setShowRegistrarVentaMayoreoModal] = useState(false);
  const [showVentasProductoModal, setShowVentasProductoModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Filter states
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '' as '' | 'vendedor' | 'bodeguero' | 'corredor',
    location: '',
    status: ''
  });

  const [costFilters, setCostFilters] = useState({
    search: '',
    category: '' as '' | 'arriendo' | 'servicios' | 'nomina' | 'mercancia' | 'comisiones' | 'transporte' | 'otros',
    location: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentView === 'users') {
      loadUsers();
    } else if (currentView === 'costs') {
      loadCosts();
    } else if (currentView === 'notifications') {
      loadNotifications();
    } else if (currentView === 'wholesale') {
      loadMayoreoData();
    }
  }, [currentView]);

  // Actualiza usuarios cuando cambian los filtros
  useEffect(() => {
    if (currentView === 'users') {
      loadUsers();
    }
  }, [userFilters, currentView]);

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
      const [dashboardResponse, metricsResponse] = await Promise.all([
        fetchAdminDashboard().catch(err => {
          console.warn('Dashboard endpoint failed:', err);
          return null;
        }),
        fetchDashboardMetrics().catch(err => {
          console.warn('Metrics endpoint failed:', err);
          return null;
        })
      ]);
      
      if (dashboardResponse) {
        setDashboardData(dashboardResponse);
      }
      
      if (metricsResponse) {
        setMetricsData(metricsResponse);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty data on error
      setDashboardData(null);
      setMetricsData(null);
    }
  };

  const loadUsers = async () => {
    try {
      const params: any = {};
      
      if (userFilters.role) {
        params.role = userFilters.role;
      }
      
      if (userFilters.location && userFilters.location !== '') {
        params.location_id = parseInt(userFilters.location);
      }
      
      if (userFilters.status && userFilters.status !== '') {
        params.is_active = userFilters.status === 'active';
      }

      const response = await fetchManagedUsers(params);
      // Handle array response directly or nested in response object
      setUsers(Array.isArray(response) ? response : response.users || response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadCosts = async () => {
    try {
      const response = await fetchOperationalDashboard();
      setOperationalData(response);
    } catch (error) {
      console.error('Error loading operational dashboard:', error);
      setOperationalData(null);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await fetchManagedLocations();
      // Handle array response directly or nested in response object
      setLocations(Array.isArray(response) ? response : response.locations || response.data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      setLocations([]);
    }
  };

  const loadAvailableLocations = async () => {
    try {
      const response = await fetchAvailableLocationsForUsers();
      // Handle array response directly or nested in response object
      setAvailableLocations(Array.isArray(response) ? response : response.locations || response.data || []);
    } catch (error) {
      console.error('Error loading available locations:', error);
      setAvailableLocations([]);
    }
  };

  const loadNotifications = async () => {
    try {
      const discountsResponse = await fetchPendingDiscountRequests();
      
      setNotifications({
        discounts: Array.isArray(discountsResponse) ? discountsResponse : discountsResponse.requests || discountsResponse.data || [],
        returns: [], // No endpoint available yet
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
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        location_id: userData.location_id ? parseInt(userData.location_id) : undefined
      });
      
      await loadUsers();
      setShowCreateUserModal(false);
      alert('Usuario creado exitosamente');
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert('Error al crear usuario: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleUpdateUser = async (userId: number, userData: any) => {
    try {
      await updateUser(userId, {
        first_name: userData.first_name,
        last_name: userData.last_name,
        is_active: userData.is_active,
        location_id: userData.location_id ? parseInt(userData.location_id) : undefined
      });
      await loadUsers();
      setEditingUser(null);
      setShowEditUserModal(false);
      alert('Usuario actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('Error al actualizar usuario: ' + (error.message || 'Error desconocido'));
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
    } catch (error: any) {
      console.error('Error processing discount:', error);
      alert('Error al procesar descuento: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleCreateInventoryAlert = async (alertData: any) => {
    try {
      await configureInventoryAlert({
        location_id: alertData.locationId,
        alert_type: alertData.alertType,
        threshold_value: alertData.thresholdValue,
        product_reference: alertData.productReference,
        notification_emails: alertData.notificationEmails,
        is_active: alertData.isActive ?? true
      });
      
      alert('Alerta de inventario configurada exitosamente');
    } catch (error: any) {
      console.error('Error creating inventory alert:', error);
      alert('Error al configurar alerta: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleCreateCost = async (costData: any) => {
    try {
      // Validar que location_id sea válido
      if (!costData.location_id) {
        alert('Por favor selecciona una ubicación válida');
        return;
      }

      // Mapear los datos del modal al formato que espera la API
      const apiData = {
        location_id: parseInt(costData.location_id.toString()),
        cost_type: mapCostTypeToAPI(costData.category),
        amount: parseFloat(costData.amount.toString()),
        frequency: mapFrequencyToAPI(costData.frequency),
        description: costData.description,
        start_date: new Date().toISOString().split('T')[0], // Default to today
        end_date: costData.due_date || undefined
      };

      console.log('Enviando datos al API:', apiData);
      
      const response = await createCostConfiguration(apiData);
      
      console.log('Respuesta del API:', response);
      
      // Verificar si la respuesta indica éxito
      if (response && (response.id || response.success !== false)) {
        await loadCosts();
        setShowCreateCostModal(false);
        alert(`¡Costo registrado exitosamente!\n\nID: ${response.id}\nDescripción: ${response.description}\nMonto: ${formatCurrency(parseFloat(response.amount))}\nTipo: ${capitalize(response.cost_type)}`);
      } else {
        throw new Error('La respuesta del servidor no indica éxito');
      }
    } catch (error: any) {
      console.error('Error creating cost:', error);
      alert('Error al registrar costo: ' + (error.message || 'Error desconocido'));
    }
  };


  const handleDeleteCost = async (costId: number, forceDelete = false) => {
    try {
      const confirmation = window.confirm('¿Estás seguro de que deseas eliminar este costo?');
      if (!confirmation) return;

      await deleteCostConfiguration(costId, forceDelete);
      await loadCosts();
      alert('Costo eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting cost:', error);
      alert('Error al eliminar costo: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDeactivateCost = async (costId: number, endDate?: string) => {
    try {
      await deactivateCostConfiguration(costId, endDate);
      await loadCosts();
      alert('Costo desactivado exitosamente');
    } catch (error: any) {
      console.error('Error deactivating cost:', error);
      alert('Error al desactivar costo: ' + (error.message || 'Error desconocido'));
    }
  };

  // Helper functions para mapear datos del modal a la API
  const mapCostTypeToAPI = (category: string): 'arriendo' | 'servicios' | 'nomina' | 'mercancia' | 'comisiones' | 'transporte' | 'otros' => {
    const mapping: Record<string, typeof mapCostTypeToAPI extends (x: any) => infer R ? R : never> = {
      // Costos Fijos
      'Arriendo': 'arriendo',
      'Servicios Públicos': 'servicios',
      'Internet': 'servicios',
      'Seguros': 'otros',
      'Nómina': 'nomina',
      'Otros Fijos': 'otros',
      // Costos Variables
      'Mercancía': 'mercancia',
      'Transporte': 'transporte',
      'Publicidad': 'otros',
      'Mantenimiento': 'otros',
      'Suministros': 'otros',
      'Otros Variables': 'otros'
    };
    return mapping[category] || 'otros';
  };

  const mapFrequencyToAPI = (frequency: string): 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' => {
    const mapping: Record<string, typeof mapFrequencyToAPI extends (x: any) => infer R ? R : never> = {
      'diario': 'daily',
      'semanal': 'weekly', 
      'mensual': 'monthly',
      'trimestral': 'quarterly',
      'anual': 'annual'
    };
    return mapping[frequency] || 'monthly';
  };

  const handleVideoInventoryEntry = async (videoData: {
    unit_price: number;
    product_brand?: string;
    product_model?: string;
    box_price?: number;
    sizes_distribution: Array<{
      size: string;
      pairs: Array<{ location_id: number; quantity: number }>;
      left_feet: Array<{ location_id: number; quantity: number }>;
      right_feet: Array<{ location_id: number; quantity: number }>;
    }>;
    video_file: File | null;
    reference_image?: File | null;
  }) => {
    try {
      // Validar que hay un video
      if (!videoData.video_file) {
        alert('❌ Error: No se encontró el archivo de video');
        return;
      }

      // Validar y preparar la distribución de tallas
      const validSizesDistribution = videoData.sizes_distribution.filter(sd => {
        // Verificar que la talla no esté vacía
        if (!sd.size.trim()) return false;
        
        // Verificar que haya al menos una distribución válida
        const hasPairs = sd.pairs.some(p => p.location_id > 0 && p.quantity > 0);
        const hasLeftFeet = sd.left_feet.some(lf => lf.location_id > 0 && lf.quantity > 0);
        const hasRightFeet = sd.right_feet.some(rf => rf.location_id > 0 && rf.quantity > 0);
        
        return hasPairs || (hasLeftFeet && hasRightFeet);
      });
      
      if (validSizesDistribution.length === 0) {
        alert('❌ Por favor ingresa al menos una talla con distribución válida');
        return;
      }

      // Validar balance de pies izquierdos y derechos por talla
      for (const sizeDistro of validSizesDistribution) {
        const totalLeftFeet = sizeDistro.left_feet.reduce((sum, lf) => sum + lf.quantity, 0);
        const totalRightFeet = sizeDistro.right_feet.reduce((sum, rf) => sum + rf.quantity, 0);
        
        if (totalLeftFeet !== totalRightFeet) {
          alert(`❌ Error en talla ${sizeDistro.size}: El total de pies izquierdos (${totalLeftFeet}) debe ser igual al total de pies derechos (${totalRightFeet})`);
          return;
        }
      }

      // Convertir a formato JSON requerido por el endpoint
      const sizesDistributionJson = JSON.stringify(
        validSizesDistribution.map(sd => ({
          size: sd.size.trim(),
          pairs: sd.pairs.filter(p => p.location_id > 0 && p.quantity > 0).map(p => ({
            location_id: p.location_id,
            quantity: p.quantity
          })),
          left_feet: sd.left_feet.filter(lf => lf.location_id > 0 && lf.quantity > 0).map(lf => ({
            location_id: lf.location_id,
            quantity: lf.quantity
          })),
          right_feet: sd.right_feet.filter(rf => rf.location_id > 0 && rf.quantity > 0).map(rf => ({
            location_id: rf.location_id,
            quantity: rf.quantity
          }))
        }))
      );

      const inventoryPayload = {
        sizes_distribution_json: sizesDistributionJson,
        unit_price: videoData.unit_price,
        video_file: videoData.video_file,
        product_brand: videoData.product_brand || '',
        product_model: videoData.product_model || '',
        box_price: videoData.box_price || 0,
        notes: '',
        reference_image: videoData.reference_image && videoData.reference_image instanceof File ? videoData.reference_image : null
      };

      console.log('Enviando datos de inventario con distribución:', inventoryPayload);
      console.log('JSON de distribución:', sizesDistributionJson);
      
      const response = await processVideoInventoryEntry(inventoryPayload);
      
      console.log('Respuesta del servidor:', response);
      
      // Verificar si la respuesta indica éxito
      if (response && (response.success || response.product_id)) {
        const distributionSummary = response.distribution_summary || [];
        
        alert(`¡Inventario registrado exitosamente con distribución! 🎉

📦 Producto: ${response.brand || videoData.product_brand || 'N/A'} ${response.model || videoData.product_model || 'N/A'}
🏷️ Código: ${response.reference_code}
📊 Total de Zapatos: ${response.total_shoes || 0}
📍 Ubicaciones: ${response.locations_count || distributionSummary.length}
💰 Precio Unitario: ${formatCurrency(response.unit_price || videoData.unit_price)}
${response.box_price ? `📦 Precio por Caja: ${formatCurrency(response.box_price)}` : ''}

${distributionSummary.length > 0 ? `Distribución por ubicación:
${distributionSummary.map((ds: any) => `• ${ds.location_name}: ${ds.total_pairs} pares${ds.total_left_feet ? ` + ${ds.total_left_feet} izq` : ''}${ds.total_right_feet ? ` + ${ds.total_right_feet} der` : ''}`).join('\n')}` : ''}

${response.processing_time_seconds ? `Procesado en ${response.processing_time_seconds}s` : ''}`);
      } else {
        throw new Error('La respuesta del servidor no indica éxito');
      }
    } catch (error: any) {
      console.error('Error processing video inventory:', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al procesar inventario por video';
      
      if (error.message && error.message.includes('ValidationError')) {
        errorMessage = `⚠️ Error en el servidor: El backend procesó tu petición pero hay un problema en la respuesta.
        
📋 Esto significa que:
• Tu video y datos fueron recibidos correctamente
• El procesamiento de IA se ejecutó
• Hay un error en el formato de respuesta del servidor

🔧 El equipo técnico debe revisar la configuración del endpoint.
        
Error técnico: ${error.message}`;
      } else if (error.message && error.message.includes('Field required')) {
        errorMessage = `🔧 Error de configuración del servidor: Falta un campo en la respuesta.
        
Tu inventario puede haberse procesado correctamente, pero el servidor no puede devolver la respuesta completa.
        
Detalle técnico: ${error.message}`;
      } else if (error.message && error.message.includes('balance')) {
        errorMessage = `⚠️ Error de balance: ${error.message}
        
Por favor verifica que:
• El total de pies izquierdos sea igual al de pies derechos para cada talla
• Todas las ubicaciones especificadas existan
• Tengas permisos sobre todas las ubicaciones`;
      } else {
        errorMessage = `❌ Error al procesar inventario: ${error.message || 'Error desconocido'}`;
      }
      
      alert(errorMessage);
    }
  };

  // ========== MAYOREO FUNCTIONS ==========

  const loadMayoreoData = async () => {
    try {
      setLoading(true);
      const [productos, ventas, estadisticas] = await Promise.all([
        listarProductosMayoreo().catch(err => {
          console.warn('Error loading productos mayoreo:', err);
          return { data: [] };
        }),
        listarVentasMayoreo().catch(err => {
          console.warn('Error loading ventas mayoreo:', err);
          return { data: [] };
        }),
        obtenerEstadisticasMayoreo().catch(err => {
          console.warn('Error loading estadisticas mayoreo:', err);
          return null;
        })
      ]);

      setProductosMayoreo(Array.isArray(productos) ? productos : productos.data || []);
      setVentasMayoreo(Array.isArray(ventas) ? ventas : ventas.data || []);
      setEstadisticasMayoreo(estadisticas);
    } catch (error) {
      console.error('Error loading mayoreo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProductoMayoreo = async (productoData: {
    modelo: string;
    cantidad_cajas_disponibles: number;
    pares_por_caja: number;
    precio: number;
    foto?: File | null;
    tallas?: string;
  }) => {
    try {
      await crearProductoMayoreo(productoData);
      await loadMayoreoData();
      setShowCreateProductoMayoreoModal(false);
      alert('✅ Producto de mayoreo creado exitosamente');
    } catch (error: any) {
      console.error('Error creating producto mayoreo:', error);
      alert('❌ Error al crear producto: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleUpdateProductoMayoreo = async (mayoreoId: number, productoData: {
    modelo?: string;
    cantidad_cajas_disponibles?: number;
    pares_por_caja?: number;
    precio?: number;
    foto?: File | null;
    tallas?: string;
    is_active?: boolean;
  }) => {
    try {
      await actualizarProductoMayoreo(mayoreoId, productoData);
      await loadMayoreoData();
      setShowEditProductoMayoreoModal(false);
      setSelectedProductoMayoreo(null);
      alert('✅ Producto actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating producto mayoreo:', error);
      alert('❌ Error al actualizar producto: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDeleteProductoMayoreo = async (mayoreoId: number) => {
    try {
      const confirmation = window.confirm('¿Estás seguro de que deseas eliminar este producto de mayoreo?');
      if (!confirmation) return;

      await eliminarProductoMayoreo(mayoreoId);
      await loadMayoreoData();
      alert('✅ Producto eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting producto mayoreo:', error);
      alert('❌ Error al eliminar producto: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleRegistrarVentaMayoreo = async (ventaData: {
    mayoreo_id: number;
    cantidad_cajas_vendidas: number;
    precio_unitario_venta: number;
    notas?: string;
  }) => {
    try {
      const response = await registrarVentaMayoreo(ventaData);
      await loadMayoreoData();
      setShowRegistrarVentaMayoreoModal(false);
      setSelectedProductoMayoreo(null);
      
      alert(`✅ Venta registrada exitosamente!

📦 Cajas vendidas: ${response.cantidad_cajas_vendidas}
💰 Precio unitario: ${formatCurrency(response.precio_unitario_venta)}
💵 Total venta: ${formatCurrency(response.total_venta)}
📅 Fecha: ${formatDate(response.fecha_venta)}`);
    } catch (error: any) {
      console.error('Error registrando venta mayoreo:', error);
      alert('❌ Error al registrar venta: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleVerVentasProducto = async (mayoreoId: number) => {
    try {
      const response = await obtenerVentasProductoMayoreo(mayoreoId);
      const ventas = Array.isArray(response) ? response : response.data || [];
      
      if (ventas.length === 0) {
        alert('ℹ️ Este producto no tiene ventas registradas');
      } else {
        setVentasMayoreo(ventas);
        setShowVentasProductoModal(true);
      }
    } catch (error: any) {
      console.error('Error obteniendo ventas del producto:', error);
      alert('❌ Error al obtener ventas: ' + (error.message || 'Error desconocido'));
    }
  };

  const renderDashboardView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">Panel de Administración</h2>
          <Button onClick={() => loadDashboardData()} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Ventas Hoy"
            value={metricsData?.total_sales_today ? formatCurrency(parseFloat(metricsData.total_sales_today)) : formatCurrency(0)}
            icon={<DollarSign className="h-6 w-6" />}
          />
          <StatsCard
            title="Ventas del Mes"
            value={metricsData?.total_sales_month ? formatCurrency(parseFloat(metricsData.total_sales_month)) : formatCurrency(0)}
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatsCard
            title="Usuarios Activos"
            value={metricsData?.active_users?.toString() || '0'}
            icon={<Users className="h-6 w-6" />}
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

        {/* Admin Dashboard Data */}
        {dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Ubicaciones Gestionadas</h3>
              </CardHeader>
              <CardContent>
                {dashboardData.managed_locations?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.managed_locations.map((location, index) => (
                      <div key={index} className=" flex items-center justify-between p-3 bg-card rounded-lg">
                        <div>
                          <p className="font-medium">{location.location_name}</p>
                          <p className="text-sm text-gray-600">{location.location_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(parseFloat(location.daily_sales || 0))}</p>
                          <p className="text-xs text-gray-500">Ventas diarias</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    title="No hay ubicaciones asignadas"
                    description="No tienes ubicaciones bajo tu gestión"
                    icon={<Store className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </CardContent>
            </Card> 
          </div>
        )}

        {/* Alerts Summary */}
        {metricsData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold">{metricsData.low_stock_alerts}</p>
                <p className="text-sm text-gray-600">Alertas de Stock Bajo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Bell className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{metricsData.pending_discount_approvals}</p>
                <p className="text-sm text-gray-600">Descuentos Pendientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold">{metricsData.avg_performance_score.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Score Promedio</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderUsersView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h2>
          <Button onClick={() => setShowCreateUserModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Usuario
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Filtros de usuarios</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <h4>Tipo de usuario</h4>
              <Select
                value={userFilters.role}
                onChange={(e) => {
                  const role = e.target.value as '' | 'vendedor' | 'bodeguero' | 'corredor';
                  setUserFilters(prev => ({ ...prev, role }));
                }}
                options={[
                  { value: '', label: 'Todos los roles' },
                  { value: 'vendedor', label: 'Vendedor' },
                  { value: 'bodeguero', label: 'Bodeguero' },
                  { value: 'corredor', label: 'Corredor' },
                ]}
              />
              <h4>Ubicación</h4>
              <Select
                value={userFilters.location}
                onChange={(e) => {
                  setUserFilters(prev => ({ ...prev, location: e.target.value }));
                }}
                options={[
                  { value: '', label: 'Todas las ubicaciones' },
                  ...locations.map(location => ({ value: location.id.toString(), label: location.name }))
                ]}
              />
              <h4>Estado</h4>
              <Select
                value={userFilters.status}
                onChange={(e) => {
                  setUserFilters(prev => ({ ...prev, status: e.target.value }));
                }}
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: 'active', label: 'Activo' },
                  { value: 'inactive', label: 'Inactivo' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {users.length > 0 ? (
              <div className="overflow-x-auto">
                  <table className="w-full bg-card text-foreground border border-border rounded-lg overflow-hidden">
                    <thead className="bg-popover text-popover-foreground">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Ubicación</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-border last:border-b-0 bg-card hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-foreground">{user.full_name}</p>
                              <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="secondary">
                              {capitalize(user.role)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
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
      <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold text-foreground">Gestión de Costos</h2>
          <Button onClick={() => setShowCreateCostModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Costo
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <Select
                 value={costFilters.category}
                 onChange={(e) => {
                   const category = e.target.value as typeof costFilters.category;
                   setCostFilters(prev => ({ ...prev, category }));
                 }}
                 options={[
                   { value: '', label: 'Todas las categorías' },
                   { value: 'arriendo', label: 'Arriendo' },
                   { value: 'servicios', label: 'Servicios' },
                   { value: 'nomina', label: 'Nómina' },
                   { value: 'mercancia', label: 'Mercancía' },
                   { value: 'comisiones', label: 'Comisiones' },
                   { value: 'transporte', label: 'Transporte' },
                   { value: 'otros', label: 'Otros' },
                 ]}
               />
               <Select
                 value={costFilters.location}
                 onChange={(e) => {
                   setCostFilters(prev => ({ ...prev, location: e.target.value }));
                 }}
                 options={[
                   { value: '', label: 'Todas las ubicaciones' },
                   ...locations.map(location => ({ value: location.id.toString(), label: location.name }))
                 ]}
               />
              <Button onClick={() => loadCosts()} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

         {/* Costs Summary */}
         {operationalData && (
           <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
             <Card>
               <CardContent className="p-4 text-center">
                 <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                 <p className="text-2xl font-bold">
                   {formatCurrency(parseFloat(operationalData.monthly_summary.total_monthly_costs))}
                 </p>
                 <p className="text-sm text-gray-600">Costos Mensuales</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-4 text-center">
                 <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
                 <p className="text-2xl font-bold">
                   {formatCurrency(parseFloat(operationalData.summary.total_overdue_amount))}
                 </p>
                 <p className="text-sm text-gray-600">Monto Vencido</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-4 text-center">
                 <BarChart3 className="h-8 w-8 text-warning mx-auto mb-2" />
                 <p className="text-2xl font-bold">{operationalData.summary.critical_alerts_count}</p>
                 <p className="text-sm text-gray-600">Alertas Críticas</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-4 text-center">
                 <Building className="h-8 w-8 text-success mx-auto mb-2" />
                 <p className="text-2xl font-bold">{operationalData.summary.total_locations}</p>
                 <p className="text-sm text-gray-600">Ubicaciones</p>
               </CardContent>
             </Card>
           </div>
         )}

        {/* Estado por Ubicaciones */}
        {operationalData && (() => {
          // Aplicar filtro por ubicación si está seleccionado
          let filteredLocations = operationalData.locations_status;
          
          if (costFilters.location) {
            const selectedLocation = locations.find(loc => loc.id.toString() === costFilters.location);
            if (selectedLocation) {
              filteredLocations = filteredLocations.filter(location => location.location_name === selectedLocation.name);
            }
          }
          
          return filteredLocations.length > 0 ? (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground">
                  Estado de Costos por Ubicación
                  {costFilters.location && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      (Filtrado: {filteredLocations.length} de {operationalData.locations_status.length})
                    </span>
                  )}
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLocations.map((location) => (
                    <div key={location.location_id} className={`p-4 rounded-lg border-l-4 bg-card text-foreground border-border ${
                      location.status === 'ok' ? 'border-success' :
                      location.status === 'attention' ? 'border-warning' :
                      'border-error'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-foreground">{location.location_name}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Costos Mensuales</p>
                              <p className="font-semibold text-foreground">{formatCurrency(parseFloat(location.monthly_costs))}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Monto Vencido</p>
                              <p className="font-semibold text-error">{formatCurrency(parseFloat(location.overdue_amount))}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Cuentas Vencidas</p>
                              <p className="font-semibold text-foreground">{location.overdue_count}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Próximos Pagos</p>
                              <p className="font-semibold text-foreground">{location.upcoming_count}</p>
                            </div>
                          </div>
                        </div>
                        <Badge variant={
                          location.status === 'ok' ? 'success' :
                          location.status === 'attention' ? 'warning' : 'error'
                        }>
                          {location.status === 'ok' ? 'OK' :
                           location.status === 'attention' ? 'Atención' : 'Crítico'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  title="No hay ubicaciones"
                  description="No se encontraron ubicaciones con los filtros aplicados"
                  icon={<Building className="h-12 w-12 text-gray-400" />}
                />
              </CardContent>
            </Card>
          );
        })()}

        {/* Pagos Próximos */}
        {operationalData && (() => {
          // Aplicar filtros a los pagos próximos
          let filteredUpcoming = operationalData.upcoming_week;
          
          // Filtro por tipo de costo
          if (costFilters.category) {
            filteredUpcoming = filteredUpcoming.filter(payment => payment.cost_type === costFilters.category);
          }
          
          // Filtro por ubicación
          if (costFilters.location) {
            const selectedLocation = locations.find(loc => loc.id.toString() === costFilters.location);
            if (selectedLocation) {
              filteredUpcoming = filteredUpcoming.filter(payment => payment.location_name === selectedLocation.name);
            }
          }
          
          return filteredUpcoming.length > 0 ? (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center text-foreground">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Pagos Próximos (Esta Semana)
                  {(costFilters.category || costFilters.location) && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      (Filtrados: {filteredUpcoming.length} de {operationalData.upcoming_week.length})
                    </span>
                  )}
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredUpcoming.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-card text-foreground border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{payment.location_name}</p>
                        <p className="text-sm text-muted-foreground">{capitalize(payment.cost_type)}</p>
                        <p className="text-xs text-muted-foreground">Vence: {formatDate(payment.due_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatCurrency(parseFloat(payment.amount))}</p>
                        <p className="text-sm text-primary">
                          {payment.days_until_due === 0 ? 'Hoy' : 
                           payment.days_until_due === 1 ? 'Mañana' : 
                           `En ${payment.days_until_due} días`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null;
        })()}

        {/* Alertas Críticas */}
        {operationalData && (() => {
          // Aplicar filtros a las alertas críticas
          let filteredAlerts = operationalData.critical_alerts;
          
          // Filtro por tipo de costo
          if (costFilters.category) {
            filteredAlerts = filteredAlerts.filter(alert => alert.cost_type === costFilters.category);
          }
          
          // Filtro por ubicación
          if (costFilters.location) {
            const selectedLocation = locations.find(loc => loc.id.toString() === costFilters.location);
            if (selectedLocation) {
              filteredAlerts = filteredAlerts.filter(alert => alert.location_name === selectedLocation.name);
            }
          }
          
          return filteredAlerts.length > 0 ? (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center text-foreground">
                  <AlertCircle className="h-5 w-5 mr-2 text-error" />
                  Alertas Críticas - Pagos Vencidos
                  {(costFilters.category || costFilters.location) && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      (Filtradas: {filteredAlerts.length} de {operationalData.critical_alerts.length})
                    </span>
                  )}
                </h3>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full bg-card text-foreground border border-border rounded-lg overflow-hidden">
                    <thead className="bg-popover text-popover-foreground">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ubicación</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tipo de Costo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Días Vencido</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha Vencimiento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Prioridad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAlerts.map((alert, index) => (
                        <tr key={index} className={
                          alert.priority === 'high' ? 'bg-error/10' : 
                          alert.priority === 'medium' ? 'bg-warning/10' : 'bg-muted/10'
                        }>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="font-medium text-foreground">{alert.location_name}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className="bg-accent text-accent-foreground border border-border">{capitalize(alert.cost_type)}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-error">
                            {formatCurrency(parseFloat(alert.amount))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-error">
                            {alert.days_overdue} días
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatDate(alert.due_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              alert.priority === 'high' ? 'error' :
                              alert.priority === 'medium' ? 'warning' : 'secondary'
                            }>
                              {alert.priority === 'high' ? 'Alta' :
                               alert.priority === 'medium' ? 'Media' : 'Baja'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  title="No hay alertas críticas"
                  description={
                    (costFilters.category || costFilters.location) 
                      ? "No se encontraron alertas con los filtros aplicados"
                      : "No hay alertas críticas en este momento"
                  }
                  icon={<AlertCircle className="h-12 w-12 text-gray-400" />}
                />
              </CardContent>
            </Card>
          );
        })()}

        {/* Estado sin datos */}
        {!operationalData && (
          <Card>
            <CardContent>
              <EmptyState
                title="Cargando información de costos"
                description="Esperando datos del dashboard operacional"
                icon={<DollarSign className="h-12 w-12 text-gray-400" />}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderLocationsView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold">Gestión de Ubicaciones</h2>
          <Button onClick={() => loadLocations()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Location Types Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{locations.filter(l => l.is_active).length}</p>
              <p className="text-sm text-gray-600">Activas</p>
            </CardContent>
          </Card>
        </div>

        {/* Locations List */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Ubicaciones Gestionadas</h3>
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
                        <p className="text-sm text-gray-600">{location.address || 'Sin dirección'}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={location.type === 'local' ? 'primary' : 'secondary'}>
                            {location.type === 'local' ? 'Local' : 'Bodega'}
                          </Badge>
                          <Badge variant={location.is_active ? 'success' : 'error'}>
                            {location.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {location.assigned_users_count} usuarios
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(parseFloat(location.total_inventory_value))}</p>
                      <p className="text-xs text-gray-500">{location.total_products} productos</p>
                      <div className="flex space-x-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            try {
                              const stats = await fetchLocationStatistics(
                                location.id, 
                                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                new Date().toISOString().split('T')[0]
                              );
                              console.log('Location stats:', stats);
                              alert('Ver estadísticas en consola por ahora');
                            } catch (error) {
                              console.error('Error fetching location stats:', error);
                              alert('Error al obtener estadísticas');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Stats
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay ubicaciones"
                description="No se encontraron ubicaciones bajo tu gestión"
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
    ].sort((a, b) => new Date(b.requested_at || b.created_at).getTime() - new Date(a.requested_at || a.created_at).getTime());

    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Notificaciones</h2>
          <Button onClick={() => loadNotifications()} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
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
                          <Badge variant={
                            notification.status === 'pending' ? 'warning' :
                            notification.status === 'approved' ? 'success' : 'error'
                          }>
                            {notification.status === 'pending' ? 'Pendiente' :
                             notification.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {notification.reason || notification.message || notification.notes}
                        </p>
                        {notification.requester_name && (
                          <p className="text-sm text-gray-600">Solicitado por: {notification.requester_name}</p>
                        )}
                        {notification.location_name && (
                          <p className="text-sm text-gray-600">Ubicación: {notification.location_name}</p>
                        )}
                        {notification.discount_amount && (
                          <p className="text-sm font-medium">Descuento: {formatCurrency(parseFloat(notification.discount_amount))}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(notification.requested_at || notification.created_at)}
                        </p>
                      </div>
                      {notification.type === 'discount' && notification.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-success border-success hover:bg-success hover:text-white"
                            onClick={() => handleApproveDiscount(notification.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-error border-error hover:bg-error hover:text-white"
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

  const renderInventoryView = () => {
  // ...el estado ahora está en el componente principal...

    return (
      <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-xl font-semibold text-foreground">Gestión de Inventario</h2>
        </div>
        
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Registrar Inventario</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna 1: Datos del Producto */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground mb-3">Datos del Producto</h4>
                
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Marca 
                  </label>
                  <Input 
                    placeholder="Ej: Nike, Adidas" 
                    value={videoInventoryForm.product_brand}
                    onChange={(e) => setVideoInventoryForm(prev => ({ ...prev, product_brand: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Marca del producto</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Modelo
                  </label>
                  <Input 
                    placeholder="Ej: Air Max 90" 
                    value={videoInventoryForm.product_model}
                    onChange={(e) => setVideoInventoryForm(prev => ({ ...prev, product_model: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Modelo del producto</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Precio Unitario <span className="text-error">*</span>
                  </label>
                  <Input 
                    placeholder="Ej: 45000" 
                    type="number"
                    value={videoInventoryForm.unit_price}
                    onChange={(e) => setVideoInventoryForm(prev => ({ ...prev, unit_price: parseFloat(e.target.value) }))}
                    min="0"
                    step="1000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Precio por unidad individual</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Distribución de Tallas <span className="text-error">*</span>
                  </label>
                  <div className="space-y-4 max-h-96 overflow-y-auto p-3 border border-border rounded-md bg-muted/5">
                    {videoInventoryForm.sizes_distribution.map((sizeDistro, sizeIdx) => (
                      <div key={sizeIdx} className="border border-border rounded-lg p-4 bg-card space-y-3">
                        {/* Talla Header */}
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Talla (ej: 42)"
                            value={sizeDistro.size}
                            onChange={e => {
                              const newDistro = [...videoInventoryForm.sizes_distribution];
                              newDistro[sizeIdx].size = e.target.value;
                              setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                            }}
                            className="w-32"
                          />
                          <div className="flex-1 text-sm text-muted-foreground">
                            Balance: {sizeDistro.left_feet.reduce((s, lf) => s + lf.quantity, 0)} izq / {sizeDistro.right_feet.reduce((s, rf) => s + rf.quantity, 0)} der
                            {sizeDistro.left_feet.reduce((s, lf) => s + lf.quantity, 0) !== sizeDistro.right_feet.reduce((s, rf) => s + rf.quantity, 0) && (
                              <span className="text-error ml-2">⚠️ Desbalanceado</span>
                            )}
                          </div>
                          {videoInventoryForm.sizes_distribution.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setVideoInventoryForm(prev => ({
                                  ...prev,
                                  sizes_distribution: prev.sizes_distribution.filter((_, i) => i !== sizeIdx)
                                }));
                              }}
                              className="text-destructive"
                            >
                              🗑️
                            </Button>
                          )}
                        </div>

                        {/* Pares Completos */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-foreground">👟 Pares Completos</label>
                          {sizeDistro.pairs.map((pair, pairIdx) => (
                            <div key={pairIdx} className="flex items-center gap-2">
                              <Select
                                value={pair.location_id.toString()}
                                onChange={(e) => {
                                  const newDistro = [...videoInventoryForm.sizes_distribution];
                                  newDistro[sizeIdx].pairs[pairIdx].location_id = parseInt(e.target.value);
                                  setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                                }}
                                options={[
                                  { value: '0', label: 'Seleccionar ubicación' },
                                  ...locations.map(loc => ({ value: loc.id.toString(), label: loc.name }))
                                ]}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Cant"
                                type="number"
                                value={pair.quantity || ''}
                                onChange={e => {
                                  const newDistro = [...videoInventoryForm.sizes_distribution];
                                  newDistro[sizeIdx].pairs[pairIdx].quantity = parseInt(e.target.value) || 0;
                                  setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                                }}
                                className="w-20"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newDistro = [...videoInventoryForm.sizes_distribution];
                                  newDistro[sizeIdx].pairs.push({ location_id: 0, quantity: 0 });
                                  setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                                }}
                              >
                                +
                              </Button>
                              {sizeDistro.pairs.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const newDistro = [...videoInventoryForm.sizes_distribution];
                                    newDistro[sizeIdx].pairs = newDistro[sizeIdx].pairs.filter((_, i) => i !== pairIdx);
                                    setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                                  }}
                                  className="text-destructive"
                                >
                                  -
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Pies Izquierdos */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-foreground">🦶 Izquierdos</label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newDistro = [...videoInventoryForm.sizes_distribution];
                                newDistro[sizeIdx].left_feet.push({ location_id: 0, quantity: 0 });
                                setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                              }}
                            >
                              +
                            </Button>
                          </div>
                          {sizeDistro.left_feet.map((leftFoot, lfIdx) => (
                            <div key={lfIdx} className="flex items-center gap-2">
                              <Select
                                value={leftFoot.location_id.toString()}
                                onChange={(e) => {
                                  const newDistro = [...videoInventoryForm.sizes_distribution];
                                  newDistro[sizeIdx].left_feet[lfIdx].location_id = parseInt(e.target.value);
                                  setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                                }}
                                options={[
                                  { value: '0', label: 'Seleccionar ubicación' },
                                  ...locations.map(loc => ({ value: loc.id.toString(), label: loc.name }))
                                ]}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Cant"
                                type="number"
                                value={leftFoot.quantity || ''}
                                onChange={e => {
                                  const newDistro = [...videoInventoryForm.sizes_distribution];
                                  newDistro[sizeIdx].left_feet[lfIdx].quantity = parseInt(e.target.value) || 0;
                                  setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                                }}
                                className="w-20"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const newDistro = [...videoInventoryForm.sizes_distribution];
                                  newDistro[sizeIdx].left_feet = newDistro[sizeIdx].left_feet.filter((_, i) => i !== lfIdx);
                                  setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                                }}
                                className="text-destructive"
                              >
                                -
                              </Button>
                            </div>
                          ))}
                          {sizeDistro.left_feet.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">Sin pies izquierdos separados</p>
                          )}
                        </div>

                        {/* Pies Derechos */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-foreground">🦶 Derechos</label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newDistro = [...videoInventoryForm.sizes_distribution];
                                newDistro[sizeIdx].right_feet.push({ location_id: 0, quantity: 0 });
                                setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                              }}
                            >
                              +
                            </Button>
                          </div>
                          {sizeDistro.right_feet.map((rightFoot, rfIdx) => (
                            <div key={rfIdx} className="flex items-center gap-2">
                              <Select
                                value={rightFoot.location_id.toString()}
                                onChange={(e) => {
                                  const newDistro = [...videoInventoryForm.sizes_distribution];
                                  newDistro[sizeIdx].right_feet[rfIdx].location_id = parseInt(e.target.value);
                                  setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                                }}
                                options={[
                                  { value: '0', label: 'Seleccionar ubicación' },
                                  ...locations.map(loc => ({ value: loc.id.toString(), label: loc.name }))
                                ]}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Cant"
                                type="number"
                                value={rightFoot.quantity || ''}
                                onChange={e => {
                                  const newDistro = [...videoInventoryForm.sizes_distribution];
                                  newDistro[sizeIdx].right_feet[rfIdx].quantity = parseInt(e.target.value) || 0;
                                  setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                                }}
                                className="w-20"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const newDistro = [...videoInventoryForm.sizes_distribution];
                                  newDistro[sizeIdx].right_feet = newDistro[sizeIdx].right_feet.filter((_, i) => i !== rfIdx);
                                  setVideoInventoryForm(prev => ({ ...prev, sizes_distribution: newDistro }));
                                }}
                                className="text-destructive"
                              >
                                -
                              </Button>
                            </div>
                          ))}
                          {sizeDistro.right_feet.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">Sin pies derechos separados</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Botón para agregar nueva talla */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setVideoInventoryForm(prev => ({
                          ...prev,
                          sizes_distribution: [
                            ...prev.sizes_distribution,
                            {
                              size: '',
                              pairs: [{ location_id: 0, quantity: 0 }],
                              left_feet: [],
                              right_feet: []
                            }
                          ]
                        }));
                      }}
                      className="w-full"
                    >
                      + Agregar Talla
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Puedes distribuir el inventario entre múltiples ubicaciones. Los pies izquierdos y derechos deben estar balanceados.
                  </p>
                </div>
              </div>

              {/* Columna 2: Foto del Producto */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground mb-3">Foto del Producto (Opcional)</h4>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Capturar Foto de Referencia
                  </label>
                  <FullScreenPhotoCapture
                    onPhotoTaken={async (url, blob) => {
                      if (blob && url) {
                        // Limpiar URL anterior si existe
                        if (capturedPhotoUrl) {
                          URL.revokeObjectURL(capturedPhotoUrl);
                        }
                        
                        setCapturedPhotoUrl(url);
                        
                        const fileType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
                        const ext = fileType.split('/')[1] || 'jpg';
                        const imageFile = new File([blob], `reference-image.${ext}`, { type: fileType });
                        
                        setVideoInventoryForm(prev => ({ 
                          ...prev, 
                          reference_image: imageFile 
                        }));
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Toca el botón para abrir la cámara en pantalla completa
                  </p>
                </div>
                  
                {/* Preview de la foto capturada */}
                {capturedPhotoUrl && (
                  <div className="border border-border rounded-lg p-4 bg-muted/10">
                    <h4 className="text-sm font-medium text-foreground mb-2">📸 Foto Capturada</h4>
                    <div className="space-y-3">
                      <img 
                        src={capturedPhotoUrl} 
                        alt="Foto del inventario"
                        className="w-full h-64 object-cover rounded-lg border shadow-sm"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Foto de referencia del producto
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (capturedPhotoUrl) {
                              URL.revokeObjectURL(capturedPhotoUrl);
                            }
                            setCapturedPhotoUrl(null);
                            setVideoInventoryForm(prev => ({ ...prev, reference_image: null }));
                          }}
                          className="text-destructive hover:text-destructive/80"
                        >
                          🗑️ Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna 3: Video del Producto */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground mb-3">Video del Producto <span className="text-error">*</span></h4>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Grabar Video del Inventario
                  </label>
                  <FullScreenCameraCapture
                    onVideoRecorded={async (url, blob) => {
                      if (blob && url) {
                        // Limpiar URL anterior si existe
                        if (capturedVideoUrl) {
                          URL.revokeObjectURL(capturedVideoUrl);
                        }
                        
                        setCapturedVideoUrl(url);
                        
                        const fileType = blob.type && blob.type.startsWith('video/') ? blob.type : 'video/webm';
                        const ext = fileType.split('/')[1] || 'webm';
                        const videoFile = new File([blob], `inventory-video.${ext}`, { type: fileType });
                        
                        setVideoInventoryForm(prev => ({ 
                          ...prev, 
                          video_file: videoFile 
                        }));
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Toca el botón para abrir la cámara en pantalla completa
                  </p>
                </div>
                  
                {/* Preview del video grabado */}
                {capturedVideoUrl && (
                  <div className="border border-border rounded-lg p-4 bg-muted/10">
                    <h4 className="text-sm font-medium text-foreground mb-2">📹 Video Grabado</h4>
                    <div className="space-y-3">
                      <video 
                        src={capturedVideoUrl} 
                        controls 
                        className="w-full rounded-lg border shadow-sm"
                        preload="metadata"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Video del inventario del producto
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (capturedVideoUrl) {
                              URL.revokeObjectURL(capturedVideoUrl);
                            }
                            setCapturedVideoUrl(null);
                            setVideoInventoryForm(prev => ({ ...prev, video_file: null }));
                          }}
                          className="text-destructive hover:text-destructive/80"
                        >
                          🗑️ Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Enviar Inventario
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Asegúrate de haber completado todos los campos requeridos y grabado el video antes de enviar.
                </p>
              </div>
              
              <Button 
                onClick={async () => {
                  // Validaciones completas
                  if (videoInventoryForm.unit_price <= 0) {
                    alert('❌ Por favor ingresa un precio unitario válido');
                    return;
                  }

                  // Validar que haya al menos una distribución de tallas válida
                  const hasValidDistribution = videoInventoryForm.sizes_distribution.some(sd => {
                    if (!sd.size.trim()) return false;
                    const hasPairs = sd.pairs.some(p => p.location_id > 0 && p.quantity > 0);
                    const hasLeftFeet = sd.left_feet.some(lf => lf.location_id > 0 && lf.quantity > 0);
                    const hasRightFeet = sd.right_feet.some(rf => rf.location_id > 0 && rf.quantity > 0);
                    return hasPairs || (hasLeftFeet && hasRightFeet);
                  });

                  if (!hasValidDistribution) {
                    alert('❌ Por favor ingresa al menos una talla con distribución válida');
                    return;
                  }

                  // Validar balance de pies
                  for (const sd of videoInventoryForm.sizes_distribution) {
                    if (!sd.size.trim()) continue;
                    const totalLeft = sd.left_feet.reduce((sum, lf) => sum + lf.quantity, 0);
                    const totalRight = sd.right_feet.reduce((sum, rf) => sum + rf.quantity, 0);
                    if (totalLeft !== totalRight) {
                      alert(`❌ Error en talla ${sd.size}: Pies izquierdos (${totalLeft}) debe ser igual a pies derechos (${totalRight})`);
                      return;
                    }
                  }

                  if (!videoInventoryForm.video_file) {
                    alert('❌ Por favor graba un video del producto antes de enviar');
                    return;
                  }

                  try {
                    console.log('=== ANTES DE ENVIAR ===');
                    console.log('Estado del formulario:', {
                      unit_price: videoInventoryForm.unit_price,
                      product_brand: videoInventoryForm.product_brand,
                      product_model: videoInventoryForm.product_model,
                      box_price: videoInventoryForm.box_price,
                      sizes_distribution: videoInventoryForm.sizes_distribution,
                      video_file: videoInventoryForm.video_file ? `File(${videoInventoryForm.video_file.size} bytes)` : 'null',
                      reference_image: videoInventoryForm.reference_image ? `File(${videoInventoryForm.reference_image.size} bytes)` : 'null'
                    });
                    console.log('=======================');
                    
                    await handleVideoInventoryEntry(videoInventoryForm);
                    
                    // Reset form después del envío exitoso
                    setVideoInventoryForm({
                      product_brand: '',
                      product_model: '',
                      unit_price: 0,
                      box_price: 0,
                      sizes_distribution: [
                        {
                          size: '',
                          pairs: [{ location_id: 0, quantity: 0 }],
                          left_feet: [],
                          right_feet: []
                        }
                      ],
                      reference_image: null,
                      video_file: null
                    });
                    
                    // Limpiar las URLs de preview y liberar memoria
                    if (capturedPhotoUrl) {
                      URL.revokeObjectURL(capturedPhotoUrl);
                    }
                    if (capturedVideoUrl) {
                      URL.revokeObjectURL(capturedVideoUrl);
                    }
                    setCapturedPhotoUrl(null);
                    setCapturedVideoUrl(null);
                  } catch (error) {
                    console.error('Error processing inventory:', error);
                  }
                }}
                className="w-full bg-success hover:bg-success/90 text-white py-4 text-lg font-semibold"
                disabled={!videoInventoryForm.video_file || videoInventoryForm.unit_price <= 0}
              >
                {!videoInventoryForm.video_file ? '📹 Graba un video primero' :
                 videoInventoryForm.unit_price <= 0 ? '💰 Ingresa el precio' :
                 '🚀 Registrar Inventario con Distribución'}
              </Button>
              
              {/* Indicadores de estado */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className={`flex items-center space-x-2 ${videoInventoryForm.unit_price > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                  <div className={`w-3 h-3 rounded-full ${videoInventoryForm.unit_price > 0 ? 'bg-success' : 'bg-muted'}`}></div>
                  <span>Precio</span>
                </div>
                <div className={`flex items-center space-x-2 ${videoInventoryForm.sizes_distribution.some(sd => sd.size.trim() && (sd.pairs.some(p => p.location_id > 0 && p.quantity > 0) || (sd.left_feet.length > 0 && sd.right_feet.length > 0))) ? 'text-success' : 'text-muted-foreground'}`}>
                  <div className={`w-3 h-3 rounded-full ${videoInventoryForm.sizes_distribution.some(sd => sd.size.trim() && (sd.pairs.some(p => p.location_id > 0 && p.quantity > 0) || (sd.left_feet.length > 0 && sd.right_feet.length > 0))) ? 'bg-success' : 'bg-muted'}`}></div>
                  <span>Distribución</span>
                </div>
                <div className={`flex items-center space-x-2 ${videoInventoryForm.video_file ? 'text-success' : 'text-muted-foreground'}`}>
                  <div className={`w-3 h-3 rounded-full ${videoInventoryForm.video_file ? 'bg-success' : 'bg-muted'}`}></div>
                  <span>Video</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWholesaleView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold text-foreground">Gestión de Ventas al Por Mayor</h2>
          <div className="flex gap-2">
            <Button onClick={() => loadMayoreoData()} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => setShowCreateProductoMayoreoModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Estadísticas de Mayoreo */}
        {estadisticasMayoreo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{estadisticasMayoreo.total_productos}</p>
                <p className="text-sm text-muted-foreground">Productos Activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingBag className="h-8 w-8 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold">{estadisticasMayoreo.total_cajas_disponibles}</p>
                <p className="text-sm text-muted-foreground">Cajas Disponibles</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(estadisticasMayoreo.valor_total_inventario)}</p>
                <p className="text-sm text-muted-foreground">Valor Inventario</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold">{estadisticasMayoreo.total_ventas}</p>
                <p className="text-sm text-muted-foreground">Ventas Realizadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(estadisticasMayoreo.valor_total_ventas)}</p>
                <p className="text-sm text-muted-foreground">Total Vendido</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Productos de Mayoreo */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Productos de Mayoreo</h3>
          </CardHeader>
          <CardContent>
            {productosMayoreo.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full bg-card text-foreground border border-border rounded-lg overflow-hidden">
                  <thead className="bg-popover text-popover-foreground">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Modelo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Tallas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Cajas Disp.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Pares/Caja</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosMayoreo.map((producto) => (
                      <tr key={producto.id} className="border-b border-border last:border-b-0 bg-card hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {producto.foto && (
                              <img src={producto.foto} alt={producto.modelo} className="h-10 w-10 rounded-md mr-3 object-cover" />
                            )}
                            <div>
                              <p className="font-medium text-foreground">{producto.modelo}</p>
                              <p className="text-sm text-muted-foreground">ID: {producto.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {producto.tallas || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={producto.cantidad_cajas_disponibles > 10 ? 'success' : producto.cantidad_cajas_disponibles > 0 ? 'warning' : 'error'}>
                            {producto.cantidad_cajas_disponibles} cajas
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {producto.pares_por_caja} pares
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-foreground">
                          {formatCurrency(producto.precio)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={producto.is_active ? 'success' : 'error'}>
                            {producto.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProductoMayoreo(producto);
                              setShowRegistrarVentaMayoreoModal(true);
                            }}
                            disabled={producto.cantidad_cajas_disponibles === 0 || !producto.is_active}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Vender
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerVentasProducto(producto.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProductoMayoreo(producto);
                              setShowEditProductoMayoreoModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No hay productos de mayoreo"
                description="Crea tu primer producto de mayoreo para comenzar"
                icon={<Package className="h-12 w-12 text-gray-400" />}
              />
            )}
          </CardContent>
        </Card>

        {/* Últimas Ventas de Mayoreo */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Últimas Ventas de Mayoreo</h3>
          </CardHeader>
          <CardContent>
            {ventasMayoreo.length > 0 ? (
              <div className="space-y-3">
                {ventasMayoreo.slice(0, 10).map((venta) => (
                  <div key={venta.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-muted/10 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {venta.mayoreo_producto?.modelo || `Producto ID: ${venta.mayoreo_id}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {venta.cantidad_cajas_vendidas} cajas × {formatCurrency(venta.precio_unitario_venta)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(venta.fecha_venta)}
                      </p>
                      {venta.notas && (
                        <p className="text-xs text-muted-foreground italic mt-1">"{venta.notas}"</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-success">{formatCurrency(venta.total_venta)}</p>
                      <Badge variant="success" className="mt-1">Completada</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay ventas registradas"
                description="Las ventas de mayoreo aparecerán aquí"
                icon={<ShoppingBag className="h-12 w-12 text-gray-400" />}
              />
            )}
          </CardContent>
        </Card>

        {/* Modales */}
        {showCreateProductoMayoreoModal && (
          <CreateProductoMayoreoModal
            onClose={() => setShowCreateProductoMayoreoModal(false)}
            onSubmit={handleCreateProductoMayoreo}
          />
        )}

        {showEditProductoMayoreoModal && selectedProductoMayoreo && (
          <EditProductoMayoreoModal
            producto={selectedProductoMayoreo}
            onClose={() => {
              setShowEditProductoMayoreoModal(false);
              setSelectedProductoMayoreo(null);
            }}
            onSubmit={(data) => handleUpdateProductoMayoreo(selectedProductoMayoreo.id, data)}
            onDelete={() => handleDeleteProductoMayoreo(selectedProductoMayoreo.id)}
          />
        )}

        {showRegistrarVentaMayoreoModal && selectedProductoMayoreo && (
          <RegistrarVentaMayoreoModal
            producto={selectedProductoMayoreo}
            onClose={() => {
              setShowRegistrarVentaMayoreoModal(false);
              setSelectedProductoMayoreo(null);
            }}
            onSubmit={handleRegistrarVentaMayoreo}
          />
        )}

        {showVentasProductoModal && (
          <VentasProductoModal
            ventas={ventasMayoreo}
            onClose={() => {
              setShowVentasProductoModal(false);
              loadMayoreoData(); // Reload para actualizar ventas generales
            }}
          />
        )}
      </div>
    );
  };

  const renderAnalyticsView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold">Análisis y Métricas</h2>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={async () => {
                try {
                  const report = await generateSalesReports({
                    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end_date: new Date().toISOString().split('T')[0]
                  });
                  console.log('Sales report:', report);
                  alert('Reporte generado - Ver consola');
                } catch (error) {
                  console.error('Error generating report:', error);
                  alert('Error al generar reporte');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={async () => {
                try {
                  const performance = await fetchUsersPerformance({
                    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end_date: new Date().toISOString().split('T')[0]
                  });
                  console.log('User performance:', performance);
                  alert('Performance data - Ver consola');
                } catch (error) {
                  console.error('Error fetching performance:', error);
                }
              }}
            >
              Performance
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={async () => {
                try {
                  const transfersOverview = await fetchTransfersOverview();
                  console.log('Transfers overview:', transfersOverview);
                  alert('Transfers overview - Ver consola');
                } catch (error) {
                  console.error('Error fetching transfers:', error);
                }
              }}
            >
              Transferencias
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Análisis de Ventas</h3>
              <p className="text-sm text-gray-600 mb-4">Tendencias y patrones de venta</p>
              <Button size="sm" className="w-full">Analizar</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-secondary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Performance de Usuarios</h3>
              <p className="text-sm text-gray-600 mb-4">Rendimiento por usuario y rol</p>
              <Button size="sm" className="w-full">Ver Métricas</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-success mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Análisis de Inventario</h3>
              <p className="text-sm text-gray-600 mb-4">Rotación y optimización de stock</p>
              <Button size="sm" className="w-full">Optimizar</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <PieChart className="h-12 w-12 text-warning mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Análisis Financiero</h3>
              <p className="text-sm text-gray-600 mb-4">Costos, márgenes y rentabilidad</p>
              <Button size="sm" className="w-full">Analizar</Button>
            </CardContent>
          </Card>
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
      <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold text-foreground">Reportes y Análisis</h2>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Reporte de Ventas</h3>
              <p className="text-sm text-gray-600 mb-4">Análisis detallado de ventas por período</p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={async () => {
                  try {
                    const report = await generateSalesReports({
                      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      end_date: new Date().toISOString().split('T')[0]
                    });
                    console.log('Sales report:', report);
                    alert('Reporte de ventas generado - revisar consola');
                  } catch (error) {
                    console.error('Error generating sales report:', error);
                    alert('Error al generar reporte de ventas');
                  }
                }}
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
                onClick={async () => {
                  try {
                    const performance = await fetchUsersPerformance({
                      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      end_date: new Date().toISOString().split('T')[0]
                    });
                    console.log('User performance data:', performance);
                    alert('Datos de performance obtenidos - revisar consola');
                  } catch (error) {
                    console.error('Error fetching user performance:', error);
                    alert('Error al obtener performance de usuarios');
                  }
                }}
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
                onClick={async () => {
                  try {
                    const overview = await fetchTransfersOverview();
                    console.log('Transfers overview:', overview);
                    alert('Overview de transferencias obtenido - revisar consola');
                  } catch (error) {
                    console.error('Error fetching transfers overview:', error);
                    alert('Error al obtener overview de transferencias');
                  }
                }}
              >
                Generar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Herramientas Adicionales</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={async () => {
                  try {
                    const assignments = await fetchProductAssignments();
                    console.log('Product assignments:', assignments);
                    alert('Asignaciones de productos - revisar consola');
                  } catch (error) {
                    console.error('Error fetching product assignments:', error);
                    alert('Error al obtener asignaciones');
                  }
                }}
              >
                <Package className="h-4 w-4 mr-2" />
                Ver Asignaciones de Productos
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={async () => {
                  try {
                    const health = await fetchAdminModuleHealth();
                    console.log('Admin module health:', health);
                    alert('Estado del módulo admin - revisar consola');
                  } catch (error) {
                    console.error('Error checking admin health:', error);
                    alert('Error al verificar estado del módulo');
                  }
                }}
              >
                <Activity className="h-4 w-4 mr-2" />
                Estado del Sistema
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={async () => {
                  try {
                    const overview = await fetchSystemOverview();
                    console.log('System overview:', overview);
                    alert('Overview del sistema - revisar consola');
                  } catch (error) {
                    console.error('Error fetching system overview:', error);
                    alert('Error al obtener overview del sistema');
                  }
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Overview del Sistema
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Configuración de Alertas</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => {
                  const alertData = {
                    locationId: 1, // Example location
                    alertType: 'inventario_minimo' as const,
                    thresholdValue: 10,
                    productReference: '',
                    notificationEmails: ['admin@example.com'],
                    isActive: true
                  };
                  handleCreateInventoryAlert(alertData);
                }}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Crear Alerta de Stock Bajo
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={async () => {
                  try {
                    const connection = await testMicroserviceConnection();
                    console.log('Microservice connection:', connection);
                    alert('Conexión con microservicio - revisar consola');
                  } catch (error) {
                    console.error('Error testing microservice:', error);
                    alert('Error al probar conexión con microservicio');
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Probar Microservicios
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

  // ========== MAYOREO MODALS ==========

  const CreateProductoMayoreoModal: React.FC<{
    onClose: () => void;
    onSubmit: (data: any) => void;
  }> = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      modelo: '',
      cantidad_cajas_disponibles: 0,
      pares_por_caja: 0,
      precio: 0,
      foto: null as File | null,
      tallas: ''
    });
    const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);

    // Limpiar URL de preview al desmontar
    React.useEffect(() => {
      return () => {
        if (fotoPreviewUrl) {
          URL.revokeObjectURL(fotoPreviewUrl);
        }
      };
    }, [fotoPreviewUrl]);

    const handleSubmit = () => {
      // Validaciones
      if (!formData.modelo.trim()) {
        alert('❌ El modelo es obligatorio');
        return;
      }
      if (formData.cantidad_cajas_disponibles < 0) {
        alert('❌ La cantidad de cajas debe ser mayor o igual a 0');
        return;
      }
      if (formData.pares_por_caja <= 0) {
        alert('❌ Los pares por caja deben ser mayor a 0');
        return;
      }
      if (formData.precio <= 0) {
        alert('❌ El precio debe ser mayor a 0');
        return;
      }

      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-card rounded-lg max-w-2xl w-full p-6 my-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Crear Producto de Mayoreo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda - Datos del producto */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Modelo del Producto <span className="text-error">*</span>
                </label>
                <Input
                  placeholder="Ej: SS-9012"
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Nombre o código del modelo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Cantidad de Cajas Disponibles <span className="text-error">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ej: 50"
                  value={formData.cantidad_cajas_disponibles}
                  onChange={(e) => setFormData({ ...formData, cantidad_cajas_disponibles: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">Stock inicial de cajas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Pares por Caja <span className="text-error">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ej: 24"
                  value={formData.pares_por_caja}
                  onChange={(e) => setFormData({ ...formData, pares_por_caja: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">Unidades por caja</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Precio por Caja <span className="text-error">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej: 150000"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">Precio de venta por caja</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Distribución de Tallas (Opcional)
                </label>
                <Input
                  placeholder="Ej: 36-39/6666, 40-44/6662"
                  value={formData.tallas}
                  onChange={(e) => setFormData({ ...formData, tallas: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Formato: rango/distribución</p>
              </div>
            </div>

            {/* Columna derecha - Foto del producto */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Foto del Producto (Opcional)
                </label>
                <FullScreenPhotoCapture
                  hideInternalPreview={true}
                  onPhotoTaken={async (url, blob) => {
                    if (blob && url) {
                      // Limpiar URL anterior si existe
                      if (fotoPreviewUrl) {
                        URL.revokeObjectURL(fotoPreviewUrl);
                      }
                      
                      setFotoPreviewUrl(url);
                      
                      const fileType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
                      const ext = fileType.split('/')[1] || 'jpg';
                      const fotoFile = new File([blob], `producto-mayoreo.${ext}`, { type: fileType });
                      
                      setFormData(prev => ({ 
                        ...prev, 
                        foto: fotoFile 
                      }));
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Toca el botón para capturar una foto del producto
                </p>
              </div>

              {/* Preview de la foto */}
              {fotoPreviewUrl && (
                <div className="space-y-2">
                  <img 
                    src={fotoPreviewUrl} 
                    alt="Preview del producto"
                    className="w-full rounded-lg border shadow-sm object-cover"
                    style={{ maxHeight: '300px' }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (fotoPreviewUrl) {
                        URL.revokeObjectURL(fotoPreviewUrl);
                      }
                      setFotoPreviewUrl(null);
                      setFormData(prev => ({ ...prev, foto: null }));
                    }}
                    className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                  >
                    🗑️ Eliminar foto
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit}>Crear Producto</Button>
          </div>
        </div>
      </div>
    );
  };

  const EditProductoMayoreoModal: React.FC<{
    producto: ProductoMayoreo;
    onClose: () => void;
    onSubmit: (data: any) => void;
    onDelete: () => void;
  }> = ({ producto, onClose, onSubmit, onDelete }) => {
    const [formData, setFormData] = useState({
      modelo: producto.modelo,
      cantidad_cajas_disponibles: producto.cantidad_cajas_disponibles,
      pares_por_caja: producto.pares_por_caja,
      precio: producto.precio,
      foto: null as File | null,
      tallas: producto.tallas || '',
      is_active: producto.is_active
    });
    const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(producto.foto || null);
    const [fotoChanged, setFotoChanged] = useState(false);

    // Limpiar URL de preview al desmontar (solo si es blob URL)
    React.useEffect(() => {
      return () => {
        if (fotoPreviewUrl && fotoPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(fotoPreviewUrl);
        }
      };
    }, [fotoPreviewUrl]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-card rounded-lg max-w-2xl w-full p-6 my-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Editar Producto de Mayoreo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda - Datos del producto */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Modelo del Producto
                </label>
                <Input
                  placeholder="Modelo"
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Cantidad de Cajas Disponibles
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.cantidad_cajas_disponibles}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      cantidad_cajas_disponibles: value === '' ? producto.cantidad_cajas_disponibles : parseInt(value) || 0 
                    });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Pares por Caja
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.pares_por_caja}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      pares_por_caja: value === '' ? producto.pares_por_caja : parseInt(value) || 0 
                    });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Precio por Caja
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      precio: value === '' ? producto.precio : parseFloat(value) || 0 
                    });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Distribución de Tallas
                </label>
                <Input
                  placeholder="Ej: 36-39/6666, 40-44/6662"
                  value={formData.tallas}
                  onChange={(e) => setFormData({ ...formData, tallas: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-muted/20 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm font-medium text-foreground">Producto Activo</label>
              </div>
            </div>

            {/* Columna derecha - Foto del producto */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Foto del Producto
                </label>
                <FullScreenPhotoCapture
                  hideInternalPreview={true}
                  onPhotoTaken={async (url, blob) => {
                    if (blob && url) {
                      // Limpiar URL anterior si es blob
                      if (fotoPreviewUrl && fotoPreviewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(fotoPreviewUrl);
                      }
                      
                      setFotoPreviewUrl(url);
                      setFotoChanged(true);
                      
                      const fileType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
                      const ext = fileType.split('/')[1] || 'jpg';
                      const fotoFile = new File([blob], `producto-mayoreo-${producto.id}.${ext}`, { type: fileType });
                      
                      setFormData(prev => ({ 
                        ...prev, 
                        foto: fotoFile 
                      }));
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {fotoChanged ? 'Nueva foto capturada' : 'Toca para cambiar la foto'}
                </p>
              </div>

              {/* Preview de la foto */}
              {fotoPreviewUrl && (
                <div className="space-y-2">
                  <img 
                    src={fotoPreviewUrl} 
                    alt="Preview del producto"
                    className="w-full rounded-lg border shadow-sm object-cover"
                    style={{ maxHeight: '300px' }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (fotoPreviewUrl && fotoPreviewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(fotoPreviewUrl);
                      }
                      setFotoPreviewUrl(null);
                      setFotoChanged(true);
                      setFormData(prev => ({ ...prev, foto: null }));
                    }}
                    className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                  >
                    🗑️ Eliminar foto
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <Button variant="outline" className="text-error border-error hover:bg-error hover:text-white" onClick={onDelete}>
              Eliminar Producto
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={() => {
                // Solo enviar campos que han cambiado
                const changedData: any = {};
                
                if (formData.modelo !== producto.modelo) {
                  changedData.modelo = formData.modelo;
                }
                if (formData.cantidad_cajas_disponibles !== producto.cantidad_cajas_disponibles) {
                  changedData.cantidad_cajas_disponibles = formData.cantidad_cajas_disponibles;
                }
                if (formData.pares_por_caja !== producto.pares_por_caja) {
                  changedData.pares_por_caja = formData.pares_por_caja;
                }
                if (formData.precio !== producto.precio) {
                  changedData.precio = formData.precio;
                }
                if (formData.tallas !== (producto.tallas || '')) {
                  changedData.tallas = formData.tallas;
                }
                if (formData.is_active !== producto.is_active) {
                  changedData.is_active = formData.is_active;
                }
                if (formData.foto !== null) {
                  changedData.foto = formData.foto;
                }
                
                console.log('Datos del formulario antes de enviar:', formData);
                console.log('Solo campos cambiados:', changedData);
                onSubmit(changedData);
              }}>Actualizar</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RegistrarVentaMayoreoModal: React.FC<{
    producto: ProductoMayoreo;
    onClose: () => void;
    onSubmit: (data: any) => void;
  }> = ({ producto, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      mayoreo_id: producto.id,
      cantidad_cajas_vendidas: 1,
      precio_unitario_venta: producto.precio,
      notas: ''
    });

    const calcularTotal = () => {
      return formData.cantidad_cajas_vendidas * formData.precio_unitario_venta;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Registrar Venta de Mayoreo</h3>
          
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="font-semibold text-foreground">Producto: {producto.modelo}</p>
            <p className="text-sm text-muted-foreground">Cajas disponibles: {producto.cantidad_cajas_disponibles}</p>
            <p className="text-sm text-muted-foreground">Precio sugerido: {formatCurrency(producto.precio)}/caja</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Cantidad de Cajas *</label>
              <Input
                type="number"
                min="1"
                max={producto.cantidad_cajas_disponibles}
                value={formData.cantidad_cajas_vendidas}
                onChange={(e) => setFormData({ ...formData, cantidad_cajas_vendidas: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Precio Unitario de Venta *</label>
              <Input
                type="number"
                value={formData.precio_unitario_venta}
                onChange={(e) => setFormData({ ...formData, precio_unitario_venta: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Notas (opcional)</label>
              <textarea
                className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Información adicional sobre la venta..."
              />
            </div>

            <div className="bg-success/10 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total de la venta:</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(calcularTotal())}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onSubmit(formData)}>Registrar Venta</Button>
          </div>
        </div>
      </div>
    );
  };

  const VentasProductoModal: React.FC<{
    ventas: VentaMayoreo[];
    onClose: () => void;
  }> = ({ ventas, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-foreground mb-4">Historial de Ventas del Producto</h3>
          
          {ventas.length > 0 ? (
            <div className="space-y-3">
              {ventas.map((venta) => (
                <div key={venta.id} className="border border-border rounded-lg p-4 bg-muted/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground">Venta #{venta.id}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(venta.fecha_venta)}</p>
                      <p className="text-sm text-foreground mt-2">
                        {venta.cantidad_cajas_vendidas} cajas × {formatCurrency(venta.precio_unitario_venta)}
                      </p>
                      {venta.notas && (
                        <p className="text-xs text-muted-foreground italic mt-1">"{venta.notas}"</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-success">{formatCurrency(venta.total_venta)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay ventas registradas</p>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
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
          message={error}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Panel de Administración">
      <div className="min-h-screen bg-background">
        {/* Mobile navigation */}
        <div className="lg:hidden bg-card border-b border-border sticky top-0 z-10">
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
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
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
          <div className="w-64 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto">
            <div className="p-4">
              <nav className="space-y-2">
                {[
                  { key: 'dashboard', label: 'Panel Principal', icon: <BarChart3 className="h-5 w-5" /> },
                  { key: 'users', label: 'Gestión de Usuarios', icon: <Users className="h-5 w-5" /> },
                  { key: 'inventory', label: 'Gestión de Inventario', icon: <Package className="h-5 w-5" /> },
                  { key: 'wholesale', label: 'Ventas Mayoreo', icon: <ShoppingBag className="h-5 w-5" /> },
                  { key: 'costs', label: 'Gestión de Costos', icon: <DollarSign className="h-5 w-5" /> },
                  { key: 'locations', label: 'Ubicaciones', icon: <MapPin className="h-5 w-5" /> },
                  { key: 'analytics', label: 'Análisis', icon: <PieChart className="h-5 w-5" /> },
                  { key: 'notifications', label: 'Notificaciones', icon: <Bell className="h-5 w-5" /> },
                  { key: 'reports', label: 'Reportes', icon: <FileText className="h-5 w-5" /> },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setCurrentView(item.key as AdminView)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                      currentView === item.key
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted/20'
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
          <div className="ml-64 flex-1 bg-background">
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
              setEditingUser(null);
              setShowEditUserModal(false);
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