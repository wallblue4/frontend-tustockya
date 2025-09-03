import React, { useState } from 'react';
import { X, DollarSign, Calendar, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Location {
  id: number;
  name: string;
  type: 'local' | 'bodega';
}

interface CreateCostModalProps {
  onClose: () => void;
  onSubmit: (costData: any) => void;
  locations: Location[];
}

export const CreateCostModal: React.FC<CreateCostModalProps> = ({ 
  onClose, 
  onSubmit, 
  locations 
}) => {
  const [formData, setFormData] = useState({
    cost_type: 'fijo' as 'fijo' | 'variable',
    category: '',
    description: '',
    amount: '',
    frequency: 'mensual' as 'diario' | 'semanal' | 'mensual' | 'anual',
    location_id: '',
    due_date: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const costCategories = {
    fijo: [
      'Arriendo',
      'Servicios Públicos',
      'Internet',
      'Seguros',
      'Nómina',
      'Otros Fijos'
    ],
    variable: [
      'Mercancía',
      'Transporte',
      'Publicidad',
      'Mantenimiento',
      'Suministros',
      'Otros Variables'
    ]
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cost_type) {
      newErrors.cost_type = 'El tipo de costo es requerido';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.amount) {
      newErrors.amount = 'El monto es requerido';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (!formData.frequency) {
      newErrors.frequency = 'La frecuencia es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        location_id: formData.location_id ? parseInt(formData.location_id) : undefined,
        due_date: formData.due_date || undefined
      });
    } catch (error) {
      console.error('Error creating cost:', error);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Registrar Nuevo Costo
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Costo
            </label>
            <select
              value={formData.cost_type}
              onChange={(e) => {
                handleInputChange('cost_type', e.target.value);
                setFormData(prev => ({ ...prev, category: '' })); // Reset category
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.cost_type ? 'border-error' : 'border-gray-300'
              }`}
            >
              <option value="fijo">Costo Fijo</option>
              <option value="variable">Costo Variable</option>
            </select>
            {errors.cost_type && <p className="mt-1 text-sm text-error">{errors.cost_type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.category ? 'border-error' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar categoría</option>
              {costCategories[formData.cost_type].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-error">{errors.category}</p>}
          </div>

          <Input
            label="Descripción"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            error={errors.description}
            placeholder="Ej: Arriendo local centro comercial"
            icon={<Tag className="h-4 w-4 text-gray-400" />}
            required
          />

          <Input
            label="Monto"
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            error={errors.amount}
            placeholder="0"
            min="0"
            step="1000"
            icon={<DollarSign className="h-4 w-4 text-gray-400" />}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frecuencia
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => handleInputChange('frequency', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.frequency ? 'border-error' : 'border-gray-300'
              }`}
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
            {errors.frequency && <p className="mt-1 text-sm text-error">{errors.frequency}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación (Opcional)
            </label>
            <select
              value={formData.location_id}
              onChange={(e) => handleInputChange('location_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todas las ubicaciones</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.type})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Fecha de Vencimiento (Opcional)"
            type="date"
            value={formData.due_date}
            onChange={(e) => handleInputChange('due_date', e.target.value)}
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
          />
          
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
              Registrar Costo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
