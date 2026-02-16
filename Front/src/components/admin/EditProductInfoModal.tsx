import React, { useState } from 'react';
import { X, Edit, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface EditProductInfoModalProps {
  onClose: () => void;
  onSubmit: (data: {
    product_reference: string;
    brand: string;
    model: string;
  }) => Promise<void>;
  productData: {
    brand: string;
    model: string;
    reference_code: string;
    image_url?: string;
  };
}

export const EditProductInfoModal: React.FC<EditProductInfoModalProps> = ({
  onClose,
  onSubmit,
  productData
}) => {
  const [formData, setFormData] = useState({
    brand: productData.brand,
    model: productData.model
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges = formData.brand !== productData.brand || formData.model !== productData.model;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand.trim()) {
      newErrors.brand = 'La marca no puede estar vacia';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'El modelo no puede estar vacio';
    }

    if (!hasChanges) {
      newErrors.general = 'Debe cambiar al menos un campo';
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
        product_reference: productData.reference_code,
        brand: formData.brand.trim(),
        model: formData.model.trim()
      });
      onClose();
    } catch (error) {
      console.error('Error updating product info:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
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
            <Edit className="h-5 w-5 mr-2" />
            Editar Informacion del Producto
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
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            {productData.image_url && (
              <div className="flex justify-center">
                <img
                  src={productData.image_url}
                  alt={`${productData.brand} ${productData.model}`}
                  className="w-24 h-32 object-cover rounded-lg border border-border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Referencia:</span>
              <span className="text-sm font-mono text-foreground">{productData.reference_code}</span>
            </div>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Marca <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              error={errors.brand}
              placeholder="Marca del producto"
              required
            />
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Modelo <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              error={errors.model}
              placeholder="Modelo del producto"
              required
            />
          </div>

          {/* Preview del cambio */}
          {hasChanges && formData.brand.trim() && formData.model.trim() && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-2">
              <span className="text-sm font-medium text-primary">Vista previa del cambio:</span>
              {formData.brand !== productData.brand && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Marca:</span>
                  <span className="text-sm text-foreground">
                    {productData.brand} → <span className="font-bold text-primary">{formData.brand.trim()}</span>
                  </span>
                </div>
              )}
              {formData.model !== productData.model && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Modelo:</span>
                  <span className="text-sm text-foreground">
                    {productData.model} → <span className="font-bold text-primary">{formData.model.trim()}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error general */}
          {errors.general && (
            <p className="text-sm text-destructive">{errors.general}</p>
          )}

          {/* Warning */}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning">
              El cambio se aplicara globalmente al producto en todas las ubicaciones.
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
              disabled={isSubmitting || !hasChanges || !formData.brand.trim() || !formData.model.trim()}
              isLoading={isSubmitting}
            >
              Confirmar Cambio
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
