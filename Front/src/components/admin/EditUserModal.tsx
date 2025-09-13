import React, { useState } from 'react';
import { X, User, Mail } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Location {
  id: number;
  name: string;
  type: 'local' | 'bodega';
}

interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'vendedor' | 'bodeguero' | 'corredor';
  location_id?: number;
  is_active: boolean;
}

interface EditUserModalProps {
  user: UserData;
  onClose: () => void;
  onSubmit: (userData: any) => void;
  locations: Location[];
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ 
  user, 
  onClose, 
  onSubmit, 
  locations 
}) => {
  const [formData, setFormData] = useState({
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    location_id: user.location_id?.toString() || '',
    is_active: user.is_active
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Solo enviar los campos editables
      await onSubmit({
        first_name: formData.first_name,
        last_name: formData.last_name,
        is_active: formData.is_active,
        location_id: formData.location_id ? parseInt(formData.location_id) : undefined
      });
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <User className="h-5 w-5 mr-2" />
            Editar Usuario
          </h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              error={errors.first_name}
              icon={<User className="h-4 w-4 text-gray-400" />}
              required
            />
            <Input
              label="Apellido"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              error={errors.last_name}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            icon={<Mail className="h-4 w-4 text-gray-400" />}
            disabled
            readOnly
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-muted/30 text-muted-foreground cursor-not-allowed"
              disabled
            >
              <option value="vendedor">Vendedor</option>
              <option value="bodeguero">Bodeguero</option>
              <option value="corredor">Corredor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Ubicación
            </label>
            <select
              value={formData.location_id}
              onChange={(e) => handleInputChange('location_id', e.target.value)}
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sin asignar</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Estado del Usuario
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm text-foreground">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  formData.is_active 
                    ? 'bg-success/20 text-success' 
                    : 'bg-destructive/20 text-destructive'
                }`}>
                  {formData.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </label>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formData.is_active 
                ? 'El usuario puede acceder al sistema' 
                : 'El usuario no puede acceder al sistema'
              }
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Actualizar Usuario
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};