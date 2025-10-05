import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { vendorAPI, formatCurrency } from '../../services/api';
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
  total_amount: number;
  status: string;
  confirmed: boolean; // API devuelve boolean directamente
  requires_confirmation: boolean; // API devuelve boolean directamente
  sale_date: string;
  items_count: number; // API devuelve este campo
  notes: string | null;
  // Campos que podrían no estar en la respuesta actual pero los mantenemos opcionales
  seller_id?: number;
  location_id?: number;
  receipt_image?: string | null;
  confirmed_at?: string | null;
  first_name?: string;
  last_name?: string;
  location_name?: string;
  items?: Array<{
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
  payment_methods?: Array<{
    id: number;
    sale_id: number;
    payment_type: string;
    amount: number;
    reference: string | null;
    created_at: string;
  }>;
}

interface SalesResponse {
  success: boolean;
  message: string;
  timestamp: string;
  date: string;
  sales: Sale[];
  summary: {
    total_sales: number;
    confirmed_sales: number;
    pending_sales: number; // Corregido: API usa "pending_sales" no "pending_confirmation"
    total_amount: number;
    pending_amount: number;
    confirmed_amount: number; // Agregado: existe en la API
    average_sale: number;
    // Removido: payment_methods_stats no existe en la API actual
  };
  seller_info: {
    seller_id: number;
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
        message: "Ventas de prueba",
        timestamp: new Date().toISOString(),
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
          items_count: 1,
          notes: null,
          requires_confirmation: false,
          confirmed: true,
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
            }]
          }
        ],
        summary: {
          total_sales: 1,
          confirmed_sales: 1,
          pending_sales: 0,
          total_amount: 180000,
          pending_amount: 0,
          confirmed_amount: 180000,
          average_sale: 180000
        },
        seller_info: {
          seller_id: 1
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSale = async (saleId: number) => {
    try {
      console.log('Confirmando venta:', saleId);
      await vendorAPI.confirmSale(saleId, true);
      
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
    if (filter === 'confirmed') return sale.confirmed;
    if (filter === 'pending') return !sale.confirmed && sale.requires_confirmation;
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
      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-foreground">Cargando ventas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!salesData) {
    return (
      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <p className="text-destructive">Error al cargar las ventas del día</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ventas</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(salesData.summary.total_amount)}</p>
                <p className="text-xs text-muted-foreground">{salesData.summary.total_sales} ventas</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmadas</p>
                <p className="text-xl font-bold text-success">{salesData.summary.confirmed_sales}</p>
                <p className="text-xs text-muted-foreground">{salesData.sales.reduce((total, sale) => total + (sale.items_count || 0), 0)} productos</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-xl font-bold text-warning">{salesData.summary.pending_sales}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(salesData.summary.pending_amount)}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(salesData.summary.average_sale)}</p>
                <p className="text-xs text-muted-foreground">por venta</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Stats - Temporalmente deshabilitado hasta que la API incluya payment_methods_stats */}
      {/* 
      <Card className="bg-card">
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">Métodos de Pago</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p>Estadísticas de métodos de pago no disponibles</p>
          </div>
        </CardContent>
      </Card>
      */}

      {/* Filter and Sales List */}
      <Card className="bg-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center text-foreground">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Ventas del Día - {salesData.date}
            </h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-border bg-card text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todas ({salesData.summary.total_sales})</option>
                <option value="confirmed">Confirmadas ({salesData.summary.confirmed_sales})</option>
                <option value="pending">Pendientes ({salesData.summary.pending_sales})</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-warning/20 border border-warning/30 rounded-md">
              <p className="text-sm text-warning">Modo de desarrollo - Usando datos de prueba</p>
            </div>
          )}
          
          {filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {filter === 'all' ? 'No hay ventas registradas hoy' : 
                 filter === 'confirmed' ? 'No hay ventas confirmadas' : 
                 'No hay ventas pendientes'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="border border-border bg-card rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.confirmed 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {sale.confirmed ? 'Confirmada' : 'Pendiente'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ID: {sale.id} • {formatSaleDate(sale.sale_date)}
                        </span>
                        {sale.receipt_image && (
                          <Receipt className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium text-foreground">{sale.first_name || 'Usuario'} {sale.last_name || ''}</span>
                        <span className="mx-2">•</span>
                        <span>{sale.location_name || 'Ubicación no especificada'}</span>
                      </div>
                      
                      {/* Items */}
                      <div className="space-y-1 mb-3">
                        {sale.items && sale.items.length > 0 ? (
                          sale.items.map((item, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium text-foreground">{item.brand} {item.model}</span>
                              <span className="text-muted-foreground"> - {item.color} • Talla {item.size} × {item.quantity}</span>
                              <span className="ml-2 text-muted-foreground">({formatCurrency(item.unit_price)})</span>
                              <span className="text-xs text-muted-foreground ml-1">Ref: {item.sneaker_reference_code}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {sale.items_count} producto{sale.items_count !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      {/* Payment Methods */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {sale.payment_methods && sale.payment_methods.length > 0 ? (
                          sale.payment_methods.map((payment, index) => (
                            <div key={index} className="flex items-center space-x-1 text-xs bg-muted/30 px-2 py-1 rounded">
                              {getPaymentMethodIcon(payment.payment_type)}
                              <span className="text-foreground">{getPaymentMethodLabel(payment.payment_type)}: {formatCurrency(payment.amount)}</span>
                              {payment.reference && (
                                <span className="text-muted-foreground">({payment.reference})</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                            Método de pago no especificado
                          </div>
                        )}
                      </div> 

                      {sale.notes && (
                        <div className="mt-2 p-2 bg-muted/20 rounded text-sm text-foreground">
                          <strong>Notas:</strong> {sale.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-foreground">{formatCurrency(sale.total_amount)}</p>
                      {!sale.confirmed && sale.requires_confirmation && (
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
                        <p className="text-xs text-muted-foreground mt-1">
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