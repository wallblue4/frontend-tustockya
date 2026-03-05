import React from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, BarChart3, Package, PieChart, Download } from 'lucide-react';
import { EmptyState } from '../../components/admin/ErrorState';
import { generateSalesReports, fetchUsersPerformance, fetchTransfersOverview } from '../../services/adminAPI';

export const AnalyticsPage: React.FC = () => {
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
                  end_date: new Date().toISOString().split('T')[0],
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
                  end_date: new Date().toISOString().split('T')[0],
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Análisis de Ventas</h3>
            <p className="text-sm text-gray-600 mb-4">Tendencias y patrones de venta</p>
            <Button size="sm" className="w-full">
              Analizar
            </Button>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-secondary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Performance de Usuarios</h3>
            <p className="text-sm text-gray-600 mb-4">Rendimiento por usuario y rol</p>
            <Button size="sm" className="w-full">
              Ver Métricas
            </Button>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-success mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Análisis de Inventario</h3>
            <p className="text-sm text-gray-600 mb-4">Rotación y optimización de stock</p>
            <Button size="sm" className="w-full">
              Optimizar
            </Button>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <PieChart className="h-12 w-12 text-warning mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Análisis Financiero</h3>
            <p className="text-sm text-gray-600 mb-4">Costos, márgenes y rentabilidad</p>
            <Button size="sm" className="w-full">
              Analizar
            </Button>
          </CardContent>
        </Card>
      </div>

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
