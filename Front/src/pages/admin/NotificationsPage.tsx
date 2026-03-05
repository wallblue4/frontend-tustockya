import React from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Bell, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { EmptyState } from '../../components/admin/ErrorState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAdmin } from '../../context/AdminContext';

export const NotificationsPage: React.FC = () => {
  const { notifications, loadNotifications, handleApproveDiscount } = useAdmin();

  const allNotifications = [
    ...notifications.discounts.map((n: any) => ({ ...n, type: 'discount' })),
    ...notifications.returns.map((n: any) => ({ ...n, type: 'return' })),
  ].sort(
    (a, b) => new Date(b.requested_at || b.created_at).getTime() - new Date(a.requested_at || a.created_at).getTime()
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notificaciones</h2>
        <Button onClick={() => loadNotifications()} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{notifications.discounts.length}</p>
            <p className="text-sm text-gray-600">Descuentos Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
            <p className="text-2xl font-bold">{notifications.returns.length}</p>
            <p className="text-sm text-gray-600">Devoluciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{allNotifications.length}</p>
            <p className="text-sm text-gray-600">Total Notificaciones</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Todas las Notificaciones</h3>
        </CardHeader>
        <CardContent>
          {allNotifications.length === 0 ? (
            <EmptyState
              title="No hay notificaciones"
              description="No tienes notificaciones pendientes en este momento"
              icon={<Bell className="h-12 w-12 text-gray-400" />}
            />
          ) : (
            <div className="space-y-4">
              {allNotifications.map((notification: any) => (
                <div
                  key={`${notification.type}-${notification.id}`}
                  className={`p-4 rounded-lg border-l-4 ${
                    notification.type === 'discount' ? 'bg-warning/10 border-warning' : 'bg-error/10 border-error'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {notification.type === 'discount' ? (
                          <AlertCircle className="h-5 w-5 text-warning" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-error" />
                        )}
                        <span className="font-medium">
                          {notification.type === 'discount' ? 'Solicitud de Descuento' : 'Devolución'}
                        </span>
                        <Badge
                          variant={
                            notification.status === 'pending'
                              ? 'warning'
                              : notification.status === 'approved'
                                ? 'success'
                                : 'error'
                          }
                        >
                          {notification.status === 'pending'
                            ? 'Pendiente'
                            : notification.status === 'approved'
                              ? 'Aprobado'
                              : 'Rechazado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {notification.reason || notification.message || notification.notes}
                      </p>
                      {notification.requester_name && (
                        <p className="text-sm text-gray-600">Solicitado por: {notification.requester_name}</p>
                      )}
                      {notification.location_name && (
                        <p className="text-sm text-gray-600">Ubicación: {notification.location_name}</p>
                      )}
                      {notification.discount_amount && (
                        <p className="text-sm font-medium">
                          Descuento: {formatCurrency(parseFloat(notification.discount_amount))}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(notification.requested_at || notification.created_at)}
                      </p>
                    </div>
                    {notification.type === 'discount' && notification.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success border-success hover:bg-success hover:text-white"
                          onClick={() => handleApproveDiscount(notification.id, true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-error border-error hover:bg-error hover:text-white"
                          onClick={() => handleApproveDiscount(notification.id, false, 'Rechazado por administrador')}
                        >
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
