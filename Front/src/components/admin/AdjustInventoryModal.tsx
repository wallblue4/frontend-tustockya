import React, { useState } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AdjustInventoryModalProps {
  onClose: () => void;
  onSubmit: (data: {
    location_id: number;
    product_reference: string;
    size: string;
    adjustment_type: 'set_quantity' | 'increment' | 'decrement';
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
    size: string;
    inventory_type: 'pair' | 'left_only' | 'right_only';
    current_quantity: number;
  };
}

export const AdjustInventoryModal: React.FC<AdjustInventoryModalProps> = ({
  onClose,
  onSubmit,
  productData
}) => {
  const [formData, setFormData] = useState({
    adjustment_type: 'set_quantity' as 'set_quantity' | 'increment' | 'decrement',
    quantity: 0,
    reason: ''
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

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'El motivo es requerido';
    } else if (formData.reason.trim().length < 5) {
      newErrors.reason = 'El motivo debe tener al menos 5 caracteres';
    }

    // Validar que decrement no resulte en cantidad negativa
    if (formData.adjustment_type === 'decrement' && formData.quantity > productData.current_quantity) {
      newErrors.quantity = `No se puede reducir mas de ${productData.current_quantity} unidades`;
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
        size: productData.size,
        adjustment_type: formData.adjustment_type,
        quantity: formData.quantity,
        reason: formData.reason.trim(),
        inventory_type: productData.inventory_type
      });
      onClose();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
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

  const getPreviewQuantity = () => {
    switch (formData.adjustment_type) {
      case 'set_quantity':
        return formData.quantity;
      case 'increment':
        return productData.current_quantity + formData.quantity;
      case 'decrement':
        return Math.max(0, productData.current_quantity - formData.quantity);
      default:
        return productData.current_quantity;
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
            <Package className="h-5 w-5 mr-2" />
            Ajustar Inventario
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
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Talla:</span>
              <span className="text-sm font-medium text-foreground">{productData.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tipo de inventario:</span>
              <span className="text-sm text-foreground">{getInventoryTypeLabel(productData.inventory_type)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cantidad actual:</span>
              <span className="text-sm font-bold text-primary">{productData.current_quantity}</span>
            </div>
          </div>

          {/* Tipo de ajuste */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tipo de Ajuste <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.adjustment_type}
              onChange={(e) => handleInputChange('adjustment_type', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
            >
              <option value="set_quantity">Establecer cantidad exacta</option>
              <option value="increment">Incrementar (+)</option>
              <option value="decrement">Decrementar (-)</option>
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <Input
              label={formData.adjustment_type === 'set_quantity' ? 'Nueva Cantidad' : 'Cantidad a ajustar'}
              type="number"
              value={formData.quantity.toString()}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              error={errors.quantity}
              placeholder="0"
              min="0"
              required
            />
          </div>

          {/* Preview del resultado */}
          {formData.quantity > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary">Cantidad resultante:</span>
                <span className="text-lg font-bold text-primary">{getPreviewQuantity()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {productData.current_quantity} → {getPreviewQuantity()}
              </p>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Motivo del Ajuste <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground min-h-[80px] ${
                errors.reason ? 'border-destructive' : 'border-border'
              }`}
              placeholder="Ej: Encontradas unidades adicionales en auditoria, Error de conteo previo, etc."
              required
            />
            {errors.reason && <p className="mt-1 text-sm text-destructive">{errors.reason}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Minimo 5 caracteres</p>
          </div>

          {/* Warning */}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning">
              Este ajuste quedara registrado en el historial. Asegurate de que la informacion sea correcta antes de confirmar.
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
              disabled={isSubmitting || formData.quantity <= 0 || formData.reason.length < 5}
              isLoading={isSubmitting}
            >
              Confirmar Ajuste
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
