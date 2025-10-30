import React, { useState } from 'react';
import { X, Package, User, Truck, AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';

// Interface compatible con ambos tipos de transferencias
interface TransferForReturn {
  id: number;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  inventory_type: any;
  product_image?: string;
}

interface ReturnModalProps {
  transfer: TransferForReturn;
  onClose: () => void;
  onSubmit: (returnData: any) => void;
  isSubmitting?: boolean;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  transfer,
  onClose,
  onSubmit,
  isSubmitting = false
}) => {
  const [step, setStep] = useState<'pickup' | 'confirm'>('pickup');
  const [formData, setFormData] = useState({
    pickup_type: '' as 'corredor' | 'vendedor' | '',
    reason: 'no_sale' as 'no_sale' | 'damaged' | 'wrong_product' | 'customer_return' | 'other',
    quantity_to_return: transfer.quantity,
    product_condition: 'good' as 'good' | 'damaged' | 'unusable',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reasonOptions = [
    { value: 'no_sale', label: 'No se vendió', description: 'El cliente no lo compró' },
    { value: 'damaged', label: 'Producto dañado', description: 'El producto llegó en mal estado' },
    { value: 'wrong_product', label: 'Producto incorrecto', description: 'Se envió el producto equivocado' },
    { value: 'customer_return', label: 'Devolución de cliente', description: 'El cliente lo devolvió' },
    { value: 'other', label: 'Otro motivo', description: 'Especificar en notas' }
  ];

  const conditionOptions = [
    { value: 'good', label: 'Buen estado', description: 'El producto está en perfectas condiciones' },
    { value: 'damaged', label: 'Dañado', description: 'El producto tiene algunos daños menores' },
    { value: 'unusable', label: 'No utilizable', description: 'El producto no puede ser vendido' }
  ];

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 'pickup') {
      if (!formData.pickup_type) {
        newErrors.pickup_type = 'Debe seleccionar quién recogerá el producto';
      }
      if (!formData.reason) {
        newErrors.reason = 'Debe seleccionar un motivo';
      }
      if (formData.quantity_to_return <= 0 || formData.quantity_to_return > transfer.quantity) {
        newErrors.quantity_to_return = `La cantidad debe estar entre 1 y ${transfer.quantity}`;
      }
      if (formData.reason === 'other' && !formData.notes.trim()) {
        newErrors.notes = 'Debe especificar el motivo en las notas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep('confirm');
    }
  };

  const handleSubmit = () => {
    if (validateStep()) {
      onSubmit({
        original_transfer_id: transfer.id,
        reason: formData.reason,
        quantity_to_return: formData.quantity_to_return,
        product_condition: formData.product_condition,
        pickup_type: formData.pickup_type,
        inventory_type: transfer.inventory_type,
        notes: formData.notes
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getWorkflowSteps = () => {
    if (formData.pickup_type === 'corredor') {
      return [
        "1. 📋 Bodeguero aceptará la solicitud",
        "2. 🚚 Corredor recogerá el producto en tu local",
        "3. 🚚 Corredor entregará en bodega",
        "4. 🔍 Bodeguero confirmará recepción y restaurará inventario"
      ];
    } else {
      return [
        "1. 📋 Bodeguero aceptará la solicitud",
        "2. 🚶 TÚ deberás llevar el producto a bodega personalmente",
        "3. 🏪 Bodeguero confirmará que recibió el producto",
        "4. 🔍 Bodeguero verificará condición y restaurará inventario"
      ];
    }
  };

  const getEstimatedTime = () => {
    return formData.pickup_type === 'corredor' ? '2-3 horas' : '1-2 horas (depende de tu disponibilidad)';
  };

  const getNextAction = () => {
    if (formData.pickup_type === 'corredor') {
      return 'Esperar que bodeguero acepte, luego corredor coordinará recogida';
    } else {
      return 'Esperar que bodeguero acepte, luego ir a bodega con el producto';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <Package className="h-5 w-5 mr-2" />
            Generar Devolución
          </h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del producto */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-3">Producto a Devolver</h4>
              <div className="flex items-center space-x-4">
                {transfer.product_image && (
                  <img 
                    src={transfer.product_image} 
                    alt={`${transfer.brand} ${transfer.model}`}
                    className="w-16 h-16 object-cover rounded-lg border border-border"
                  />
                )}
                <div>
                  <p className="font-medium text-foreground">{transfer.brand} {transfer.model}</p>
                  <p className="text-sm text-muted-foreground">Talla {transfer.size} • Ref: {transfer.sneaker_reference_code}</p>
                  <p className="text-sm text-muted-foreground">Cantidad: {transfer.quantity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {step === 'pickup' && (
            <>
              {/* Selección de pickup type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  ¿Quién recogerá el producto?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('pickup_type', 'corredor')}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      formData.pickup_type === 'corredor'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Truck className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Corredor</p>
                        <p className="text-sm text-muted-foreground">Un corredor recogerá el producto</p>
                        <p className="text-xs text-muted-foreground mt-1">⏱️ Tiempo estimado: 2-3 horas</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleInputChange('pickup_type', 'vendedor')}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      formData.pickup_type === 'vendedor'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Vendedor</p>
                        <p className="text-sm text-muted-foreground">Usted llevará el producto a bodega</p>
                        <p className="text-xs text-muted-foreground mt-1">⏱️ Tiempo estimado: 1-2 horas</p>
                      </div>
                    </div>
                  </button>
                </div>
                {errors.pickup_type && (
                  <p className="text-sm text-error mt-1">{errors.pickup_type}</p>
                )}
              </div>

              {/* Motivo de devolución */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Motivo de la devolución
                </label>
                <div className="space-y-2">
                  {reasonOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('reason', option.value)}
                      className={`w-full p-3 border rounded-lg text-left transition-all ${
                        formData.reason === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </button>
                  ))}
                </div>
                {errors.reason && (
                  <p className="text-sm text-error mt-1">{errors.reason}</p>
                )}
              </div>

              {/* Cantidad a devolver */}
              <div>
                <Input
                  label="Cantidad a devolver"
                  type="number"
                  min="1"
                  max={transfer.quantity}
                  value={formData.quantity_to_return}
                  onChange={(e) => handleInputChange('quantity_to_return', parseInt(e.target.value))}
                  error={errors.quantity_to_return}
                />
              </div>

              {/* Estado del producto */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Estado del producto
                </label>
                <div className="space-y-2">
                  {conditionOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('product_condition', option.value)}
                      className={`w-full p-3 border rounded-lg text-left transition-all ${
                        formData.product_condition === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notas adicionales {formData.reason === 'other' && <span className="text-error">*</span>}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder={formData.reason === 'other' ? 'Especifique el motivo de la devolución...' : 'Notas adicionales (opcional)...'}
                />
                {errors.notes && (
                  <p className="text-sm text-error mt-1">{errors.notes}</p>
                )}
              </div>
            </>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <h4 className="font-semibold text-warning">Confirmar Devolución</h4>
                </div>
                <p className="text-sm text-warning">
                  ¿Está seguro de que desea generar esta devolución? Esta acción no se puede deshacer.
                </p>
              </div>

              {/* Resumen de la devolución */}
              <div className="bg-muted/20 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-foreground">Resumen de la devolución:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Producto:</strong> {transfer.brand} {transfer.model} - Talla {transfer.size}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Cantidad:</strong> {formData.quantity_to_return}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Motivo:</strong> {reasonOptions.find(r => r.value === formData.reason)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Recogerá:</strong> {formData.pickup_type === 'corredor' ? 'Corredor' : 'Vendedor'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Estado:</strong> {conditionOptions.find(c => c.value === formData.product_condition)?.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Tiempo estimado:</strong> {getEstimatedTime()}
                    </p>
                  </div>
                </div>
                {formData.notes && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Notas:</strong> {formData.notes}
                  </p>
                )}
              </div>

              {/* Pasos del flujo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Pasos del proceso:
                </h4>
                <div className="space-y-2">
                  {getWorkflowSteps().map((step, index) => (
                    <p key={index} className="text-sm text-blue-700">{step}</p>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                  <p className="text-sm text-blue-800">
                    <strong>Próxima acción:</strong> {getNextAction()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            {step === 'pickup' ? (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button onClick={handleNext}>
                  Continuar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setStep('pickup')}>
                  Atrás
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-warning hover:bg-warning/90"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Generar Devolución
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


