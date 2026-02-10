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
    source_location_id: number;
    destination_location_id: number;
    // Información específica de pies separados
    pairs?: number;
    left_feet?: number;
    right_feet?: number;
    can_sell?: boolean;
    can_form_pair?: boolean;
    missing_foot?: 'left' | 'right' | null;
    location_name?: string;
    transfer_type?: 'pair' | 'left_foot' | 'right_foot' | 'form_pair';
    request_notes?: string;
    // Opciones disponibles para solicitar
    available_options?: {
      pairs_available?: boolean;
      left_feet_available?: boolean;
      right_feet_available?: boolean;
      pairs_quantity?: number;
      left_feet_quantity?: number;
      right_feet_quantity?: number;
    };
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
    // La nueva estructura tiene results.matches con TODOS los matches
    if (!scanResponse || !scanResponse.success || !scanResponse.results?.matches?.length) return [];
    
    const allMatches = scanResponse.results.matches;
    const options: ProductOption[] = [];
    
    // Procesar CADA match
    allMatches.forEach((match: any, index: number) => {
      const product = match.product || {};
      const sizes = match.sizes || {};
      const classification = match.classification || {};
      
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
      
      // Adaptar availability con datos del global_summary
      const availability: AvailabilityInfo = {
        in_stock: match.global_summary?.inventory_local?.pairs_available > 0,
        can_sell: match.global_summary?.inventory_local?.can_sell_immediately || false,
        can_request_from_other_locations: match.global_summary?.total_opportunities > 0 || match.global_summary?.total_suggestions > 0,
        recommended_action: match.global_summary?.inventory_local?.can_sell_immediately 
          ? 'Puede vender ahora' 
          : 'Requiere transferencia o formación de pares'
      };
      
      // Obtener confianza real desde el match
      const confidencePercentage = match.confidence_percentage || 0;
      const similarityScore = match.similarity_score || 0;
      
      // Mapear confidence_level de la API
      const mapConfidenceLevel = (level: string): 'very_high' | 'high' | 'medium' | 'low' => {
        switch(level.toLowerCase()) {
          case 'very_high': return 'very_high';
          case 'high': return 'high';
          case 'medium': return 'medium';
          case 'low': return 'low';
          default: return confidencePercentage >= 90 ? 'very_high' : confidencePercentage >= 70 ? 'high' : 'medium';
        }
      };
      
      // Crear el objeto ProductOption con la estructura nueva
      const productOption = {
        id: `${product.reference_code}-${index}` || `product-${index}`,
        brand: product.brand || classification.brand_detected || '',
        model: product.model || classification.model_detected || '',
        code: product.reference_code || '',
        description: product.description || `${product.brand} ${product.model}`,
        color: '', // No viene en la nueva estructura
        image: product.image_url || undefined,
        confidence: confidencePercentage,
        rank: match.rank || index + 1,
        similarity_score: similarityScore,
        confidence_level: mapConfidenceLevel(match.confidence_level),
        original_db_id: product.product_id || 0,
        inventory,
        availability,
      };
      
      // Preservar la estructura completa de sizes para que convertAvailabilityToSizes pueda acceder a ella
      (productOption as any).sizesData = sizes;
      (productOption as any).globalSummary = match.global_summary;
      (productOption as any).distributionMatrix = match.distribution_matrix;
      (productOption as any).matchRank = match.rank;
      (productOption as any).classification = classification;
      
      options.push(productOption);
    });
    
    return options; // Retornar TODOS los matches
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
        classification_service: scanResponse.classification_service,
        total_matches: scanResponse.results?.total_matches || 0
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

      // Determinar las opciones disponibles en la ubicación de origen
      const availableOptions = {
        pairs_available: (sizeInfo.pairs || 0) > 0,
        left_feet_available: (sizeInfo.left_feet || 0) > 0,
        right_feet_available: (sizeInfo.right_feet || 0) > 0,
        pairs_quantity: sizeInfo.pairs || 0,
        left_feet_quantity: sizeInfo.left_feet || 0,
        right_feet_quantity: sizeInfo.right_feet || 0
      };

      // Determinar el tipo de transferencia por defecto basado en el estado del inventario
      let transferType: 'pair' | 'left_foot' | 'right_foot' | 'form_pair' = 'pair';
      let requestNotes = '';
      
      if (sizeInfo.can_sell && (sizeInfo.pairs || 0) > 0) {
        // Hay pares completos disponibles
        transferType = 'pair';
        requestNotes = `Solicitar ${sizeInfo.pairs} par(es) completo(s) desde ${sizeInfo.location_name}`;
      } else if (sizeInfo.can_form_pair && (sizeInfo.left_feet || 0) > 0 && (sizeInfo.right_feet || 0) > 0) {
        // Se pueden formar pares juntando pies separados
        transferType = 'form_pair';
        requestNotes = `Formar pares: ${Math.min(sizeInfo.left_feet || 0, sizeInfo.right_feet || 0)} par(es) desde ${sizeInfo.location_name}`;
      } else if (sizeInfo.missing_foot === 'right' && (sizeInfo.left_feet || 0) > 0) {
        // Falta pie derecho, solicitar pie derecho
        transferType = 'right_foot';
        requestNotes = `Solicitar pie derecho para completar par con ${sizeInfo.left_feet} pie(s) izquierdo(s) en ${sizeInfo.location_name}`;
      } else if (sizeInfo.missing_foot === 'left' && (sizeInfo.right_feet || 0) > 0) {
        // Falta pie izquierdo, solicitar pie izquierdo
        transferType = 'left_foot';
        requestNotes = `Solicitar pie izquierdo para completar par con ${sizeInfo.right_feet} pie(s) derecho(s) en ${sizeInfo.location_name}`;
      } else {
        // Caso por defecto: solicitar par completo
        transferType = 'pair';
        requestNotes = `Solicitar par completo desde ${sizeInfo.location_name}`;
      }

      const transferData = {
        sneaker_reference_code: selectedProduct.product.code,
        brand: selectedProduct.product.brand,
        model: selectedProduct.product.model,
        color: selectedProduct.product.color,
        size: size,
        product: selectedProduct.product,
        source_location_id: sourceLocationId,
        destination_location_id: user.location_id || 0,
        // Información específica de pies separados
        pairs: sizeInfo.pairs,
        left_feet: sizeInfo.left_feet,
        right_feet: sizeInfo.right_feet,
        can_sell: sizeInfo.can_sell,
        can_form_pair: sizeInfo.can_form_pair,
        missing_foot: sizeInfo.missing_foot,
        location_name: sizeInfo.location_name,
        transfer_type: transferType,
        request_notes: requestNotes,
        // Opciones disponibles para solicitar
        available_options: availableOptions
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

  const getConfidenceCircleStyles = (level: string) => {
    switch (level) {
      case 'very_high':
        return 'border-lime-500 text-lime-600';
      case 'high':
        return 'border-green-500 text-green-600';
      case 'medium':
        return 'border-yellow-500 text-yellow-600';
      case 'low':
        return 'border-red-500 text-red-600';
      default:
        return 'border-gray-400 text-gray-600';
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

      {/* Scan Info */}
      {scanInfo && (
        <Card className="border-primary/30 bg-primary/10">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary">
                    Procesado en {scanInfo.processing_time.toFixed(0)}ms
                  </p>
                </div>
                <div className="text-xs text-primary">
                  {new Date(scanInfo.scan_timestamp).toLocaleString()}
                </div>
              </div>
              
              {scanInfo.availability_summary && (
                <div className="grid grid-cols-2 gap-4 text-xs text-primary bg-primary/20 p-2 rounded">
                  <div>Productos clasificados: {scanInfo.availability_summary.products_classified_only}</div>
                  <div>Venta inmediata: {scanInfo.availability_summary.can_sell_immediately ? 'Sí' : 'No'}</div>
                  <div>Disponibles localmente: {scanInfo.availability_summary.products_available_locally}</div>
                  <div>Requieren transferencia: {scanInfo.availability_summary.products_requiring_transfer}</div>
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
                  className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                    option.inventory.total_stock > 0 ? 'hover:border-primary' : 'border-red-400'
                  }`}
                  onClick={() => handleProductSelect(option)}
                >
                  {/* Photo | Info */}
                  <div className="flex gap-3 sm:gap-4">
                    {/* Left: Photo */}
                    <ProductImageComponent
                      image={option.image}
                      alt={`${option.brand} ${option.model}`}
                      className="w-28 sm:w-36 h-auto self-stretch object-cover rounded-lg flex-shrink-0 border border-border shadow"
                    />
                    {/* Right: Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      {/* Mobile: stacked layout */}
                      <div className="sm:hidden flex flex-col gap-1.5">
                        {/* Name */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded shrink-0">#{option.rank}</span>
                          <h4 className="font-semibold text-sm text-foreground truncate">{option.description || `${option.brand} ${option.model}`}</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{option.brand} • {option.model}</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getConfidenceCircleStyles(option.confidence_level)}`}>
                            <span className="text-[9px] font-bold">{option.confidence?.toFixed(0)}%</span>
                          </div>
                          <span className={`text-[10px] font-semibold ${getConfidenceCircleStyles(option.confidence_level).split(' ')[1]}`}>{getConfidenceLevelText(option.confidence_level)}</span>
                        </div>
                        {option.inventory.available_sizes && option.inventory.available_sizes.length > 0 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto">
                            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">Tallas:</span>
                            <div className="flex gap-1 flex-nowrap">
                              {option.inventory.available_sizes.slice(0, 6).map((size) => (
                                <span key={size} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 shrink-0">
                                  {size}
                                </span>
                              ))}
                              {option.inventory.available_sizes.length > 6 && (
                                <span className="text-[10px] text-muted-foreground self-center shrink-0">+{option.inventory.available_sizes.length - 6}</span>
                              )}
                            </div>
                          </div>
                        )}
                        <span className="text-primary font-bold text-sm">{formatCurrency(option.inventory.pricing.unit_price)}</span>
                      </div>

                      {/* Desktop: optimized layout */}
                      <div className="hidden sm:flex sm:flex-col sm:gap-2 sm:h-full">
                        {/* Row 1: Name + Confidence */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded shrink-0">#{option.rank}</span>
                              <h4 className="font-semibold text-base text-foreground truncate">{option.description || `${option.brand} ${option.model}`}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{option.brand} • {option.model}</p>
                          </div>
                          <div className="flex flex-col items-center shrink-0">
                            <div className={`w-11 h-11 rounded-full border-[3px] flex items-center justify-center ${getConfidenceCircleStyles(option.confidence_level)}`}>
                              <span className="text-[11px] font-bold">{option.confidence?.toFixed(0)}%</span>
                            </div>
                            <span className={`text-[10px] font-semibold mt-0.5 ${getConfidenceCircleStyles(option.confidence_level).split(' ')[1]}`}>{getConfidenceLevelText(option.confidence_level)}</span>
                          </div>
                        </div>
                        {/* Row 2: Stock + Price */}
                        <div className="flex items-center justify-between">
                          <span className="text-primary font-bold text-base">{formatCurrency(option.inventory.pricing.unit_price)}</span>
                        </div>
                        {/* Row 3: Tallas */}
                        {option.inventory.available_sizes && option.inventory.available_sizes.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground shrink-0">Tallas:</span>
                            <div className="flex gap-1 flex-wrap">
                              {option.inventory.available_sizes.slice(0, 8).map((size) => (
                                <span key={size} className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                  {size}
                                </span>
                              ))}
                              {option.inventory.available_sizes.length > 8 && (
                                <span className="text-xs text-muted-foreground self-center">+{option.inventory.available_sizes.length - 8}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Acción */}
                  <div className="mt-3">
                    <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all">
                      Seleccionar <ArrowRight className="h-4 w-4" />
                    </span>
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
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-xl mb-2 text-foreground">
                      {selectedProduct.product.description || `${selectedProduct.product.brand} ${selectedProduct.product.model}`}
                    </h4>
                    <p className="text-muted-foreground mb-1">
                      Modelo: {selectedProduct.product.model}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">Marca: {selectedProduct.product.brand}</p>
                  </div>
                  <div className="flex flex-col items-center ml-6">
                    <div className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center ${getConfidenceCircleStyles(selectedProduct.product.confidence_level)}`}>
                      <span className="text-sm font-bold">{selectedProduct.product.confidence?.toFixed(0)}%</span>
                    </div>
                    <span className={`text-[10px] font-semibold mt-1 ${getConfidenceCircleStyles(selectedProduct.product.confidence_level).split(' ')[1]}`}>{getConfidenceLevelText(selectedProduct.product.confidence_level)}</span>
                  </div>
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
                              : sizeInfo.location_id === user?.location_id 
                                ? (sizeInfo.can_sell
                                  ? 'border-success bg-success/5 hover:border-success/50 hover:shadow-sm'
                                  : sizeInfo.can_form_pair
                                  ? 'border-warning bg-warning/5 hover:border-warning/50 hover:shadow-sm'
                                  : 'border-muted bg-muted/5 hover:border-muted/50 hover:shadow-sm')
                                : 'border-primary bg-primary/5 hover:border-primary/50 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-lg text-foreground">Talla {sizeInfo.size}</span>
                            <div className="flex items-center gap-1">
                              {sizeInfo.location_id === user?.location_id ? (
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
                              {(() => {
                                // Determinar si es el local del vendedor o una ubicación externa
                                // Comparar con la ubicación del usuario actual
                                const isLocalVendor = sizeInfo.location_id === user?.location_id;
                                
                                if (isLocalVendor) {
                                  // En el local del vendedor - mostrar estado real
                                  if (sizeInfo.can_sell) {
                                    return (
                                      <span className="text-success font-medium flex items-center gap-1">
                                        <CheckCircle className="h-4 w-4" />
                                        Disponible venta
                                      </span>
                                    );
                                  } else if (sizeInfo.can_form_pair) {
                                    return (
                                      <span className="text-warning font-medium flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        Formar pares
                                      </span>
                                    );
                                  } else if (sizeInfo.missing_foot) {
                                    return (
                                      <span className="text-muted-foreground font-medium flex items-center gap-1">
                                        <XCircle className="h-4 w-4" />
                                        Falta pie {sizeInfo.missing_foot === 'left' ? 'izq' : 'der'}
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="text-muted font-medium">
                                        Sin stock local
                                      </span>
                                    );
                                  }
                                } else {
                                  // En otras ubicaciones - siempre requiere transferencia
                                  return (
                                    <span className="text-primary font-medium flex items-center gap-1">
                                      <Package className="h-4 w-4" />
                                      Requiere transferencia
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                            <span className="font-bold text-primary">
                              {formatCurrency(sizeInfo.unit_price)}
                            </span>
                          </div>

                          {/* Oportunidades de formación - solo para local del vendedor */}
                          {sizeInfo.formation_opportunities && sizeInfo.formation_opportunities.length > 0 && sizeInfo.location_id === user?.location_id && (
                            <div className="text-xs text-warning bg-warning/10 p-2 rounded">
                              💡 {sizeInfo.formation_opportunities[0].action}
                            </div>
                          )}

                          {/* Sugerencias de transferencia - solo para ubicaciones externas */}
                          {sizeInfo.suggestions && sizeInfo.suggestions.length > 0 && sizeInfo.location_id !== user?.location_id && (
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
                              <p className={`font-medium ${sizeInfo.location_id === user?.location_id ? 
                                (sizeInfo.can_sell ? 'text-success' : sizeInfo.can_form_pair ? 'text-warning' : 'text-muted') 
                                : 'text-primary'}`}>
                                {sizeInfo.location_id === user?.location_id ? 
                                  (sizeInfo.can_sell ? '✅ Disponible venta' : 
                                   sizeInfo.can_form_pair ? '⚠️ Puede formar pares' : 
                                   '❌ Sin stock local') : 
                                  '📦 Requiere transferencia'}
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