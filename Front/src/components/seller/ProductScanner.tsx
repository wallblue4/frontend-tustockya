import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CameraCapture } from '../ui/CameraCapture'; // Nuevo import
import { formatCurrency } from '../../services/api';
import { 
  Camera, 
  Upload, 
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
  XCircle,
  TrendingUp,
  TrendingDown
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

interface ProductMatch {
  rank: number;
  similarity_score: number;
  confidence_percentage: number;
  confidence_level: string;
  reference: {
    code: string;
    brand: string;
    model: string;
    color: string;
    description: string;
    photo: string;
  };
  inventory: InventoryInfo;
  availability: AvailabilityInfo;
  classification_source: string;
  inventory_source: string;
  original_db_id: number;
  image_path: string;
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
  onRequestTransfer?: (product: any) => void;
  authToken?: string; // Token de autorización
  onOpenCamera?: () => void; // Nueva prop para abrir cámara desde el dashboard
}

// Interfaz para la respuesta completa de la API con stock
interface StockAPIResponse {
  success: boolean;
  scan_timestamp: string;
  scanned_by: {
    user_id: number;
    email: string;
    name: string;
    role: string;
    location_id: number;
  };
  user_location: string;
  best_match: ProductMatch;
  alternative_matches: ProductMatch[];
  total_matches_found: number;
  processing_time_ms: number;
  image_info: {
    filename: string;
    size_bytes: number;
    content_type: string;
  };
  classification_service: any;
  inventory_service: any;
}

export const ProductScanner: React.FC<ProductScannerProps> = ({
  onSellProduct,
  onRequestTransfer,
  authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTIwMjM1NDN9.isFUvKkUk3YDcazhGTI1PkW_dn15o7luU0lQT1vC1qg", // Token por defecto
  onOpenCamera
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanOptions, setScanOptions] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProductDetails | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'options' | 'details'>('upload');
  const [scanInfo, setScanInfo] = useState<any>(null);

  // Nuevos estados para la cámara personalizada
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
      setScanOptions([]);
      setSelectedProduct(null);
      setCurrentStep('upload');
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
      setScanOptions([]);
      setSelectedProduct(null);
      setCurrentStep('upload');
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // Nueva función para abrir la cámara personalizada
  const handleOpenCustomCamera = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setScanOptions([]);
    setSelectedProduct(null);
    setCurrentStep('upload');
    setShowCameraCapture(true);
  };

  // Nueva función para manejar la foto capturada de la cámara personalizada
  const handleCameraPhoto = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);
    setScanOptions([]);
    setSelectedProduct(null);
    setCurrentStep('upload');
    setShowCameraCapture(false);
    
    // Auto-escanear después de capturar
    setTimeout(() => {
      handleScanWithFile(file);
    }, 500);
  };

  const convertMatchToProductOption = (match: ProductMatch): ProductOption => {
    return {
      id: match.original_db_id.toString(),
      brand: match.reference.brand,
      model: match.reference.model,
      code: match.reference.code,
      description: match.reference.description,
      confidence: Math.round(match.confidence_percentage),
      image: match.reference.photo,
      rank: match.rank,
      similarity_score: match.similarity_score,
      confidence_level: match.confidence_level,
      original_db_id: match.original_db_id,
      inventory: match.inventory,
      availability: match.availability,
      color: match.reference.color
    };
  };

  // Función separada para escanear con archivo específico
  const handleScanWithFile = async (file?: File) => {
    const fileToScan = file || selectedFile;
    if (!fileToScan) return;

    setIsScanning(true);
    setError(null);

    try {
      // Preparar FormData para la API con stock
      const formData = new FormData();
      formData.append('image', fileToScan);

      // Hacer la llamada a la API con stock
      const response = await fetch('https://tustockya-backend.onrender.com/api/v1/classify/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
      }

      const apiData: StockAPIResponse = await response.json();

      if (!apiData.success) {
        throw new Error('La API no pudo procesar la imagen');
      }

      // Guardar información del escaneo
      setScanInfo({
        scan_timestamp: apiData.scan_timestamp,
        scanned_by: apiData.scanned_by,
        user_location: apiData.user_location,
        processing_time: apiData.processing_time_ms
      });

      // Convertir la respuesta de la API al formato esperado por el componente
      const options: ProductOption[] = [];
      
      // Agregar el mejor match primero
      if (apiData.best_match) {
        options.push(convertMatchToProductOption(apiData.best_match));
      }
      
      // Agregar las alternativas
      if (apiData.alternative_matches) {
        options.push(...apiData.alternative_matches.map(convertMatchToProductOption));
      }

      setScanOptions(options);
      setCurrentStep('options');
    } catch (err) {
      console.error('Error al procesar la imagen:', err);
      setError(
        err instanceof Error 
          ? `Error al procesar la imagen: ${err.message}`
          : 'Error desconocido al procesar la imagen. Inténtalo de nuevo.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Función wrapper para mantener compatibilidad
  const handleScan = () => handleScanWithFile();

  const handleProductSelect = async (product: ProductOption) => {
    try {
      // Convertir los datos de stock reales al formato del componente
      const realSizes: SizeInfo[] = product.inventory.stock_by_size.map((stockInfo) => ({
        size: stockInfo.size,
        location: stockInfo.location,
        storage_type: stockInfo.quantity_stock > 0 ? 'warehouse' : 'display',
        quantity: stockInfo.quantity_stock,
        unit_price: product.inventory.pricing.unit_price,
        box_price: product.inventory.pricing.box_price,
        total_quantity: stockInfo.quantity_stock + stockInfo.quantity_exhibition
      }));

      setSelectedProduct({
        product,
        sizes: realSizes
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
        // Preparar datos en el formato correcto
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
    if (selectedProduct && onRequestTransfer) {
      onRequestTransfer({
        product: selectedProduct.product,
        size: selectedSize
      });
    }
    console.log('Botón Solicitar presionado');
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanOptions([]);
    setSelectedProduct(null);
    setSelectedSize('');
    setError(null);
    setCurrentStep('upload');
    setScanInfo(null);
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
              <p className="text-sm font-medium text-green-800">Escáner IA - Stock en Tiempo Real</p>
              <p className="text-sm text-green-700">
                Conectado a inventario real con datos de stock actualizados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Info */}
      {scanInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      )}

      {/* File Upload Section - ACTUALIZADA */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <Camera className="h-6 w-6 mr-2" />
              Escanear Producto
            </h2>
          </CardHeader>
          <CardContent>
            {/* Botones de captura mejorados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Button 
                onClick={handleOpenCustomCamera}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Camera className="h-8 w-8" />
                <span className="font-medium">Abrir Cámara</span>
                <span className="text-xs opacity-90">Tomar foto nueva</span>
              </Button>
              
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
              >
                <Upload className="h-8 w-8" />
                <span className="font-medium">Galería</span>
                <span className="text-xs text-gray-500">Seleccionar imagen</span>
              </Button>
            </div>

            {/* Input file oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Área de drag & drop tradicional */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    {/* Overlay de loading durante el escaneo */}
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="text-white text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm">Analizando con IA...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <Button 
                      onClick={handleScan} 
                      disabled={isScanning}
                      className="min-w-[120px]"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Escanear
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetScanner}>
                      Cambiar Imagen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">O arrastra una imagen aquí</p>
                    <p className="text-gray-500">También puedes usar las opciones de arriba</p>
                  </div>
                </div>
              )}
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
              <Button variant="ghost" onClick={resetScanner}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Nueva Imagen
              </Button>
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
                    {option.image && (
                      <img
                        src={option.image}
                        alt={`${option.brand} ${option.model}`}
                        className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
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
                        disabled={sizeInfo.quantity === 0}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          selectedSize === sizeInfo.size
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : sizeInfo.quantity > 0
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
                              sizeInfo.quantity > 0 ? 'text-success' : 'text-error'
                            }`}>
                              {sizeInfo.quantity > 0 ? `${sizeInfo.quantity} disponibles` : 'Sin stock'}
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
                 <p>No hay tallas disponibles en stock para este producto</p>
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
                           <p className="font-medium text-success">{sizeInfo.quantity} disponibles</p>
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
               {selectedSize && selectedProduct.sizes.find(s => s.size === selectedSize)?.quantity > 0 ? (
                 <>
                   <Button
                     onClick={handleSell}
                     className="flex-1"
                   >
                     <ShoppingBag className="h-4 w-4 mr-2" />
                     Vender Talla {selectedSize}
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
                     onClick={resetScanner}
                     className="px-6"
                   >
                     Escanear Otro
                   </Button>
                 </>
               ) : (
                 <div className="text-center py-4">
                   <p className="text-gray-500 mb-4">
                     Producto no disponible para venta o transferencia
                   </p>
                   <Button
                     variant="outline"
                     onClick={resetScanner}
                     className="px-6"
                   >
                     Escanear Otro Producto
                   </Button>
                 </div>
               )}
             </div>
           </div>
         </CardContent>
       </Card>
     )}

     {/* Componente de Cámara Personalizada */}
     <CameraCapture
       isOpen={showCameraCapture}
       onClose={() => setShowCameraCapture(false)}
       onCapture={handleCameraPhoto}
       isProcessing={isScanning}
     />

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