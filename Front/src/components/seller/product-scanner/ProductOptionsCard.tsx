import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { formatCurrency } from '../../../services/api';
import { getConfidenceCircleStyles, getConfidenceLevelText } from './helpers';
import { ProductOption } from './types';
import { ProductImage } from './ProductImage';

interface ProductOptionsCardProps {
  options: ProductOption[];
  onSelect: (product: ProductOption) => void;
}

const ProductOptionItem: React.FC<{ option: ProductOption; onSelect: (product: ProductOption) => void }> = ({
  option,
  onSelect,
}) => {
  const confidenceStyles = getConfidenceCircleStyles(option.confidence_level);
  const confidenceTextColor = confidenceStyles.split(' ')[1];

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
        option.inventory.total_stock > 0 ? 'hover:border-primary' : 'border-red-400'
      }`}
      onClick={() => onSelect(option)}
    >
      <div className="flex gap-3 sm:gap-4">
        <ProductImage
          image={option.image}
          alt={`${option.brand} ${option.model}`}
          className="w-28 sm:w-36 h-auto self-stretch object-cover rounded-lg flex-shrink-0 border border-border shadow"
        />

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="sm:hidden flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded shrink-0">
                #{option.rank}
              </span>
              <h4 className="font-semibold text-sm text-foreground truncate">
                {option.description || `${option.brand} ${option.model}`}
              </h4>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {option.brand} • {option.model}
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${confidenceStyles}`}>
                <span className="text-[9px] font-bold">{option.confidence?.toFixed(0)}%</span>
              </div>
              <span className={`text-[10px] font-semibold ${confidenceTextColor}`}>
                {getConfidenceLevelText(option.confidence_level)}
              </span>
            </div>
            {option.inventory.available_sizes && option.inventory.available_sizes.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-semibold text-muted-foreground shrink-0">Tallas:</span>
                <div className="flex gap-1 flex-nowrap">
                  {option.inventory.available_sizes.slice(0, 6).map((size) => (
                    <span
                      key={size}
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 shrink-0"
                    >
                      {size}
                    </span>
                  ))}
                  {option.inventory.available_sizes.length > 6 && (
                    <span className="text-[10px] text-muted-foreground self-center shrink-0">
                      +{option.inventory.available_sizes.length - 6}
                    </span>
                  )}
                </div>
              </div>
            )}
            <span className="text-primary font-bold text-sm">{formatCurrency(option.inventory.pricing.unit_price)}</span>
          </div>

          <div className="hidden sm:flex sm:flex-col sm:gap-2 sm:h-full">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded shrink-0">
                    #{option.rank}
                  </span>
                  <h4 className="font-semibold text-base text-foreground truncate">
                    {option.description || `${option.brand} ${option.model}`}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {option.brand} • {option.model}
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

            {option.inventory.available_sizes && option.inventory.available_sizes.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground shrink-0">Tallas:</span>
                <div className="flex gap-1 flex-wrap">
                  {option.inventory.available_sizes.slice(0, 8).map((size) => (
                    <span
                      key={size}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {size}
                    </span>
                  ))}
                  {option.inventory.available_sizes.length > 8 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{option.inventory.available_sizes.length - 8}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all">
          Seleccionar <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
};

export const ProductOptionsCard: React.FC<ProductOptionsCardProps> = ({ options, onSelect }) => {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-end mb-4">
          <p className="text-sm text-gray-500">{options.length} productos encontrados</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option) => (
            <ProductOptionItem key={option.id} option={option} onSelect={onSelect} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
