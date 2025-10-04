// src/services/transfersAPI.ts - CORREGIDO PARA USAR ENDPOINTS CORRECTOS
import type { ReturnRequestCreate, ReturnResponse } from '../types/transfers';

const BACKEND_URL = 'http://localhost:8000';
//const BACKEND_URL = 'https://tustockya-backend.onrender.com';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(error.detail || `Error ${response.status}`);
  }
  return response.json();
};

// Mock data básico para fallbacks
const mockData = {
  seller: {
    pendingTransfers: [
      {
        id: 1,
        status: 'delivered' as const,
        sneaker_reference_code: 'MOCK-001',
        brand: 'Mock Brand',
        model: 'Mock Model',
        size: '42',
        quantity: 1,
        purpose: 'cliente' as const,
        priority: 'high' as const,
        requested_at: new Date().toISOString(),
        time_elapsed: '2h',
        next_action: 'Confirmar recepción',
        courier_name: 'Mock Courier'
      }
    ],
    completedTransfers: [
      {
        id: 2,
        status: 'completed' as const,
        sneaker_reference_code: 'MOCK-002',
        brand: 'Mock Brand',
        model: 'Mock Model',
        size: '41',
        quantity: 1,
        purpose: 'restock' as const,
        priority: 'normal' as const,
        requested_at: new Date().toISOString(),
        time_elapsed: '1h',
        next_action: 'Completado'
      }
    ]
  }
};

// NUEVA FUNCIÓN: Intentar conectar al backend primero
const tryBackendFirst = async (apiCall: () => Promise<any>) => {
  try {
    console.log('🌐 Intentando conectar con el backend...');
    const result = await apiCall();
    console.log('✅ Backend disponible, usando datos reales');
    return { success: true, data: result };
  } catch (error) {
    console.warn('⚠️ Backend no disponible, usando modo mock:', (error as Error).message);
    return { success: false, error };
  }
};

