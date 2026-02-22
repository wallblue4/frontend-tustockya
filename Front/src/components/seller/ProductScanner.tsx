import React, { useState, useEffect } from 'react';
import { vendorAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ErrorCard } from './product-scanner/ErrorCard';
import {
  extractLocationFromKey,
  extractSizeFromKey,
} from './product-scanner/helpers';
import { NoResultsCard } from './product-scanner/NoResultsCard';
import { ProcessingCard } from './product-scanner/ProcessingCard';
import { ProductDetailsCard } from './product-scanner/ProductDetailsCard';
import { ProductOptionsCard } from './product-scanner/ProductOptionsCard';
import { SearchBar } from './product-scanner/SearchBar';
import { ScanInfoCard } from './product-scanner/ScanInfoCard';
import { AvailabilityInfo, InventoryInfo, ProductOption, SelectedProductDetails, SizeInfo } from './product-scanner/types';

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
    pickup_type?: 'vendedor' | 'corredor';
    // Transferencia dual: pies en ubicaciones diferentes
    dual_transfer?: {
      left_foot_source: {
        source_location_id: number;
        location_name: string;
      };
      right_foot_source: {
        source_location_id: number;
        location_name: string;
      };
    };
    // Opciones disponibles para solicitar
    available_options?: {
      pairs_available?: boolean;
      left_feet_available?: boolean;
      right_feet_available?: boolean;
      pairs_quantity?: number;
      left_feet_quantity?: number;
      right_feet_quantity?: number;
    };
    // Inventario local del destino
    local_left_feet?: number;
    local_right_feet?: number;
    local_pairs?: number;
  }) => void;
  onStepTitleChange?: (title: string) => void;
  onSellProduct?: (productData: {
    code: string;
    brand: string;
    model: string;
    size: string;
    price: number;
    location: string;
    storage_type: string;
    color?: string;
    image?: string;
  }) => void;
  capturedImage?: File | null;
  scanResult?: any;
  searchMode?: boolean;
}

