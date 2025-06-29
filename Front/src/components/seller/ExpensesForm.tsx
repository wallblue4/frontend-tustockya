import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { vendorAPI, formatCurrency } from '../../services/api';
import { 
  Receipt, 
  Upload, 
  CheckCircle,
  Plus,
  DollarSign
} from 'lucide-react';

export const ExpensesForm: React.FC = () => {
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || amount <= 0) return;

    setIsSubmitting(true);
    try {
      // Convert receipt to base64 if exists
      let receipt_image = null;
      if (receiptFile) {
        receipt_image = await fileToBase64(receiptFile);
      }

      // Prepare expense data according to API structure
      const expenseData = {
        concept,
        amount,
        ...(receipt_image && { receipt_image }),
        ...(notes && { notes })
      };

      console.log('Enviando datos de gasto:', expenseData);

      const response = await vendorAPI.createExpense(expenseData);
      
      console.log('Respuesta de la API:', response);
      
      // Reset form
      setConcept('');
      setAmount(0);
      setReceiptFile(null);
      setNotes('');
      
      alert(`Gasto registrado exitosamente!\nID: ${response.expense_id || 'N/A'}\nConcepto: ${concept}\nMonto: ${formatCurrency(amount)}`);
      
    } catch (error) {
      console.error('Error al registrar el gasto:', error);
      alert('Error al registrar el gasto: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold flex items-center">
          <Receipt className="h-6 w-6 mr-2" />
          Registrar Nuevo Gasto
        </h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Concepto del Gasto"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Ej: Transporte, Almuerzo, Materiales..."
            required
          />

          <Input
            label="Monto"
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            placeholder="0"
            min="0.01"
            step="0.01"
            required
            icon={<DollarSign className="h-4 w-4 text-gray-400" />}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprobante (Opcional)
            </label>
            <div className="flex items-center space-x-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="flex-1"
              />
              {receiptFile && (
                <div className="flex items-center text-success">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">{receiptFile.name}</span>
                </div>
              )}
            </div>
            {receiptFile && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✅ Comprobante listo para enviar: {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Detalles adicionales sobre el gasto..."
            />
          </div>

          {/* Preview Section */}
          {(concept || amount > 0) && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-medium text-gray-800 mb-2">Vista Previa del Gasto:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Concepto:</span>
                  <span className="font-medium">{concept || 'Sin especificar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-bold text-green-600">{formatCurrency(amount)}</span>
                </div>
                {receiptFile && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comprobante:</span>
                    <span className="text-green-600">✓ Adjunto</span>
                  </div>
                )}
                {notes && (
                  <div className="mt-2">
                    <span className="text-gray-600 block">Notas:</span>
                    <span className="text-gray-800 text-xs italic">{notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={!concept || amount <= 0 || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Gasto
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};