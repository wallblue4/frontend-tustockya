import React from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Package2, 
  BarChart2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';

export const AdminDashboard: React.FC = () => {
  const estadisticas = [
    { title: 'Ventas Diarias Todos los Locales', value: '$24,589.00', change: 12.5, icon: <DollarSign className="h-6 w-6" /> },
    { title: 'Número de Pares Vendidos', value: '127', change: 8.3, icon: <Package2 className="h-6 w-6" /> },
    { title: 'Utilidad Diaria Total', value: '$8,450.00', change: 15.2, icon: <BarChart2 className="h-6 w-6" /> },
  ];

  const ventasRecientes = [
    { id: 1, product: 'Pro Court 2023', store: 'Tienda Principal', amount: '$129.99', date: '2025-07-18', status: 'completed' },
    { id: 2, product: 'Speed Runner Elite', store: 'Sucursal Centro', amount: '$149.99', date: '2025-07-18', status: 'completed' },
    { id: 3, product: 'Grand Slam Pro', store: 'Centro Comercial', amount: '$179.99', date: '2025-07-18', status: 'processing' },
    { id: 4, product: 'Clay Court Master', store: 'Tienda Principal', amount: '$159.99', date: '2025-07-17', status: 'completed' },
    { id: 5, product: 'Pro Court 2023', store: 'Sucursal Oeste', amount: '$129.99', date: '2025-07-17', status: 'completed' },
  ];

  const alertasInventario = [
    { id: 1, product: 'Pro Court 2023', size: '9.5', location: 'Almacén Principal', available: 2, status: 'low' },
    { id: 2, product: 'Speed Runner Elite', size: '8', location: 'Almacén Principal', available: 1, status: 'low' },
    { id: 3, product: 'Grand Slam Pro', size: '10', location: 'Almacén Principal', available: 0, status: 'out' },
  ];

  return (
    <DashboardLayout title="Panel de Administrador">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {estadisticas.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Revisión de Ventas</h2>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
              <div className="text-center">
                <BarChart2 className="h-10 w-10 mx-auto text-primary mb-3" />
                <p className="text-sm text-gray-500">La visualización del gráfico de ventas aparecerá aquí</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-success/10 p-3 rounded-md">
                <div className="flex items-center text-success mb-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Mayor Crecimiento</span>
                </div>
                <p className="font-semibold">Pro Court 2023</p>
                <p className="text-sm">+24% en los últimos 30 días</p>
              </div>
              
              <div className="bg-error/10 p-3 rounded-md">
                <div className="flex items-center text-error mb-1">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Ventas Decrecientes</span>
                </div>
                <p className="font-semibold">Adidas Runner</p>
                <p className="text-sm">-8% en los últimos 30 días</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Ventas Recientes</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Producto</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Tienda</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Monto</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasRecientes.map((venta) => (
                    <tr key={venta.id} className="border-b">
                      <td className="py-2 px-4 text-sm">{venta.product}</td>
                      <td className="py-2 px-4 text-sm">{venta.store}</td>
                      <td className="py-2 px-4 text-sm font-medium">{venta.amount}</td>
                      <td className="py-2 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          venta.status === 'completed' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {venta.status === 'completed' ? 'Completado' : 'En Proceso'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-xl font-semibold">Alertas de Inventario</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Producto</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Talla</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Ubicación</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Disponible</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {alertasInventario.map((alerta) => (
                  <tr key={alerta.id} className="border-b">
                    <td className="py-2 px-4 text-sm">{alerta.product}</td>
                    <td className="py-2 px-4 text-sm">{alerta.size}</td>
                    <td className="py-2 px-4 text-sm">{alerta.location}</td>
                    <td className="py-2 px-4 text-sm">{alerta.available}</td>
                    <td className="py-2 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alerta.status === 'out' 
                          ? 'bg-error/10 text-error' 
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {alerta.status === 'out' ? 'Sin Stock' : 'Stock Bajo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};