import React, { useState } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AdjustPriceModalProps {
  onClose: () => void;
  onSubmit: (data: {
    product_reference: string;
    new_unit_price: number;
    update_all_locations: boolean;
  }) => Promise<void>;
  productData: {
    brand: string;
    model: string;
    reference_code: string;
    current_price: number;
    image_url?: string;
  };
}

export const AdjustPriceModal: React.FC<AdjustPriceModalProps> = ({
  onClose,
  onSubmit,
  productData
}) => {
  const [formData, setFormData] = useState({
    new_unit_price: productData.current_price,
    update_all_locations: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.new_unit_price <= 0) {
      newErrors.new_unit_price = 'El precio debe ser mayor a 0';
    }

    if (formData.new_unit_price === productData.current_price) {
      newErrors.new_unit_price = 'El nuevo precio debe ser diferente al actual';
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
        new_unit_price: formData.new_unit_price,
        update_all_locations: formData.update_all_locations
      });
      onClose();
    } catch (error) {
      console.error('Error adjusting price:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPriceChangePercentage = () => {
    if (productData.current_price === 0) return 0;
    const change = ((formData.new_unit_price - productData.current_price) / productData.current_price) * 100;
    return change.toFixed(1);
  };

  const priceChange = formData.new_unit_price - productData.current_price;
  const priceChangePercentage = getPriceChangePercentage();

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
            Ajustar Precio
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
              <span className="text-sm text-muted-foreground">Producto:</span>
              <span className="text-sm font-medium text-foreground">{productData.brand} {productData.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Referencia:</span>
              <span className="text-sm font-mono text-foreground">{productData.reference_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Precio actual:</span>
              <span className="text-sm font-bold text-primary">{formatCurrency(productData.current_price)}</span>
            </div>
          </div>

          {/* Nuevo precio */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nuevo Precio Unitario <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              value={formData.new_unit_price.toString()}
              onChange={(e) => handleInputChange('new_unit_price', parseFloat(e.target.value) || 0)}
              error={errors.new_unit_price}
              placeholder="0"
              min="0"
              step="1000"
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              required
            />
          </div>

          {/* Preview del cambio */}
          {formData.new_unit_price > 0 && formData.new_unit_price !== productData.current_price && (
            <div className={`rounded-lg p-3 ${priceChange > 0
              ? 'bg-success/10 border border-success/20'
              : 'bg-error/10 border border-error/20'
              }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${priceChange > 0 ? 'text-success' : 'text-error'}`}>
                  Cambio de precio:
                </span>
                <span className={`text-lg font-bold ${priceChange > 0 ? 'text-success' : 'text-error'}`}>
                  {priceChange > 0 ? '+' : ''}{formatCurrency(priceChange)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">Variacion porcentual:</span>
                <span className={`text-sm font-medium ${priceChange > 0 ? 'text-success' : 'text-error'}`}>
                  {parseFloat(priceChangePercentage) > 0 ? '+' : ''}{priceChangePercentage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {formatCurrency(productData.current_price)} → {formatCurrency(formData.new_unit_price)}
              </p>
            </div>
          )}

          {/* Alcance */}
          <div className="bg-muted/30 rounded-lg p-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.update_all_locations}
                onChange={(e) => handleInputChange('update_all_locations', e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Actualizar en todas las ubicaciones</span>
                <p className="text-xs text-muted-foreground">El nuevo precio se aplicara globalmente a este producto</p>
              </div>
            </label>
          </div>

          {/* Warning */}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning">
              El cambio de precio afectara las ventas futuras. Este cambio quedara registrado en el historial.
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
              disabled={isSubmitting || formData.new_unit_price <= 0 || formData.new_unit_price === productData.current_price}
              isLoading={isSubmitting}
            >
              Confirmar Cambio de Precio
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
