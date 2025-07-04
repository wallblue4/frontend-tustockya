import React from 'react';
import { Package, MapPin } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const RunnerDashboard: React.FC = () => {
  const solicitudEntrega = {
    id: 'DEL-7832',
    items: [
      { product: 'Pro Court 2023', size: '9.5', quantity: 2 },
      { product: 'Speed Runner Elite', size: '8', quantity: 1 },
    ],
    from: 'Almacén Principal',
    to: 'Tienda Centro',
    distance: '3.2 km',
    requestedBy: 'Juan (Tienda Centro)',
    timestamp: '2025-07-18 10:24 AM'
  };

  const handleAccept = () => {
    console.log('Entrega aceptada');
  };

  const handleDecline = () => {
    console.log('Entrega rechazada');
  };

  return (
    <DashboardLayout title="Entrega Disponible">
      <div className="max-w-2xl mx-auto">
        {solicitudEntrega ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-6 w-6 text-primary mr-2" />
                  <h2 className="text-xl font-semibold">Nueva Solicitud de Entrega</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                  Pendiente
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Tenis a entregar:</h3>
                  <div className="space-y-2">
                    {solicitudEntrega.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{item.product} (Talla {item.size})</span>
                        <span className="font-medium">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Recoger en</p>
                    <p className="font-medium">{solicitudEntrega.from}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Entregar en</p>
                    <p className="font-medium">{solicitudEntrega.to}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>Distancia: {solicitudEntrega.distance}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-500">Solicitado por:</span>
                    <span className="font-medium">{solicitudEntrega.requestedBy}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-6">
                    <span className="text-gray-500">Hora de solicitud:</span>
                    <span className="font-medium">{solicitudEntrega.timestamp}</span>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      className="flex-1 bg-success hover:bg-success/90"
                      onClick={handleAccept}
                    >
                      Aceptar Entrega
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-error hover:bg-error/10"
                      onClick={handleDecline}
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium">No hay entregas disponibles</h3>
              <p className="text-gray-500">Revisa en unos minutos para nuevas solicitudes de entrega.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};