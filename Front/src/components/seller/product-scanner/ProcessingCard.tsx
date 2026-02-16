import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';

export const ProcessingCard: React.FC = () => {
  return (
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
  );
};