export const ProductScanner: React.FC<ProductScannerProps> = ({
  onRequestTransfer,
  onStepTitleChange,
  onSellProduct,
  capturedImage,
  searchMode
}) => {
  const { user } = useAuth();

  const [isScanning, setIsScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [scanOptions, setScanOptions] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProductDetails | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(''); // Ahora guardará "talla-ubicacion" como clave única
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'processing' | 'options' | 'details'>('processing');
  const [scanInfo, setScanInfo] = useState<any>(null);
  const [sizesMap, setSizesMap] = useState<Map<string, SizeInfo[]>>(new Map());

  // Effect para procesar imagen automáticamente cuando llega desde la cámara
  useEffect(() => {
    if (capturedImage) {
      console.log('Imagen recibida desde cámara, procesando...', capturedImage.name);
      handleScanFromCamera(capturedImage);
    }
  }, [capturedImage]);

  // En searchMode, ir directo a la vista de opciones (con barra de búsqueda)
  useEffect(() => {
    if (searchMode && !capturedImage) {
      setCurrentStep('options');
    }
  }, [searchMode, capturedImage]);

  useEffect(() => {
    if (!onStepTitleChange) return;

    if (currentStep === 'processing') {
      onStepTitleChange('Analizando imagen');
      return;
    }

    if (currentStep === 'options') {
      if (isScanning) {
        onStepTitleChange('Analizando imagen');
      } else if (scanOptions.length > 0) {
        onStepTitleChange('Selecciona el producto');
      } else {
        onStepTitleChange('Sin resultados de escaneo');
      }
      return;
    }

    if (currentStep === 'details') {
      onStepTitleChange('Detalles del Producto');
    }
  }, [currentStep, isScanning, scanOptions.length, onStepTitleChange]);

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
              is_local: true,
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
                  is_local: false,
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
      const mapConfidenceLevel = (level?: string): 'very_high' | 'high' | 'medium' | 'low' => {
        if (!level) return confidencePercentage >= 90 ? 'very_high' : confidencePercentage >= 70 ? 'high' : confidencePercentage >= 50 ? 'medium' : 'low';
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

      // Pre-computar sizesMap para todas las opciones
      const map = new Map<string, SizeInfo[]>();
      options.forEach(opt => map.set(opt.id, convertAvailabilityToSizes(opt)));
      setSizesMap(map);

      setCurrentStep('options');
    } catch (err) {
      console.error('Error al procesar la imagen:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al procesar la imagen');
      setCurrentStep('options');
    } finally {
      setIsScanning(false);
    }
  };

  // Búsqueda por texto (marca/modelo)
  const handleTextSearch = React.useCallback(async (brand: string, model: string) => {
    setIsSearching(true);
    setError(null);
    setScanOptions([]);
    setSizesMap(new Map());
    setScanInfo(null);

    try {
      console.log('Buscando productos por texto:', { brand, model });
      const searchResponse: any = await vendorAPI.searchProducts(brand, model);
      console.log('Respuesta de búsqueda:', searchResponse);

      if (!searchResponse.success) {
        throw new Error('La API no pudo procesar la búsqueda');
      }

      // Guardar información del resultado
      if (searchResponse.scan_timestamp || searchResponse.processing_time_ms) {
        setScanInfo({
          scan_timestamp: searchResponse.scan_timestamp,
          scanned_by: searchResponse.scanned_by,
          user_location: searchResponse.user_location,
          processing_time: searchResponse.processing_time_ms,
          availability_summary: searchResponse.availability_summary,
          classification_service: searchResponse.classification_service,
          total_matches: searchResponse.results?.total_matches || 0
        });
      }

      // Convertir la respuesta usando la misma lógica que el escaneo
      let options = convertScanResponseToProductOptions(searchResponse);
      options = options.map(opt => ({
        ...opt,
        image: opt.image === null ? undefined : opt.image
      }));
      console.log('Opciones de búsqueda procesadas:', options.length);
      setScanOptions(options);

      // Pre-computar sizesMap
      const map = new Map<string, SizeInfo[]>();
      options.forEach(opt => map.set(opt.id, convertAvailabilityToSizes(opt)));
      setSizesMap(map);

      setCurrentStep('options');
    } catch (err) {
      console.error('Error en búsqueda por texto:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al buscar productos');
      setCurrentStep('options');
    } finally {
      setIsSearching(false);
    }
  }, []);

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

  const handleSell = () => {
    if (selectedProduct && selectedSize && onSellProduct) {
      const size = extractSizeFromKey(selectedSize);
      const location = extractLocationFromKey(selectedSize);

      const sizeInfo = selectedProduct.sizes.find(
        s => s.size === size && (s.location_name || s.location) === location
      );

      if (!sizeInfo) {
        console.error('No se encontró información de la talla seleccionada para venta');
        return;
      }

      onSellProduct({
        code: selectedProduct.product.code,
        brand: selectedProduct.product.brand,
        model: selectedProduct.product.model,
        size: size,
        price: sizeInfo.unit_price,
        location: sizeInfo.location_name || sizeInfo.location,
        storage_type: sizeInfo.storage_type,
        color: selectedProduct.product.color,
        image: selectedProduct.product.image,
      });
    }
  };

  const handleDirectAction = (product: ProductOption, selectedSizeStr: string, pickupType: 'vendedor' | 'corredor') => {
    setError(null);
    const sizes = sizesMap.get(product.id) || [];
    const matchingSizes = sizes.filter(s => s.size === selectedSizeStr);

    if (matchingSizes.length === 0) {
      setError('No se encontró información para la talla seleccionada');
      return;
    }

    // Buscar si hay alguna entrada local con can_sell
    const localSellable = matchingSizes.find(s => s.can_sell === true);

    if (localSellable && onSellProduct) {
      // Si es local y can_sell=true -> siempre ir a Nueva Venta (sin importar botón)
      onSellProduct({
        code: product.code,
        brand: product.brand,
        model: product.model,
        size: selectedSizeStr,
        price: localSellable.unit_price,
        location: localSellable.location_name || localSellable.location,
        storage_type: localSellable.storage_type,
        color: product.color,
        image: product.image,
      });
      return;
    }

    // Si no es vendible localmente -> ir a transferencia
    if (!onRequestTransfer || !user) return;

    // Separar entry local (destino) de entries remotos (posibles orígenes)
    const localEntry = matchingSizes.find(s => s.is_local);
    const remoteEntries = matchingSizes.filter(s => !s.is_local);

    if (remoteEntries.length === 0) {
      setError('No hay stock disponible en otras ubicaciones');
      return;
    }

    // Determinar transfer_type basado en inventario LOCAL
    let transferType: 'pair' | 'left_foot' | 'right_foot' | 'form_pair' = 'pair';
    let requestNotes = '';

    if (localEntry) {
      // Hay inventario local parcial → transferir la pieza faltante
      if (localEntry.missing_foot === 'right' && (localEntry.left_feet || 0) > 0) {
        transferType = 'right_foot';
        requestNotes = `Completar par: tiene pie izquierdo, necesita pie derecho`;
      } else if (localEntry.missing_foot === 'left' && (localEntry.right_feet || 0) > 0) {
        transferType = 'left_foot';
        requestNotes = `Completar par: tiene pie derecho, necesita pie izquierdo`;
      } else {
        transferType = 'pair';
        requestNotes = `Solicitar par completo`;
      }
    } else {
      // Sin stock local: verificar si necesitamos transferencia dual
      const canSingleRemoteSatisfy = remoteEntries.some(
        e => (e.pairs || 0) > 0 || ((e.left_feet || 0) > 0 && (e.right_feet || 0) > 0)
      );

      if (!canSingleRemoteSatisfy) {
        // Ningún remoto puede satisfacer solo → buscar pies en ubicaciones distintas
        const remoteWithLeft = remoteEntries.find(
          e => (e.left_feet || 0) > 0 && (e.right_feet || 0) === 0 && (e.pairs || 0) === 0
        );
        const remoteWithRight = remoteEntries.find(
          e => (e.right_feet || 0) > 0 && (e.left_feet || 0) === 0 && (e.pairs || 0) === 0
        );

        if (remoteWithLeft && remoteWithRight) {
          const leftSourceId = remoteWithLeft.location_id || remoteWithLeft.location_number;
          const rightSourceId = remoteWithRight.location_id || remoteWithRight.location_number;

          if (leftSourceId && rightSourceId) {
            onRequestTransfer({
              sneaker_reference_code: product.code,
              brand: product.brand,
              model: product.model,
              color: product.color,
              size: selectedSizeStr,
              product: product,
              source_location_id: leftSourceId, // Principal para compatibilidad
              destination_location_id: user.location_id || 0,
              pairs: 0,
              left_feet: remoteWithLeft.left_feet,
              right_feet: remoteWithRight.right_feet,
              can_sell: false,
              can_form_pair: false,
              missing_foot: null,
              location_name: remoteWithLeft.location_name,
              transfer_type: 'form_pair',
              request_notes: `Transferencia dual: pie izquierdo desde ${remoteWithLeft.location_name}, pie derecho desde ${remoteWithRight.location_name}`,
              pickup_type: pickupType,
              available_options: {
                pairs_available: false,
                left_feet_available: true,
                right_feet_available: true,
                pairs_quantity: 0,
                left_feet_quantity: remoteWithLeft.left_feet || 0,
                right_feet_quantity: remoteWithRight.right_feet || 0,
              },
              local_left_feet: 0,
              local_right_feet: 0,
              local_pairs: 0,
              dual_transfer: {
                left_foot_source: {
                  source_location_id: leftSourceId,
                  location_name: remoteWithLeft.location_name || '',
                },
                right_foot_source: {
                  source_location_id: rightSourceId,
                  location_name: remoteWithRight.location_name || '',
                },
              },
            });
            return;
          }
        }
      }

      // Selección inteligente de fuente y tipo
      const sourceWithPairs = remoteEntries.find(e => (e.pairs || 0) > 0);
      const sourceWithBothFeet = remoteEntries.find(
        e => (e.left_feet || 0) > 0 && (e.right_feet || 0) > 0
      );

      if (sourceWithPairs) {
        transferType = 'pair';
        requestNotes = `Solicitar par completo desde ${sourceWithPairs.location_name}`;
      } else if (sourceWithBothFeet) {
        transferType = 'form_pair';
        requestNotes = `Formar par con pies separados desde ${sourceWithBothFeet.location_name}`;
      } else {
        // Pie huérfano: no existe par ni contraparte en ningún lugar
        setError('No hay stock suficiente para completar un par de esta talla en ninguna ubicación');
        return;
      }
    }

    // FUENTE: selección inteligente basada en transferType
    let sourceInfo;
    if (transferType === 'pair') {
      sourceInfo = remoteEntries.find(e => (e.pairs || 0) > 0);
    } else if (transferType === 'form_pair') {
      sourceInfo = remoteEntries.find(e => (e.left_feet || 0) > 0 && (e.right_feet || 0) > 0);
    } else if (transferType === 'right_foot') {
      sourceInfo = remoteEntries.find(e => (e.right_feet || 0) > 0);
    } else if (transferType === 'left_foot') {
      sourceInfo = remoteEntries.find(e => (e.left_feet || 0) > 0);
    } else {
      sourceInfo = remoteEntries[0];
    }

    if (!sourceInfo) {
      setError('No se encontró una ubicación de origen con el stock necesario');
      return;
    }
    const sourceLocationId = sourceInfo.location_id || sourceInfo.location_number;

    if (!sourceLocationId) {
      setError('No se pudo determinar la ubicación de origen');
      return;
    }

    const availableOptions = {
      pairs_available: (sourceInfo.pairs || 0) > 0,
      left_feet_available: (sourceInfo.left_feet || 0) > 0,
      right_feet_available: (sourceInfo.right_feet || 0) > 0,
      pairs_quantity: sourceInfo.pairs || 0,
      left_feet_quantity: sourceInfo.left_feet || 0,
      right_feet_quantity: sourceInfo.right_feet || 0
    };

    onRequestTransfer({
      sneaker_reference_code: product.code,
      brand: product.brand,
      model: product.model,
      color: product.color,
      size: selectedSizeStr,
      product: product,
      source_location_id: sourceLocationId,
      destination_location_id: user.location_id || 0,
      // Inventario del ORIGEN
      pairs: sourceInfo.pairs,
      left_feet: sourceInfo.left_feet,
      right_feet: sourceInfo.right_feet,
      can_sell: sourceInfo.can_sell,
      can_form_pair: sourceInfo.can_form_pair,
      missing_foot: localEntry?.missing_foot || null,
      location_name: sourceInfo.location_name,
      transfer_type: transferType,
      request_notes: requestNotes,
      pickup_type: pickupType,
      available_options: availableOptions,
      // Inventario local del destino
      local_left_feet: localEntry?.left_feet || 0,
      local_right_feet: localEntry?.right_feet || 0,
      local_pairs: localEntry?.pairs || 0,
    });
  };

  const goBackToOptions = () => {
    setSelectedProduct(null);
    setSelectedSize('');
    setCurrentStep('options');
  };

  const showSearchBar = currentStep === 'options' || (searchMode && currentStep !== 'details');

  return (
    <div className="space-y-6">

      {currentStep === 'processing' && !searchMode && <ProcessingCard />}

      {/* SearchBar siempre visible en modo opciones / búsqueda — memoizado para no re-renderizar al cambiar resultados */}
      {showSearchBar && (
        <SearchBar onSearch={handleTextSearch} isSearching={isSearching} />
      )}

      {/* Resultados de búsqueda / escaneo */}
      {currentStep === 'options' && scanOptions.length > 0 && (
        <ProductOptionsCard options={scanOptions} sizesMap={sizesMap} onAction={handleDirectAction} error={error} onClearError={() => setError(null)} />
      )}

      {currentStep === 'options' && scanOptions.length === 0 && !isScanning && !isSearching && !searchMode && (
        <NoResultsCard onRetry={() => window.location.reload()} />
      )}

      {currentStep === 'details' && selectedProduct && (
        <ProductDetailsCard
          selectedProduct={selectedProduct}
          selectedSize={selectedSize}
          userLocationId={user?.location_id}
          onBack={goBackToOptions}
          onSelectSize={setSelectedSize}
          onSolicitar={handleSolicitar}
          onSell={handleSell}
          onScanAnother={() => window.location.reload()}
        />
      )}

      {error && <ErrorCard error={error} />}
    </div>
  );
};