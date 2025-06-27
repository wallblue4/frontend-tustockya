import React, { useState } from 'react';
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
  Percent
} from 'lucide-react';

interface SaleItem {
  id: string;
  code: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  price: number;
}

interface PaymentMethod {
  type: 'cash' | 'card' | 'transfer';
  amount: number;
  reference?: string; // For card (last 4 digits) or transfer reference
}

export const SalesForm: React.FC = () => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { type: 'cash', amount: 0 }
  ]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  // Discount fields
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');

  // Add new item
  const addItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      code: '',
      brand: '',
      model: '',
      size: '',
      quantity: 1,
      price: 0
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
    setPaymentMethods([...paymentMethods, { type: 'cash', amount: 0 }]);
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
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const itemsTotal = itemsSubtotal - discountAmount;
  const paymentsTotal = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0);
  const isValidSale = itemsTotal > 0 && Math.abs(itemsTotal - paymentsTotal) < 0.01;

  // Handle file upload
  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  // Submit sale
  const handleSubmit = async () => {
    if (!isValidSale) return;

    setIsSubmitting(true);
    try {
      const saleData = {
        items: items.map(item => ({
          product_code: item.code,
          size: item.size,
          quantity: item.quantity,
          unit_price: item.price
        })),
        payment_methods: paymentMethods.map(pm => ({
          type: pm.type,
          amount: pm.amount,
          reference: pm.reference
        })),
        discount_amount: discountAmount,
        discount_reason: discountReason,
        notes,
        requires_confirmation: requiresConfirmation,
        receipt_file: receiptFile
      };

      await vendorAPI.createSale(saleData);
      
      // Reset form
      setItems([]);
      setPaymentMethods([{ type: 'cash', amount: 0 }]);
      setReceiptFile(null);
      setNotes('');
      setDiscountAmount(0);
      setDiscountReason('');
      setRequiresConfirmation(false);
      setShowSummary(false);
      
      alert('Venta registrada exitosamente');
    } catch (error) {
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
                    <p className="text-sm text-gray-600">Talla {item.size} × {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.quantity * item.price)}</p>
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
                    <p className="font-medium capitalize">{payment.type === 'cash' ? 'Efectivo' : payment.type === 'card' ? 'Tarjeta' : 'Transferencia'}</p>
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
              <span>{formatCurrency(itemsTotal)}</span>
            </div>
          </div>

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
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                  <Input
                    label="Código"
                    value={item.code}
                    onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                    placeholder="Código del producto"
                  />
                  <Input
                    label="Marca"
                    value={item.brand}
                    onChange={(e) => updateItem(item.id, 'brand', e.target.value)}
                    placeholder="Marca"
                  />
                  <Input
                    label="Modelo"
                    value={item.model}
                    onChange={(e) => updateItem(item.id, 'model', e.target.value)}
                    placeholder="Modelo"
                  />
                  <Input
                    label="Talla"
                    value={item.size}
                    onChange={(e) => updateItem(item.id, 'size', e.target.value)}
                    placeholder="Talla"
                  />
                  <Input
                    label="Cantidad"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                  <div className="flex items-end space-x-2">
                    <Input
                      label="Precio"
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Monto del Descuento"
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              max="5000"
              icon={<DollarSign className="h-4 w-4 text-gray-400" />}
            />
            <Input
              label="Razón del Descuento"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="Ej: Cliente frecuente, promoción..."
              disabled={discountAmount === 0}
            />
          </div>
          {discountAmount > 5000 && (
            <p className="text-error text-sm mt-2">El descuento máximo permitido es $5,000</p>
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
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>
                <Input
                  label="Monto"
                  type="number"
                  value={payment.amount}
                  onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  icon={<DollarSign className="h-4 w-4 text-gray-400" />}
                />
                {(payment.type === 'card' || payment.type === 'transfer') && (
                  <Input
                    label={payment.type === 'card' ? 'Últimos 4 dígitos' : 'Referencia'}
                    value={payment.reference || ''}
                    onChange={(e) => updatePaymentMethod(index, 'reference', e.target.value)}
                    placeholder={payment.type === 'card' ? '1234' : 'REF123456'}
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
              <span className="font-semibold">{formatCurrency(itemsTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Pagos:</span>
              <span className="font-semibold">{formatCurrency(paymentsTotal)}</span>
            </div>
            <div className={`flex justify-between items-center font-bold ${
              isValidSale ? 'text-success' : 'text-error'
            }`}>
              <span>Diferencia:</span>
              <span>{formatCurrency(Math.abs(itemsTotal - paymentsTotal))}</span>
            </div>
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
                  <span className="text-sm">Archivo cargado</span>
                </div>
              )}
            </div>
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