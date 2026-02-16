import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { vendorAPI } from '../../services/transfersAPI';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Package, Truck, Tag, Loader2, CheckCircle, AlertCircle, ArrowDown, Footprints } from 'lucide-react';

interface ScannerTransferRequestProps {
  prefilledProductData: {
    sneaker_reference_code: string;
    brand: string;
    model: string;
    color: string;
    size: string;
    source_location_id?: number;
    destination_location_id?: number;
    pairs?: number;
    left_feet?: number;
    right_feet?: number;
    location_name?: string;
    transfer_type?: 'pair' | 'left_foot' | 'right_foot' | 'form_pair';
    request_notes?: string;
    pickup_type?: 'vendedor' | 'corredor';
    available_options?: {
      pairs_available?: boolean;
      left_feet_available?: boolean;
      right_feet_available?: boolean;
      pairs_quantity?: number;
      left_feet_quantity?: number;
      right_feet_quantity?: number;
    };
    local_left_feet?: number;
    local_right_feet?: number;
    local_pairs?: number;
  };
  onTransferRequested?: (transferId: number, isUrgent: boolean) => void;
  onBack?: () => void;
}

export const ScannerTransferRequest: React.FC<ScannerTransferRequestProps> = ({
  prefilledProductData,
  onTransferRequested,
  onBack
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInventoryLabel = () => {
    const { transfer_type } = prefilledProductData;
    switch (transfer_type) {
      case 'left_foot':
        return '1 Pie Izquierdo';
      case 'right_foot':
        return '1 Pie Derecho';
      case 'form_pair':
        return '1 Par (formar con pies separados)';
      case 'pair':
      default:
        return '1 Par Completo';
    }
  };

  const getPickupLabel = () => {
    return prefilledProductData.pickup_type === 'corredor' ? 'Corredor' : 'Vendedor recoge';
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const transferType = prefilledProductData.transfer_type || 'pair';
      const isSingleFoot = transferType === 'left_foot' || transferType === 'right_foot';

      let response;

      if (isSingleFoot) {
        const singleFootPayload = {
          source_location_id: prefilledProductData.source_location_id || 0,
          destination_location_id: prefilledProductData.destination_location_id || user?.location_id || 0,
          sneaker_reference_code: prefilledProductData.sneaker_reference_code,
          size: prefilledProductData.size,
          foot_side: transferType === 'left_foot' ? 'left' : 'right',
          quantity: 1,
          purpose: 'pair_formation',
          pickup_type: prefilledProductData.pickup_type || 'vendedor',
          notes: prefilledProductData.request_notes || null
        };
        response = await vendorAPI.requestSingleFoot(singleFootPayload);
      } else {
        const transferPayload = {
          source_location_id: prefilledProductData.source_location_id,
          destination_location_id: prefilledProductData.destination_location_id || user?.location_id,
          sneaker_reference_code: prefilledProductData.sneaker_reference_code,
          brand: prefilledProductData.brand,
          model: prefilledProductData.model,
          size: prefilledProductData.size,
          quantity: 1,
          purpose: 'cliente' as const,
          pickup_type: prefilledProductData.pickup_type || 'vendedor',
          destination_type: 'exhibicion',
          notes: prefilledProductData.request_notes || `Solicitud desde escáner - Color: ${prefilledProductData.color || 'N/A'}`
        };
        response = await vendorAPI.requestTransfer(transferPayload);
      }

      setSuccess(true);
      onTransferRequested?.(response.transfer_request_id, true);
    } catch (err) {
      console.error('Error enviando solicitud de transferencia:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al solicitar transferencia');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-semibold text-green-800">Transferencia Solicitada</h3>
          <p className="text-sm text-green-600">
            Tu solicitud ha sido enviada. Recibirás una notificación cuando sea procesada.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Confirmar Solicitud de Transferencia</h3>

        {/* Ruta: Origen → Destino */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex gap-4">
            {/* Línea vertical con puntos */}
            <div className="flex flex-col items-center pt-1">
              <div className="h-3 w-3 rounded-full bg-purple-500 ring-4 ring-purple-100 shrink-0" />
              <div className="w-0.5 flex-1 bg-gradient-to-b from-purple-300 to-blue-300 " />
              <ArrowDown className="h-5 w-5 text-blue-400 shrink-0" />
              <div className="h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-100 shrink-0" />
            </div>

            {/* Contenido de los puntos */}
            <div className="flex flex-col justify-between flex-1 gap-4 min-h-[88px]">
              {/* Punto origen */}
              <div>
                <p className="text-xs text-muted-foreground">Origen</p>
                <p className="text-sm font-semibold">{prefilledProductData.location_name || 'Bodega Principal'}</p>
              </div>

              {/* Punto destino */}
              <div>
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="text-sm font-semibold">{user?.location_name}</p>
              </div>
            </div>

            {/* Badge de recogida */}
            <div className="flex items-center self-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                <Truck className="h-3 w-3" />
                {getPickupLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Detalle del producto */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {prefilledProductData.brand} {prefilledProductData.model}
              </p>
              <p className="text-xs text-muted-foreground">
                Talla {prefilledProductData.size}
                {prefilledProductData.color ? ` · ${prefilledProductData.color}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Sección de formación de par */}
        {(() => {
          const { transfer_type, local_left_feet = 0, local_right_feet = 0, local_pairs = 0 } = prefilledProductData;
          const hasLocalStock = local_left_feet > 0 || local_right_feet > 0 || local_pairs > 0;

          if (transfer_type === 'left_foot' || transfer_type === 'right_foot' || transfer_type === 'form_pair') {
            return (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Footprints className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-800">Formación de Par</span>
                </div>
                <div className="space-y-2 pl-7">
                  <div>
                    <p className="text-xs text-muted-foreground">En tu local:</p>
                    <p className="text-sm font-medium text-black">
                      {local_left_feet > 0 && `🦶 ${local_left_feet} Pie${local_left_feet > 1 ? 's' : ''} Izquierdo${local_left_feet > 1 ? 's' : ''}`}
                      {local_right_feet > 0 && `🦶 ${local_right_feet} Pie${local_right_feet > 1 ? 's' : ''} Derecho${local_right_feet > 1 ? 's' : ''}`}
                      {local_pairs > 0 && `📦 ${local_pairs} Par${local_pairs > 1 ? 'es' : ''}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Se transferirá:</p>
                    <p className="text-sm font-medium text-indigo-700">
                      {transfer_type === 'right_foot' && '🦶 1 Pie Derecho'}
                      {transfer_type === 'left_foot' && '🦶 1 Pie Izquierdo'}
                      {transfer_type === 'form_pair' && '📦 1 Par (formar con pies separados)'}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          if (transfer_type === 'pair' && !hasLocalStock) {
            return (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-800">Detalle de Transferencia</span>
                </div>
                <div className="space-y-1 pl-7">
                  <p className="text-xs text-muted-foreground">En tu local: <span className="font-medium text-red-800">Sin stock de esta talla</span></p>
                  <p className="text-xs text-muted-foreground">Se transferirá: <span className="font-medium text-slate-700">1 Par Completo</span></p>
                </div>
              </div>
            );
          }

          return null;
        })()}

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
                Solicitando...
              </>
            ) : (
              'Solicitar Transferencia'
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
