import React, { useState } from 'react';
import { vendorAPI } from '../../services/api';
import { vendorAPI as transferVendorAPI } from '../../services/transfersAPI';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Tag, Loader2, CheckCircle, AlertCircle, DollarSign, ChevronDown, ChevronUp, Percent, Upload } from 'lucide-react';

interface ScannerSaleConfirmProps {
  productData: {
    code: string;
    brand: string;
    model: string;
    size: string;
    price: number;
    location?: string;
    storage_type?: string;
    color?: string;
    image?: string;
    transfer_id?: number;
  };
  onSaleCompleted?: () => void;
  onBack?: () => void;
}

type PaymentMethodType = 'efectivo' | 'tarjeta' | 'transferencia';

export const ScannerSaleConfirm: React.FC<ScannerSaleConfirmProps> = ({
  productData,
  onSaleCompleted,
  onBack
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedPrice, setEditedPrice] = useState<number>(productData.price);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('efectivo');

  // Opciones avanzadas
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInput, setDiscountInput] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [isRequestingDiscount, setIsRequestingDiscount] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);

  const paymentMethods: { value: PaymentMethodType; label: string }[] = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'transferencia', label: 'Transferencia' },
  ];

  const getStorageLabel = (storageType?: string) => {
    switch (storageType) {
      case 'exhibition': return 'Exhibicion';
      case 'warehouse': return 'Bodega';
      default: return storageType || '';
    }
  };

  const totalAmount = editedPrice - discountAmount;

  const handleRequestDiscount = async () => {
    if (!discountAmount || !discountReason) {
      setError('Ingresa el monto y la razon del descuento');
      return;
    }
    setIsRequestingDiscount(true);
    setError(null);
    try {
      await vendorAPI.requestDiscount({ amount: discountAmount, reason: discountReason });
    } catch (err) {
      console.error('Error solicitando descuento:', err);
      setError(err instanceof Error ? err.message : 'Error al solicitar descuento');
    } finally {
      setIsRequestingDiscount(false);
    }
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecciona una imagen valida');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Maximo 5MB');
      return;
    }
    setReceiptFile(file);
  };

  const handleSubmit = async () => {
    if (totalAmount <= 0) {
      setError('El total debe ser mayor a 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const autoNotes = productData.transfer_id
        ? `Venta desde transferencia #${productData.transfer_id} — ${productData.location || 'N/A'} (${getStorageLabel(productData.storage_type)})`
        : `Venta directa desde escaner — ${productData.location || 'N/A'} (${getStorageLabel(productData.storage_type)})`;
      const fullNotes = notes ? `${autoNotes} | ${notes}` : autoNotes;

      const paymentMethod: { type: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'; amount: number; reference?: string | null } = {
        type: selectedPaymentMethod,
        amount: totalAmount,
      };
      if (paymentReference && (selectedPaymentMethod === 'tarjeta' || selectedPaymentMethod === 'transferencia')) {
        paymentMethod.reference = paymentReference;
      }

      if (productData.transfer_id) {
        // Venta desde transferencia completada — usar endpoint sellFromTransfer
        const formData = new FormData();
        formData.append('total_amount', String(totalAmount));
        formData.append('payment_methods', JSON.stringify([{
          type: paymentMethod.type,
          amount: paymentMethod.amount,
          reference: paymentMethod.reference || null
        }]));
        formData.append('notes', fullNotes);
        if (receiptFile) {
          formData.append('receipt_image', receiptFile);
        }

        await transferVendorAPI.sellFromTransfer(productData.transfer_id, formData);
      } else {
        // Venta directa desde escáner — usar endpoint createSale
        const saleData = {
          items: [{
            sneaker_reference_code: productData.code,
            brand: productData.brand,
            model: productData.model,
            color: productData.color,
            size: productData.size,
            quantity: 1,
            unit_price: editedPrice
          }],
          total_amount: totalAmount,
          payment_methods: [paymentMethod],
          notes: fullNotes,
          requires_confirmation: requiresConfirmation,
          receipt_image: receiptFile,
        };

        await vendorAPI.createSale(saleData);
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error creando venta:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-semibold text-green-800">Venta Registrada</h3>
          <p className="text-sm text-green-600">
            La venta se ha registrado correctamente.
          </p>
          {onSaleCompleted && (
            <Button variant="ghost" onClick={onSaleCompleted} className="mt-2">
              Volver al Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Confirmar Venta</h3>

        {/* Detalle del producto */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {productData.brand} {productData.model}
              </p>
              <p className="text-xs text-muted-foreground">
                Talla {productData.size}
                {productData.color ? ` · ${productData.color}` : ''}
              </p>
              {(productData.storage_type || productData.location) && (
                <p className="text-xs text-muted-foreground">
                  {getStorageLabel(productData.storage_type)}
                  {productData.location ? ` — ${productData.location}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Precio editable */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <DollarSign className="h-4 w-4 text-green-600" />
            Precio
          </label>
          <input
            type="number"
            value={editedPrice}
            onChange={(e) => setEditedPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            min={0}
            step={1000}
          />
        </div>

        {/* Metodo de pago */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Metodo de pago</p>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setSelectedPaymentMethod(method.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selectedPaymentMethod === method.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-muted'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Referencia de pago (visible si tarjeta o transferencia) */}
        {(selectedPaymentMethod === 'tarjeta' || selectedPaymentMethod === 'transferencia') && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Referencia {selectedPaymentMethod === 'tarjeta' ? '(****1234)' : ''}
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder={selectedPaymentMethod === 'tarjeta' ? '****1234' : 'REF123456'}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        )}

        {/* Toggle Opciones Avanzadas */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Opciones Avanzadas
        </button>

        {/* Opciones Avanzadas */}
        {showAdvanced && (
          <div className="space-y-4 border-t border-border pt-4">
            {/* Descuento */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Percent className="h-4 w-4 text-blue-500" />
                Descuento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={discountInput}
                  onChange={(e) => {
                    setDiscountInput(e.target.value);
                    const parsed = e.target.value.trim() === '' ? 0 : parseFloat(e.target.value) || 0;
                    setDiscountAmount(parsed);
                  }}
                  placeholder="Monto"
                  min={0}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Razon del descuento"
                  disabled={discountAmount === 0}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                />
              </div>
              {discountAmount > 0 && discountReason && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestDiscount}
                  disabled={isRequestingDiscount}
                  className="w-full"
                >
                  {isRequestingDiscount ? 'Solicitando...' : 'Solicitar Descuento'}
                </Button>
              )}
              {discountAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Total con descuento: ${totalAmount.toLocaleString('es-CO')}
                </p>
              )}
            </div>

            {/* Comprobante */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Upload className="h-4 w-4 text-purple-500" />
                Comprobante
              </label>
              <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border border-input bg-background text-sm font-medium text-foreground hover:bg-muted cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                {receiptFile ? 'Cambiar archivo' : 'Seleccionar archivo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
              {receiptFile && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {receiptFile.name} ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Notas adicionales</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notas sobre la venta..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Requiere confirmacion */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresConfirmation"
                checked={requiresConfirmation}
                onChange={(e) => setRequiresConfirmation(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary/50"
              />
              <label htmlFor="requiresConfirmation" className="text-sm text-foreground">
                Requiere confirmacion posterior
              </label>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              'Confirmar Venta'
            )}
          </Button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 py-1"
            >
              Cancelar
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
