import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';

interface NoResultsCardProps {
  onRetry: () => void;
}

export const NoResultsCard: React.FC<NoResultsCardProps> = ({ onRetry }) => {
  return (
    <Card className="border-warning/30 bg-warning/10">
      <CardContent className="p-8 text-center">
        <div className="space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-warning" />
          <div>
            <h3 className="text-lg font-semibold text-warning">No se encontraron productos</h3>
            <p className="text-warning">
              No se pudieron identificar productos en la imagen. Intenta con una imagen mas clara o un angulo
              diferente.
            </p>
          </div>
          <Button variant="outline" onClick={onRetry} className="mt-4">
            Intentar de Nuevo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
