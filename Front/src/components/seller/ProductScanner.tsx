import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
  ArrowLeft
} from 'lucide-react';

interface ProductOption {
  id: string;
  brand: string;
  model: string;
  code: string;
  description: string;
  confidence: number;
  image?: string;
}

interface SizeInfo {
  size: string;
  location: string;
  storage_type: 'warehouse' | 'display';
  quantity: number;
  unit_price: number;
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
}

export const ProductScanner: React.FC<ProductScannerProps> = ({
  onSellProduct,
  onRequestTransfer
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanOptions, setScanOptions] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProductDetails | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'options' | 'details'>('upload');

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

  const handleScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setError(null);

    try {
      // Simular delay de procesamiento de IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Usar datos mock directamente (sin llamada al backend)
      const mockOptions: ProductOption[] = [
        {
          id: '1',
          brand: 'Nike',
          model: 'Air Max 90',
          code: 'NK-AM90-001',
          description: 'Zapatillas deportivas clásicas con amortiguación Air',
          confidence: 95,
          image: 'https://images.pexels.com/photos/2385477/pexels-photo-2385477.jpeg?auto=compress&cs=tinysrgb&w=300'
        },
        {
          id: '2',
          brand: 'Nike',
          model: 'Air Force 1',
          code: 'NK-AF1-002',
          description: 'Icónicas zapatillas urbanas de cuero',
          confidence: 87,
          image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=300'
        },
        {
          id: '3',
          brand: 'Adidas',
          model: 'Stan Smith',
          code: 'AD-SS-003',
          description: 'Zapatillas minimalistas de tenis clásicas',
          confidence: 82,
          image: 'https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=300'
        },
        {
          id: '4',
          brand: 'Puma',
          model: 'Suede Classic',
          code: 'PM-SC-004',
          description: 'Zapatillas retro de gamuza',
          confidence: 78,
          image: 'https://images.pexels.com/photos/2421374/pexels-photo-2421374.jpeg?auto=compress&cs=tinysrgb&w=300'
        }
      ];

      setScanOptions(mockOptions);
      setCurrentStep('options');
    } catch (err) {
      setError('Error al procesar la imagen. Inténtalo de nuevo.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleProductSelect = async (product: ProductOption) => {
    try {
      // Simular delay de carga de detalles
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generar datos mock específicos para cada producto
      const mockSizes: SizeInfo[] = [
        {
          size: '7',
          location: 'Local Centro',
          storage_type: 'warehouse',
          quantity: Math.floor(Math.random() * 5) + 1,
          unit_price: 180000 + (Math.random() * 40000)
        },
        {
          size: '7.5',
          location: 'Local Centro',
          storage_type: 'display',
          quantity: Math.floor(Math.random() * 3),
          unit_price: 180000 + (Math.random() * 40000)
        },
        {
          size: '8',
          location: 'Local Norte',
          storage_type: 'warehouse',
          quantity: Math.floor(Math.random() * 6) + 1,
          unit_price: 180000 + (Math.random() * 40000)
        },
        {
          size: '8.5',
          location: 'Local Centro',
          storage_type: 'warehouse',
          quantity: Math.floor(Math.random() * 4),
          unit_price: 180000 + (Math.random() * 40000)
        },
        {
          size: '9',
          location: 'Local Sur',
          storage_type: 'display',
          quantity: Math.floor(Math.random() * 3),
          unit_price: 180000 + (Math.random() * 40000)
        },
        {
          size: '9.5',
          location: 'Local Norte',
          storage_type: 'warehouse',
          quantity: Math.floor(Math.random() * 5) + 1,
          unit_price: 180000 + (Math.random() * 40000)
        },
        {
          size: '10',
          location: 'Local Centro',
          storage_type: 'warehouse',
          quantity: Math.floor(Math.random() * 2),
          unit_price: 180000 + (Math.random() * 40000)
        },
        {
          size: '10.5',
          location: 'Local Sur',
          storage_type: 'display',
          quantity: Math.floor(Math.random() * 2),
          unit_price: 180000 + (Math.random() * 40000)
        }
      ];

      setSelectedProduct({
        product,
        sizes: mockSizes
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
    // Por el momento no hace nada, como solicitaste
    console.log('Botón Solicitar presionado - funcionalidad pendiente');
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanOptions([]);
    setSelectedProduct(null);
    setSelectedSize('');
    setError(null);
    setCurrentStep('upload');
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

  return (
    <div className="space-y-6">
      {/* Development Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Camera className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">Modo de Desarrollo - Escáner IA</p>
              <p className="text-sm text-blue-700">
                Simulando reconocimiento de productos con datos de prueba
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <Camera className="h-6 w-6 mr-2" />
              Escanear Producto
            </h2>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <div className="flex justify-center space-x-4">
                    <Button onClick={handleScan} disabled={isScanning}>
                      {isScanning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analizando con IA...
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
                    <p className="text-lg font-medium">Sube una imagen del tenis</p>
                    <p className="text-gray-500">Arrastra y suelta o haz clic para seleccionar</p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="max-w-xs mx-auto"
                  />
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
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg truncate">
                          {option.brand} {option.model}
                        </h4>
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          {option.confidence}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Código: {option.code}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{option.description}</p>
                      <div className="mt-3 flex items-center text-primary">
                        <span className="text-sm font-medium">Seleccionar</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
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
                  {selectedProduct.product.brand} {selectedProduct.product.model}
                </h4>
                <p className="text-gray-600 mb-1">Código: {selectedProduct.product.code}</p>
                <p className="text-sm text-gray-500">{selectedProduct.product.description}</p>
              </div>

              {/* Size Selection */}
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
                      </div>
                    </button>
                  ))}
                </div>
              </div>

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
                            <span className="text-gray-600">Precio:</span>
                            <p className="font-bold text-lg text-primary">{formatCurrency(sizeInfo.unit_price)}</p>
                          </div>
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
                ) : (
                  <>
                    <Button
                      onClick={handleSolicitar}
                      variant="secondary"
                      className="flex-1"
                      disabled={!selectedSize}
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
            <p className="text-error">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};