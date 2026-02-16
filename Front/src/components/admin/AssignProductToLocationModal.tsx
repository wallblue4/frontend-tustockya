import React, { useState, useMemo } from 'react';
import { X, MapPin, Search, AlertCircle, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { AdminInventoryLocation } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AssignProductToLocationModalProps {
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
  allInventory: AdminInventoryLocation[];
  allLocations: { id: number; name: string }[];
}

interface UniqueProduct {
  product_id: number;
  reference_code: string;
  brand: string;
  model: string;
  unit_price: string;
  image_url?: string;
  location_ids: number[];
}

export const AssignProductToLocationModal: React.FC<AssignProductToLocationModalProps> = ({
  onClose,
  onSubmit,
  allInventory,
  allLocations
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<UniqueProduct | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
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

  // Deduplicate products across all locations
  const uniqueProducts = useMemo(() => {
    const productMap = new Map<string, UniqueProduct>();
    for (const location of allInventory) {
      for (const product of location.products) {
        const existing = productMap.get(product.reference_code);
        if (existing) {
          if (!existing.location_ids.includes(location.location_id)) {
            existing.location_ids.push(location.location_id);
          }
        } else {
          productMap.set(product.reference_code, {
            product_id: product.product_id,
            reference_code: product.reference_code,
            brand: product.brand,
            model: product.model,
            unit_price: product.unit_price,
            image_url: product.image_url,
            location_ids: [location.location_id]
          });
        }
      }
    }
    return Array.from(productMap.values());
  }, [allInventory]);

  // Filter products by search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return uniqueProducts;
    const term = searchTerm.toLowerCase();
    return uniqueProducts.filter(p =>
      p.brand.toLowerCase().includes(term) ||
      p.model.toLowerCase().includes(term) ||
      p.reference_code.toLowerCase().includes(term)
    );
  }, [uniqueProducts, searchTerm]);

  // Locations where the selected product does NOT exist
  const availableLocations = useMemo(() => {
    if (!selectedProduct) return [];
    return allLocations.filter(l => !selectedProduct.location_ids.includes(l.id));
  }, [selectedProduct, allLocations]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedProduct) {
      newErrors.product = 'Selecciona un producto';
    }
    if (!selectedLocationId) {
      newErrors.location = 'Selecciona una ubicacion';
    }
    if (!formData.size.trim()) {
      newErrors.size = 'La talla es requerida';
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
    if (!validateForm() || !selectedProduct || !selectedLocationId) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        location_id: selectedLocationId,
        product_reference: selectedProduct.reference_code,
        size: formData.size.trim(),
        adjustment_type: 'set_quantity',
        quantity: formData.quantity,
        reason: formData.reason.trim(),
        inventory_type: formData.inventory_type
      });
    } catch (error) {
      console.error('Error assigning product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectProduct = (product: UniqueProduct) => {
    setSelectedProduct(product);
    setSelectedLocationId(null);
    setErrors({});
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedLocationName = allLocations.find(l => l.id === selectedLocationId)?.name || '';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <MapPin className="h-5 w-5 mr-2" />
            Asignar Producto a Ubicacion
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Warning */}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning">
              Asignar un producto existente a una ubicacion donde aun no esta registrado.
            </p>
          </div>

          {/* Search product */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Buscar Producto
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por marca, modelo o referencia..."
                className="w-full pl-10 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
              />
            </div>
          </div>

          {/* Product list */}
          <div className="max-h-48 overflow-y-auto border border-border rounded-md">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No se encontraron productos
              </div>
            ) : (
              filteredProducts.map(product => (
                <button
                  key={product.reference_code}
                  type="button"
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 ${selectedProduct?.reference_code === product.reference_code
                      ? 'bg-primary/10 border-l-2 border-l-primary'
                      : ''
                    }`}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.model}
                      className="h-10 w-10 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {product.brand} {product.model}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{product.reference_code}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {product.location_ids.length} ubicacion(es)
                  </span>
                </button>
              ))
            )}
          </div>
          {errors.product && <p className="text-sm text-destructive">{errors.product}</p>}

          {/* Selected product info */}
          {selectedProduct && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Producto:</span>
                <span className="text-sm font-medium text-foreground">{selectedProduct.brand} {selectedProduct.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Referencia:</span>
                <span className="text-sm font-mono text-foreground">{selectedProduct.reference_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Precio:</span>
                <span className="text-sm text-foreground">{formatCurrency(parseFloat(selectedProduct.unit_price))}</span>
              </div>
            </div>
          )}

          {/* Location select */}
          {selectedProduct && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Ubicacion Destino <span className="text-destructive">*</span>
              </label>
              {availableLocations.length === 0 ? (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-primary">
                    Este producto ya existe en todas las ubicaciones disponibles.
                  </p>
                </div>
              ) : (
                <>
                  <select
                    value={selectedLocationId || ''}
                    onChange={(e) => {
                      setSelectedLocationId(Number(e.target.value) || null);
                      if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
                  >
                    <option value="">Seleccionar ubicacion...</option>
                    {availableLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  {errors.location && <p className="mt-1 text-sm text-destructive">{errors.location}</p>}
                </>
              )}
            </div>
          )}

          {/* Size, inventory type, quantity, reason — only when product and location selected */}
          {selectedProduct && selectedLocationId && (
            <>
              {/* Size */}
              <div>
                <Input
                  label="Talla"
                  type="text"
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  error={errors.size}
                  placeholder="Ej: 42, 38.5, 10 US"
                  required
                />
              </div>

              {/* Inventory type */}
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

              {/* Quantity */}
              <div>
                <Input
                  label="Cantidad"
                  type="number"
                  value={formData.quantity.toString()}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  error={errors.quantity}
                  placeholder="1"
                  min="1"
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Motivo <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground min-h-[80px] ${errors.reason ? 'border-destructive' : 'border-border'
                    }`}
                  placeholder="Ej: Producto trasladado desde bodega, Asignacion inicial de inventario, etc."
                  required
                />
                {errors.reason && <p className="mt-1 text-sm text-destructive">{errors.reason}</p>}
                <p className="mt-1 text-xs text-muted-foreground">Minimo 5 caracteres</p>
              </div>

              {/* Summary info box */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-primary">
                  Se creara el producto "{selectedProduct.reference_code}" con talla "{formData.size || '...'}" ({formData.quantity} unidad(es), {getInventoryTypeLabel(formData.inventory_type)}) en {selectedLocationName}.
                </p>
              </div>
            </>
          )}

          {/* Buttons */}
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
              disabled={
                isSubmitting ||
                !selectedProduct ||
                !selectedLocationId ||
                !formData.size.trim() ||
                formData.quantity <= 0 ||
                formData.reason.length < 5
              }
              isLoading={isSubmitting}
            >
              Asignar Producto
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
