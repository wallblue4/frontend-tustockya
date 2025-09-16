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

    if (!formData.location_id) {
      newErrors.location_id = 'La ubicación es requerida';
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <DollarSign className="h-5 w-5 mr-2" />
            Registrar Nuevo Costo
          </h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tipo de Costo
            </label>
            <select
              value={formData.cost_type}
              onChange={(e) => {
                handleInputChange('cost_type', e.target.value);
                setFormData(prev => ({ ...prev, category: '' })); // Reset category
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground ${
                errors.cost_type ? 'border-destructive' : 'border-border'
              }`}
            >
              <option value="fijo">Costo Fijo</option>
              <option value="variable">Costo Variable</option>
            </select>
            {errors.cost_type && <p className="mt-1 text-sm text-destructive">{errors.cost_type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground ${
                errors.category ? 'border-destructive' : 'border-border'
              }`}
            >
              <option value="">Seleccionar categoría</option>
              {costCategories[formData.cost_type].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-destructive">{errors.category}</p>}
          </div>

          <Input
            label="Descripción"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            error={errors.description}
            placeholder="Ej: Arriendo local centro comercial"
            icon={<Tag className="h-4 w-4 text-muted-foreground" />}
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
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            required
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Frecuencia
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => handleInputChange('frequency', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground ${
                errors.frequency ? 'border-destructive' : 'border-border'
              }`}
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
            {errors.frequency && <p className="mt-1 text-sm text-destructive">{errors.frequency}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Ubicación <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.location_id}
              onChange={(e) => handleInputChange('location_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground ${
                errors.location_id ? 'border-destructive' : 'border-border'
              }`}
            >
              <option value="">Seleccionar ubicación</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.type})
                </option>
              ))}
            </select>
            {errors.location_id && <p className="mt-1 text-sm text-destructive">{errors.location_id}</p>}
          </div>

          <Input
            label="Fecha de Vencimiento (Opcional)"
            type="date"
            value={formData.due_date}
            onChange={(e) => handleInputChange('due_date', e.target.value)}
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
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
