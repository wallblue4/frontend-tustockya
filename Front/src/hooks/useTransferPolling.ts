// hooks/useTransferPolling.ts
import { useEffect, useRef, useState } from 'react';
import { vendorAPI, warehouseAPI, courierAPI } from '../services/transfersAPI';

interface PollingOptions {
  enabled: boolean;
  interval: number;
  onUpdate?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useTransferPolling = (
  userRole: 'seller' | 'bodeguero' | 'corredor',
  options: PollingOptions
) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  const fetchData = async () => {
    try {
      setError(null);
      let response;

      switch (userRole) {
        case 'seller':
          const [pending, receptions] = await Promise.all([
            vendorAPI.getPendingTransfers(),
            vendorAPI.getPendingReceptions()
          ]);
          response = { pending: pending.pending_transfers, receptions: receptions.pending_receptions };
          break;

        case 'bodeguero':
          const [pendingReq, accepted] = await Promise.all([
            warehouseAPI.getPendingRequests(),
            warehouseAPI.getAcceptedRequests()
          ]);
          response = { pending: pendingReq.pending_requests, accepted: accepted.accepted_requests };
          break;

        case 'corredor':
          const [available, assigned] = await Promise.all([
            courierAPI.getAvailableRequests(),
            courierAPI.getMyAssignedTransports() // my-transports - entregas asignadas/pendientes
          ]);
          response = { available: available.available_requests, assigned: assigned.my_transports || [] };
          break;

        default:
          throw new Error('Rol de usuario no válido');
      }

      setData(response);
      options.onUpdate?.(response);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      setError(error);
      options.onError?.(error);
    }
  };

  const startPolling = () => {
    if (!options.enabled || intervalRef.current) return;

    setIsPolling(true);

    // Fetch inicial
    fetchData();

    // Configurar intervalo
    intervalRef.current = setInterval(fetchData, options.interval);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  };

  useEffect(() => {
    if (options.enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [options.enabled, options.interval, userRole]);

  // Visibility API: Forzar actualización cuando el usuario vuelve a la app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && options.enabled) {
        console.log('App visible: Forzando actualización de datos...');
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [options.enabled, userRole]);

  return {
    data,
    error,
    isPolling,
    refetch: fetchData,
    startPolling,
    stopPolling
  };
};