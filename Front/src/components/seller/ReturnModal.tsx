import React, { useState } from 'react';
import { Package, User, Truck, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { vendorAPI } from '../../services/transfersAPI';

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
  onSuccess?: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  transfer,
  onClose,
  onSuccess
}) => {
  const [pickupType, setPickupType] = useState<'vendedor' | 'corredor' | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!pickupType) return;
    setLoading(true);
    setError(null);

    try {
      await vendorAPI.createReturn({
        original_transfer_id: transfer.id,
        reason: 'no_sale',
        quantity_to_return: transfer.quantity,
        product_condition: 'good',
        pickup_type: pickupType,
        inventory_type: transfer.inventory_type,
        notes: ''
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la devolución');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={!loading ? onClose : undefined} />
      <div className="w-full max-w-md relative z-10">
        {success ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold text-green-800">Devolución Generada</h3>
              <p className="text-sm text-green-600">
                La solicitud de devolución ha sido enviada. El bodeguero procesará la solicitud.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-green-500 text-white hover:bg-green-600 text-sm px-4 py-2.5 rounded-lg font-semibold"
              >
                Cerrar
              </button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Package className="h-5 w-5" />
                Generar Devolución
              </h3>

              {/* Información del producto */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {transfer.product_image && (
                    <img
                      src={transfer.product_image}
                      alt={`${transfer.brand} ${transfer.model}`}
                      className="w-14 h-14 object-cover rounded-lg border border-border"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {transfer.brand} {transfer.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Talla {transfer.size} · Cantidad: {transfer.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ref: {transfer.sneaker_reference_code}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selección de pickup type */}
              <div>
                <span className="text-xs font-semibold text-muted-foreground mb-2 block">
                  ¿Quién entregará el producto?
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPickupType('vendedor')}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 ${
                      pickupType === 'vendedor'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm font-semibold">Vendedor</span>
                    <span className="text-[10px] text-muted-foreground">Llevar a bodega</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupType('corredor')}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 ${
                      pickupType === 'corredor'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Truck className="h-5 w-5" />
                    <span className="text-sm font-semibold">Corredor</span>
                    <span className="text-[10px] text-muted-foreground">Recoge en local</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!pickupType || loading}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    pickupType && !loading
                      ? 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
                      : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    'Confirmar Devolución'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 py-1"
                >
                  Cancelar
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