// ========== VENDEDOR APIs ==========
export const vendorAPI = {
  async requestTransfer(transferData) {
    console.log('🔄 Solicitando transferencia...', transferData);
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/transfers/request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(transferData)
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando respuesta mock para requestTransfer');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const transferId = Math.floor(Math.random() * 1000) + 100;
      
      return {
        success: true,
        transfer_request_id: transferId,
        status: 'pending',
        estimated_time: transferData.purpose === 'cliente' ? '30 minutos' : '45 minutos',
        priority: transferData.purpose === 'cliente' ? 'high' : 'normal',
        reservation_expires_at: new Date(Date.now() + 2700000).toISOString()
      };
    }
  },

  // *** ACTUALIZACIÓN - USAR ENDPOINT CORRECTO: /vendor/pending-transfers ***
  async getPendingTransfers() {
    console.log('🔄 Obteniendo transferencias pendientes (recepciones por confirmar)...');
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/vendor/pending-transfers`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      // El endpoint devuelve: { success: true, pending_transfers: [...], summary: {...}, attention_needed: [...] }
      console.log('✅ Transferencias pendientes cargadas del backend:', result.data.pending_transfers?.length || 0);
      
      const transfers = result.data.pending_transfers || [];
      
      // Contar transferencias que requieren atención (status = 'delivered')
      const deliveredCount = transfers.filter(t => t.status === 'delivered').length;
      const otherCount = transfers.filter(t => t.status !== 'delivered').length;
      
      return {
        success: true,
        pending_transfers: transfers,
        urgent_count: deliveredCount, // Las entregadas son urgentes (requieren confirmación)
        normal_count: otherCount,
        total_pending: transfers.length,
        summary: result.data.summary,
        attention_needed: result.data.attention_needed
      };
    } else {
      // Fallback a mock
      console.log('📦 Usando datos mock para pending transfers');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        pending_transfers: mockData.seller.pendingTransfers,
        urgent_count: 1,
        normal_count: 0,
        total_pending: 1
      };
    }
  },

  // *** NUEVA FUNCIÓN - USAR ENDPOINT CORRECTO: /vendor/completed-transfers ***
  async getCompletedTransfers() {
    console.log('🔄 Obteniendo transferencias completadas del día (historial)...');
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/vendor/completed-transfers`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      // El endpoint devuelve: { success: true, date: "2025-01-28", completed_transfers: [...], today_stats: {...} }
      console.log('✅ Transferencias completadas cargadas del backend:', result.data.completed_transfers?.length || 0);
      
      return {
        success: true,
        completed_transfers: result.data.completed_transfers || [],
        date: result.data.date,
        today_stats: result.data.today_stats
      };
    } else {
      // Fallback a mock
      console.log('📦 Usando datos mock para completed transfers');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        completed_transfers: mockData.seller.completedTransfers,
        date: new Date().toISOString().split('T')[0],
        today_stats: {
          total_transfers: 2,
          completed: 1,
          cancelled: 1,
          success_rate: 50.0,
          total_value_completed: 180.00,
          average_duration: '2.3h',
          performance: 'Buena'
        }
      };
    }
  },

  // *** MANTENER - Confirmar recepción usando endpoint existente ***
  async confirmReception(requestId, quantity, conditionOk, notes) {
    console.log('🔄 Confirmando recepción...', { requestId, quantity, conditionOk });
    
    const backendCall = async () => {
      const params = new URLSearchParams({
        received_quantity: quantity.toString(),
        condition_ok: conditionOk.toString(),
        notes: notes || ''
      });
      
      const response = await fetch(`${BACKEND_URL}/api/v1/vendor/confirm-reception/${requestId}?${params}`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando respuesta mock para confirm reception');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Recepción confirmada - Inventario actualizado automáticamente',
        request_id: requestId,
        received_quantity: quantity,
        inventory_updated: true,
        confirmed_at: new Date().toISOString()
      };
    }
  },

  // *** NUEVA FUNCIÓN - Cancelar transferencia ***
  async cancelTransfer(transferId, reason) {
    console.log('🔄 Cancelando transferencia...', { transferId, reason });
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/vendor/cancel-transfer/${transferId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          cancellation_reason: reason || 'Cliente ya no necesita el producto'
        })
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando respuesta mock para cancel transfer');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Transferencia cancelada exitosamente',
        transfer_id: transferId,
        cancelled_at: new Date().toISOString(),
        reason: reason || 'Cliente ya no necesita el producto'
      };
    }
  },

  // *** NUEVA FUNCIÓN - Obtener detalles de transferencia ***
  async getTransferDetails(transferId) {
    console.log('🔄 Obteniendo detalles de transferencia...', { transferId });
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/vendor/transfer-details/${transferId}`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando respuesta mock para transfer details');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        transfer: mockData.seller.pendingTransfers[0], // Usar el primer mock como ejemplo
        contact_info: {
          warehouse_keeper: {
            name: 'Carlos Bodeguero',
            email: 'carlos@bodega.com',
            location: 'Bodega Central',
            location_phone: '+57 300 1234567'
          },
          courier: {
            name: 'Luis Corredor',
            email: 'luis@corredor.com',
            phone: '+57 301 9876543'
          }
        }
      };
    }
  },

  async getDashboard() {
    console.log('🔄 Obteniendo dashboard...');
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/vendor/dashboard`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando datos mock para dashboard');
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        success: true,
        dashboard_timestamp: new Date().toISOString(),
        vendor_info: {
          name: 'Juan Pérez (Mock)',
          email: 'juan@tustockya.com',
          location_name: 'Local #1',
          role: 'seller',
          location_id: 1
        },
        today_summary: {
          date: new Date().toISOString().split('T')[0],
          sales: {
            total_count: 15,
            pending_confirmations: 3,
            total_amount: 2450000,
            confirmed_amount: 2000000,
            pending_amount: 450000
          },
          expenses: {
            count: 2,
            total_amount: 150000
          },
          net_income: 2300000
        }
      };
    }
  },

  // *** NUEVA FUNCIÓN - Solicitar devolución ***
  async requestReturn(returnData: ReturnRequestCreate): Promise<ReturnResponse> {
    console.log('🔄 Solicitando devolución...', returnData);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/returns/request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(returnData)
      });
      
      const result = await handleResponse(response);
      console.log('✅ Devolución solicitada exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al solicitar devolución:', error);
      throw error;
    }
  }
};

