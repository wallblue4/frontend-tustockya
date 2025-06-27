import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { vendorAPI, formatCurrency } from '../../services/api';
import { 
  Camera, 
  Upload, 
  Loader2, 
  Package, 
  MapPin,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

interface ScanResult {
  confidence: number;
  product: {
    id: string;
    brand: string;
    model: string;
    code: string;
    description: string;
  };
  localInventory: {
    location: string;
    unitPrice: number;
    boxPrice: number;
    sizes: Array<{
      size: string;
      warehouse: number;
      display: number;
      total: number;
    }>;
  };
  otherLocations: Array<{
    location: string;
    totalStock: number;
  }>;
  alternatives: Array<{
    product: any;
    confidence: number;
  }>;
}

interface ProductScannerProps {
  onSellProduct?: (product: any, size: string) => void;
  onRequestTransfer?: (product: any) => void;
}

export const ProductScanner: React.FC<ProductScannerProps> = ({
  onSellProduct,
  onRequestTransfer
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
      setScanResult(null);
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
      setScanResult(null);
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
      const result = await vendorAPI.scanProduct(selectedFile);
      setScanResult(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al escanear el producto');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSell = () => {
    if (scanResult && selectedSize && onSellProduct) {
      onSellProduct(scanResult.product, selectedSize);
    }
  };

  const handleTransferRequest = () => {
    if (scanResult && onRequestTransfer) {
      onRequestTransfer(scanResult.product);
    }
  };

  const hasLocalStock = scanResult?.localInventory.sizes.some(size => size.total > 0);

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
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
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setScanResult(null);
                    }}
                  >
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

      {/* Error Display */}
      {error && (
        <Card className="border-error">
          <CardContent className="p-4">
            <p className="text-error">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Scan Results */}
      {scanResult && (
        <div className="space-y-6">
          {/* Main Result */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Mejor Coincidencia</h3>
                <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                  {Math.round(scanResult.confidence)}% confianza
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">{scanResult.product.brand} {scanResult.product.model}</h4>
                  <p className="text-gray-600">Código: {scanResult.product.code}</p>
                  <p className="text-sm text-gray-500">{scanResult.product.description}</p>
                </div>

                {/* Local Inventory */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    <h5 className="font-medium">{scanResult.localInventory.location}</h5>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Precio Unitario</p>
                      <p className="font-semibold">{formatCurrency(scanResult.localInventory.unitPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Precio por Caja</p>
                      <p className="font-semibold">{formatCurrency(scanResult.localInventory.boxPrice)}</p>
                    </div>
                  </div>

                  {/* Size Selection */}
                  <div className="space-y-2">
                    <p className="font-medium">Stock por Talla:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {scanResult.localInventory.sizes.map((sizeInfo) => (
                        <button
                          key={sizeInfo.size}
                          onClick={() => setSelectedSize(sizeInfo.size)}
                          disabled={sizeInfo.total === 0}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            selectedSize === sizeInfo.size
                              ? 'border-primary bg-primary/10'
                              : sizeInfo.total > 0
                              ? 'border-gray-200 hover:border-gray-300'
                              : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          <div className="font-medium">Talla {sizeInfo.size}</div>
                          <div className="text-xs text-gray-600">
                            Bodega: {sizeInfo.warehouse} | Exhibición: {sizeInfo.display}
                          </div>
                          <div className={`text-sm font-medium ${
                            sizeInfo.total > 0 ? 'text-success' : 'text-error'
                          }`}>
                            Total: {sizeInfo.total}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  {hasLocalStock ? (
                    <Button
                      onClick={handleSell}
                      disabled={!selectedSize}
                      className="flex-1"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Vender
                    </Button>
                  ) : (
                    <Button
                      onClick={handleTransferRequest}
                      variant="secondary"
                      className="flex-1"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Solicitar Transferencia
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Locations */}
          {scanResult.otherLocations.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Otros Locales con Stock</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scanResult.otherLocations.map((location, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{location.location}</span>
                      <span className="text-success font-semibold">{location.totalStock} disponibles</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alternative Matches */}
          {scanResult.alternatives.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Coincidencias Alternativas</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scanResult.alternatives.map((alt, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{alt.product.brand} {alt.product.model}</p>
                        <p className="text-sm text-gray-600">Código: {alt.product.code}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">{Math.round(alt.confidence)}% confianza</span>
                        <ArrowRight className="h-4 w-4 text-gray-400 ml-2 inline" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};