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
    totalSales: number;
    pendingSales: number;
    totalAmount: number;
    pendingAmount: number;
    itemsSold: number;
    totalExpenses: number;
    netIncome: number;
    paymentMethods: {
      cash: number;
      card: number;
      transfer: number;
    };
    pendingActions: {
      salesToConfirm: number;
      transferRequests: number;
      discountRequests: number;
      unreadReturns: number;
    };
  };
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => {
  const stats = [
    {
      title: 'Ventas Confirmadas',
      value: data.totalSales,
      subtitle: `${data.pendingSales} pendientes`,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Monto Total Vendido',
      value: formatCurrency(data.totalAmount),
      subtitle: `${formatCurrency(data.pendingAmount)} pendiente`,
      icon: <DollarSign className="h-6 w-6" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Items Vendidos',
      value: data.itemsSold,
      subtitle: 'pares de tenis',
      icon: <ShoppingBag className="h-6 w-6" />,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'Ingreso Neto',
      value: formatCurrency(data.netIncome),
      subtitle: `Gastos: ${formatCurrency(data.totalExpenses)}`,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-success',
      bgColor: 'bg-success/10'
    }
  ];

  const pendingActions = [
    {
      title: 'Ventas por Confirmar',
      count: data.pendingActions.salesToConfirm,
      icon: <Clock className="h-5 w-5" />,
      color: 'text-warning'
    },
    {
      title: 'Transferencias en Curso',
      count: data.pendingActions.transferRequests,
      icon: <AlertCircle className="h-5 w-5" />,
      color: 'text-primary'
    },
    {
      title: 'Descuentos Pendientes',
      count: data.pendingActions.discountRequests,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-secondary'
    },
    {
      title: 'Devoluciones Sin Leer',
      count: data.pendingActions.unreadReturns,
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
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">Desglose por Método de Pago</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Efectivo</p>
              <p className="text-lg font-bold">{formatCurrency(data.paymentMethods.cash)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Tarjeta</p>
              <p className="text-lg font-bold">{formatCurrency(data.paymentMethods.card)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Transferencia</p>
              <p className="text-lg font-bold">{formatCurrency(data.paymentMethods.transfer)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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