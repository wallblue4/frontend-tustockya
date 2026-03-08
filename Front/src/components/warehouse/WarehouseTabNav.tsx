import React from 'react';
import { Clock, Package, Warehouse, CheckCircle, Truck, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { WarehouseTab } from '../../types/warehouse';

interface WarehouseTabNavProps {
  activeTab: WarehouseTab;
  setActiveTab: (tab: WarehouseTab) => void;
  filteredPendingCount: number;
  acceptedCount: number;
  pendingReturnsCount: number;
  transferHistoryCount: number;
  loading: boolean;
  onRefresh: () => void;
  onHistoryClick: () => void;
}

export const WarehouseTabNav: React.FC<WarehouseTabNavProps> = ({
  activeTab,
  setActiveTab,
  filteredPendingCount,
  acceptedCount,
  pendingReturnsCount,
  transferHistoryCount,
  loading,
  onRefresh,
  onHistoryClick,
}) => {
  return (
    <Card>
      <CardContent className="p-2 md:p-4">
        <div className="flex flex-wrap gap-2 md:gap-4">
          <Button
            variant={activeTab === 'pending' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('pending')}
            size="sm"
            className="flex-1 md:flex-none text-xs md:text-sm"
          >
            <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Pendientes</span>
            <span className="sm:hidden">Pend.</span>({filteredPendingCount})
          </Button>
          <Button
            variant={activeTab === 'accepted' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('accepted')}
            size="sm"
            className="flex-1 md:flex-none text-xs md:text-sm"
          >
            <Package className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Entregas</span>
            <span className="sm:hidden">Entreg.</span>({acceptedCount})
          </Button>
          <Button
            variant={activeTab === 'inventory' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('inventory')}
            size="sm"
            className="flex-1 md:flex-none text-xs md:text-sm"
          >
            <Warehouse className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Inventario</span>
            <span className="sm:hidden">Inv.</span>
          </Button>
          <Button
            variant={activeTab === 'stats' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('stats')}
            size="sm"
            className="flex-1 md:flex-none text-xs md:text-sm"
          >
            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Estadisticas</span>
            <span className="sm:hidden">Stats</span>
          </Button>
          <Button
            variant={activeTab === 'returns' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('returns')}
            size="sm"
            className="flex-1 md:flex-none text-xs md:text-sm"
          >
            <Package className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Devoluciones</span>
            <span className="sm:hidden">Devol.</span>({pendingReturnsCount})
          </Button>
          <Button
            variant={activeTab === 'history' ? 'primary' : 'outline'}
            onClick={onHistoryClick}
            size="sm"
            className="flex-1 md:flex-none text-xs md:text-sm"
          >
            <Truck className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Historial</span>
            <span className="sm:hidden">Hist.</span>({transferHistoryCount})
          </Button>
          <div className="flex-grow hidden md:block"></div>
          <Button variant="ghost" onClick={onRefresh} size="sm" className="text-xs md:text-sm" disabled={loading}>
            <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Actualizar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
