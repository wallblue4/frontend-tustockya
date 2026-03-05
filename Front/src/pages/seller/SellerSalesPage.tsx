import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SalesForm } from '../../components/seller/SalesForm';
import { useSeller } from '../../context/SellerContext';

export const SellerNewSalePage: React.FC = () => {
  const navigate = useNavigate();
  const { prefilledProduct } = useSeller();

  return (
    <div className="space-y-4 p-4">
      <Button variant="ghost" onClick={() => navigate('/seller')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
      </Button>
      <SalesForm prefilledProduct={prefilledProduct} />
    </div>
  );
};
