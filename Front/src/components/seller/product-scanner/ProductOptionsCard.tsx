import React, { useState, useEffect, useRef } from 'react';
import { User, Truck, ShoppingBag, ShoppingCart, CheckCircle, XCircle, Info } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { formatCurrency } from '../../../services/api';
import { getConfidenceCircleStyles, getConfidenceLevelText } from './helpers';
import { ProductOption, SizeInfo } from './types';
import { ProductImage } from './ProductImage';

type SizeCategory = 'direct_sale' | 'request_pair' | 'request_piece' | 'request_multi' | 'other_stock' | 'no_stock';

function getSizeCategory(s: {
  totalStock: number;
  canSell: boolean;
  hasLocalParts: boolean;
  hasRemoteCompletePair: boolean;
  remotePartsCount: number;
}): SizeCategory {
  if (s.totalStock === 0) return 'no_stock';
  if (s.canSell) return 'direct_sale';
  if (s.hasRemoteCompletePair) return 'request_pair';
  if (s.hasLocalParts && s.remotePartsCount >= 1) return 'request_piece';
  if (s.remotePartsCount >= 2) return 'request_multi';
  return 'other_stock';
}

const SIZE_STYLES: Record<SizeCategory, { unselected: string; selected: string }> = {
  direct_sale: {
    unselected: 'bg-success/15 text-success border-2 border-success hover:bg-success/25 active:scale-95',
    selected: 'bg-success text-success-foreground border-2 border-success shadow-sm scale-105',
  },
  request_pair: {
    unselected: 'bg-primary/15 text-primary border-2 border-primary/60 hover:bg-primary/25 active:scale-95',
    selected: 'bg-primary text-primary-foreground border-2 border-primary shadow-sm scale-105',
  },
  request_piece: {
    unselected: 'bg-warning/15 text-warning border-2 border-warning/60 hover:bg-warning/25 active:scale-95',
    selected: 'bg-warning text-warning-foreground border-2 border-warning shadow-sm scale-105',
  },
  request_multi: {
    unselected: 'bg-orange-500/15 text-orange-600 border-2 border-orange-400/60 hover:bg-orange-500/25 active:scale-95',
    selected: 'bg-orange-500 text-white border-2 border-orange-500 shadow-sm scale-105',
  },
  other_stock: {
    unselected: 'bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20 active:scale-95',
    selected: 'bg-primary text-primary-foreground border-2 border-primary shadow-sm scale-105',
  },
  no_stock: {
    unselected: 'bg-muted/50 text-muted-foreground/40 border-muted/30 cursor-not-allowed',
    selected: '',
  },
};

interface ProductOptionsCardProps {
  options: ProductOption[];
  sizesMap: Map<string, SizeInfo[]>;
  onAction: (product: ProductOption, selectedSize: string, pickupType: 'vendedor' | 'corredor') => void;
  onAddToCart?: (product: ProductOption, selectedSize: string) => boolean;
  cartItemCount?: number;
  error?: string | null;
  onClearError?: () => void;
  hideConfidence?: boolean;
}

