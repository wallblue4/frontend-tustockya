import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message, 
  onRetry, 
  showRetry = true 
}) => (
  <div className="text-center py-12">
    <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar datos</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
    {showRetry && onRetry && (
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reintentar
      </Button>
    )}
  </div>
);

export const EmptyState: React.FC<{ 
  title: string; 
  description: string; 
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => (
  <div className="text-center py-12">
    {icon && <div className="mb-4">{icon}</div>}
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
    {action}
  </div>
);