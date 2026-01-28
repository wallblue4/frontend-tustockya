import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AddSizeModalProps {
  onClose: () => void;
  onSubmit: (data: {
    location_id: number;
    product_reference: string;
    size: string;
    adjustment_type: 'set_quantity';
    quantity: number;
    reason: string;
    inventory_type: 'pair' | 'left_only' | 'right_only';
  }) => Promise<void>;
  productData: {
    brand: string;
    model: string;
    reference_code: string;
    location_id: number;
    location_name: string;
    existing_sizes: string[];
  };
}

export const AddSizeModal: React.FC<AddSizeModalProps> = ({
  onClose,
  onSubmit,
  productData
}) => {
  const [formData, setFormData] = useState({
    size: '',
    quantity: 1,
    reason: '',
    inventory_type: 'pair' as 'pair' | 'left_only' | 'right_only'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInventoryTypeLabel = (type: string) => {
    switch (type) {
      case 'pair': return 'Par completo';
      case 'left_only': return 'Pie izquierdo';
      case 'right_only': return 'Pie derecho';
      default: return type;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.size.trim()) {
      newErrors.size = 'La talla es requerida';
    } else if (productData.existing_sizes.includes(formData.size.trim())) {
      newErrors.size = 'Esta talla ya existe para este producto en esta ubicacion';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'El motivo es requerido';
    } else if (formData.reason.trim().length < 5) {
      newErrors.reason = 'El motivo debe tener al menos 5 caracteres';
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
        location_id: productData.location_id,
        product_reference: productData.reference_code,
        size: formData.size.trim(),
        adjustment_type: 'set_quantity',
        quantity: formData.quantity,
        reason: formData.reason.trim(),
        inventory_type: formData.inventory_type
      });
      onClose();
    } catch (error) {
      console.error('Error adding size:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
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
            <Plus className="h-5 w-5 mr-2" />
            Agregar Nueva Talla
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Informacion del producto (readonly) */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Producto:</span>
              <span className="text-sm font-medium text-foreground">{productData.brand} {productData.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Referencia:</span>
              <span className="text-sm font-mono text-foreground">{productData.reference_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ubicacion:</span>
              <span className="text-sm text-foreground">{productData.location_name}</span>
            </div>
            {productData.existing_sizes.length > 0 && (
              <div className="pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Tallas existentes:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {productData.existing_sizes.map(size => (
                    <span key={size} className="px-2 py-0.5 bg-muted rounded text-xs text-foreground">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nueva talla */}
          <div>
            <Input
              label="Nueva Talla"
              type="text"
              value={formData.size}
              onChange={(e) => handleInputChange('size', e.target.value)}
              error={errors.size}
              placeholder="Ej: 42, 38.5, 10 US"
              required
            />
          </div>

          {/* Tipo de inventario */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tipo de Inventario <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.inventory_type}
              onChange={(e) => handleInputChange('inventory_type', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
            >
              <option value="pair">{getInventoryTypeLabel('pair')}</option>
              <option value="left_only">{getInventoryTypeLabel('left_only')}</option>
              <option value="right_only">{getInventoryTypeLabel('right_only')}</option>
            </select>
          </div>

          {/* Cantidad inicial */}
          <div>
            <Input
              label="Cantidad Inicial"
              type="number"
              value={formData.quantity.toString()}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              error={errors.quantity}
              placeholder="1"
              min="1"
              required
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Motivo <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground min-h-[80px] ${
                errors.reason ? 'border-destructive' : 'border-border'
              }`}
              placeholder="Ej: Nueva talla agregada al catalogo, Ingreso de inventario inicial, etc."
              required
            />
            {errors.reason && <p className="mt-1 text-sm text-destructive">{errors.reason}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Minimo 5 caracteres</p>
          </div>

          {/* Info */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-primary">
              Se creara una nueva talla "{formData.size || '...'}" con {formData.quantity} unidad(es) de tipo "{getInventoryTypeLabel(formData.inventory_type)}" en {productData.location_name}.
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
              disabled={isSubmitting || !formData.size.trim() || formData.quantity <= 0 || formData.reason.length < 5}
              isLoading={isSubmitting}
            >
              Agregar Talla
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