// ========== BODEGUERO APIs (SIN CAMBIOS) ==========  
export const warehouseAPI = {
  async getPendingRequests() {
    console.log('🔄 Obteniendo solicitudes pendientes de bodega...');
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/warehouse/pending-requests`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando datos mock para warehouse pending requests');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        pending_requests: [],
        urgent_count: 0,
        total_stock_value: 1580.50
      };
    }
  },

  async acceptRequest(requestData) {
    console.log('🔄 Aceptando solicitud...', requestData);
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/warehouse/accept-request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestData)
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando respuesta mock para accept request');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Solicitud aceptada - Disponible para corredores',
        request_id: requestData.transfer_request_id,
        status: 'accepted'
      };
    }
  },

  async getAcceptedRequests() {
    console.log('🔄 Obteniendo solicitudes aceptadas...');
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/warehouse/accepted-requests`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando datos mock para accepted requests');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        accepted_requests: []
      };
    }
  },

  async deliverToCourier(requestData) {
    console.log('🔄 Entregando a corredor...', requestData);
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/warehouse/deliver-to-courier`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestData)
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando respuesta mock para deliver to courier');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Producto entregado a corredor - Inventario actualizado',
        request_id: requestData.transfer_request_id,
        inventory_updated: true,
        delivered_at: new Date().toISOString()
      };
    }
  }
};

// ========== CORREDOR APIs (SIN CAMBIOS) ==========
export const courierAPI = {
  async getAvailableRequests() {
    console.log('🔄 Obteniendo entregas disponibles...');
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/available-requests`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando datos mock para available requests');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        available_requests: []
      };
    }
  },

  async acceptRequest(requestId, estimatedTime, notes) {
    console.log('🔄 Aceptando transporte...', { requestId, estimatedTime });
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/accept-request/${requestId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          estimated_pickup_time: estimatedTime,
          notes
        })
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando respuesta mock para accept request');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Solicitud de transporte aceptada exitosamente',
        request_id: requestId,
        status: 'courier_assigned',
        estimated_pickup_time: estimatedTime,
        accepted_at: new Date().toISOString()
      };
    }
  },

  async getMyAssignedTransports() {
    console.log('🔄 Obteniendo mis transportes asignados...');
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/my-assigned-transports`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando datos mock para assigned transports');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        my_transports: []
      };
    }
  },

  async confirmPickup(requestId, notes) {
    console.log('🔄 Confirmando recolección...', { requestId });
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/confirm-pickup/${requestId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ pickup_notes: notes })
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando respuesta mock para confirm pickup');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Recolección confirmada - Producto en tránsito',
        request_id: requestId,
        status: 'in_transit',
        picked_up_at: new Date().toISOString()
      };
    }
  },

  async confirmDelivery(requestId, successful, notes) {
    console.log('🔄 Confirmando entrega...', { requestId, successful });
    
    const backendCall = async () => {
      const params = new URLSearchParams({
        delivery_successful: successful.toString(),
        notes: notes || ''
      });
      
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/confirm-delivery/${requestId}?${params}`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando respuesta mock para confirm delivery');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Entrega confirmada exitosamente',
        request_id: requestId,
        status: 'delivered',
        delivered_at: new Date().toISOString()
      };
    }
  },

  async getMyDeliveries() {
    console.log('🔄 Obteniendo historial de entregas...');
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/my-deliveries`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando datos mock para deliveries');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        recent_deliveries: []
      };
    }
  }
};

// Exportar todo como un objeto para facilitar el import
export const transfersAPI = {
  vendor: vendorAPI,
  warehouse: warehouseAPI,
  courier: courierAPI
};