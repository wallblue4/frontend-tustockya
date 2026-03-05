import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProductScanner } from '../../components/seller/ProductScanner';
import { ScannerTransferRequest } from '../../components/seller/ScannerTransferRequest';
import { ScannerSaleConfirm } from '../../components/seller/ScannerSaleConfirm';
import { useSeller } from '../../context/SellerContext';

type SubView = 'scan' | 'scanner-transfer' | 'scanner-sale';

export const SellerScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [subView, setSubView] = useState<SubView>('scan');
  const {
    capturedImage,
    scanResult,
    isSearchMode,
    setScanViewTitle,
    prefilledProduct,
    setPrefilledProduct,
    productDataForTransfer,
    setProductDataForTransfer,
    loadTransfersSummary,
  } = useSeller();

  const handleRequestTransfer = (productData: {
    sneaker_reference_code: string;
    brand: string;
    model: string;
    color: string;
    size: string;
    product: any;
  }) => {
    setProductDataForTransfer(productData);
    setSubView('scanner-transfer');
  };

  const handleSellProduct = (productData: {
    code: string;
    brand: string;
    model: string;
    size: string;
    price: number;
    location: string;
    storage_type: string;
    color?: string;
    image?: string;
    transfer_id?: number;
  }) => {
    setPrefilledProduct({
      code: productData.code,
      brand: productData.brand,
      model: productData.model,
      size: productData.size,
      price: productData.price,
      location: productData.location,
      storage_type: productData.storage_type,
      color: productData.color,
      image: productData.image ? [productData.image] : undefined,
      transfer_id: productData.transfer_id,
    });
    setSubView('scanner-sale');
  };

  const goBackToDashboard = () => {
    setPrefilledProduct(null);
    setProductDataForTransfer(null);
    navigate('/seller');
  };

  const goBackToScanner = () => {
    setProductDataForTransfer(null);
    setPrefilledProduct(null);
    setSubView('scan');
  };

  return (
    <div className="space-y-4 p-4">
      {subView === 'scan' ? (
        <Button variant="ghost" onClick={goBackToDashboard} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
        </Button>
      ) : (
        <Button variant="ghost" onClick={goBackToScanner} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Escaner
        </Button>
      )}

      <div className={subView !== 'scan' ? 'hidden' : ''}>
        <ProductScanner
          onRequestTransfer={handleRequestTransfer}
          onStepTitleChange={setScanViewTitle}
          onSellProduct={handleSellProduct}
          capturedImage={capturedImage}
          scanResult={scanResult}
          searchMode={isSearchMode}
        />
      </div>

      {subView === 'scanner-transfer' && productDataForTransfer && (
        <ScannerTransferRequest
          prefilledProductData={productDataForTransfer}
          onTransferRequested={() => {
            loadTransfersSummary();
          }}
          onBack={goBackToScanner}
          onViewTransfers={() => navigate('/seller/transfers')}
        />
      )}

      {subView === 'scanner-sale' && prefilledProduct && (
        <ScannerSaleConfirm
          productData={{
            code: prefilledProduct.code,
            brand: prefilledProduct.brand,
            model: prefilledProduct.model,
            size: prefilledProduct.size,
            price: prefilledProduct.price,
            location: prefilledProduct.location,
            storage_type: prefilledProduct.storage_type,
            color: prefilledProduct.color,
            image: prefilledProduct.image?.[0],
            transfer_id: prefilledProduct.transfer_id,
          }}
          onSaleCompleted={goBackToDashboard}
          onBack={prefilledProduct.transfer_id ? goBackToDashboard : goBackToScanner}
        />
      )}
    </div>
  );
};
