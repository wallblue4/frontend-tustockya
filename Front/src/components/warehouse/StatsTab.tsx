import React from 'react';
import type { WarehouseStats } from '../../types/warehouse';
import { formatPrice } from '../../utils/warehouseUtils';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface StatsTabProps {
  stats: WarehouseStats;
}

const StatsTab: React.FC<StatsTabProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <h3 className="text-base md:text-lg font-semibold">📊 Estadísticas del Día</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base">Solicitudes procesadas:</span>
              <span className="font-bold">24</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base">Tiempo promedio de respuesta:</span>
              <span className="font-bold text-green-600">8.5 min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base">Solicitudes urgentes atendidas:</span>
              <span className="font-bold text-red-600">6</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base">Productos entregados a corredores:</span>
              <span className="font-bold">18</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base">Valor total de stock gestionado:</span>
              <span className="font-bold text-blue-600">{formatPrice(stats.totalStockValue)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-base md:text-lg font-semibold">🎯 Rendimiento</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm md:text-base">Tasa de completación</span>
                <span className="font-bold">{stats.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.completionRate}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm md:text-base">Solicitudes rechazadas</span>
                <span className="font-bold text-red-600">2</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm md:text-base">Eficiencia en entregas</span>
                <span className="font-bold text-green-600">96.5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '96.5%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm md:text-base">Tiempo promedio de entrega</span>
                <span className="font-bold text-blue-600">12 min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsTab;
