import React from 'react';
import { XCircle } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';

interface ErrorCardProps {
  error: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ error }) => {
  return (
    <Card className="border-error">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-error" />
          <p className="text-error">{error}</p>
        </div>
      </CardContent>
    </Card>
  );
};
