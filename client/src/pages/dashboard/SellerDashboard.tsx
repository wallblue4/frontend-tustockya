import React from 'react';
import { Camera, ShoppingBag, Package, Clock } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Button } from '../../components/ui/Button';

export const SellerDashboard: React.FC = () => {
  return (
    <DashboardLayout title="Panel de Vendedor">
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-6 p-6">
        <Button 
          className="h-48 text-xl font-semibold flex flex-col items-center justify-center space-y-4"
          onClick={() => console.log('Escanear Producto')}
        >
          <Camera className="h-12 w-12" />
          <span>Escanear</span>
        </Button>

        <Button 
          className="h-48 text-xl font-semibold flex flex-col items-center justify-center space-y-4"
          onClick={() => console.log('Nueva Venta')}
        >
          <ShoppingBag className="h-12 w-12" />
          <span>Nueva Venta</span>
        </Button>

        <Button 
          className="h-48 text-xl font-semibold flex flex-col items-center justify-center space-y-4"
          onClick={() => console.log('Solicitar Tenis')}
        >
          <Package className="h-12 w-12" />
          <span>Solicitar Tenis</span>
        </Button>

        <Button 
          className="h-48 text-xl font-semibold flex flex-col items-center justify-center space-y-4"
          onClick={() => console.log('Solicitudes Pendientes')}
        >
          <Clock className="h-12 w-12" />
          <span>Solicitudes Pendientes</span>
        </Button>
      </div>
    </DashboardLayout>
  );
};