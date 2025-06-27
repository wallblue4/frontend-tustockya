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
      const expenseData = {
        concept,
        amount,
        notes,
        receipt_file: receiptFile
      };

      await vendorAPI.createExpense(expenseData);
      
      // Reset form
      setConcept('');
      setAmount(0);
      setReceiptFile(null);
      setNotes('');
      
      alert('Gasto registrado exitosamente');
    } catch (error) {
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
            min="1"
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
                  <span className="text-sm">Archivo cargado</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Detalles adicionales sobre el gasto..."
            />
          </div>

          <Button
            type="submit"
            disabled={!concept || amount <= 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Guardando...' : 'Registrar Gasto'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};