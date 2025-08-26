import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency, vendorAPI, convertScanResponseToProductOptions, ScanResponse } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Camera, 
  Loader2, 
  Package, 
  MapPin,
  ShoppingBag,
  ArrowRight,
  Check,
  Warehouse,
  Store,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface StockBySizeInfo {
  size: string;
  quantity_stock: number;
  quantity_exhibition: number;
  location: string;
}

interface InventoryInfo {
  local_info: {
    location_number: number;
    location_name: string;
  };
  pricing: {
    unit_price: number;
    box_price: number;
  };
  stock_by_size: StockBySizeInfo[];
  total_stock: number;
  total_exhibition: number;
  available_sizes: string[];
  other_locations: any[];
}

interface AvailabilityInfo {
  in_stock: boolean;
  can_sell: boolean;
  can_request_from_other_locations: boolean;
  recommended_action: string;
}

interface ProductOption {
  id: string;
  brand: string;
  model: string;
  code: string;
  description: string;
  confidence: number;
  image?: string;
  rank: number;
  similarity_score: number;
  confidence_level: string;
  original_db_id: number;
  inventory: InventoryInfo;
  availability: AvailabilityInfo;
  color: string;
}

interface SizeInfo {
  size: string;
  location: string;
  location_number?: number;
  storage_type: 'warehouse' | 'display';
  quantity: number;
  unit_price: number;
  box_price: number;
  total_quantity: number;
}

interface SelectedProductDetails {
  product: ProductOption;
  sizes: SizeInfo[];
}

interface ProductScannerProps {
  onSellProduct?: (productData: {
    code: string;
    brand: string;
    model: string;
    size: string;
    price: number;
    location: string;
    storage_type: string;
  }) => void;
  onRequestTransfer?: (productData: {
    sneaker_reference_code: string;
    brand: string;
    model: string;
    color: string;
    size: string;
    product: ProductOption;
  }) => void;
  capturedImage?: File | null;
  scanResult?: any;
}

// Componente para manejar imágenes con fallback
interface ProductImageProps {
  image?: string;
  alt: string;
  className?: string;
}

const ProductImageComponent: React.FC<ProductImageProps> = ({ 
  image, 
  alt, 
  className = "w-20 h-20 object-cover rounded-md flex-shrink-0" 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!image || imageError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <Camera className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={alt}
      className={className}
      onError={() => {
        console.log(`Error cargando imagen: ${image}`);
        setImageError(true);
        setImageLoading(false);
      }}
      onLoad={() => setImageLoading(false)}
      style={{ display: imageLoading ? 'none' : 'block' }}
    />
  );
};

