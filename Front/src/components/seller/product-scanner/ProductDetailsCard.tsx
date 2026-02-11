import React from 'react';
import { AlertCircle, ArrowLeft, Check, CheckCircle, MapPin, Package, ShoppingBag, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { formatCurrency } from '../../../services/api';
import { createSizeKey, findSizeByKey, getConfidenceCircleStyles, getConfidenceLevelText } from './helpers';
import { SelectedProductDetails, SizeInfo } from './types';

interface ProductDetailsCardProps {
  selectedProduct: SelectedProductDetails;
  selectedSize: string;
  userLocationId?: number;
  onBack: () => void;
  onSelectSize: (sizeKey: string) => void;
  onSolicitar: () => void;
  onSell?: () => void;
  onScanAnother: () => void;
}

const getSizeStatus = (sizeInfo: SizeInfo, userLocationId?: number) => {
  const isLocalVendor = sizeInfo.location_id === userLocationId;

  if (!isLocalVendor) {
    return {
      icon: <Package className="h-4 w-4" />,
      text: 'Requiere transferencia',
      textClass: 'text-primary',
    };
  }

  if (sizeInfo.can_sell) {
    return {
      icon: <CheckCircle className="h-4 w-4" />,
      text: 'Disponible venta',
      textClass: 'text-success',
    };
  }

  if (sizeInfo.can_form_pair) {
    return {
      icon: <AlertCircle className="h-4 w-4" />,
      text: 'Formar pares',
      textClass: 'text-warning',
    };
  }

  if (sizeInfo.missing_foot) {
    return {
      icon: <XCircle className="h-4 w-4" />,
      text: `Falta pie ${sizeInfo.missing_foot === 'left' ? 'izq' : 'der'}`,
      textClass: 'text-muted-foreground',
    };
  }

  return {
    icon: null,
    text: 'Sin stock local',
    textClass: 'text-muted',
  };
};

const SizeCard: React.FC<{
  sizeInfo: SizeInfo;
  isSelected: boolean;
  userLocationId?: number;
  onSelect: () => void;
}> = ({ sizeInfo, isSelected, userLocationId, onSelect }) => {
  const status = getSizeStatus(sizeInfo, userLocationId);

  return (
    <button
      onClick={onSelect}
      className={`p-4 border rounded-lg text-left transition-all ${
        isSelected
          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
          : sizeInfo.location_id === userLocationId
            ? sizeInfo.can_sell
              ? 'border-success bg-success/5 hover:border-success/50 hover:shadow-sm'
              : sizeInfo.can_form_pair
                ? 'border-warning bg-warning/5 hover:border-warning/50 hover:shadow-sm'
                : 'border-muted bg-muted/5 hover:border-muted/50 hover:shadow-sm'
            : 'border-primary bg-primary/5 hover:border-primary/50 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-lg text-foreground">Talla {sizeInfo.size}</span>
        <div className="flex items-center gap-1">
          {sizeInfo.location_id === userLocationId ? (
            <>
              {sizeInfo.can_sell && <CheckCircle className="h-5 w-5 text-success" />}
              {!sizeInfo.can_sell && sizeInfo.can_form_pair && <AlertCircle className="h-5 w-5 text-warning" />}
              {!sizeInfo.can_sell && !sizeInfo.can_form_pair && <XCircle className="h-5 w-5 text-muted" />}
            </>
          ) : (
            <Package className="h-5 w-5 text-primary" />
          )}
          {isSelected && <Check className="h-5 w-5 text-primary ml-1" />}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-muted-foreground gap-2 flex-wrap">
          <MapPin className="h-3 w-3 mr-1" />
          <span className="font-medium">{sizeInfo.location_name || sizeInfo.location}</span>
          {sizeInfo.location_type && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                sizeInfo.location_type === 'local' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
              }`}
            >
              {sizeInfo.location_type === 'local' ? 'Local' : 'Bodega'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 p-2 bg-muted/10 rounded">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">👟 Pares</div>
            <div className={`font-bold ${(sizeInfo.pairs || 0) > 0 ? 'text-success' : 'text-muted'}`}>
              {sizeInfo.pairs || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">🦶 Izq</div>
            <div className={`font-bold ${(sizeInfo.left_feet || 0) > 0 ? 'text-warning' : 'text-muted'}`}>
              {sizeInfo.left_feet || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">🦶 Der</div>
            <div className={`font-bold ${(sizeInfo.right_feet || 0) > 0 ? 'text-warning' : 'text-muted'}`}>
              {sizeInfo.right_feet || 0}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className={`font-medium flex items-center gap-1 ${status.textClass}`}>
            {status.icon}
            {status.text}
          </div>
          <span className="font-bold text-primary">{formatCurrency(sizeInfo.unit_price)}</span>
        </div>

        {sizeInfo.formation_opportunities && sizeInfo.formation_opportunities.length > 0 && sizeInfo.location_id === userLocationId && (
          <div className="text-xs text-warning bg-warning/10 p-2 rounded">💡 {sizeInfo.formation_opportunities[0].action}</div>
        )}

        {sizeInfo.suggestions && sizeInfo.suggestions.length > 0 && sizeInfo.location_id !== userLocationId && (
          <div className="text-xs text-primary bg-primary/10 p-2 rounded">📦 {sizeInfo.suggestions[0].action}</div>
        )}

        {sizeInfo.box_price > 0 && sizeInfo.box_price !== sizeInfo.unit_price && (
          <div className="text-xs text-muted-foreground">Precio caja: {formatCurrency(sizeInfo.box_price)}</div>
        )}
      </div>
    </button>
  );
};

const SelectedSizeDetails: React.FC<{
  selectedProduct: SelectedProductDetails;
  selectedSize: string;
  userLocationId?: number;
}> = ({ selectedProduct, selectedSize, userLocationId }) => {
  if (!selectedSize) {
    return null;
  }

  const sizeInfo = findSizeByKey(selectedProduct.sizes, selectedSize);
  if (!sizeInfo) {
    return null;
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
      <div className="space-y-4">
        <div>
          <h6 className="font-medium text-primary mb-3 flex items-center gap-2">
            Talla {sizeInfo.size} Seleccionada
            {sizeInfo.can_sell && <CheckCircle className="h-5 w-5 text-success" />}
            {!sizeInfo.can_sell && sizeInfo.can_form_pair && <AlertCircle className="h-5 w-5 text-warning" />}
          </h6>

          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 mb-3">
            <div className="text-xs text-muted-foreground mb-2 font-semibold">Inventario Disponible</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-success/10 rounded">
                <div className="text-2xl font-bold text-success">{sizeInfo.pairs || 0}</div>
                <div className="text-xs text-muted-foreground">👟 Pares completos</div>
              </div>
              <div className="text-center p-2 bg-warning/10 rounded">
                <div className="text-2xl font-bold text-warning">{sizeInfo.left_feet || 0}</div>
                <div className="text-xs text-muted-foreground">🦶 Izquierdos</div>
              </div>
              <div className="text-center p-2 bg-warning/10 rounded">
                <div className="text-2xl font-bold text-warning">{sizeInfo.right_feet || 0}</div>
                <div className="text-xs text-muted-foreground">🦶 Derechos</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Ubicacion:</span>
              <p className="font-medium text-foreground">{sizeInfo.location}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Estado:</span>
              <p
                className={`font-medium ${
                  sizeInfo.location_id === userLocationId
                    ? sizeInfo.can_sell
                      ? 'text-success'
                      : sizeInfo.can_form_pair
                        ? 'text-warning'
                        : 'text-muted'
                    : 'text-primary'
                }`}
              >
                {sizeInfo.location_id === userLocationId
                  ? sizeInfo.can_sell
                    ? '✅ Disponible venta'
                    : sizeInfo.can_form_pair
                      ? '⚠️ Puede formar pares'
                      : '❌ Sin stock local'
                  : '📦 Requiere transferencia'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Precio unitario:</span>
              <p className="font-bold text-lg text-primary">{formatCurrency(sizeInfo.unit_price)}</p>
            </div>
            {sizeInfo.box_price > 0 && sizeInfo.box_price !== sizeInfo.unit_price && (
              <div>
                <span className="text-muted-foreground">Precio por caja:</span>
                <p className="font-medium text-primary">{formatCurrency(sizeInfo.box_price)}</p>
              </div>
            )}
          </div>
        </div>

        {sizeInfo.formation_opportunities && sizeInfo.formation_opportunities.length > 0 && (
          <div className="border-t border-primary/20 pt-3">
            <div className="text-sm font-semibold text-foreground mb-2">💡 Oportunidades de Formacion</div>
            {sizeInfo.formation_opportunities.map((opp: any, idx: number) => (
              <div key={idx} className="bg-warning/10 border border-warning/20 rounded p-3 mb-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">{opp.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prioridad: {opp.priority} • Tiempo estimado: {opp.estimated_time_hours}h
                    </p>
                    {opp.from_locations && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {opp.from_locations.map((loc: any, locIdx: number) => (
                          <div key={locIdx}>• {loc.quantity} {loc.type === 'left' ? 'izq' : 'der'} en {loc.location_name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {sizeInfo.suggestions && sizeInfo.suggestions.length > 0 && (
          <div className="border-t border-primary/20 pt-3">
            <div className="text-sm font-semibold text-foreground mb-2">📦 Sugerencias de Transferencia</div>
            {sizeInfo.suggestions.slice(0, 2).map((sugg: any, idx: number) => (
              <div key={idx} className="bg-primary/10 border border-primary/20 rounded p-3 mb-2">
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-primary">{sugg.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tiempo: ~{sugg.estimated_time_minutes} min • Disponibles: {sugg.metadata?.available_quantity || 0}
                    </p>
                    {sugg.steps && sugg.steps.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {sugg.steps.slice(0, 2).map((step: string, stepIdx: number) => (
                          <div key={stepIdx}>• {step}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductDetailsCard: React.FC<ProductDetailsCardProps> = ({
  selectedProduct,
  selectedSize,
  userLocationId,
  onBack,
  onSelectSize,
  onSolicitar,
  onSell,
  onScanAnother,
}) => {
  const confidenceStyles = getConfidenceCircleStyles(selectedProduct.product.confidence_level);
  const confidenceTextColor = confidenceStyles.split(' ')[1];

  // Determine if the selected size is in the seller's local stock and can be sold directly
  const selectedSizeInfo = selectedSize ? findSizeByKey(selectedProduct.sizes, selectedSize) : undefined;
  const isLocalAndCanSell = selectedSizeInfo && selectedSizeInfo.location_id === userLocationId && selectedSizeInfo.can_sell;

  const showPrimaryRequestButton =
    selectedSize && (selectedProduct.product.availability.can_sell || selectedProduct.product.inventory.total_stock > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Detalles del Producto</h3>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cambiar Producto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-muted/20 p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-xl mb-2 text-foreground">
                  {selectedProduct.product.description || `${selectedProduct.product.brand} ${selectedProduct.product.model}`}
                </h4>
                <p className="text-muted-foreground mb-1">Modelo: {selectedProduct.product.model}</p>
                <p className="text-sm text-muted-foreground mb-3">Marca: {selectedProduct.product.brand}</p>
              </div>
              <div className="flex flex-col items-center ml-6">
                <div className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center ${confidenceStyles}`}>
                  <span className="text-sm font-bold">{selectedProduct.product.confidence?.toFixed(0)}%</span>
                </div>
                <span className={`text-[10px] font-semibold mt-1 ${confidenceTextColor}`}>
                  {getConfidenceLevelText(selectedProduct.product.confidence_level)}
                </span>
              </div>
            </div>
          </div>

          {selectedProduct.sizes.length > 0 ? (
            <div>
              <h5 className="font-medium mb-3 text-foreground">Selecciona una Talla:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedProduct.sizes.map((sizeInfo) => {
                  const sizeKey = createSizeKey(sizeInfo.size, sizeInfo.location_name || sizeInfo.location);
                  return (
                    <SizeCard
                      key={sizeKey}
                      sizeInfo={sizeInfo}
                      isSelected={selectedSize === sizeKey}
                      userLocationId={userLocationId}
                      onSelect={() => onSelectSize(sizeKey)}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No hay informacion de tallas disponible para este producto</p>
            </div>
          )}

          <SelectedSizeDetails selectedProduct={selectedProduct} selectedSize={selectedSize} userLocationId={userLocationId} />

          <div className="flex space-x-4">
            {isLocalAndCanSell && onSell ? (
              <>
                <Button onClick={onSell} className="flex-1 bg-success hover:bg-success/90 text-success-foreground">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Vender
                </Button>
                <Button variant="outline" onClick={onScanAnother} className="px-6">
                  Escanear Otro
                </Button>
              </>
            ) : showPrimaryRequestButton ? (
              <Button onClick={onSolicitar} className="w-full">
                <Package className="h-4 w-4 mr-2" />
                Solicitar Transferencia
              </Button>
            ) : selectedProduct.product.availability.can_request_from_other_locations ? (
              <>
                <Button
                  onClick={onSolicitar}
                  variant="secondary"
                  className="flex-1"
                  disabled={!selectedSize && selectedProduct.sizes.length > 0}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Solicitar Transferencia
                </Button>
                <Button variant="outline" onClick={onScanAnother} className="px-6">
                  Escanear Otro
                </Button>
              </>
            ) : (
              <div className="text-center py-4 w-full">
                <p className="text-muted-foreground mb-4">
                  Producto identificado pero no disponible para venta o transferencia
                </p>
                <div className="flex space-x-4">
                  <Button onClick={onSolicitar} variant="secondary" className="flex-1" disabled={!selectedSize}>
                    <Package className="h-4 w-4 mr-2" />
                    Solicitar de Todas Formas
                  </Button>
                  <Button variant="outline" onClick={onScanAnother} className="px-6">
                    Escanear Otro Producto
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
