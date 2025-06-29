import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { vendorAPI, formatCurrency, formatDate } from '../../services/api';
import { 
  ShoppingBag, 
  Clock,
  CheckCircle,
  CreditCard,
  DollarSign,
  ArrowRight,
  Filter,
  Receipt,
  AlertCircle
} from 'lucide-react';

interface Sale {
  id: number;
  seller_id: number;
  location_id: number;
  total_amount: number;
  receipt_image: string | null;
  sale_date: string;
  status: string;
  notes: string | null;
  requires_confirmation: number;
  confirmed: number;
  confirmed_at: string | null;
  first_name: string;
  last_name: string;
  location_name: string;
  items: Array<{
    id: number;
    sale_id: number;
    sneaker_reference_code: string;
    brand: string;
    model: string;
    color: string;
    size: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  payment_methods: Array<{
    id: number;
    sale_id: number;
    payment_type: string;
    amount: number;
    reference: string | null;
    created_at: string;
  }>;
  status_info: {
    is_confirmed: boolean;
    requires_confirmation: boolean;
    has_receipt: boolean;
    confirmation_pending: boolean;
  };
}

interface SalesResponse {
  success: boolean;
  date: string;
  sales: Sale[];
  summary: {
    total_sales: number;
    confirmed_sales: number;
    pending_confirmation: number;
    total_amount: number;
    pending_amount: number;
    total_items: number;
    average_sale: number;
    payment_methods_stats: {
      [key: string]: {
        count: number;
        amount: number;
      };
    };
  };
}

export const SalesList: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all');

  useEffect(() => {
    loadTodaySales();
  }, []);

