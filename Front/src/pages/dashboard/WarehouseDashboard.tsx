import React from 'react';
import { Package, Send, X } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const WarehouseDashboard: React.FC = () => {
  const solicitudesEntrega = [
    { 
      id: 'REQ-2025071801', 
      productName: 'Pro Court 2023', 
      size: '9.5', 
      quantity: 2, 
      requester: 'Juan (Tienda Centro)',
      status: 'pending',
      created: '2025-07-18 10:24 AM',
      image: 'https://images.pexels.com/photos/2385477/pexels-photo-2385477.jpeg',
      forDisplay: true
    },
    { 
      id: 'REQ-2025071802', 
      productName: 'Speed Runner Elite', 
      size: '8', 
      quantity: 1, 
      requester: 'María (Tienda Mall)',
      status: 'pending',
      created: '2025-07-18 09:15 AM',
      image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg',
      forDisplay: false
    }
  ];

  return (
    <DashboardLayout title="Panel de Bodega">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Package className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold">Solicitudes de Entrega</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {solicitudesEntrega.map((solicitud) => (
                <div 
                  key={solicitud.id} 
                  className="border rounded-md p-4 flex gap-6"
                >
                  <div className="w-32 h-32 flex-shrink-0">
                    <img 
                      src={solicitud.image} 
                      alt={solicitud.productName} 
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-lg">{solicitud.productName}</h3>
                        <p className="text-sm text-gray-600">
                          {solicitud.id} • Solicitado por {solicitud.requester}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                        Pendiente
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Talla</p>
                        <p className="font-medium">{solicitud.size}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cantidad</p>
                        <p className="font-medium">{solicitud.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Propósito</p>
                        <p className="font-medium">{solicitud.forDisplay ? 'Exhibición' : 'Stock'}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        size="sm" 
                        className="bg-success hover:bg-success/90"
                      >
                        <Send className="h-4 w-4 mr-1" /> Enviar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-error hover:bg-error/10"
                      >
                        <X className="h-4 w-4 mr-1" /> Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};