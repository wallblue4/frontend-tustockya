import React, { useState } from 'react';
import { User, Truck, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { formatCurrency } from '../../../services/api';
import { getConfidenceCircleStyles, getConfidenceLevelText } from './helpers';
import { ProductOption, SizeInfo } from './types';
import { ProductImage } from './ProductImage';

interface ProductOptionsCardProps {
  options: ProductOption[];
  sizesMap: Map<string, SizeInfo[]>;
  onAction: (product: ProductOption, selectedSize: string, pickupType: 'vendedor' | 'corredor') => void;
}

const ProductOptionItem: React.FC<{
  option: ProductOption;
  sizes: SizeInfo[];
  onAction: (product: ProductOption, selectedSize: string, pickupType: 'vendedor' | 'corredor') => void;
}> = ({ option, sizes, onAction }) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const confidenceStyles = getConfidenceCircleStyles(option.confidence_level);
  const confidenceTextColor = confidenceStyles.split(' ')[1];

  // Obtener tallas únicas con su stock total y si se puede vender directo
  const uniqueSizes = React.useMemo(() => {
    const sizeMap = new Map<string, { size: string; totalStock: number; canSell: boolean; hasLocalParts: boolean; hasRemoteCompletePair: boolean }>();
    sizes.forEach((s) => {
      // Contar pares completos + pies individuales como stock disponible
      const effectiveStock = s.quantity + (s.left_feet || 0) + (s.right_feet || 0);
      // Un remoto tiene par completo si tiene pairs > 0 o ambos pies
      const remoteHasPair = !s.is_local && ((s.pairs || 0) > 0 || ((s.left_feet || 0) > 0 && (s.right_feet || 0) > 0));
      const existing = sizeMap.get(s.size);
      if (existing) {
        existing.totalStock += effectiveStock;
        if (s.can_sell) existing.canSell = true;
        if (s.is_local) existing.hasLocalParts = true;
        if (remoteHasPair) existing.hasRemoteCompletePair = true;
      } else {
        sizeMap.set(s.size, { size: s.size, totalStock: effectiveStock, canSell: !!s.can_sell, hasLocalParts: !!s.is_local, hasRemoteCompletePair: remoteHasPair });
      }
    });
    return Array.from(sizeMap.values());
  }, [sizes]);

  const handleSizeToggle = (size: string, hasStock: boolean) => {
    if (!hasStock) return;
    setSelectedSize((prev) => (prev === size ? null : size));
  };

  const hasSelection = selectedSize !== null;
  const selectedCanSell = hasSelection && uniqueSizes.find((s) => s.size === selectedSize)?.canSell;

  return (
    <div
      className={`relative border rounded-lg p-4 transition-all ${
        hasSelection && !selectedCanSell
          ? 'border-blue-400'
          : sizes.some((s) => s.can_sell)
            ? 'border-green-400'
            : 'border-border'
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
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${confidenceStyles}`}>
                <span className="text-[9px] font-bold">{option.confidence?.toFixed(0)}%</span>
              </div>
              <span className={`text-[10px] font-semibold ${confidenceTextColor}`}>
                {getConfidenceLevelText(option.confidence_level)}
              </span>
            </div>
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
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-11 h-11 rounded-full border-[3px] flex items-center justify-center ${confidenceStyles}`}>
                  <span className="text-[11px] font-bold">{option.confidence?.toFixed(0)}%</span>
                </div>
                <span className={`text-[10px] font-semibold mt-0.5 ${confidenceTextColor}`}>
                  {getConfidenceLevelText(option.confidence_level)}
                </span>
              </div>
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
            {uniqueSizes.map(({ size, totalStock, canSell, hasLocalParts, hasRemoteCompletePair }) => {
              const hasStock = totalStock > 0;
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!hasStock}
                  onClick={() => handleSizeToggle(size, hasStock)}
                  className={`py-2.5 sm:py-1 sm:px-2.5 rounded-lg text-sm sm:text-sm font-medium border transition-all
                    ${isSelected
                      ? canSell
                        ? 'bg-green-500 text-white border-2 border-green-500 shadow-sm scale-105'
                        : 'bg-primary text-white border-primary shadow-sm scale-105'
                      : hasStock
                        ? canSell
                          ? 'bg-green-50 text-green-600 border-2 border-green-500 hover:bg-green-100 active:scale-95'
                          : hasLocalParts
                            ? 'bg-primary/10 text-primary font-bold border-2 border-primary/50 hover:bg-primary/20 active:scale-95'
                            : hasRemoteCompletePair
                              ? 'bg-primary/10 text-primary border-dashed border-primary/20 hover:bg-primary/20 active:scale-95'
                              : 'bg-primary/10 text-primary border-dotted border-2 border-primary/30 hover:bg-primary/20 active:scale-95'
                        : 'bg-muted/50 text-muted-foreground/40 border-muted/30 cursor-not-allowed'
                    }`}
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

      {/* Botones de acción */}
      <div className="mt-3 flex gap-2">
        {selectedCanSell ? (
          <button
            type="button"
            onClick={() => onAction(option, selectedSize!, 'vendedor')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-sm font-semibold transition-all bg-green-500 text-white hover:bg-green-600 active:scale-[0.98]"
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
                  ? 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
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
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:scale-[0.98] border border-border'
                  : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
                }`}
            >
              <Truck className="h-4 w-4" />
              Corredor
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const ProductOptionsCard: React.FC<ProductOptionsCardProps> = ({ options, sizesMap, onAction }) => {
  return (
    <Card>
      <CardContent>
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
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
