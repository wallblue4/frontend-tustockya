import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { vendorAPI, formatCurrency, formatDate } from '../../services/api';
import { 
  Receipt, 
  FileImage,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Expense {
  id: string;
  concept: string;
  amount: number;
  notes?: string;
  has_receipt: boolean;
  created_at: string;
}

export const ExpensesList: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodayExpenses();
  }, []);

  const loadTodayExpenses = async () => {
    try {
      setError(null);
      const response = await vendorAPI.getTodayExpenses();
      setExpenses(response.data || []);
    } catch (error) {
      console.warn('Backend API not available, using mock data for expenses');
      setError('Conectando con el servidor...');
      
      // Mock data for development
      setExpenses([
        {
          id: '1',
          concept: 'Transporte',
          amount: 15000,
          notes: 'Taxi al centro comercial',
          has_receipt: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          concept: 'Almuerzo',
          amount: 12000,
          has_receipt: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando gastos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Resumen de Gastos del Día
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total de Gastos</p>
              <p className="text-2xl font-bold text-error">{formatCurrency(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Número de Gastos</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            Gastos del Día
          </h3>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">Modo de desarrollo - Usando datos de prueba</p>
            </div>
          )}
          
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay gastos registrados hoy</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{expense.concept}</h4>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(expense.created_at)}</span>
                        {expense.has_receipt && (
                          <>
                            <FileImage className="h-4 w-4 ml-3 mr-1 text-success" />
                            <span className="text-success">Con comprobante</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-error">{formatCurrency(expense.amount)}</p>
                    </div>
                  </div>
                  
                  {expense.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">{expense.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};