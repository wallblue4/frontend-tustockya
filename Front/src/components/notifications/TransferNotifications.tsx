// components/notifications/TransferNotifications.tsx
import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Package, Truck } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

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

interface TransferNotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

export const TransferNotifications: React.FC<TransferNotificationsProps> = ({
  notifications,
  onDismiss,
  onDismissAll
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Package className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Botón de notificaciones */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full"
        variant="outline"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </Button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto shadow-xl border border-border">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border bg-muted/20">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-foreground">Notificaciones</h3>
                <div className="flex space-x-2">
                  {notifications.length > 0 && (
                    <Button
                      onClick={onDismissAll}
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                    >
                      Limpiar todo
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsOpen(false)}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground bg-card">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 ${getBgColor(notification.type)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-medium text-sm text-foreground">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                          
                          {notification.action && (
                            <Button
                              onClick={notification.action.onClick}
                              size="sm"
                              className="mt-2"
                            >
                              {notification.action.label}
                            </Button>
                          )}
                        </div>
                        <Button
                          onClick={() => onDismiss(notification.id)}
                          size="sm"
                          variant="ghost"
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};