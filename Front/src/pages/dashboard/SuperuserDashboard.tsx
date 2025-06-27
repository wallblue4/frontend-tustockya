import React, { useState } from 'react';
import { 
  Users, 
  Database, 
  ArrowUpFromLine, 
  ArrowDownToLine,
  Trash2, 
  Plus 
} from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const SuperuserDashboard: React.FC = () => {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  
  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Administrador creado: ${adminName} (${newAdminEmail})`);
    setNewAdminEmail('');
    setAdminName('');
  };
  
  return (
    <DashboardLayout title="Panel de Superusuario">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Users className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold">Gestión de Administradores</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <h3 className="font-medium mb-2">Crear Nueva Cuenta de Administrador</h3>
              <Input
                label="Nombre del Administrador"
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Ingrese el nombre del administrador"
                required
              />
              <Input
                label="Correo Electrónico"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Ingrese el correo electrónico"
                required
              />
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Crear Cuenta de Administrador
              </Button>
            </form>
            
            <div className="mt-6">
              <h3 className="font-medium mb-3">Administradores Existentes</h3>
              <div className="space-y-3">
                {[
                  { id: 1, name: 'Juan Pérez', email: 'juan@tennishub.com' },
                  { id: 2, name: 'María Rodríguez', email: 'maria@tennishub.com' },
                  { id: 3, name: 'David Chen', email: 'david@tennishub.com' },
                ].map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">{admin.name}</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-error hover:text-error">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Database className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold">Gestión de Base de Datos</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Estado de la Base de Datos</h3>
                <div className="p-4 rounded-md bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tamaño de la Base de Datos</p>
                      <p className="font-medium">1.45 GB</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Último Respaldo</p>
                      <p className="font-medium">Hoy, 03:45 AM</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registros</p>
                      <p className="font-medium">67,582</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <p className="text-success font-medium">Con Espacio</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button className="w-full">
                  <ArrowUpFromLine className="h-4 w-4 mr-2" /> Exportar
                </Button>
                <Button className="w-full">
                  <ArrowDownToLine className="h-4 w-4 mr-2" /> Comprimir
                </Button>
                <Button variant="outline" className="w-full text-error hover:text-error">
                  <Trash2 className="h-4 w-4 mr-2" /> Reiniciar
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Registro de la Base de Datos</h3>
                <div className="bg-gray-900 text-gray-300 p-3 rounded-md font-mono text-xs h-36 overflow-y-auto">
                  <p>[2025-07-18 09:32:12] INFO: Respaldo de base de datos completado exitosamente</p>
                  <p>[2025-07-18 00:05:03] INFO: Proceso de limpieza automático ejecutado</p>
                  <p>[2025-07-17 18:43:27] WARN: Alto tráfico detectado, capacidad del servidor aumentada</p>
                  <p>[2025-07-17 14:22:05] INFO: Optimización de índices completada</p>
                  <p>[2025-07-17 10:15:33] INFO: Nuevos registros añadidos: 521</p>
                  <p>[2025-07-17 08:00:12] INFO: Mantenimiento diario completado</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};