  const loadTodaySales = async () => {
    try {
      setError(null);
      console.log('Cargando ventas del día...');
      
      const response = await vendorAPI.getTodaySales();
      console.log('Respuesta de ventas:', response);
      
      setSalesData(response);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      console.warn('Backend API not available, using mock data for sales');
      setError('Conectando con el servidor...');
      
      // Mock data for development
      setSalesData({
        success: true,
        date: new Date().toISOString().split('T')[0],
        sales: [
          {
            id: 1,
            seller_id: 1,
            location_id: 1,
            total_amount: 180000,
            receipt_image: null,
            sale_date: new Date().toISOString(),
            status: 'completed',
            notes: null,
            requires_confirmation: 0,
            confirmed: 1,
            confirmed_at: new Date().toISOString(),
            first_name: 'Vendedor',
            last_name: 'Prueba',
            location_name: 'Local #1',
            items: [{
              id: 1,
              sale_id: 1,
              sneaker_reference_code: 'NK001',
              brand: 'Nike',
              model: 'Air Max 90',
              color: 'Blanco/Negro',
              size: '9.5',
              quantity: 1,
              unit_price: 180000,
              subtotal: 180000
            }],
            payment_methods: [{
              id: 1,
              sale_id: 1,
              payment_type: 'tarjeta',
              amount: 180000,
              reference: '****1234',
              created_at: new Date().toISOString()
            }],
            status_info: {
              is_confirmed: true,
              requires_confirmation: false,
              has_receipt: false,
              confirmation_pending: false
            }
          }
        ],
        summary: {
          total_sales: 1,
          confirmed_sales: 1,
          pending_confirmation: 0,
          total_amount: 180000,
          pending_amount: 0,
          total_items: 1,
          average_sale: 180000,
          payment_methods_stats: {
            tarjeta: { count: 1, amount: 180000 }
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSale = async (saleId: number) => {
    try {
      console.log('Confirmando venta:', saleId);
      await vendorAPI.confirmSale(saleId);
      
      // Reload sales after confirmation
      loadTodaySales();
      alert('Venta confirmada exitosamente');
    } catch (error) {
      console.error('Error al confirmar venta:', error);
      alert('Error al confirmar la venta: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const filteredSales = salesData?.sales?.filter(sale => {
    if (filter === 'all') return true;
    if (filter === 'confirmed') return sale.status_info.is_confirmed;
    if (filter === 'pending') return sale.status_info.confirmation_pending;
    return true;
  }) || [];

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'efectivo':
        return <DollarSign className="h-4 w-4" />;
      case 'tarjeta':
        return <CreditCard className="h-4 w-4" />;
      case 'transferencia':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (type: string) => {
    switch (type) {
      case 'efectivo':
        return 'Efectivo';
      case 'tarjeta':
        return 'Tarjeta';
      case 'transferencia':
        return 'Transferencia';
      default:
        return type;
    }
  };

  const formatSaleDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando ventas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!salesData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600">Error al cargar las ventas del día</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ventas</p>
                <p className="text-xl font-bold">{formatCurrency(salesData.summary.total_amount)}</p>
                <p className="text-xs text-gray-500">{salesData.summary.total_sales} ventas</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmadas</p>
                <p className="text-xl font-bold text-success">{salesData.summary.confirmed_sales}</p>
                <p className="text-xs text-gray-500">{salesData.summary.total_items} productos</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-xl font-bold text-warning">{salesData.summary.pending_confirmation}</p>
                <p className="text-xs text-gray-500">{formatCurrency(salesData.summary.pending_amount)}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(salesData.summary.average_sale)}</p>
                <p className="text-xs text-gray-500">por venta</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Stats */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Métodos de Pago</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(salesData.summary.payment_methods_stats).map(([method, stats]) => (
              <div key={method} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getPaymentMethodIcon(method)}
                    <span className="font-medium">{getPaymentMethodLabel(method)}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(stats.amount)}</p>
                    <p className="text-sm text-gray-600">{stats.count} transacciones</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Sales List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Ventas del Día - {salesData.date}
            </h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todas ({salesData.summary.total_sales})</option>
                <option value="confirmed">Confirmadas ({salesData.summary.confirmed_sales})</option>
                <option value="pending">Pendientes ({salesData.summary.pending_confirmation})</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">Modo de desarrollo - Usando datos de prueba</p>
            </div>
          )}
          
          {filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {filter === 'all' ? 'No hay ventas registradas hoy' : 
                 filter === 'confirmed' ? 'No hay ventas confirmadas' : 
                 'No hay ventas pendientes'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.status_info.is_confirmed 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {sale.status_info.is_confirmed ? 'Confirmada' : 'Pendiente'}
                        </span>
                        <span className="text-sm text-gray-500">
                          ID: {sale.id} • {formatSaleDate(sale.sale_date)}
                        </span>
                        {sale.status_info.has_receipt && (
                          <Receipt className="h-4 w-4 text-blue-500" title="Tiene comprobante" />
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">{sale.first_name} {sale.last_name}</span>
                        <span className="mx-2">•</span>
                        <span>{sale.location_name}</span>
                      </div>
                      
                      {/* Items */}
                      <div className="space-y-1 mb-3">
                        {sale.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{item.brand} {item.model}</span>
                            <span className="text-gray-600"> - {item.color} • Talla {item.size} × {item.quantity}</span>
                            <span className="ml-2 text-gray-500">({formatCurrency(item.unit_price)})</span>
                            <span className="text-xs text-gray-400 ml-1">Ref: {item.sneaker_reference_code}</span>
                          </div>
                        ))}
                      </div>

                      {/* Payment Methods */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {sale.payment_methods.map((payment, index) => (
                          <div key={index} className="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded">
                            {getPaymentMethodIcon(payment.payment_type)}
                            <span>{getPaymentMethodLabel(payment.payment_type)}: {formatCurrency(payment.amount)}</span>
                            {payment.reference && (
                              <span className="text-gray-500">({payment.reference})</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {sale.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          <strong>Notas:</strong> {sale.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold">{formatCurrency(sale.total_amount)}</p>
                      {sale.status_info.confirmation_pending && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmSale(sale.id)}
                          className="mt-2"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar
                        </Button>
                      )}
                      {sale.confirmed_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Confirmada: {formatSaleDate(sale.confirmed_at)}
                        </p>
                      )}
                    </div>
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