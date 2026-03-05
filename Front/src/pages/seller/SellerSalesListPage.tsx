import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SalesList } from '../../components/seller/SalesList';

export const SellerSalesListPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 p-4">
      <Button variant="ghost" onClick={() => navigate('/seller')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
      </Button>
      <SalesList />
    </div>
  );
};
