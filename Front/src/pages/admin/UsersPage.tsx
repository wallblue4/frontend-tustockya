import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { Users, Plus, Edit } from 'lucide-react';
import { EmptyState } from '../../components/admin/ErrorState';
import { CreateUserModal } from '../../components/admin/CreateUserModal';
import { EditUserModal } from '../../components/admin/EditUserModal';
import { fetchManagedUsers, createUser, updateUser } from '../../services/adminAPI';
import { useAdmin } from '../../context/AdminContext';
import type { AdminUser } from '../../types/admin';

export const UsersPage: React.FC = () => {
  const { locations, availableLocations } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '' as '' | 'vendedor' | 'bodeguero' | 'corredor',
    location: '',
    status: '',
  });

  const loadUsers = async () => {
    try {
      const params: any = {};
      if (userFilters.role) params.role = userFilters.role;
      if (userFilters.location && userFilters.location !== '') params.location_id = parseInt(userFilters.location);
      if (userFilters.status && userFilters.status !== '') params.is_active = userFilters.status === 'active';

      const response = await fetchManagedUsers(params);
      setUsers(Array.isArray(response) ? response : response.users || response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFilters]);

  const handleCreateUser = async (userData: any) => {
    try {
      await createUser({
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        location_ids: userData.location_ids || [],
      });
      await loadUsers();
      setShowCreateUserModal(false);
      alert('Usuario creado exitosamente');
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert('Error al crear usuario: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleUpdateUser = async (userId: number, userData: any) => {
    try {
      await updateUser(userId, {
        first_name: userData.first_name,
        last_name: userData.last_name,
        is_active: userData.is_active,
        location_ids: userData.location_ids || [],
      });
      await loadUsers();
      setEditingUser(null);
      setShowEditUserModal(false);
      alert('Usuario actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('Error al actualizar usuario: ' + (error.message || 'Error desconocido'));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h2>
        <Button onClick={() => setShowCreateUserModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Filtros de usuarios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <h4>Tipo de usuario</h4>
            <Select
              value={userFilters.role}
              onChange={(e) => setUserFilters((prev) => ({ ...prev, role: e.target.value as any }))}
              options={[
                { value: '', label: 'Todos los roles' },
                { value: 'seller', label: 'Vendedor' },
                { value: 'bodeguero', label: 'Bodeguero' },
                { value: 'corredor', label: 'Corredor' },
              ]}
            />
            <h4>Ubicación</h4>
            <Select
              value={userFilters.location}
              onChange={(e) => setUserFilters((prev) => ({ ...prev, location: e.target.value }))}
              options={[
                { value: '', label: 'Todas las ubicaciones' },
                ...locations.map((location) => ({ value: location.id.toString(), label: location.name })),
              ]}
            />
            <h4>Estado</h4>
            <Select
              value={userFilters.status}
              onChange={(e) => setUserFilters((prev) => ({ ...prev, status: e.target.value }))}
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full bg-card text-foreground border border-border rounded-lg overflow-hidden">
                <thead className="bg-popover text-popover-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">
                      Ubicaciones
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-b-0 bg-card hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-foreground">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.role}</td>
                      <td className="px-6 py-4">
                        {user.assigned_locations && user.assigned_locations.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.assigned_locations.map((loc) => (
                              <span
                                key={loc.id}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${loc.type === 'bodega' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'}`}
                              >
                                {loc.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.is_active ? 'success' : 'error'}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(user);
                            setShowEditUserModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No hay usuarios"
              description="No se encontraron usuarios con los filtros aplicados"
              icon={<Users className="h-12 w-12 text-gray-400" />}
            />
          )}
        </CardContent>
      </Card>

      {showCreateUserModal && (
        <CreateUserModal
          onClose={() => setShowCreateUserModal(false)}
          onSubmit={handleCreateUser}
          locations={availableLocations}
        />
      )}

      {showEditUserModal && editingUser && (
        <EditUserModal
          user={{
            ...editingUser,
            location_ids: editingUser.assigned_locations?.map((loc) => loc.id) || [],
          }}
          onClose={() => {
            setEditingUser(null);
            setShowEditUserModal(false);
          }}
          onSubmit={(userData) => handleUpdateUser(editingUser.id, userData)}
          locations={availableLocations}
        />
      )}
    </div>
  );
};
