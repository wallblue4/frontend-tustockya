import { InventoryResponse } from '../types';
import { BACKEND_URL } from '../config/env';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(error.detail || `Error ${response.status}`);
  }
  return response.json();
};

export const inventoryAPI = {
  async getAllInventory(): Promise<InventoryResponse> {
    try {
      console.log('🔄 Obteniendo inventario completo...');

      const response = await fetch(`${BACKEND_URL}/api/v1/inventory/warehouse-keeper/inventory/all`, {
        method: 'GET',
        headers: getHeaders(),
      });

      const data = await handleResponse(response);
      console.log('✅ Inventario obtenido:', data);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo inventario:', error);
      throw error;
    }
  }
};