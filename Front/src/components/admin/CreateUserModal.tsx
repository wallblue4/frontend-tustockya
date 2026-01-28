import React, { useState } from 'react';
import { X, User, Mail, Lock, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Location {
  id: number;
  name: string;
  type: 'local' | 'bodega';
}

interface CreateUserModalProps {
  onClose: () => void;
  onSubmit: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    location_ids: number[];
  }) => void;
  locations: Location[];
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  onClose,
  onSubmit,
  locations
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'vendedor' as 'vendedor' | 'bodeguero' | 'corredor',
    location_ids: [] as number[]
  });
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es valido';
    }

    if (!formData.password) {
      newErrors.password = 'La contrasena es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contrasena debe tener al menos 6 caracteres';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }

    if (!formData.role) {
      newErrors.role = 'El rol es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Mapear roles en español a los valores que espera el backend en ingles
      const roleMapping: Record<string, string> = {
        'vendedor': 'seller',
        'bodeguero': 'bodeguero',
        'corredor': 'corredor'
      };

      await onSubmit({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: roleMapping[formData.role] || formData.role,
        location_ids: formData.location_ids
      });
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleLocation = (locationId: number) => {
    setFormData(prev => {
      const newLocationIds = prev.location_ids.includes(locationId)
        ? prev.location_ids.filter(id => id !== locationId)
        : [...prev.location_ids, locationId];
      return { ...prev, location_ids: newLocationIds };
    });
  };

  const isLocationSelected = (locationId: number) => {
    return formData.location_ids.includes(locationId);
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
            Crear Nuevo Usuario
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
            required
          />

          <div className="relative">
            <Input
              label="Contrasena"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
              icon={<Lock className="h-4 w-4 text-gray-400" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className={`absolute right-3 top-8 focus:outline-none ${showPassword ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.94 17.94A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.175-6.125M3 3l18 18" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12" />
                </svg>
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground ${
                errors.role ? 'border-destructive' : 'border-border'
              }`}
            >
              <option value="vendedor">Vendedor</option>
              <option value="bodeguero">Bodeguero</option>
              <option value="corredor">Corredor</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-destructive">{errors.role}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ubicaciones Asignadas
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Selecciona una o mas ubicaciones para este usuario
            </p>
            <div className="border border-border rounded-md max-h-48 overflow-y-auto">
              {locations.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No hay ubicaciones disponibles
                </div>
              ) : (
                locations.map((location) => (
                  <div
                    key={location.id}
                    onClick={() => toggleLocation(location.id)}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors ${
                      isLocationSelected(location.id) ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isLocationSelected(location.id)
                          ? 'bg-primary border-primary'
                          : 'border-border'
                      }`}>
                        {isLocationSelected(location.id) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm text-foreground">{location.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      location.type === 'bodega'
                        ? 'bg-warning/20 text-warning'
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {location.type}
                    </span>
                  </div>
                ))
              )}
            </div>
            {formData.location_ids.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {formData.location_ids.length} ubicacion(es) seleccionada(s)
              </p>
            )}
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
              Crear Usuario
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
