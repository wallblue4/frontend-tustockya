import React from 'react';
import { Card, CardContent } from '../../ui/Card';

interface ScanInfoCardProps {
  scanInfo: any;
}

export const ScanInfoCard: React.FC<ScanInfoCardProps> = ({ scanInfo }) => {
  if (!scanInfo) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/10">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary">Procesado en {scanInfo.processing_time.toFixed(0)}ms</p>
            </div>
            <div className="text-xs text-primary">{new Date(scanInfo.scan_timestamp).toLocaleString()}</div>
          </div>

          {scanInfo.availability_summary && (
            <div className="grid grid-cols-2 gap-4 text-xs text-primary bg-primary/20 p-2 rounded">
              <div>Productos clasificados: {scanInfo.availability_summary.products_classified_only}</div>
              <div>Venta inmediata: {scanInfo.availability_summary.can_sell_immediately ? 'Si' : 'No'}</div>
              <div>Disponibles localmente: {scanInfo.availability_summary.products_available_locally}</div>
              <div>Requieren transferencia: {scanInfo.availability_summary.products_requiring_transfer}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