const ProductOptionItem: React.FC<{
  option: ProductOption;
  sizes: SizeInfo[];
  onAction: (product: ProductOption, selectedSize: string, pickupType: 'vendedor' | 'corredor') => void;
  onAddToCart?: (product: ProductOption, selectedSize: string) => boolean;
  cartItemCount?: number;
  hideConfidence?: boolean;
}> = ({ option, sizes, onAction, onAddToCart, cartItemCount, hideConfidence }) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confidenceStyles = getConfidenceCircleStyles(option.confidence_level);
  const confidenceTextColor = confidenceStyles.split(' ')[1];

  // Obtener tallas únicas con su stock total y categorización por tipo de transferencia
  const uniqueSizes = React.useMemo(() => {
    const sizeMap = new Map<string, {
      size: string; totalStock: number; canSell: boolean;
      hasLocalParts: boolean; hasRemoteCompletePair: boolean; remotePartsCount: number;
    }>();
    sizes.forEach((s) => {
      const effectiveStock = s.quantity + (s.left_feet || 0) + (s.right_feet || 0);
      const remoteHasPair = !s.is_local && ((s.pairs || 0) > 0 || ((s.left_feet || 0) > 0 && (s.right_feet || 0) > 0));
      const remoteHasParts = !s.is_local && !remoteHasPair && ((s.left_feet || 0) > 0 || (s.right_feet || 0) > 0);
      const existing = sizeMap.get(s.size);
      if (existing) {
        existing.totalStock += effectiveStock;
        if (s.can_sell) existing.canSell = true;
        if (s.is_local) existing.hasLocalParts = true;
        if (remoteHasPair) existing.hasRemoteCompletePair = true;
        if (remoteHasParts) existing.remotePartsCount += 1;
      } else {
        sizeMap.set(s.size, {
          size: s.size, totalStock: effectiveStock, canSell: !!s.can_sell,
          hasLocalParts: !!s.is_local, hasRemoteCompletePair: remoteHasPair,
          remotePartsCount: remoteHasParts ? 1 : 0,
        });
      }
    });
    return Array.from(sizeMap.values());
  }, [sizes]);

  const handleSizeToggle = (size: string, hasStock: boolean) => {
    if (!hasStock) return;
    setSelectedSize((prev) => (prev === size ? null : size));
  };

  const hasSelection = selectedSize !== null;
  const selectedSizeData = hasSelection ? uniqueSizes.find(s => s.size === selectedSize) : null;
  const selectedCanSell = selectedSizeData?.canSell ?? false;
  const selectedCategory = selectedSizeData ? getSizeCategory(selectedSizeData) : null;

  return (
    <div
      className={`relative border rounded-lg p-4 transition-all ${
        hasSelection
          ? selectedCategory === 'direct_sale' ? 'border-success'
            : selectedCategory === 'request_piece' ? 'border-warning'
            : selectedCategory === 'request_multi' ? 'border-orange-400'
            : 'border-primary'
          : sizes.some((s) => s.can_sell) ? 'border-success/50' : 'border-border'
      }`}
    >
      {/* Ranking badge absoluto */}
      <span className="absolute -top-2.5 -left-2 z-10 text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full shadow-md ring-2 ring-background">
        #{option.rank}
      </span>

      <div className="flex gap-3 sm:gap-4">
        <ProductImage
          image={option.image}
          alt={`${option.brand} ${option.model}`}
          className="w-28 sm:w-36 h-auto self-stretch object-cover rounded-lg flex-shrink-0 border border-border shadow"
        />

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Mobile layout */}
          <div className="sm:hidden flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <h4 className="font-semibold text-sm text-foreground truncate">
                {option.description || `${option.brand} ${option.model}`}
              </h4>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {option.brand} &bull; {option.model}
            </p>
            {!hideConfidence && (
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${confidenceStyles}`}>
                  <span className="text-[9px] font-bold">{option.confidence?.toFixed(0)}%</span>
                </div>
                <span className={`text-[10px] font-semibold ${confidenceTextColor}`}>
                  {getConfidenceLevelText(option.confidence_level)}
                </span>
              </div>
            )}
            <span className="text-primary font-bold text-sm">{formatCurrency(option.inventory.pricing.unit_price)}</span>
          </div>

          {/* Desktop layout */}
          <div className="hidden sm:flex sm:flex-col sm:gap-2 sm:h-full">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-base text-foreground truncate">
                    {option.description || `${option.brand} ${option.model}`}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {option.brand} &bull; {option.model}
                </p>
              </div>
              {!hideConfidence && (
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-11 h-11 rounded-full border-[3px] flex items-center justify-center ${confidenceStyles}`}>
                    <span className="text-[11px] font-bold">{option.confidence?.toFixed(0)}%</span>
                  </div>
                  <span className={`text-[10px] font-semibold mt-0.5 ${confidenceTextColor}`}>
                    {getConfidenceLevelText(option.confidence_level)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-primary font-bold text-base">{formatCurrency(option.inventory.pricing.unit_price)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle de tallas */}
      {uniqueSizes.length > 0 ? (
        <div className="mt-3">
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1.5 block">Tallas:</span>
          <div className="grid grid-cols-4 gap-2 sm:flex sm:gap-1.5 sm:flex-wrap">
            {uniqueSizes.map(({ size, totalStock, canSell, hasLocalParts, hasRemoteCompletePair, remotePartsCount }) => {
              const hasStock = totalStock > 0;
              const isSelected = selectedSize === size;
              const category = getSizeCategory({ totalStock, canSell, hasLocalParts, hasRemoteCompletePair, remotePartsCount });
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!hasStock}
                  onClick={() => handleSizeToggle(size, hasStock)}
                  className={`py-2.5 sm:py-1 sm:px-2.5 rounded-lg text-sm font-medium border transition-all
                    ${isSelected ? SIZE_STYLES[category].selected : SIZE_STYLES[category].unselected}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <span className="text-[10px] sm:text-xs text-muted-foreground">Sin tallas disponibles</span>
        </div>
      )}

      {/* Mensaje contextual al seleccionar talla */}
      {hasSelection && selectedCategory && selectedCategory !== 'direct_sale' && selectedCategory !== 'no_stock' && (
        <p className="mt-2 flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
          <Info className="w-3 h-3 shrink-0" />
          {selectedCategory === 'request_pair' && 'Se pedirá un par completo desde otra ubicación'}
          {selectedCategory === 'request_piece' && 'Se completará el par con pieza de otra ubicación'}
          {selectedCategory === 'request_multi' && 'Se juntarán piezas desde 2 ubicaciones distintas'}
          {selectedCategory === 'other_stock' && 'Stock disponible en otra ubicación'}
        </p>
      )}

      {/* Botones de acción */}
      <div className="mt-3 flex gap-2">
        {selectedCanSell ? (
          <button
            type="button"
            onClick={() => onAction(option, selectedSize!, 'vendedor')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-sm font-semibold transition-all bg-success text-success-foreground hover:bg-success/90 active:scale-[0.98]"
          >
            <ShoppingBag className="h-4 w-4" />
            Vender
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={!hasSelection}
              onClick={() => hasSelection && onAction(option, selectedSize!, 'vendedor')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-sm font-semibold transition-all
                ${hasSelection
                  ? selectedCategory === 'request_piece'
                    ? 'bg-warning text-warning-foreground hover:bg-warning/90 active:scale-[0.98]'
                    : selectedCategory === 'request_multi'
                      ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
                  : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
                }`}
            >
              <User className="h-4 w-4" />
              Vendedor
            </button>
            <button
              type="button"
              disabled={!hasSelection}
              onClick={() => hasSelection && onAction(option, selectedSize!, 'corredor')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-sm font-semibold transition-all
                ${hasSelection
                  ? selectedCategory === 'request_piece'
                    ? 'bg-warning/80 text-warning-foreground hover:bg-warning/70 active:scale-[0.98] border border-warning'
                    : selectedCategory === 'request_multi'
                      ? 'bg-orange-400 text-white hover:bg-orange-500 active:scale-[0.98] border border-orange-500'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:scale-[0.98] border border-border'
                  : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
                }`}
            >
              <Truck className="h-4 w-4" />
              Corredor
            </button>
            {onAddToCart && (
              <button
                type="button"
                disabled={!hasSelection || justAdded}
                onClick={() => {
                  if (!hasSelection) return;
                  const success = onAddToCart(option, selectedSize!);
                  if (success) {
                    setJustAdded(true);
                    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
                    addedTimerRef.current = setTimeout(() => setJustAdded(false), 1500);
                  }
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-sm font-semibold transition-all
                  ${justAdded
                    ? 'bg-success text-success-foreground scale-[0.98]'
                    : hasSelection
                      ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]'
                      : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
                  }`}
              >
                {justAdded ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Agregado</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {cartItemCount ? `Carrito (${cartItemCount})` : '+Carrito'}
                    </span>
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const ProductOptionsCard: React.FC<ProductOptionsCardProps> = ({ options, sizesMap, onAction, onAddToCart, cartItemCount, error, onClearError, hideConfidence }) => {
  const errorRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error]);

  return (
    <Card>
      <CardContent>
        {error && (
          <div ref={errorRef} className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            {onClearError && (
              <button type="button" onClick={onClearError} className="text-red-400 hover:text-red-600 flex-shrink-0">
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        <div className="flex items-center justify-end mb-4">
          <p className="text-sm text-gray-500">{options.length} productos encontrados</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option) => (
            <ProductOptionItem
              key={option.id}
              option={option}
              sizes={sizesMap.get(option.id) || []}
              onAction={onAction}
              onAddToCart={onAddToCart}
              cartItemCount={cartItemCount}
              hideConfidence={hideConfidence}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
