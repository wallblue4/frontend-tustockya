import React, { useState } from 'react';
import { useTransferCart } from '../../context/TransferCartContext';
import { transfersAPI } from '../../services/transfersAPI';
import { vendorAPI } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  ShoppingCart, Loader2, CheckCircle, AlertCircle, DollarSign,
  ChevronDown, ChevronUp, Percent, Upload
} from 'lucide-react';

type SinglePaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';
type PaymentMethodType = SinglePaymentMethod | 'mixto';

interface CartSaleConfirmProps {
  /** If provided, only sell these transfer IDs (partial sale). Otherwise sell all completed. */
  transferIdsToSell?: number[];
  onSaleCompleted: () => void;
  onBack: () => void;
}

export const CartSaleConfirm: React.FC<CartSaleConfirmProps> = ({
  transferIdsToSell,
  onSaleCompleted,
  onBack
}) => {
  const { items, completedTransferIds, clearCart } = useTransferCart();

  const idsToSell = transferIdsToSell ?? completedTransferIds;
  const itemsToSell = items.filter(i => i.transfer_id && idsToSell.includes(i.transfer_id));

  // Price state: start from unit_price * quantity for each item
  const defaultTotal = itemsToSell.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const [editedTotal, setEditedTotal] = useState<number>(defaultTotal);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('efectivo');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInput, setDiscountInput] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [isRequestingDiscount, setIsRequestingDiscount] = useState(false);

  // Mixed payments
  const [mixedPayments, setMixedPayments] = useState<{ type: SinglePaymentMethod; amount: string; reference: string }[]>([
    { type: 'efectivo', amount: '', reference: '' },
    { type: 'transferencia', amount: '', reference: '' },
  ]);

  const totalAmount = editedTotal - discountAmount;
  const mixedTotal = mixedPayments.reduce((sum, mp) => sum + (parseFloat(mp.amount) || 0), 0);

  const singlePaymentMethods: { value: SinglePaymentMethod; label: string }[] = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'transferencia', label: 'Transferencia' },
  ];

  const paymentMethods: { value: PaymentMethodType; label: string }[] = [
    ...singlePaymentMethods,
    { value: 'mixto', label: 'Mixto' },
  ];

  const updateMixedPayment = (index: number, field: 'type' | 'amount' | 'reference', value: string) => {
    setMixedPayments(prev => {
      const updated = prev.map((mp, i) => i === index ? { ...mp, [field]: value } : mp);
      if (field === 'amount' && updated.length === 2) {
        const otherIndex = index === 0 ? 1 : 0;
        const typed = parseFloat(value) || 0;
        const remaining = totalAmount - typed;
        updated[otherIndex] = { ...updated[otherIndex], amount: remaining >= 0 ? String(remaining) : '' };
      }
      return updated;
    });
  };

  const handleConfirmSale = async () => {
    if (loading || idsToSell.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      let paymentMethodsData: any[];

      if (selectedPaymentMethod === 'mixto') {
        paymentMethodsData = mixedPayments
          .filter(mp => parseFloat(mp.amount) > 0)
          .map(mp => ({
            type: mp.type,
            amount: parseFloat(mp.amount),
            reference: mp.reference || null,
          }));
      } else {
        paymentMethodsData = [{
          type: selectedPaymentMethod,
          amount: totalAmount,
          reference: paymentReference || null,
        }];
      }

      // Handle discount request
      if (discountAmount > 0 && discountReason) {
        setIsRequestingDiscount(true);
        try {
          await vendorAPI.requestDiscount({ amount: discountAmount, reason: discountReason });
        } catch {
          // Non-blocking - discount request failure shouldn't block sale
        }
        setIsRequestingDiscount(false);
      }

      await transfersAPI.vendor.sellFromCart(
        idsToSell,
        totalAmount,
        paymentMethodsData,
        notes || undefined,
        receiptFile || undefined,
      );

      setSuccess(true);

      // If all items were sold, clear the cart
      if (!transferIdsToSell || transferIdsToSell.length === completedTransferIds.length) {
        setTimeout(() => {
          clearCart();
          onSaleCompleted();
        }, 2000);
      } else {
        setTimeout(() => onSaleCompleted(), 2000);
      }
    } catch (err: any) {
      setError(err.detail || err.message || 'Error registrando la venta');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
          <h3 className="text-lg font-bold text-green-800 mb-1">Venta Registrada</h3>
          <p className="text-sm text-green-700">
            {itemsToSell.length} producto{itemsToSell.length !== 1 ? 's' : ''} vendido{itemsToSell.length !== 1 ? 's' : ''} exitosamente
          </p>
          <p className="text-lg font-semibold text-green-800 mt-2">
            ${totalAmount.toLocaleString('es-CO')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Items summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Resumen de Venta ({itemsToSell.length} producto{itemsToSell.length !== 1 ? 's' : ''})
          </h3>
          <div className="space-y-2">
            {itemsToSell.map(item => (
              <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.brand} {item.model}</p>
                  <p className="text-xs text-muted-foreground">
                    Talla {item.size} x{item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium">
                  ${(item.unit_price * item.quantity).toLocaleString('es-CO')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Total editable */}
      <Card>
        <CardContent className="p-4">
          <label className="text-sm font-medium text-muted-foreground">Total de la Venta</label>
          <div className="flex items-center gap-2 mt-1">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <input
              type="number"
              value={editedTotal}
              onChange={(e) => setEditedTotal(parseFloat(e.target.value) || 0)}
              className="w-full text-2xl font-bold border-b-2 border-primary bg-transparent outline-none py-1"
            />
          </div>
          {discountAmount > 0 && (
            <p className="text-sm text-amber-600 mt-1">
              Descuento: -${discountAmount.toLocaleString('es-CO')} = ${totalAmount.toLocaleString('es-CO')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment method */}
      <Card>
        <CardContent className="p-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Metodo de Pago</label>
          <div className="grid grid-cols-4 gap-2">
            {paymentMethods.map(pm => (
              <button
                key={pm.value}
                onClick={() => setSelectedPaymentMethod(pm.value)}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  selectedPaymentMethod === pm.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>

          {/* Reference for single payment */}
          {selectedPaymentMethod !== 'mixto' && selectedPaymentMethod !== 'efectivo' && (
            <input
              type="text"
              placeholder="Referencia de pago"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full mt-3 p-2 border rounded-lg text-sm"
            />
          )}

          {/* Mixed payments */}
          {selectedPaymentMethod === 'mixto' && (
            <div className="mt-3 space-y-2">
              {mixedPayments.map((mp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={mp.type}
                    onChange={(e) => updateMixedPayment(idx, 'type', e.target.value)}
                    className="border rounded p-1 text-xs"
                  >
                    {singlePaymentMethods.map(spm => (
                      <option key={spm.value} value={spm.value}>{spm.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Monto"
                    value={mp.amount}
                    onChange={(e) => updateMixedPayment(idx, 'amount', e.target.value)}
                    className="flex-1 border rounded p-1 text-xs"
                  />
                  {mp.type !== 'efectivo' && (
                    <input
                      type="text"
                      placeholder="Ref."
                      value={mp.reference}
                      onChange={(e) => updateMixedPayment(idx, 'reference', e.target.value)}
                      className="w-20 border rounded p-1 text-xs"
                    />
                  )}
                </div>
              ))}
              {Math.abs(mixedTotal - totalAmount) > 1 && (
                <p className="text-xs text-red-500">
                  Total pagos: ${mixedTotal.toLocaleString('es-CO')} (faltan ${(totalAmount - mixedTotal).toLocaleString('es-CO')})
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced options */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
      >
        {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Opciones avanzadas
      </button>

      {showAdvanced && (
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Discount */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descuento</label>
              <div className="flex items-center gap-2 mt-1">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  placeholder="Monto descuento"
                  value={discountInput}
                  onChange={(e) => {
                    setDiscountInput(e.target.value);
                    setDiscountAmount(parseFloat(e.target.value) || 0);
                  }}
                  className="flex-1 border rounded p-1.5 text-sm"
                />
              </div>
              {discountAmount > 0 && (
                <input
                  type="text"
                  placeholder="Razon del descuento (requerido)"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full border rounded p-1.5 text-sm mt-1"
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notas</label>
              <textarea
                placeholder="Notas adicionales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded p-1.5 text-sm mt-1"
                rows={2}
              />
            </div>

            {/* Receipt image */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Comprobante</label>
              <label className="flex items-center gap-2 mt-1 p-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {receiptFile ? receiptFile.name : 'Subir comprobante'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Confirm button */}
      <Button
        className="w-full"
        onClick={handleConfirmSale}
        disabled={loading || totalAmount <= 0 || (selectedPaymentMethod === 'mixto' && Math.abs(mixedTotal - totalAmount) > 1)}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4 mr-2" />
        )}
        {loading ? 'Procesando...' : `Confirmar Venta - $${totalAmount.toLocaleString('es-CO')}`}
      </Button>
    </div>
  );
};
