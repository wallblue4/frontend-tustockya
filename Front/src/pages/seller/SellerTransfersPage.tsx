import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { TransfersView } from '../../components/seller/TransfersView';
import { useSeller } from '../../context/SellerContext';
import type { PrefilledProduct } from '../../context/SellerContext';

export const SellerTransfersPage: React.FC = () => {
  const navigate = useNavigate();
  const { productDataForTransfer, loadTransfersSummary, setPrefilledProduct } = useSeller();

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
    const prefilledData: PrefilledProduct = {
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
    };
    setPrefilledProduct(prefilledData);
    navigate('/seller/scan');
  };

  return (
    <div className="space-y-4 p-4">
      <Button variant="ghost" onClick={() => navigate('/seller')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
      </Button>
      <TransfersView
        prefilledProductData={productDataForTransfer}
        onSellProduct={handleSellProduct}
        onTransferRequested={() => {
          loadTransfersSummary();
          navigate('/seller');
        }}
      />
    </div>
  );
};
