import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { formatCurrency } from '../../services/api';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DashboardStatsProps {
  data: {
    success?: boolean;
    dashboard_timestamp?: string;
    vendor_info?: {
      name: string;
      email: string;
      role: string;
      location_id: number;
      location_name: string;
    };
    today_summary?: {
      date: string;
      sales?: {
        total_count: number;
        confirmed_amount: number;
        pending_amount: number;
        pending_confirmations: number;
        total_amount: number;
      };
      payment_methods_breakdown?: any[];
      expenses?: {
        count: number;
        total_amount: number;
      };
      net_income: number;
    };
    pending_actions?: {
      sale_confirmations: number;
      transfer_requests?: {
        pending: number;
        in_transit: number;
        delivered: number;
      };
      discount_requests?: {
        pending: number;
        approved: number;
        rejected: number;
      };
      return_notifications: number;
    };
    quick_actions?: string[];
  };
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => {
  // Extraer datos de la estructura de API real
  const salesData = data.today_summary?.sales || {};
  const expensesData = data.today_summary?.expenses || {};
  const pendingActionsData = data.pending_actions || {};
  
  const stats = [
    {
      title: 'Ventas Confirmadas',
      value: salesData.total_count || 0,
      subtitle: `${salesData.pending_confirmations || 0} pendientes`,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Monto Total Vendido',
      value: formatCurrency(salesData.total_amount || 0),
      subtitle: `${formatCurrency(salesData.pending_amount || 0)} pendiente`,
      icon: <DollarSign className="h-6 w-6" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Items Vendidos',
      value: salesData.total_count || 0,
      subtitle: 'pares de tenis',
      icon: <ShoppingBag className="h-6 w-6" />,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'Ingreso Neto',
      value: formatCurrency(data.today_summary?.net_income || 0),
      subtitle: `Gastos: ${formatCurrency(expensesData.total_amount || 0)}`,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-success',
      bgColor: 'bg-success/10'
    }
  ];

  const pendingActions = [
    {
      title: 'Ventas por Confirmar',
      count: pendingActionsData.sale_confirmations || 0,
      icon: <Clock className="h-5 w-5" />,
      color: 'text-warning'
    },
    {
      title: 'Transferencias en Curso',
      count: pendingActionsData.transfer_requests?.pending || 0,
      icon: <AlertCircle className="h-5 w-5" />,
      color: 'text-primary'
    },
    {
      title: 'Descuentos Pendientes',
      count: pendingActionsData.discount_requests?.pending || 0,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-secondary'
    },
    {
      title: 'Devoluciones Sin Leer',
      count: pendingActionsData.return_notifications || 0,
      icon: <AlertCircle className="h-5 w-5" />,
      color: 'text-error'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Methods Breakdown */}
      {data.today_summary?.payment_methods_breakdown && data.today_summary.payment_methods_breakdown.length > 0 ? (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Desglose por Método de Pago</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Efectivo</p>
                <p className="text-lg font-bold">{formatCurrency(0)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Tarjeta</p>
                <p className="text-lg font-bold">{formatCurrency(0)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Transferencia</p>
                <p className="text-lg font-bold">{formatCurrency(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Desglose por Método de Pago</h3>
            <div className="text-center text-gray-500">
              <p>No hay datos de métodos de pago disponibles</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Actions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">Acciones Pendientes</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {pendingActions.map((action, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={action.color}>{action.icon}</div>
                <div>
                  <p className="text-sm text-gray-600">{action.title}</p>
                  <p className="font-bold text-lg">{action.count}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};