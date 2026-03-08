import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Card, CardContent } from '../../components/ui/Card';
import { useWarehouseDashboard } from '../../hooks/useWarehouseDashboard';
import { WarehouseTabNav } from '../../components/warehouse/WarehouseTabNav';
import PendingRequestsTab from '../../components/warehouse/PendingRequestsTab';
import AcceptedRequestsTab from '../../components/warehouse/AcceptedRequestsTab';
import InventoryTab from '../../components/warehouse/InventoryTab';
import StatsTab from '../../components/warehouse/StatsTab';
import ReturnsTab from '../../components/warehouse/ReturnsTab';
import TransferHistoryTab from '../../components/warehouse/TransferHistoryTab';
import type { WarehouseTab } from '../../types/warehouse';

const VALID_TABS: WarehouseTab[] = ['pending', 'accepted', 'inventory', 'stats', 'returns', 'history'];

export const WarehouseDashboard: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const currentTab: WarehouseTab = VALID_TABS.includes(tab as WarehouseTab) ? (tab as WarehouseTab) : 'pending';

  const {
    activeTab,
    setActiveTab,
    loading,
    error,
    pollingError,
    actionLoading,
    acceptedRequests,
    pendingReturns,
    transferHistory,
    transferHistoryLoading,
    stats,
    inventory,
    inventoryLoading,
    showFilters,
    setShowFilters,
    priorityFilter,
    setPriorityFilter,
    purposeFilter,
    setPurposeFilter,
    searchTerm,
    setSearchTerm,
    selectedLocation,
    setSelectedLocation,
    filteredPendingRequests,
    getFilteredInventory,
    handleRefresh,
    handleAcceptRequest,
    handleDeliverToCourier,
    handleDeliverToVendor,
    handleConfirmReturnReception,
    loadInventory,
    loadTransferHistory,
  } = useWarehouseDashboard(currentTab);

  const handleTabChange = useCallback(
    (newTab: WarehouseTab) => {
      setActiveTab(newTab);
      navigate(`/warehouse/${newTab}`, { replace: true });
    },
    [setActiveTab, navigate]
  );

  if (loading) {
    return (
      <DashboardLayout title="Panel de Bodega">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando solicitudes de bodega...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Panel de Bodega">
      <div className="space-y-4 md:space-y-6">
        <WarehouseTabNav
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          filteredPendingCount={filteredPendingRequests.length}
          acceptedCount={acceptedRequests.length}
          pendingReturnsCount={pendingReturns.length}
          transferHistoryCount={transferHistory.length}
          loading={loading}
          onRefresh={handleRefresh}
          onHistoryClick={async () => {
            handleTabChange('history');
            await loadTransferHistory();
          }}
        />

        {pollingError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                <p className="text-red-800 text-sm">Error de conexion - Usando datos locales</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-warning/30 bg-warning/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium text-warning">Modo de Desarrollo</p>
                  <p className="text-sm text-warning">
                    Usando datos de prueba. El servidor backend no esta disponible.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'history' && (
          <TransferHistoryTab
            transferHistory={transferHistory}
            transferHistoryLoading={transferHistoryLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}

        {activeTab === 'pending' && (
          <PendingRequestsTab
            filteredPendingRequests={filteredPendingRequests}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            purposeFilter={purposeFilter}
            setPurposeFilter={setPurposeFilter}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            actionLoading={actionLoading}
            onAcceptRequest={handleAcceptRequest}
          />
        )}

        {activeTab === 'accepted' && (
          <AcceptedRequestsTab
            acceptedRequests={acceptedRequests}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            actionLoading={actionLoading}
            onDeliverToCourier={handleDeliverToCourier}
            onDeliverToVendor={handleDeliverToVendor}
            onConfirmReturnReception={handleConfirmReturnReception}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            inventory={inventory}
            inventoryLoading={inventoryLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            getFilteredInventory={getFilteredInventory}
            onLoadInventory={loadInventory}
          />
        )}

        {activeTab === 'stats' && <StatsTab stats={stats} />}

        {activeTab === 'returns' && (
          <ReturnsTab
            pendingReturns={pendingReturns}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            actionLoading={actionLoading}
            onConfirmReturnReception={handleConfirmReturnReception}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
