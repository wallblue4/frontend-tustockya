// components/testing/TransferFlowTester.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { vendorAPI, warehouseAPI, courierAPI } from '../../services/transfersAPI';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  Package,
  Truck,
  User
} from 'lucide-react';

interface TestStep {
  id: string;
  title: string;
  description: string;
  action: () => Promise<any>;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
}

export const TransferFlowTester: React.FC = () => {
  const [currentFlow, setCurrentFlow] = useState<'cliente' | 'restock'>('cliente');
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [transferId, setTransferId] = useState<number | null>(null);

  const clienteFlowSteps: TestStep[] = [
    {
      id: 'vendor-request',
      title: '1. Vendedor solicita transferencia (URGENTE)',
      description: 'Vendedor solicita producto para cliente presente',
      action: async () => {
        const response = await vendorAPI.requestTransfer({
          source_location_id: 2,
          sneaker_reference_code: 'AD-UB22-BLK-001',
          brand: 'Adidas',
          model: 'Ultraboost 22',
          size: '9.5',
          quantity: 1,
          purpose: 'cliente',
          pickup_type: 'corredor',
          destination_type: 'exhibicion',
          notes: 'Cliente presente esperando - URGENTE'
        });
        setTransferId(response.transfer_request_id);
        return response;
      },
      status: 'pending'
    },
    {
      id: 'warehouse-accept',
      title: '2. Bodeguero acepta solicitud',
      description: 'Bodeguero revisa y acepta la solicitud urgente',
      action: async () => {
        if (!transferId) throw new Error('No hay transfer ID');
        return await warehouseAPI.acceptRequest({
          transfer_request_id: transferId,
          accepted: true,
          estimated_preparation_time: 15,
          notes: 'Producto disponible. Preparando para entrega inmediata.'
        });
      },
      status: 'pending'
    },
    {
      id: 'courier-accept',
      title: '3. Corredor acepta transporte',
      description: 'Corredor ve la solicitud y acepta el transporte',
      action: async () => {
        if (!transferId) throw new Error('No hay transfer ID');
        return await courierAPI.acceptRequest(transferId, 20, 'Voy en camino a la bodega.');
      },
      status: 'pending'
    },
    {
      id: 'warehouse-deliver',
      title: '4. Bodeguero entrega a corredor',
      description: 'Bodeguero entrega el producto al corredor',
      action: async () => {
        if (!transferId) throw new Error('No hay transfer ID');
        return await warehouseAPI.deliverToCourier({
          transfer_request_id: transferId,
          delivered: true,
          delivery_notes: 'Producto entregado al corredor en perfecto estado.'
        });
      },
      status: 'pending'
    },
    {
      id: 'courier-pickup',
      title: '5. Corredor confirma recolección',
      description: 'Corredor confirma que recogió el producto',
      action: async () => {
        if (!transferId) throw new Error('No hay transfer ID');
        return await courierAPI.confirmPickup(transferId, 'Producto recogido. En camino al destino.');
      },
      status: 'pending'
    },
    {
      id: 'courier-delivery',
      title: '6. Corredor confirma entrega',
      description: 'Corredor entrega el producto al vendedor',
      action: async () => {
        if (!transferId) throw new Error('No hay transfer ID');
        return await courierAPI.confirmDelivery(transferId, true, 'Entrega exitosa.');
      },
      status: 'pending'
    },
    {
      id: 'vendor-confirm',
      title: '7. Vendedor confirma recepción',
      description: 'Vendedor confirma que recibió el producto',
      action: async () => {
        if (!transferId) throw new Error('No hay transfer ID');
        return await vendorAPI.confirmReception(transferId, 1, true, 'Producto recibido correctamente');
      },
      status: 'pending'
    }
  ];

  const restockFlowSteps: TestStep[] = [
    {
      id: 'vendor-request-restock',
      title: '1. Vendedor solicita transferencia (RESTOCK)',
      description: 'Vendedor solicita producto para restock normal',
      action: async () => {
        const response = await vendorAPI.requestTransfer({
          source_location_id: 2,
          sneaker_reference_code: 'NK-AF1-WHT-002',
          brand: 'Nike',
          model: 'Air Force 1',
          size: '10',
          quantity: 2,
          purpose: 'restock',
          pickup_type: 'corredor',
          destination_type: 'exhibicion',
          notes: 'Restock semanal'
        });
        setTransferId(response.transfer_request_id);
        return response;
      },
      status: 'pending'
    },
    // ... resto de pasos similares al flujo cliente
  ];

  const runFlow = async () => {
    setIsRunning(true);
    const flowSteps = currentFlow === 'cliente' ? clienteFlowSteps : restockFlowSteps;
    setSteps([...flowSteps]);
    
    for (let i = 0; i < flowSteps.length; i++) {
      const step = flowSteps[i];
      
      // Actualizar estado a "running"
      setSteps(prevSteps => 
        prevSteps.map(s => 
          s.id === step.id ? { ...s, status: 'running' } : s
        )
      );

      try {
        // Ejecutar el paso
        const result = await step.action();
        
        // Actualizar estado a "success"
        setSteps(prevSteps => 
          prevSteps.map(s => 
            s.id === step.id ? { ...s, status: 'success', result } : s
          )
        );

        // Esperar un poco entre pasos para simular realismo
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        // Actualizar estado a "error"
        setSteps(prevSteps => 
          prevSteps.map(s => 
            s.id === step.id ? { 
              ...s, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Error desconocido'
            } : s
          )
        );
        break; // Detener el flujo en caso de error
      }
    }
    
    setIsRunning(false);
  };

  const resetFlow = () => {
    setSteps([]);
    setTransferId(null);
    setIsRunning(false);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'running':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-gray-200 bg-gray-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">🧪 Probador de Flujos de Transferencia</h2>
          <p className="text-center text-gray-600">
            Simula flujos completos de transferencia para probar la integración
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <Button
              variant={currentFlow === 'cliente' ? 'primary' : 'outline'}
              onClick={() => setCurrentFlow('cliente')}
              disabled={isRunning}
            >
              🔥 Flujo Cliente Presente
            </Button>
            <Button
              variant={currentFlow === 'restock' ? 'primary' : 'outline'}
              onClick={() => setCurrentFlow('restock')}
              disabled={isRunning}
            >
              📦 Flujo Restock Normal
            </Button>
          </div>

          <div className="flex space-x-4 mb-6">
            <Button
              onClick={runFlow}
              disabled={isRunning}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Ejecutando Flujo...' : 'Iniciar Flujo de Prueba'}
            </Button>
            <Button
              onClick={resetFlow}
              disabled={isRunning}
              variant="outline"
            >
              Resetear
            </Button>
          </div>

          {transferId && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium">
                🆔 Transfer ID generado: <code className="bg-white px-2 py-1 rounded">{transferId}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">
              Progreso del Flujo: {currentFlow === 'cliente' ? '🔥 Cliente Presente' : '📦 Restock'}
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className={`border rounded-lg p-4 ${getStepColor(step.status)}`}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getStepIcon(step.status)}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                      
                      {step.status === 'success' && step.result && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <p className="text-xs text-green-600 font-medium">✅ Resultado:</p>
                          <pre className="text-xs text-gray-700 mt-1 overflow-x-auto">
                            {JSON.stringify(step.result, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {step.status === 'error' && step.error && (
                        <div className="mt-2 p-2 bg-white rounded border border-red-200">
                          <p className="text-xs text-red-600 font-medium">❌ Error:</p>
                          <p className="text-xs text-red-700 mt-1">{step.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">💡 Guía de Pruebas</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-red-600 mb-2">🔥 Flujo Cliente Presente</h4>
              <ul className="text-sm space-y-1">
                <li>• Prioridad ALTA - Urgente</li>
                <li>• Polling más frecuente</li>
                <li>• Notificaciones inmediatas</li>
                <li>• Tiempo límite reducido</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-blue-600 mb-2">📦 Flujo Restock</h4>
              <ul className="text-sm space-y-1">
                <li>• Prioridad NORMAL</li>
                <li>• Proceso estándar</li>
                <li>• Sin urgencia temporal</li>
                <li>• Planificación flexible</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Instrucciones de Prueba</h4>
            <ol className="text-sm space-y-1 text-yellow-700">
              <li>1. Selecciona el tipo de flujo que quieres probar</li>
              <li>2. Haz clic en "Iniciar Flujo de Prueba"</li>
              <li>3. Observa cada paso ejecutándose automáticamente</li>
              <li>4. Revisa los resultados y errores en tiempo real</li>
              <li>5. Usa el Transfer ID para pruebas manuales adicionales</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};