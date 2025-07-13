import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { vendorAPI, formatCurrency } from '../../services/api';
import { 
  Plus, 
  Trash2, 
  CreditCard, 
  DollarSign, 
  Upload,
  CheckCircle,
  Percent,
  AlertCircle
} from 'lucide-react';

interface SaleItem {
  id: string;
  sneaker_reference_code: string;
  brand: string;
  model: string;
  color?: string; // Added color field to match backend
  size: string;
  quantity: number;
  unit_price: number;
}

interface PaymentMethod {
  type: 'efectivo' | 'tarjeta' | 'transferencia';
  amount: number;
  reference?: string | null; // Changed to match backend expectation
}

interface SalesFormProps {
  prefilledProduct?: {
    code: string;
    brand: string;
    model: string;
    size: string;
    price: number;
    location?: string;
    storage_type?: string;
  };
}

export const SalesForm: React.FC<SalesFormProps> = ({ prefilledProduct }) => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { type: 'efectivo', amount: 0 }
  ]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  // Discount fields
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');
  const [isRequestingDiscount, setIsRequestingDiscount] = useState(false);

  // Effect to handle prefilled product
  useEffect(() => {
    if (prefilledProduct) {
      const newItem: SaleItem = {
        id: Date.now().toString(),
        sneaker_reference_code: prefilledProduct.code,
        brand: prefilledProduct.brand,
        model: prefilledProduct.model,
        size: prefilledProduct.size,
        quantity: 1,
        unit_price: prefilledProduct.price
      };
      setItems([newItem]);
      
      // Set payment amount to product price
      setPaymentMethods([{ type: 'efectivo', amount: prefilledProduct.price }]);
      
      // Add note about the product source
      if (prefilledProduct.location && prefilledProduct.storage_type) {
        setNotes(`Producto escaneado - Ubicación: ${prefilledProduct.location} (${prefilledProduct.storage_type === 'warehouse' ? 'Bodega' : 'Exhibición'})`);
      }
    }
  }, [prefilledProduct]);

  // Add new item
  const addItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      sneaker_reference_code: '',
      brand: '',
      model: '',
      color: '',
      size: '',
      quantity: 1,
      unit_price: 0
    };
    setItems([...items, newItem]);
  };

  // Update item
  const updateItem = (id: string, field: keyof SaleItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Remove item
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Add payment method
  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { type: 'efectivo', amount: 0 }]);
  };

  // Update payment method
  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: any) => {
    const updated = [...paymentMethods];
    updated[index] = { ...updated[index], [field]: value };
    setPaymentMethods(updated);
  };

  // Remove payment method
  const removePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    }
  };

  // Calculate totals
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalAmount = itemsSubtotal - discountAmount;
  const paymentsTotal = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0);
  const isValidSale = totalAmount > 0 && Math.abs(totalAmount - paymentsTotal) < 0.01 && items.every(item => 
    item.sneaker_reference_code && item.brand && item.model && item.size && item.unit_price > 0
  );

  // Request discount from API
  const requestDiscount = async () => {
    if (!discountAmount || !discountReason) {
      alert('Por favor ingrese el monto y la razón del descuento');
      return;
    }

    setIsRequestingDiscount(true);
    try {
      const discountData = {
        amount: discountAmount,
        reason: discountReason
      };

      console.log('Solicitando descuento:', discountData);
      
      const response = await vendorAPI.requestDiscount(discountData);
      console.log('Respuesta del descuento:', response);
      
      alert(`Descuento solicitado exitosamente!\nID: ${response.discount_id || 'N/A'}\nMonto: ${formatCurrency(discountAmount)}\nEstado: ${response.status || 'pending'}`);
      
    } catch (error) {
      console.error('Error al solicitar descuento:', error);
      alert('Error al solicitar descuento: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsRequestingDiscount(false);
    }
  };

  // Handle file upload
  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor seleccione una imagen válida');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB');
        return;
      }
      
      setReceiptFile(file);
    }
  };

  // Submit sale
  const handleSubmit = async () => {
    if (!isValidSale) return;

    setIsSubmitting(true);
    try {
      // Prepare sale data according to API structure (now using File directly)
      const saleData = {
        items: items.map(item => ({
          sneaker_reference_code: item.sneaker_reference_code,
          brand: item.brand,
          model: item.model,
          color: item.color || '', // Include color field
          size: item.size,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        total_amount: totalAmount,
        payment_methods: paymentMethods.map(pm => ({
          type: pm.type,
          amount: pm.amount,
          reference: pm.reference || null // Ensure null if empty
        })),
        receipt_image: receiptFile, // Now pass File directly, not base64
        notes: notes || undefined,
        requires_confirmation: requiresConfirmation
      };

      console.log('Enviando datos de venta:', {
        ...saleData,
        receipt_image: receiptFile ? `File: ${receiptFile.name} (${receiptFile.size} bytes)` : null
      });

      const response = await vendorAPI.createSale(saleData);
      
      console.log('Respuesta de la API:', response);
      
      // Show success message with all the details from the response
      let successMessage = `¡Venta registrada exitosamente!\n\n`;
      successMessage += `ID de Venta: ${response.sale_id}\n`;
      successMessage += `Total: ${formatCurrency(response.sale_details.total_amount)}\n`;
      successMessage += `Estado: ${response.status_info.status}\n`;
      successMessage += `Fecha: ${new Date(response.sale_timestamp).toLocaleString('es-CO')}\n`;
      
      if (response.receipt_info.has_receipt) {
        successMessage += `\nComprobante guardado: ${response.receipt_info.stored_in}`;
      }
      
      if (response.seller_info) {
        successMessage += `\nVendedor: ${response.seller_info.seller_name}`;
      }
      
      alert(successMessage);
      
      // Reset form
      setItems([]);
      setPaymentMethods([{ type: 'efectivo', amount: 0 }]);
      setReceiptFile(null);
      setNotes('');
      setDiscountAmount(0);
      setDiscountReason('');
      setRequiresConfirmation(false);
      setShowSummary(false);
      
    } catch (error) {
      console.error('Error al registrar la venta:', error);
      alert('Error al registrar la venta: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSummary) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Resumen de Venta</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Items Summary */}
          <div>
            <h3 className="font-medium mb-3">Productos</h3>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.brand} {item.model}</p>
                    {item.color && <p className="text-sm text-gray-500">Color: {item.color}</p>}
                    <p className="text-sm text-gray-600">
                      Talla {item.size} × {item.quantity}
                    </p>
                    <p className="text-xs text-gray-500">Ref: {item.sneaker_reference_code}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.quantity * item.unit_price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Discount Summary */}
          {discountAmount > 0 && (
            <div>
              <h3 className="font-medium mb-3">Descuento Aplicado</h3>
              <div className="p-3 bg-accent/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-accent">Descuento</p>
                    <p className="text-sm text-gray-600">{discountReason}</p>
                  </div>
                  <p className="font-semibold text-accent">-{formatCurrency(discountAmount)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div>
            <h3 className="font-medium mb-3">Métodos de Pago</h3>
            <div className="space-y-2">
              {paymentMethods.map((payment, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{payment.type}</p>
                    {payment.reference && (
                      <p className="text-sm text-gray-600">Ref: {payment.reference}</p>
                    )}
                  </div>
                  <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span>{formatCurrency(itemsSubtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-accent">
                <span>Descuento</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Total Pagos</span>
              <span>{formatCurrency(paymentsTotal)}</span>
            </div>
          </div>

          {/* Additional Info */}
          {(notes || receiptFile || requiresConfirmation) && (
            <div className="border-t pt-4 space-y-2">
              {notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Notas:</p>
                  <p className="text-sm text-gray-600">{notes}</p>
                </div>
              )}
              {receiptFile && (
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-1 text-success" />
                  <span>Comprobante adjunto: {receiptFile.name} ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
              {requiresConfirmation && (
                <div className="flex items-center text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>Requiere confirmación posterior</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <Button onClick={() => setShowSummary(false)} variant="outline" className="flex-1">
              Editar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Guardando...' : 'Confirmar Venta'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prefilled Product Notice */}
      {prefilledProduct && (
        <Card className="border-success bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-success">Producto Escaneado Agregado</p>
                <p className="text-sm text-gray-700">
                  {prefilledProduct.brand} {prefilledProduct.model} - Talla {prefilledProduct.size}
                </p>
                <p className="text-xs text-gray-600">
                  Código: {prefilledProduct.code} | Precio: {formatCurrency(prefilledProduct.price)}
                </p>
                {prefilledProduct.location && prefilledProduct.storage_type && (
                  <p className="text-xs text-gray-600">
                    Ubicación: {prefilledProduct.location} ({prefilledProduct.storage_type === 'warehouse' ? 'Bodega' : 'Exhibición'})
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Productos a Vender</h2>
            <Button onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay productos agregados</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border rounded-lg">
                  <Input
                    label="Código de Referencia"
                    value={item.sneaker_reference_code}
                    onChange={(e) => updateItem(item.id, 'sneaker_reference_code', e.target.value)}
                    placeholder="NK-AM90-WHT-001"
                    required
                  />
                  <Input
                    label="Marca"
                    value={item.brand}
                    onChange={(e) => updateItem(item.id, 'brand', e.target.value)}
                    placeholder="Nike"
                    required
                  />
                  <Input
                    label="Modelo"
                    value={item.model}
                    onChange={(e) => updateItem(item.id, 'model', e.target.value)}
                    placeholder="Air Max 90"
                    required
                  />
                  <Input
                    label="Color (Opcional)"
                    value={item.color || ''}
                    onChange={(e) => updateItem(item.id, 'color', e.target.value)}
                    placeholder="Blanco"
                  />
                  <Input
                    label="Talla"
                    value={item.size}
                    onChange={(e) => updateItem(item.id, 'size', e.target.value)}
                    placeholder="9.0"
                    required
                  />
                  <Input
                    label="Cantidad"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    min="1"
                    required
                  />
                  <div className="flex items-end space-x-2">
                    <Input
                      label="Precio"
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      step="0.01"
                      min="0"
                      required
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-error hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discount Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <Percent className="h-6 w-6 mr-2" />
            Descuento (Opcional)
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Monto del Descuento"
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="0.01"
              icon={<DollarSign className="h-4 w-4 text-gray-400" />}
            />
            <Input
              label="Razón del Descuento"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="Ej: Cliente frecuente, promoción..."
              disabled={discountAmount === 0}
            />
            <div className="flex items-end">
              <Button
                onClick={requestDiscount}
                disabled={!discountAmount || !discountReason || isRequestingDiscount}
                variant="outline"
                className="w-full"
              >
                {isRequestingDiscount ? 'Solicitando...' : 'Solicitar Descuento'}
              </Button>
            </div>
          </div>
          {discountAmount > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 <strong>Tip:</strong> Haz clic en "Solicitar Descuento" para registrar la solicitud en el sistema antes de proceder con la venta.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Métodos de Pago</h2>
            <Button onClick={addPaymentMethod} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Método
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethods.map((payment, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={payment.type}
                    onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <Input
                  label="Monto"
                  type="number"
                  value={payment.amount}
                  onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  icon={<DollarSign className="h-4 w-4 text-gray-400" />}
                  required
                />
                {(payment.type === 'tarjeta' || payment.type === 'transferencia') && (
                  <Input
                    label={payment.type === 'tarjeta' ? 'Referencia (****1234)' : 'Referencia'}
                    value={payment.reference || ''}
                    onChange={(e) => updatePaymentMethod(index, 'reference', e.target.value)}
                    placeholder={payment.type === 'tarjeta' ? '****1234' : 'REF123456'}
                  />
                )}
                <div className="flex items-end">
                  {paymentMethods.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePaymentMethod(index)}
                      className="text-error hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Payment Validation */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span>Subtotal Productos:</span>
              <span className="font-semibold">{formatCurrency(itemsSubtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-accent">
                <span>Descuento:</span>
                <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t pt-2">
              <span>Total a Pagar:</span>
              <span className="font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Pagos:</span>
              <span className="font-semibold">{formatCurrency(paymentsTotal)}</span>
            </div>
            <div className={`flex justify-between items-center font-bold ${
              isValidSale ? 'text-success' : 'text-error'
            }`}>
              <span>Diferencia:</span>
              <span>{formatCurrency(Math.abs(totalAmount - paymentsTotal))}</span>
            </div>
            {!isValidSale && totalAmount > 0 && (
              <p className="text-error text-sm mt-2">
                {Math.abs(totalAmount - paymentsTotal) > 0.01 
                  ? 'Los montos no coinciden' 
                  : 'Complete todos los campos requeridos'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Información Adicional</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprobante (Opcional)
            </label>
            <div className="flex items-center space-x-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="flex-1"
              />
              {receiptFile && (
                <div className="flex items-center text-success">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <div className="text-sm">
                    <p>{receiptFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Notas sobre la venta..."
            />
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requiresConfirmation"
              checked={requiresConfirmation}
              onChange={(e) => setRequiresConfirmation(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="requiresConfirmation" className="ml-2 text-sm text-gray-700">
              Requiere confirmación posterior
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowSummary(true)}
          disabled={!isValidSale || (discountAmount > 0 && !discountReason)}
          size="lg"
        >
          Revisar Venta
        </Button>
      </div>
    </div>
  );
};