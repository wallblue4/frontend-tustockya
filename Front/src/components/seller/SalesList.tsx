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
  Filter
} from 'lucide-react';

interface Sale {
  id: string;
  items: Array<{
    product_code: string;
    brand: string;
    model: string;
    size: string;
    quantity: number;
    unit_price: number;
  }>;
  payment_methods: Array<{
    type: 'cash' | 'card' | 'transfer';
    amount: number;
    reference?: string;
  }>;
  total_amount: number;
  status: 'confirmed' | 'pending';
  notes?: string;
  created_at: string;
}

export const SalesList: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all');

  useEffect(() => {
    loadTodaySales();
  }, []);

  const loadTodaySales = async () => {
    try {
      setError(null);
      const response = await vendorAPI.getTodaySales();
      setSales(response.data || []);
    } catch (error) {
      console.warn('Backend API not available, using mock data for sales');
      setError('Conectando con el servidor...');
      
      // Mock data for development
      setSales([
        {
          id: '1',
          items: [
            {
              product_code: 'NK001',
              brand: 'Nike',
              model: 'Air Max 90',
              size: '9.5',
              quantity: 1,
              unit_price: 180000
            }
          ],
          payment_methods: [
            { type: 'card', amount: 180000, reference: '1234' }
          ],
          total_amount: 180000,
          status: 'confirmed',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          items: [
            {
              product_code: 'AD002',
              brand: 'Adidas',
              model: 'Ultraboost 22',
              size: '8',
              quantity: 1,
              unit_price: 220000
            }
          ],
          payment_methods: [
            { type: 'cash', amount: 220000 }
          ],
          total_amount: 220000,
          status: 'pending',
          notes: 'Cliente pagó en efectivo',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSale = async (saleId: string) => {
    try {
      await vendorAPI.confirmSale(saleId);
      // Reload sales after confirmation
      loadTodaySales();
      alert('Venta confirmada exitosamente');
    } catch (error) {
      alert('Error al confirmar la venta: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const filteredSales = sales.filter(sale => {
    if (filter === 'all') return true;
    return sale.status === filter;
  });

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'transfer':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (type: string) => {
    switch (type) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      case 'transfer':
        return 'Transferencia';
      default:
        return type;
    }
  };

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const confirmedSales = sales.filter(sale => sale.status === 'confirmed');
  const pendingSales = sales.filter(sale => sale.status === 'pending');

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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ventas</p>
                <p className="text-xl font-bold">{formatCurrency(totalSales)}</p>
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
                <p className="text-xl font-bold text-success">{confirmedSales.length}</p>
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
                <p className="text-xl font-bold text-warning">{pendingSales.length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Sales List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Ventas del Día
            </h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todas</option>
                <option value="confirmed">Confirmadas</option>
                <option value="pending">Pendientes</option>
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
                          sale.status === 'confirmed' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {sale.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                        </span>
                        <span className="text-sm text-gray-500">{formatDate(sale.created_at)}</span>
                      </div>
                      
                      {/* Items */}
                      <div className="space-y-1 mb-3">
                        {sale.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{item.brand} {item.model}</span>
                            <span className="text-gray-600"> - Talla {item.size} × {item.quantity}</span>
                            <span className="ml-2 text-gray-500">({formatCurrency(item.unit_price)})</span>
                          </div>
                        ))}
                      </div>

                      {/* Payment Methods */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {sale.payment_methods.map((payment, index) => (
                          <div key={index} className="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded">
                            {getPaymentMethodIcon(payment.type)}
                            <span>{getPaymentMethodLabel(payment.type)}: {formatCurrency(payment.amount)}</span>
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
                      {sale.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmSale(sale.id)}
                          className="mt-2"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar
                        </Button>
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