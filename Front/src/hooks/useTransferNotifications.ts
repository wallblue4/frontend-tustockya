// hooks/useTransferNotifications.ts
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useTransferNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const addNotification = useCallback((
    type: Notification['type'],
    title: string,
    message: string,
    action?: Notification['action']
  ) => {
    const notification: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      timestamp: new Date(),
      action
    };

    setNotifications(prev => [notification, ...prev].slice(0, 10)); // Máximo 10 notificaciones

    // Auto-dismiss después de 8 segundos para notificaciones de éxito
    if (type === 'success') {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, 8000);
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Notificaciones específicas para transferencias
  const notifyTransferRequested = useCallback((transferId: number, isUrgent: boolean) => {
    addNotification(
      isUrgent ? 'warning' : 'info',
      isUrgent ? '🔥 Transferencia Urgente Solicitada' : '📦 Transferencia Solicitada',
      `Solicitud #${transferId} ${isUrgent ? 'para cliente presente' : 'de restock'} enviada exitosamente`,
      {
        label: 'Ver Estado',
        onClick: () => {
          // Navegar a transferencias
          console.log('Navegando a transferencias...');
        }
      }
    );
  }, [addNotification]);

  const notifyTransferStatusChange = useCallback((transferId: number, status: string, details: string) => {
    const statusMessages: Record<string, { title: string; type: Notification['type'] }> = {
      'accepted': { title: '✅ Transferencia Aceptada', type: 'success' },
      'courier_assigned': { title: '🚚 Corredor Asignado', type: 'info' },
      'in_transit': { title: '🚛 En Camino', type: 'info' },
      'delivered': { title: '📦 Producto Entregado', type: 'success' },
      'completed': { title: '🎉 Transferencia Completada', type: 'success' },
      'cancelled': { title: '❌ Transferencia Cancelada', type: 'error' }
    };

    const config = statusMessages[status] || { title: 'Estado Actualizado', type: 'info' };
    
    addNotification(
      config.type,
      config.title,
      `Transferencia #${transferId}: ${details}`,
      status === 'delivered' ? {
        label: 'Confirmar Recepción',
        onClick: () => {
          // Navegar a confirmación
          console.log('Navegando a confirmación...');
        }
      } : undefined
    );
  }, [addNotification]);

  const notifyNewTransferAvailable = useCallback((transferDetails: any) => {
    if (user?.role === 'bodeguero') {
      addNotification(
        transferDetails.purpose === 'cliente' ? 'warning' : 'info',
        transferDetails.purpose === 'cliente' ? '🔥 Solicitud Urgente' : '📦 Nueva Solicitud',
        `${transferDetails.product} solicitado por ${transferDetails.requester}`,
        {
          label: 'Revisar',
          onClick: () => {
            console.log('Navegando a solicitudes pendientes...');
          }
        }
      );
    }
  }, [addNotification, user?.role]);

  const notifyTransportAvailable = useCallback((transportDetails: any) => {
    if (user?.role === 'corredor') {
      addNotification(
        transportDetails.purpose === 'cliente' ? 'warning' : 'info',
        transportDetails.purpose === 'cliente' ? '🔥 Entrega Urgente Disponible' : '🚚 Nueva Entrega Disponible',
        `${transportDetails.product} - ${transportDetails.distance}`,
        {
          label: 'Aceptar',
          onClick: () => {
            console.log('Navegando a entregas disponibles...');
          }
        }
      );
    }
  }, [addNotification, user?.role]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    dismissAllNotifications,
    // Métodos específicos
    notifyTransferRequested,
    notifyTransferStatusChange,
    notifyNewTransferAvailable,
    notifyTransportAvailable
  };
};