export const ProductScanner: React.FC<ProductScannerProps> = ({
  onSellProduct,
  onRequestTransfer,
  capturedImage,
  scanResult
}) => {
  const { user } = useAuth();

  const [isScanning, setIsScanning] = useState(false);
  const [scanOptions, setScanOptions] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProductDetails | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'processing' | 'options' | 'details'>('processing');
  const [scanInfo, setScanInfo] = useState<any>(null);

  // Effect para procesar imagen automáticamente cuando llega desde la cámara
  useEffect(() => {
    if (capturedImage) {
      console.log('Imagen recibida desde cámara, procesando...', capturedImage.name);
      handleScanFromCamera(capturedImage);
    }
  }, [capturedImage]);

  // Función para convertir los datos de disponibilidad a formato de tallas
  const convertAvailabilityToSizes = (product: ProductOption): SizeInfo[] => {
    // Si no hay stock disponible, crear tallas mock basadas en las tallas disponibles del sistema
    if (product.inventory.total_stock === 0 && product.inventory.available_sizes.length === 0) {
      // Crear tallas comunes sin stock para mostrar que el producto existe pero no está disponible
      const commonSizes = ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'];
      return commonSizes.map(size => ({
        size,
        location: product.inventory.local_info.location_name || 'Sin ubicación',
        storage_type: 'warehouse' as const,
        quantity: 0,
        unit_price: product.inventory.pricing.unit_price,
        box_price: product.inventory.pricing.box_price,
        total_quantity: 0
      }));
    }

    // Si hay tallas disponibles en el sistema pero sin información detallada de stock
    if (product.inventory.available_sizes.length > 0) {
      return product.inventory.available_sizes.map(size => ({
        size,
        location: product.inventory.local_info.location_name || 'Local',
        storage_type: 'warehouse' as const,
        quantity: 0, // La nueva API no proporciona información detallada por talla
        unit_price: product.inventory.pricing.unit_price,
        box_price: product.inventory.pricing.box_price,
        total_quantity: 0
      }));
    }

    // Si hay información detallada de stock por talla (del formato anterior)
    if (product.inventory.stock_by_size && product.inventory.stock_by_size.length > 0) {
      return product.inventory.stock_by_size.map((stockInfo) => ({
        size: stockInfo.size,
        location: stockInfo.location,
        location_number: (stockInfo as any).location_number ?? product.inventory.local_info.location_number,
        storage_type: stockInfo.quantity_stock > 0 ? 'warehouse' : 'display',
        quantity: stockInfo.quantity_stock,
        unit_price: product.inventory.pricing.unit_price,
        box_price: product.inventory.pricing.box_price,
        total_quantity: stockInfo.quantity_stock + stockInfo.quantity_exhibition
      }));
    }

    // Fallback: crear al menos una entrada para mostrar el producto
    return [{
      size: 'Consultar',
      location: product.inventory.local_info.location_name || 'Local',
      storage_type: 'warehouse' as const,
      quantity: 0,
      unit_price: product.inventory.pricing.unit_price,
      box_price: product.inventory.pricing.box_price,
      total_quantity: 0
    }];
  };

  // Función handleScanFromCamera actualizada para usar la nueva API
  const handleScanFromCamera = async (imageFile: File) => {
    setIsScanning(true);
    setError(null);
    setCurrentStep('processing');

    try {
      console.log('Enviando imagen al servidor...', {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        fileType: imageFile.type
      });

      // Usar la función del API actualizada
      const scanResponse: ScanResponse = await vendorAPI.scanProduct(imageFile);
      console.log('Respuesta de la API:', scanResponse);

      if (!scanResponse.success) {
        throw new Error('La API no pudo procesar la imagen');
      }

      // Guardar información del escaneo
      setScanInfo({
        scan_timestamp: scanResponse.scan_timestamp,
        scanned_by: scanResponse.scanned_by,
        user_location: scanResponse.user_location,
        processing_time: scanResponse.processing_time_ms,
        availability_summary: scanResponse.availability_summary,
        classification_service: scanResponse.classification_service
      });

      // Convertir la respuesta a formato compatible con el componente
      let options = convertScanResponseToProductOptions(scanResponse);
      // Corregir image: null -> undefined para cumplir con ProductOption
      options = options.map(opt => ({
        ...opt,
        image: opt.image === null ? undefined : opt.image
      }));
      console.log('Opciones procesadas:', options.map(opt => ({
        id: opt.id,
        brand: opt.brand,
        model: opt.model,
        image: opt.image,
        availability: opt.availability
      })));
      setScanOptions(options);
      setCurrentStep('options');
    } catch (err) {
      console.error('Error al procesar la imagen:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al procesar la imagen');
      setCurrentStep('options');
    } finally {
      setIsScanning(false);
    }
  };

  const handleProductSelect = async (product: ProductOption) => {
    try {
      // Convertir los datos de disponibilidad al formato de tallas
      const sizes = convertAvailabilityToSizes(product);

      setSelectedProduct({
        product,
        sizes
      });
      setCurrentStep('details');
      setSelectedSize('');
    } catch (error) {
      setError('Error al cargar detalles del producto');
    }
  };

  const handleSell = () => {
    if (selectedProduct && selectedSize && onSellProduct) {
      const sizeInfo = selectedProduct.sizes.find(s => s.size === selectedSize);
      if (sizeInfo) {
        const productData = {
          code: selectedProduct.product.code,
          brand: selectedProduct.product.brand,
          model: selectedProduct.product.model,
          size: selectedSize,
          price: Math.round(sizeInfo.unit_price),
          location: sizeInfo.location,
          storage_type: sizeInfo.storage_type
        };
        
        console.log('Enviando datos del producto:', productData);
        onSellProduct(productData);
      }
    }
  };

  const handleSolicitar = () => {
    if (selectedProduct && selectedSize && onRequestTransfer && user) {
      // Buscar la talla seleccionada
      const sizeInfo = selectedProduct.sizes.find(s => s.size === selectedSize);

      // Buscar el location_id correcto en other_locations para la talla seleccionada
      let sourceLocationId: number | undefined = undefined;
      if (selectedProduct.product.inventory.other_locations && Array.isArray(selectedProduct.product.inventory.other_locations)) {
        for (const loc of selectedProduct.product.inventory.other_locations) {
          // Verifica si la talla está en el stock_info de esta ubicación
          if (loc.stock_info && Array.isArray(loc.stock_info.available_sizes)) {
            const foundSize = loc.stock_info.available_sizes.find((sz: any) => sz.size === selectedSize);
            if (foundSize && loc.location_info && typeof loc.location_info.location_id === 'number') {
              sourceLocationId = loc.location_info.location_id;
              break;
            }
          }
        }
      }
      // Fallback: si no se encuentra, usar el location_number anterior
      if (!sourceLocationId) {
        sourceLocationId = sizeInfo?.location_number ?? selectedProduct.product.inventory.local_info.location_number;
      }

      const transferData = {
        sneaker_reference_code: selectedProduct.product.code,
        brand: selectedProduct.product.brand,
        model: selectedProduct.product.model,
        color: selectedProduct.product.color,
        size: selectedSize,
        product: selectedProduct.product,
        source_location_id: sizeInfo?.location_number ?? selectedProduct.product.inventory.local_info.location_number,
        destination_location_id: user.location_id
      };
      console.log('Enviando datos para transferencia:', transferData);
      onRequestTransfer(transferData);
    }
  };

  const goBackToOptions = () => {
    setSelectedProduct(null);
    setSelectedSize('');
    setCurrentStep('options');
  };

  const getStorageTypeLabel = (type: 'warehouse' | 'display') => {
    return type === 'warehouse' ? 'Bodega' : 'Exhibición';
  };

  const getStorageTypeIcon = (type: 'warehouse' | 'display') => {
    return type === 'warehouse' ? <Warehouse className="h-4 w-4" /> : <Store className="h-4 w-4" />;
  };

  const getConfidenceLevelColor = (level: string) => {
    switch (level) {
      case 'very_high':
        return 'text-green-600 bg-green-100';
      case 'high':
        return 'text-blue-600 bg-blue-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }; 

  const getConfidenceLevelText = (level: string) => {
    switch (level) {
      case 'very_high':
        return 'Muy Alta';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Desconocida';
    }
  };

  const getAvailabilityIcon = (availability: AvailabilityInfo) => {
    if (availability.can_sell) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (availability.can_request_from_other_locations) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getAvailabilityColor = (availability: AvailabilityInfo) => {
    if (availability.can_sell) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (availability.can_request_from_other_locations) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else {
      return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* API Integration Notice */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Camera className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Escáner IA - Sistema Actualizado</p>
              <p className="text-sm text-green-700">
                Conectado a nueva API de clasificación con información de disponibilidad
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Info */}
      {scanInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Escaneado por: {scanInfo.scanned_by.name} - {scanInfo.user_location}
                  </p>
                  <p className="text-xs text-blue-600">
                    Procesado en {scanInfo.processing_time.toFixed(0)}ms
                  </p>
                </div>
                <div className="text-xs text-blue-600">
                  {new Date(scanInfo.scan_timestamp).toLocaleString()}
                </div>
              </div>
              
              {/* New: Show availability summary */}
              {scanInfo.availability_summary && (
                <div className="grid grid-cols-2 gap-4 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                  <div>Productos clasificados: {scanInfo.availability_summary.products_classified_only}</div>
                  <div>Venta inmediata: {scanInfo.availability_summary.can_sell_immediately ? 'Sí' : 'No'}</div>
                  <div>Disponibles localmente: {scanInfo.availability_summary.products_available_locally}</div>
                  <div>Requieren transferencia: {scanInfo.availability_summary.products_requiring_transfer}</div>
                </div>
              )}
              
              {/* New: Show classification service info */}
              {scanInfo.classification_service && (
                <div className="text-xs text-blue-600">
                  Modelo: {scanInfo.classification_service.model} | 
                  Coincidencias en BD: {scanInfo.classification_service.total_database_matches}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing State */}
      {currentStep === 'processing' && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Analizando imagen con IA...</h3>
                <p className="text-gray-600">Identificando producto y consultando disponibilidad</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Options Selection */}
      {currentStep === 'options' && scanOptions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Selecciona el Producto Correcto</h3>
              <p className="text-sm text-gray-500">{scanOptions.length} productos encontrados</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scanOptions.map((option) => (
                <div
                  key={option.id}
                  className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  onClick={() => handleProductSelect(option)}
                >
                  <div className="flex items-start space-x-4">
                    <ProductImageComponent
                      image={option.image}
                      alt={`${option.brand} ${option.model}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg truncate">
                          {option.description || `${option.brand} ${option.model}`}
                        </h4>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                            {option.confidence}%
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceLevelColor(option.confidence_level)}`}>
                            {getConfidenceLevelText(option.confidence_level)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Código: {option.code} | Color: {option.color} | Modelo: {option.model}
                      </p>
                      
                      {/* Stock Status */}
                      <div className={`p-2 rounded-md border mb-2 ${getAvailabilityColor(option.availability)}`}>
                        <div className="flex items-center space-x-2">
                          {getAvailabilityIcon(option.availability)}
                          <span className="text-xs font-medium">
                            {option.availability.recommended_action}
                          </span>
                        </div>
                        {option.inventory.total_stock > 0 && (
                          <div className="text-xs mt-1">
                            Stock total: {option.inventory.total_stock} unidades
                          </div>
                        )}
                      </div>

                      {/* Pricing */}
                      {option.inventory.pricing.unit_price > 0 && (
                        <div className="text-sm mb-2">
                          <span className="font-semibold text-primary">
                            {formatCurrency(option.inventory.pricing.unit_price)}
                          </span>
                          {option.inventory.pricing.box_price > 0 && (
                            <span className="text-gray-500 ml-2">
                              (Caja: {formatCurrency(option.inventory.pricing.box_price)})
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Ranking: #{option.rank}</span>
                        <div className="flex items-center text-primary">
                          <span className="text-sm font-medium">Seleccionar</span>
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No results found */}
      {currentStep === 'options' && scanOptions.length === 0 && !isScanning && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">No se encontraron productos</h3>
                <p className="text-yellow-700">No se pudieron identificar productos en la imagen. Intenta con una imagen más clara o un ángulo diferente.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Intentar de Nuevo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Details and Size Selection */}
      {currentStep === 'details' && selectedProduct && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detalles del Producto</h3>
              <Button variant="ghost" onClick={goBackToOptions}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cambiar Producto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Product Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-xl mb-2">
                  {selectedProduct.product.description || `${selectedProduct.product.brand} ${selectedProduct.product.model}`}
                </h4>
                <p className="text-gray-600 mb-1">
                  Código: {selectedProduct.product.code} | Color: {selectedProduct.product.color} | Modelo: {selectedProduct.product.model}
                </p>
                <p className="text-sm text-gray-500 mb-3">Marca: {selectedProduct.product.brand}</p>
                
                {/* Availability Status */}
                <div className={`p-3 rounded-md border ${getAvailabilityColor(selectedProduct.product.availability)}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {getAvailabilityIcon(selectedProduct.product.availability)}
                    <span className="font-medium">
                      {selectedProduct.product.availability.recommended_action}
                    </span>
                  </div>
                  <div className="text-sm">
                    Stock total: {selectedProduct.product.inventory.total_stock} unidades
                    {selectedProduct.product.inventory.total_exhibition > 0 && (
                      <span className="ml-2">| Exhibición: {selectedProduct.product.inventory.total_exhibition}</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceLevelColor(selectedProduct.product.confidence_level)}`}>
                    Confianza: {getConfidenceLevelText(selectedProduct.product.confidence_level)} ({selectedProduct.product.confidence}%)
                  </span>
                  <span className="text-xs text-gray-500">
                    Similitud: {(selectedProduct.product.similarity_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Size Selection */}
              {selectedProduct.sizes.length > 0 ? (
                <div>
                  <h5 className="font-medium mb-3">Selecciona una Talla:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedProduct.sizes.map((sizeInfo) => (
                      <button
                        key={sizeInfo.size}
                        onClick={() => setSelectedSize(sizeInfo.size)}
                        disabled={sizeInfo.quantity === 0 && selectedProduct.product.inventory.total_stock === 0}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          selectedSize === sizeInfo.size
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : sizeInfo.quantity > 0 || selectedProduct.product.inventory.total_stock > 0
                            ? 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg">Talla {sizeInfo.size}</span>
                          {selectedSize === sizeInfo.size && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{sizeInfo.location}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            {getStorageTypeIcon(sizeInfo.storage_type)}
                            <span className="ml-1">{getStorageTypeLabel(sizeInfo.storage_type)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${
                              sizeInfo.quantity > 0 || selectedProduct.product.inventory.total_stock > 0 ? 'text-success' : 'text-error'
                            }`}>
                              {sizeInfo.quantity > 0 ? `${sizeInfo.quantity} disponibles` : 
                               selectedProduct.product.inventory.total_stock > 0 ? 'Consultar stock' : 'Sin stock'}
                            </span>
                            <span className="font-bold text-primary">
                              {formatCurrency(sizeInfo.unit_price)}
                            </span>
                          </div>
                          
                          {sizeInfo.box_price > 0 && sizeInfo.box_price !== sizeInfo.unit_price && (
                            <div className="text-xs text-gray-500">
                              Precio caja: {formatCurrency(sizeInfo.box_price)}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay información de tallas disponible para este producto</p>
                </div>
              )}

              {/* Selected Size Details */}
              {selectedSize && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  {(() => {
                    const sizeInfo = selectedProduct.sizes.find(s => s.size === selectedSize);
                    if (!sizeInfo) return null;
                    
                    return (
                      <div>
                        <h6 className="font-medium text-primary mb-3">Talla {selectedSize} Seleccionada</h6>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Ubicación:</span>
                            <p className="font-medium">{sizeInfo.location}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Almacenamiento:</span>
                            <p className="font-medium">{getStorageTypeLabel(sizeInfo.storage_type)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Cantidad:</span>
                            <p className="font-medium text-success">
                              {sizeInfo.quantity > 0 ? `${sizeInfo.quantity} disponibles` : 
                               selectedProduct.product.inventory.total_stock > 0 ? 'Consultar disponibilidad' : 'Sin stock'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Precio unitario:</span>
                            <p className="font-bold text-lg text-primary">{formatCurrency(sizeInfo.unit_price)}</p>
                          </div>
                          {sizeInfo.box_price > 0 && sizeInfo.box_price !== sizeInfo.unit_price && (
                            <div className="col-span-2">
                              <span className="text-gray-600">Precio por caja:</span>
                              <p className="font-medium text-primary">{formatCurrency(sizeInfo.box_price)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                {selectedSize && (selectedProduct.product.availability.can_sell || selectedProduct.product.inventory.total_stock > 0) ? (
                  <>
                    <Button
                      onClick={handleSell}
                      className="flex-1"
                      disabled={!selectedProduct.product.availability.can_sell && selectedProduct.product.inventory.total_stock === 0}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      {selectedProduct.product.availability.can_sell ? `Vender Talla ${selectedSize}` : `Vender Talla ${selectedSize}`}
                    </Button>
                    <Button
                      onClick={handleSolicitar}
                      variant="outline"
                      className="px-6"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Solicitar
                    </Button>
                  </>
                ) : selectedProduct.product.availability.can_request_from_other_locations ? (
                  <>
                    <Button
                      onClick={handleSolicitar}
                      variant="secondary"
                      className="flex-1"
                      disabled={!selectedSize && selectedProduct.sizes.length > 0}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Solicitar Transferencia
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                      className="px-6"
                    >
                      Escanear Otro
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4 w-full">
                    <p className="text-gray-500 mb-4">
                      Producto identificado pero no disponible para venta o transferencia
                    </p>
                    <div className="flex space-x-4">
                      <Button
                        onClick={handleSolicitar}
                        variant="secondary"
                        className="flex-1"
                        disabled={!selectedSize}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Solicitar de Todas Formas
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="px-6"
                      >
                        Escanear Otro Producto
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-error">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-error" />
              <p className="text-error">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};