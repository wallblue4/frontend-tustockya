import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency, vendorAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Camera, 
  Loader2, 
  Package, 
  MapPin,
  ArrowRight,
  Check,
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
  location_id?: number; // ID de la ubicación para transferencias
  location_name?: string;
  location_type?: 'local' | 'bodega';
  storage_type: 'warehouse' | 'display';
  quantity: number;
  unit_price: number;
  box_price: number;
  total_quantity: number;
  // Nuevos campos para pies separados
  pairs?: number; // Pares completos
  left_feet?: number; // Pies izquierdos
  right_feet?: number; // Pies derechos
  can_sell?: boolean; // Si se puede vender ahora
  can_form_pair?: boolean; // Si se pueden formar pares
  missing_foot?: 'left' | 'right' | null; // Qué pie falta para formar par
  formation_opportunities?: any[]; // Oportunidades de formar pares
  suggestions?: any[]; // Sugerencias de transferencia
}

interface SelectedProductDetails {
  product: ProductOption;
  sizes: SizeInfo[];
}

interface ProductScannerProps {
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
  onRequestTransfer,
  capturedImage
}) => {
  const { user } = useAuth();

  const [isScanning, setIsScanning] = useState(false);
  const [scanOptions, setScanOptions] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProductDetails | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(''); // Ahora guardará "talla-ubicacion" como clave única
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'processing' | 'options' | 'details'>('processing');
  const [scanInfo, setScanInfo] = useState<any>(null);

  // Función helper para crear una clave única por talla y ubicación
  const createSizeKey = (size: string, location: string): string => {
    return `${size}|||${location}`;
  };

  // Función helper para extraer la talla de la clave única
  const extractSizeFromKey = (key: string): string => {
    return key.split('|||')[0];
  };

  // Función helper para extraer la ubicación de la clave única
  const extractLocationFromKey = (key: string): string => {
    return key.split('|||')[1] || '';
  };

  // Effect para procesar imagen automáticamente cuando llega desde la cámara
  useEffect(() => {
    if (capturedImage) {
      console.log('Imagen recibida desde cámara, procesando...', capturedImage.name);
      handleScanFromCamera(capturedImage);
    }
  }, [capturedImage]);

  // Función para convertir los datos de disponibilidad a formato de tallas
  const convertAvailabilityToSizes = (product: ProductOption): SizeInfo[] => {
    // Nueva estructura con sizesData
    if ((product as any).sizesData) {
      const allSizes: SizeInfo[] = [];
      const sizesData = (product as any).sizesData;
      
      console.log('Processing product with sizesData:', sizesData);
      
      // Procesar cada talla desde detailed_by_size
      if (sizesData.detailed_by_size) {
        Object.entries(sizesData.detailed_by_size).forEach(([size, sizeDetails]: [string, any]) => {
          const localAvail = sizeDetails.local_availability || {};
          const globalDistro = sizeDetails.global_distribution || {};
          
          // Información de pares y pies en el local actual
          const pairs = localAvail.pairs?.quantity || 0;
          const leftFeet = localAvail.individual_feet?.left?.quantity || 0;
          const rightFeet = localAvail.individual_feet?.right?.quantity || 0;
          const canSell = localAvail.summary?.can_sell_now || false;
          const canFormPair = localAvail.individual_feet?.can_form_pair || false;
          const missing = localAvail.individual_feet?.missing || null;
          
          // Total disponible para venta (pares completos disponibles)
          const availableForSale = localAvail.pairs?.quantity_available_sale || 0;
          
          console.log(`Processing size ${size}:`, {
            pairs,
            leftFeet,
            rightFeet,
            canSell,
            canFormPair,
            missing
          });
          
          // Agregar entrada para el local actual si hay stock
          if (pairs > 0 || leftFeet > 0 || rightFeet > 0) {
            allSizes.push({
              size,
              location: localAvail.location_name || '',
              location_id: localAvail.location_id,
              location_name: localAvail.location_name,
              location_type: localAvail.location_type as 'local' | 'bodega',
              storage_type: 'warehouse' as const,
              quantity: availableForSale, // Cantidad que se puede vender
              unit_price: product.inventory.pricing.unit_price,
              box_price: product.inventory.pricing.box_price,
              total_quantity: pairs + Math.min(leftFeet, rightFeet),
              // Campos nuevos
              pairs,
              left_feet: leftFeet,
              right_feet: rightFeet,
              can_sell: canSell,
              can_form_pair: canFormPair,
              missing_foot: missing,
              formation_opportunities: sizeDetails.formation_opportunities || [],
              suggestions: sizeDetails.suggestions || []
            });
          }
          
          // Agregar entradas para otras ubicaciones con stock de esta talla
          if (globalDistro.by_location && Array.isArray(globalDistro.by_location)) {
            globalDistro.by_location.forEach((locDistro: any) => {
              // Saltar si es el local actual (ya lo agregamos arriba)
              if (locDistro.location_id === localAvail.location_id) return;
              
              // Solo agregar si hay stock en esa ubicación
              const locationPairs = locDistro.pairs || 0;
              const locationLeftFeet = locDistro.left_feet || 0;
              const locationRightFeet = locDistro.right_feet || 0;
              
              if (locationPairs > 0 || locationLeftFeet > 0 || locationRightFeet > 0) {
                allSizes.push({
                  size,
                  location: locDistro.location_name || '',
                  location_id: locDistro.location_id,
                  location_name: locDistro.location_name,
                  location_type: locDistro.location_type as 'local' | 'bodega',
                  storage_type: 'warehouse' as const,
                  quantity: locationPairs, // Solo pares completos se pueden transferir/vender
                  unit_price: product.inventory.pricing.unit_price,
                  box_price: product.inventory.pricing.box_price,
                  total_quantity: locationPairs + Math.min(locationLeftFeet, locationRightFeet),
                  // Campos nuevos
                  pairs: locationPairs,
                  left_feet: locationLeftFeet,
                  right_feet: locationRightFeet,
                  can_sell: false, // No está en el local actual
                  can_form_pair: locationLeftFeet > 0 && locationRightFeet > 0,
                  missing_foot: null,
                  formation_opportunities: sizeDetails.formation_opportunities || [],
                  suggestions: sizeDetails.suggestions || []
                });
              }
            });
          }
        });
      }
      
      console.log('All sizes processed with new structure:', allSizes);
      return allSizes;
    }

    // Fallback para estructura antigua (locations)
    if ((product as any).locations) {
      const allSizes: SizeInfo[] = [];
      
      console.log('Processing product with locations (fallback):', (product as any).locations);
      
      // current_location - ubicaciones en el local actual del usuario (estructura simple)
      if ((product as any).locations.current_location && Array.isArray((product as any).locations.current_location)) {
        (product as any).locations.current_location.forEach((sizeObj: any) => {
          console.log('Processing current location size:', sizeObj);
          
          if (sizeObj.quantity > 0) {
            allSizes.push({
              size: sizeObj.size,
              location: sizeObj.location,
              location_id: sizeObj.location_id, // Agregar location_id
              location_name: sizeObj.location,
              location_type: 'local' as const,
              storage_type: 'warehouse' as const,
              quantity: sizeObj.quantity,
              unit_price: product.inventory.pricing.unit_price,
              box_price: product.inventory.pricing.box_price,
              total_quantity: sizeObj.quantity
            });
          }
        });
      }
      
      // other_locations - ubicaciones en otros locales/bodegas (estructura simple)
      if ((product as any).locations.other_locations && Array.isArray((product as any).locations.other_locations)) {
        (product as any).locations.other_locations.forEach((sizeObj: any) => {
          console.log('Processing other location size:', sizeObj);
          
          // Agregar todas las tallas de other_locations, incluso si quantity es 0, para permitir transferencias
          allSizes.push({
            size: sizeObj.size,
            location: sizeObj.location,
            location_id: sizeObj.location_id, // Agregar location_id
            location_name: sizeObj.location,
            location_type: 'bodega' as const,
            storage_type: 'warehouse' as const,
            quantity: sizeObj.quantity || 0,
            unit_price: product.inventory.pricing.unit_price,
            box_price: product.inventory.pricing.box_price,
            total_quantity: sizeObj.quantity || 0
          });
        });
      }
      
      console.log('All sizes processed:', allSizes);
      return allSizes;
    }

    // Fallbacks antiguos:
    if (product.inventory.total_stock === 0 && product.inventory.available_sizes.length === 0) {
      const commonSizes = ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'];
      return commonSizes.map(size => ({
        size,
        location: product.inventory.local_info.location_name || 'Sin ubicación',
        location_name: product.inventory.local_info.location_name || 'Sin ubicación',
        location_type: undefined,
        storage_type: 'warehouse' as const,
        quantity: 0,
        unit_price: product.inventory.pricing.unit_price,
        box_price: product.inventory.pricing.box_price,
        total_quantity: 0
      }));
    }
    if (product.inventory.available_sizes.length > 0) {
      return product.inventory.available_sizes.map(size => ({
        size,
        location: product.inventory.local_info.location_name || 'Local',
        location_name: product.inventory.local_info.location_name || 'Local',
        location_type: undefined,
        storage_type: 'warehouse' as const,
        quantity: 0,
        unit_price: product.inventory.pricing.unit_price,
        box_price: product.inventory.pricing.box_price,
        total_quantity: 0
      }));
    }
    if (product.inventory.stock_by_size && product.inventory.stock_by_size.length > 0) {
      return product.inventory.stock_by_size.map((stockInfo) => ({
        size: stockInfo.size,
        location: stockInfo.location,
        location_name: stockInfo.location,
        location_type: undefined,
        location_number: (stockInfo as any).location_number ?? product.inventory.local_info.location_number,
        storage_type: stockInfo.quantity_stock > 0 ? 'warehouse' : 'display',
        quantity: stockInfo.quantity_stock,
        unit_price: product.inventory.pricing.unit_price,
        box_price: product.inventory.pricing.box_price,
        total_quantity: stockInfo.quantity_stock + stockInfo.quantity_exhibition
      }));
    }
    return [{
      size: 'Consultar',
      location: product.inventory.local_info.location_name || 'Local',
      location_name: product.inventory.local_info.location_name || 'Local',
      location_type: undefined,
      storage_type: 'warehouse' as const,
      quantity: 0,
      unit_price: product.inventory.pricing.unit_price,
      box_price: product.inventory.pricing.box_price,
      total_quantity: 0
    }];
  };

  // Convierte la respuesta de la API a ProductOption[]
  function convertScanResponseToProductOptions(scanResponse: any): ProductOption[] {
    // La nueva estructura ya no tiene results.best_match, sino que viene directamente
    if (!scanResponse || !scanResponse.success) return [];
    
    // La nueva API devuelve directamente el producto, no múltiples opciones
    const product = scanResponse.product || {};
    const sizes = scanResponse.sizes || {};
    const classification = scanResponse.classification || {};
    
    // Calcular stock total de la nueva estructura con pies separados
    const calculateTotalStock = () => {
      let totalPairs = 0;
      let totalLeftFeet = 0;
      let totalRightFeet = 0;
      
      if (sizes.detailed_by_size) {
        Object.values(sizes.detailed_by_size).forEach((sizeData: any) => {
          if (sizeData.local_availability) {
            totalPairs += sizeData.local_availability.pairs?.quantity || 0;
            totalLeftFeet += sizeData.local_availability.individual_feet?.left?.quantity || 0;
            totalRightFeet += sizeData.local_availability.individual_feet?.right?.quantity || 0;
          }
        });
      }
      
      // Retornar el total de pares equivalentes (pares + pies que pueden formar pares)
      const formablePairs = Math.min(totalLeftFeet, totalRightFeet);
      return totalPairs + formablePairs;
    };

    // Obtener todas las tallas disponibles
    const getAvailableSizes = () => {
      return sizes.available_sizes || [];
    };

    // Crear stock_by_size para current_location (adaptado a nueva estructura)
    const createStockBySize = () => {
      if (!sizes.detailed_by_size) return [];
      
      return Object.entries(sizes.detailed_by_size).map(([size, sizeData]: [string, any]) => {
        const localAvail = sizeData.local_availability || {};
        const pairs = localAvail.pairs?.quantity || 0;
        const leftFeet = localAvail.individual_feet?.left?.quantity || 0;
        const rightFeet = localAvail.individual_feet?.right?.quantity || 0;
        const formablePairs = Math.min(leftFeet, rightFeet);
        
        return {
          size,
          quantity_stock: pairs + formablePairs,
          quantity_exhibition: localAvail.pairs?.quantity_exhibition || 0,
          location: localAvail.location_name || ''
        };
      });
    };
    
    // Unificar estructura de inventory para el componente
    const inventory: InventoryInfo = {
      local_info: {
        location_number: scanResponse.scanned_by?.location_id || 0,
        location_name: sizes.detailed_by_size && Object.values(sizes.detailed_by_size)[0] 
          ? (Object.values(sizes.detailed_by_size)[0] as any).local_availability?.location_name || ''
          : '',
      },
      pricing: {
        unit_price: product.unit_price || 0,
        box_price: product.box_price || 0,
      },
      stock_by_size: createStockBySize(),
      total_stock: calculateTotalStock(),
      total_exhibition: 0,
      available_sizes: getAvailableSizes(),
      other_locations: [] // Se llenará desde detailed_by_size
    };
    
    // Adaptar availability
    const availability: AvailabilityInfo = {
      in_stock: scanResponse.global_summary?.inventory_local?.pairs_available > 0,
      can_sell: scanResponse.global_summary?.inventory_local?.can_sell_immediately || false,
      can_request_from_other_locations: scanResponse.global_summary?.total_opportunities > 0,
      recommended_action: scanResponse.global_summary?.inventory_local?.can_sell_immediately 
        ? 'Puede vender ahora' 
        : 'Requiere transferencia o formación de pares'
    };
    
    // Crear el objeto ProductOption con la estructura nueva
    const productOption = {
      id: product.reference_code || 'product-1',
      brand: product.brand || classification.brand_detected || '',
      model: product.model || classification.model_detected || '',
      code: product.reference_code || '',
      description: product.description || `${product.brand} ${product.model}`,
      color: '', // No viene en la nueva estructura
      image: product.image_url || undefined,
      confidence: classification.confidence_percentage || 0,
      rank: 1,
      similarity_score: classification.confidence_score || 0,
      confidence_level: classification.confidence_percentage >= 90 ? 'high' : 'medium',
      original_db_id: product.product_id || 0,
      inventory,
      availability,
    };
    
    // Preservar la estructura completa de sizes para que convertAvailabilityToSizes pueda acceder a ella
    (productOption as any).sizesData = sizes;
    (productOption as any).globalSummary = scanResponse.global_summary;
    (productOption as any).distributionMatrix = scanResponse.distribution_matrix;
    
    return [productOption]; // Retornar como array de un elemento
  }

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
      const scanResponse: any = await vendorAPI.scanProduct(imageFile);
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

  const handleSolicitar = () => {
    if (selectedProduct && selectedSize && onRequestTransfer && user) {
      // Extraer la talla y ubicación de la clave única
      const size = extractSizeFromKey(selectedSize);
      const location = extractLocationFromKey(selectedSize);
      
      // Buscar la información exacta de esa talla en esa ubicación
      const sizeInfo = selectedProduct.sizes.find(
        s => s.size === size && (s.location_name || s.location) === location
      );

      if (!sizeInfo) {
        console.error('No se encontró información de la talla seleccionada');
        alert('Error: No se encontró información de la talla seleccionada');
        return;
      }

      // Obtener el source_location_id directamente de sizeInfo (ya lo guardamos ahí)
      let sourceLocationId = sizeInfo.location_id || sizeInfo.location_number;

      // Si aún no tenemos source_location_id, mostrar error
      if (!sourceLocationId) {
        console.error('No se pudo determinar source_location_id para la transferencia');
        alert('Error: No se pudo determinar la ubicación de origen para la transferencia');
        return;
      }

      const transferData = {
        sneaker_reference_code: selectedProduct.product.code,
        brand: selectedProduct.product.brand,
        model: selectedProduct.product.model,
        color: selectedProduct.product.color,
        size: size,
        product: selectedProduct.product,
        source_location_id: sourceLocationId,
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
      <Card className="border-success/30 bg-success/10">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Camera className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-medium text-success">Escáner IA - Sistema Actualizado</p>
              <p className="text-sm text-success">
                Conectado a nueva API de clasificación con información de disponibilidad
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Info */}
      {scanInfo && (
        <Card className="border-primary/30 bg-primary/10">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">
                    Escaneado por: {scanInfo.scanned_by.name} - {scanInfo.user_location}
                  </p>
                  <p className="text-xs text-primary">
                    Procesado en {scanInfo.processing_time.toFixed(0)}ms
                  </p>
                </div>
                <div className="text-xs text-primary">
                  {new Date(scanInfo.scan_timestamp).toLocaleString()}
                </div>
              </div>
              
              {/* New: Show availability summary */}
              {scanInfo.availability_summary && (
                <div className="grid grid-cols-2 gap-4 text-xs text-primary bg-primary/20 p-2 rounded">
                  <div>Productos clasificados: {scanInfo.availability_summary.products_classified_only}</div>
                  <div>Venta inmediata: {scanInfo.availability_summary.can_sell_immediately ? 'Sí' : 'No'}</div>
                  <div>Disponibles localmente: {scanInfo.availability_summary.products_available_locally}</div>
                  <div>Requieren transferencia: {scanInfo.availability_summary.products_requiring_transfer}</div>
                </div>
              )}
              
              {/* New: Show classification service info */}
              {scanInfo.classification_service && (
                <div className="text-xs text-primary">
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
                  <div className="flex items-start gap-6">
                    <ProductImageComponent
                      image={option.image}
                      alt={`${option.brand} ${option.model}`}
                      className="w-32 h-44 object-cover rounded-lg flex-shrink-0 border border-border shadow"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                      {/* Título y confianza */}
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-lg text-foreground truncate max-w-[16ch]">{option.description || `${option.brand} ${option.model}`}</h4>
                        <div className="flex flex-col items-end">
                          <span className={`text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded mb-1`}>{option.confidence?.toFixed(6)}%</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getConfidenceLevelColor(option.confidence_level)}`}>{getConfidenceLevelText(option.confidence_level)}</span>
                        </div>
                      </div>
                      {/* Info principal */}
                      <div className="mt-1 text-sm text-muted-foreground">
                        <div>Código: <span className="font-medium text-foreground">{option.code}</span> | Color: {option.color} | Modelo: {option.model}</div>
                        <div className="truncate">{option.description}</div>
                      </div>
                      {/* Estado de disponibilidad */}
                      <div className="mt-2">
                        <div
                          className={`p-2 rounded-md border text-sm flex items-center gap-2 
                            ${option.availability.can_sell ? 'bg-success/10 border-success text-success' : 
                              option.availability.can_request_from_other_locations ? 'bg-warning/10 border-warning text-warning' : 'bg-error/10 border-error text-error'}
                          `}
                        >
                          {getAvailabilityIcon(option.availability)}
                          <span className="font-medium text-foreground">{option.availability.recommended_action}</span>
                          {option.availability.can_sell && (
                            <span className="ml-2 text-xs text-muted-foreground">Stock total: {option.inventory.total_stock} unidades</span>
                          )}
                        </div>
                      </div>
                      {/* Precios */}
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-primary font-bold text-base">{formatCurrency(option.inventory.pricing.unit_price)}</span>
                        <span className="text-muted-foreground text-sm">(Caja: {formatCurrency(option.inventory.pricing.box_price)})</span>
                      </div>
                      {/* Ranking y acción */}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Ranking: #{option.rank}</span>
                        <span className="text-primary font-semibold text-sm flex items-center gap-1">Seleccionar <ArrowRight className="h-4 w-4 inline" /></span>
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
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-warning" />
              <div>
                <h3 className="text-lg font-semibold text-warning">No se encontraron productos</h3>
                <p className="text-warning">No se pudieron identificar productos en la imagen. Intenta con una imagen más clara o un ángulo diferente.</p>
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
              <div className="bg-muted/20 p-4 rounded-lg">
                <h4 className="font-semibold text-xl mb-2 text-foreground">
                  {selectedProduct.product.description || `${selectedProduct.product.brand} ${selectedProduct.product.model}`}
                </h4>
                <p className="text-muted-foreground mb-1">
                  Código: {selectedProduct.product.code} | Modelo: {selectedProduct.product.model}
                </p>
                <p className="text-sm text-muted-foreground mb-3">Marca: {selectedProduct.product.brand}</p>
                
                {/* Availability Status */}
                <div className={`p-3 rounded-md border ${getAvailabilityColor(selectedProduct.product.availability)}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {getAvailabilityIcon(selectedProduct.product.availability)}
                    <span className="font-medium text-foreground">
                      {selectedProduct.product.availability.recommended_action}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
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
                  <span className="text-xs text-muted-foreground">
                    Similitud: {(selectedProduct.product.similarity_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Size Selection */}
              {selectedProduct.sizes.length > 0 ? (
                <div>
                  <h5 className="font-medium mb-3 text-foreground">Selecciona una Talla:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedProduct.sizes.map((sizeInfo) => {
                      // Crear clave única para esta talla+ubicación
                      const sizeKey = createSizeKey(sizeInfo.size, sizeInfo.location_name || sizeInfo.location);
                      const isSelected = selectedSize === sizeKey;
                      
                      return (
                        <button
                          key={sizeKey}
                          onClick={() => setSelectedSize(sizeKey)}
                          disabled={false} // Permitir seleccionar todas las tallas para solicitar transferencias
                          className={`p-4 border rounded-lg text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                              : sizeInfo.can_sell
                              ? 'border-success bg-success/5 hover:border-success/50 hover:shadow-sm'
                              : sizeInfo.can_form_pair
                              ? 'border-warning bg-warning/5 hover:border-warning/50 hover:shadow-sm'
                              : 'border-muted bg-muted/5 hover:border-muted/50 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-lg text-foreground">Talla {sizeInfo.size}</span>
                            <div className="flex items-center gap-1">
                              {sizeInfo.can_sell && <CheckCircle className="h-5 w-5 text-success" />}
                              {!sizeInfo.can_sell && sizeInfo.can_form_pair && <AlertCircle className="h-5 w-5 text-warning" />}
                              {!sizeInfo.can_sell && !sizeInfo.can_form_pair && <XCircle className="h-5 w-5 text-muted" />}
                              {isSelected && <Check className="h-5 w-5 text-primary ml-1" />}
                            </div>
                          </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-muted-foreground gap-2 flex-wrap">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="font-medium">{sizeInfo.location_name || sizeInfo.location}</span>
                            {sizeInfo.location_type && (
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                sizeInfo.location_type === 'local'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-secondary/10 text-secondary'
                              }`}>
                                {sizeInfo.location_type === 'local' ? 'Local' : 'Bodega'}
                              </span>
                            )}
                          </div>

                          {/* Información de pares y pies separados */}
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

                          {/* Estado de venta */}
                          <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                              {sizeInfo.can_sell ? (
                                <span className="text-success font-medium flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" />
                                  Disponible venta
                                </span>
                              ) : sizeInfo.can_form_pair ? (
                                <span className="text-warning font-medium flex items-center gap-1">
                                  <AlertCircle className="h-4 w-4" />
                                  Formar pares
                                </span>
                              ) : sizeInfo.missing_foot ? (
                                <span className="text-muted-foreground font-medium flex items-center gap-1">
                                  <XCircle className="h-4 w-4" />
                                  Falta pie {sizeInfo.missing_foot === 'left' ? 'izq' : 'der'}
                                </span>
                              ) : sizeInfo.quantity === 0 ? (
                                <span className="text-muted font-medium">
                                  Transferir
                                </span>
                              ) : null}
                            </div>
                            <span className="font-bold text-primary">
                              {formatCurrency(sizeInfo.unit_price)}
                            </span>
                          </div>

                          {/* Oportunidades de formación */}
                          {sizeInfo.formation_opportunities && sizeInfo.formation_opportunities.length > 0 && (
                            <div className="text-xs text-warning bg-warning/10 p-2 rounded">
                              💡 {sizeInfo.formation_opportunities[0].action}
                            </div>
                          )}

                          {/* Sugerencias de transferencia */}
                          {sizeInfo.suggestions && sizeInfo.suggestions.length > 0 && !sizeInfo.can_sell && (
                            <div className="text-xs text-primary bg-primary/10 p-2 rounded">
                              📦 {sizeInfo.suggestions[0].action}
                            </div>
                          )}

                          {sizeInfo.box_price > 0 && sizeInfo.box_price !== sizeInfo.unit_price && (
                            <div className="text-xs text-muted-foreground">
                              Precio caja: {formatCurrency(sizeInfo.box_price)}
                            </div>
                          )}
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No hay información de tallas disponible para este producto</p>
                </div>
              )}

              {/* Selected Size Details */}
              {selectedSize && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  {(() => {
                    // Extraer talla y ubicación de la clave única
                    const size = extractSizeFromKey(selectedSize);
                    const location = extractLocationFromKey(selectedSize);
                    
                    // Buscar la información exacta de esa talla en esa ubicación
                    const sizeInfo = selectedProduct.sizes.find(
                      s => s.size === size && (s.location_name || s.location) === location
                    );
                    if (!sizeInfo) return null;
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <h6 className="font-medium text-primary mb-3 flex items-center gap-2">
                            Talla {size} Seleccionada
                            {sizeInfo.can_sell && <CheckCircle className="h-5 w-5 text-success" />}
                            {!sizeInfo.can_sell && sizeInfo.can_form_pair && <AlertCircle className="h-5 w-5 text-warning" />}
                          </h6>
                          
                          {/* Inventario detallado */}
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
                              <span className="text-muted-foreground">Ubicación:</span>
                              <p className="font-medium text-foreground">{sizeInfo.location}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Estado:</span>
                              <p className={`font-medium ${sizeInfo.can_sell ? 'text-success' : 'text-warning'}`}>
                                {sizeInfo.can_sell ? '✅ Disponible venta' : sizeInfo.can_form_pair ? '⚠️ Puede formar pares' : '❌ Requiere transferencia'}
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

                        {/* Oportunidades de formación de pares */}
                        {sizeInfo.formation_opportunities && sizeInfo.formation_opportunities.length > 0 && (
                          <div className="border-t border-primary/20 pt-3">
                            <div className="text-sm font-semibold text-foreground mb-2">💡 Oportunidades de Formación</div>
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

                        {/* Sugerencias de transferencia */}
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
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                {selectedSize && (selectedProduct.product.availability.can_sell || selectedProduct.product.inventory.total_stock > 0) ? (
                  <Button
                    onClick={handleSolicitar}
                    className="w-full"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Solicitar
                  </Button>
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
                    <p className="text-muted-foreground mb-4">
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