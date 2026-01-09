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

  // --- LÓGICA DE NOTIFICACIONES NATIVAS (SISTEMA OPERATIVO) ---

  // Solicitar permisos al cargar el componente
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // Nota: Algunos navegadores requieren una acción del usuario para disparar esto
      Notification.requestPermission();
    }
  }, []);

  // Función para disparar la alerta visual del Sistema Operativo (Windows/macOS/Android)
  const triggerOSNotification = useCallback((title: string, message: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: message,// Asegúrate de que esta ruta sea válida en tu carpeta public
          tag: "transfer-update", // Agrupa notificaciones para no saturar el centro de actividades
          silent: false,
        });
      } catch (err) {
        console.error("Error al disparar notificación nativa:", err);
      }
    }
  }, []);

  // --- GESTIÓN DEL ESTADO INTERNO ---

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((
    type: Notification['type'],
    title: string,
    message: string,
    action?: Notification['action']
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const notification: Notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      action
    };

    // 1. Actualizar estado interno (Máximo 10 para no saturar la UI)
    setNotifications(prev => [notification, ...prev].slice(0, 10));

    // 2. Disparar notificación de Sistema Operativo si es importante (Warning o Info)
    // Esto es lo que permite que el usuario se entere aunque esté en otra pestaña
    if (type === 'warning' || type === 'info') {
      triggerOSNotification(title, message);
    }

    // 3. Auto-dismiss después de 8 segundos para notificaciones de éxito
    if (type === 'success') {
      setTimeout(() => {
        dismissNotification(id);
      }, 8000);
    }
  }, [dismissNotification, triggerOSNotification]);

  // --- MÉTODOS ESPECÍFICOS DE NEGOCIO ---

  const notifyTransferRequested = useCallback((transferId: number, isUrgent: boolean) => {
    addNotification(
      isUrgent ? 'warning' : 'info',
      isUrgent ? '🔥 Transferencia Urgente Solicitada' : '📦 Transferencia Solicitada',
      `Solicitud #${transferId} ${isUrgent ? 'para cliente presente' : 'de restock'} enviada exitosamente`,
      {
        label: 'Ver Estado',
        onClick: () => console.log('Navegando a transferencias...')
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
        onClick: () => console.log('Navegando a confirmación...')
      } : undefined
    );
  }, [addNotification]);

  const notifyNewTransferAvailable = useCallback((transferDetails: any) => {
    if (user?.role === 'bodeguero') {
      addNotification(
        transferDetails.purpose === 'cliente' ? 'warning' : 'info',
        transferDetails.purpose === 'cliente' ? '🔥 Solicitud Urgente' : '📦 Nueva Solicitud',
        `${transferDetails.product} solicitado por ${transferDetails.requester}`
      );
    }
  }, [addNotification, user?.role]);

  const notifyTransportAvailable = useCallback((transportDetails: any) => {
    if (user?.role === 'corredor') {
      addNotification(
        transportDetails.purpose === 'cliente' ? 'warning' : 'info',
        transportDetails.purpose === 'cliente' ? '🔥 Entrega Urgente Disponible' : '🚚 Nueva Entrega Disponible',
        `${transportDetails.product} - ${transportDetails.distance}`
      );
    }
  }, [addNotification, user?.role]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    dismissAllNotifications,
    notifyTransferRequested,
    notifyTransferStatusChange,
    notifyNewTransferAvailable,
    notifyTransportAvailable
  };
};