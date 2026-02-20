// src/services/transfersAPI.ts
import type { ReturnRequestCreate, ReturnResponse } from '../types/transfers';
import { BACKEND_URL } from '../config/env';

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

// NUEVA FUNCIÓN: Intentar conectar al backend primero
const tryBackendFirst = async (apiCall: () => Promise<any>, mockFallback?: any) => {
  try {
    console.log('🌐 Intentando conectar con el backend...');
    const result = await apiCall();
    console.log('✅ Backend disponible, usando datos reales');
    return { success: true, data: result };
  } catch (error) {
    console.warn('⚠️ Backend no disponible', (error as Error).message);
    if (mockFallback) {
      return { success: false, data: mockFallback }; // Return mock data structure
    }
    return { success: false, error };
  }
};

// ========== VENDEDOR APIs ==========
export const vendorAPI = {
  async requestTransfer(transferData: any) {
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

  async sellFromTransfer(transferId: number, formData: FormData) {
    console.log('🔄 Registrando venta desde transferencia...', { transferId });

    const backendCall = async () => {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token || ''}`
      };

      const response = await fetch(`${BACKEND_URL}/api/v1/vendor/sell-from-transfer/${transferId}`, {
        method: 'POST',
        headers,
        body: formData
      });
      return handleResponse(response);
    };

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token || ''}`
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/vendor/sell-from-transfer/${transferId}`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const err: any = new Error(body.message || body.detail || `Error ${response.status}`);
      err.detail = body.detail || null;
      throw err;
    }

    return response.json();
  },

  async instantSingleFoot(data: any) {
    console.log('⚡ Solicitando transferencia instantánea de pie individual...', data);

    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/transfers/instant-single-foot`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);

    if (result.success) {
      return result.data;
    } else {
      console.log('📦 Usando respuesta mock para instantSingleFoot');
      await new Promise(resolve => setTimeout(resolve, 500));
      const transferId = Math.floor(Math.random() * 1000) + 100;

      return {
        success: true,
        transfer_request_id: transferId,
        status: 'completed',
        estimated_time: 'Instantáneo',
        priority: 'high',
        pair_formation_available: true,
        pairs_can_be_formed: 1
      };
    }
  },

  async requestSingleFoot(singleFootData: any) {
    console.log('🔄 Solicitando transferencia de pie individual...', singleFootData);

    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/transfers/request-single-foot`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(singleFootData)
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);

    if (result.success) {
      return result.data;
    } else {
      console.log('📦 Usando respuesta mock para requestSingleFoot');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const transferId = Math.floor(Math.random() * 1000) + 100;

      return {
        success: true,
        transfer_request_id: transferId,
        status: 'pending',
        estimated_time: '30 minutos',
        priority: 'high',
        reservation_expires_at: new Date(Date.now() + 2700000).toISOString(),
        pair_formation_available: true,
        pairs_can_be_formed: 1
      };
    }
  },

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
      return result.data;
    } else {
      console.log('📦 Usando datos mock para pending transfers');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        pending_transfers: [
          {
            id: 301,
            status: 'delivered',
            sneaker_reference_code: 'NIKE-DUNK-005',
            brand: 'Nike',
            model: 'Dunk Low',
            size: '42',
            quantity: 1,
            purpose: 'return',
            pickup_type: 'corredor',
            courier_name: 'Carlos R.',
            warehouse_keeper_name: 'Bodega Central',
            next_action: 'Confirmar recepción',
            product_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
            priority: 'normal'
          }
        ],
        urgent_count: 0,
        normal_count: 1,
        total_pending: 1
      };
    }
  },

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
      return result.data;
    } else {
      console.log('📦 Usando datos mock para completed transfers');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        completed_transfers: [],
        date: new Date().toISOString().split('T')[0],
        today_stats: {
          total_transfers: 0,
          completed: 0,
          cancelled: 0,
          success_rate: 0,
          total_value_completed: 0,
          average_duration: '0h',
          performance: 'N/A'
        }
      };
    }
  },

  async getTransferHistory() {
    console.log('🔄 Obteniendo historial del día...');

    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/vendor/transfer-history`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);

    if (result.success) {
      return result.data;
    } else {
      console.log('📦 Usando datos mock para transfer history');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        date: new Date().toISOString().split('T')[0],
        history: [],
        stats: {
          total_items: 0,
          completed_count: 0,
          selled_count: 0,
          cancelled_count: 0,
          returned_count: 0,
          total_sales_amount: 0
        }
      };
    }
  },

  async getIncomingTransfers() {
    try {
      const mockIncoming: any[] = [
        {
          id: 201,
          status: 'pending',
          sneaker_reference_code: 'NIKE-AIR-001',
          inventory_type: 'left_only',
          requester_name: 'Juan Pérez (Local Centro)',
          time_elapsed: '2h 15m',
          quantity: 1,
          brand: 'Nike',
          model: 'Air Force 1',
          size: '42',
          product_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          pickup_type: 'vendedor'
        },
        {
          id: 202,
          status: 'accepted',
          sneaker_reference_code: 'ADIDAS-UB-002',
          inventory_type: 'pair',
          requester_name: 'María González (Local Norte)',
          time_elapsed: '45m',
          quantity: 1,
          brand: 'Adidas',
          model: 'Ultra Boost',
          size: '40',
          product_image: 'https://images.unsplash.com/photo-1587563871167-1ee79736a4c5',
          pickup_type: 'vendedor'
        },
        {
          id: 203,
          status: 'courier_assigned',
          sneaker_reference_code: 'JORDAN-1-003',
          inventory_type: 'pair',
          requester_name: 'Carlos Rodríguez (Local Sur)',
          time_elapsed: '1h 30m',
          quantity: 1,
          brand: 'Nike',
          model: 'Air Jordan 1',
          size: '43',
          product_image: 'https://images.unsplash.com/photo-1581101767113-1677fc2beaa8',
          pickup_type: 'corredor'
        }
      ];

      const backendCall = async () => {
        const response = await fetch(`${BACKEND_URL}/api/v1/vendor/incoming-transfers`, {
          headers: getHeaders()
        });
        return handleResponse(response);
      };

      const result = await tryBackendFirst(backendCall);

      if (result.success) {
        return result.data;
      } else {
        return { incoming_transfers: mockIncoming, count: mockIncoming.length };
      }
    } catch (error) {
      console.error('Error fetching incoming transfers:', error);
      throw error;
    }
  },

  async acceptIncomingTransfer(transferId: number) {
    try {
      const backendCall = async () => {
        const response = await fetch(`${BACKEND_URL}/api/v1/vendor/incoming-transfers/${transferId}/accept`, {
          method: 'POST',
          headers: getHeaders()
        });
        return handleResponse(response);
      };
      const result = await tryBackendFirst(backendCall);
      if (result.success) return result.data;
      return { success: true, status: 'accepted' };
    } catch (error) {
      console.error('Error accepting transfer:', error);
      throw error;
    }
  },

  async dispatchIncomingTransfer(transferId: number, data: { delivery_notes: string; evidence_url?: string }) {
    try {
      const backendCall = async () => {
        const response = await fetch(`${BACKEND_URL}/api/v1/vendor/incoming-transfers/${transferId}/dispatch`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      };
      const result = await tryBackendFirst(backendCall);
      if (result.success) return result.data;
      return { success: true, new_status: 'in_transit', inventory_updated: true, remaining_stock: 4 };
    } catch (error) {
      console.error('Error dispatching transfer:', error);
      throw error;
    }
  },

  async confirmReturnReception(returnId: number, data: { received_quantity: number; condition: string; notes: string }) {
    try {
      const backendCall = async () => {
        const response = await fetch(`${BACKEND_URL}/api/v1/vendor/returns/${returnId}/confirm-reception`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      };
      const result = await tryBackendFirst(backendCall);
      if (result.success) return result.data;
      return {
        success: true,
        message: 'Devolución recibida correctamente',
        inventory_restored: { reversed: true },
        pair_reversal: { reversed: true, quantity_reversed: 1, pairs_remaining: 5 }
      };
    } catch (error) {
      console.error('Error confirming return reception:', error);
      throw error;
    }
  },

  async confirmReception(requestId: number, quantity: number, conditionOk: boolean, notes?: string) {
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

  async cancelTransfer(transferId: number, reason?: string) {
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

  async getTransferDetails(transferId: number) {
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
      console.log('📦 Usando respuesta mock para transfer details');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        transfer: {},
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
  },

  async createReturn(returnData: any) {
    console.log('🔄 Creando devolución...', returnData);

    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/transfers/create-return`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(returnData)
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);

    if (result.success) {
      return result.data;
    } else {
      console.log('📦 Usando respuesta mock para createReturn');
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        message: 'Devolución creada',
        return_id: Math.floor(Math.random() * 1000) + 135,
        original_transfer_id: returnData.original_transfer_id,
        status: 'pending',
        pickup_type: returnData.pickup_type,
        estimated_return_time: '2-3 horas',
        workflow_steps: [],
        next_action: 'Esperar'
      };
    }
  },

  async deliverReturnToWarehouse(returnId: number, deliveryNotes: string) {
    console.log('🔄 Entregando devolución a bodega...', { returnId, deliveryNotes });

    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/vendor/deliver-return-to-warehouse/${returnId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ delivery_notes: deliveryNotes })
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);

    if (result.success) {
      return result.data;
    } else {
      console.log('📦 Usando respuesta mock para deliver return to warehouse');
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        message: 'Entrega confirmada',
        return_id: returnId,
        status: 'delivered',
        delivered_at: new Date().toISOString()
      };
    }
  }
};

// ========== BODEGUERO APIs ==========
export const warehouseAPI = {
  async getPendingRequests() {
    console.log('🔄 Obteniendo solicitudes pendientes de bodega...');
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/warehouse/pending-requests`, { headers: getHeaders() });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, pending_requests: [], urgent_count: 0, total_stock_value: 0 };
  },

  async acceptRequest(requestData: any) {
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
    if (result.success) return result.data;
    return { success: true, message: 'Solicitud aceptada', status: 'accepted' };
  },

  async getAcceptedRequests() {
    console.log('🔄 Obteniendo solicitudes aceptadas...');
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/warehouse/accepted-requests`, { headers: getHeaders() });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, accepted_requests: [] };
  },

  async deliverToCourier(requestData: any) {
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
    if (result.success) return result.data;
    return { success: true, message: 'Entregado a corredor', status: 'in_transit' };
  },

  async deliverToVendor(transferId: number, requestData: any) {
    console.log('🔄 Entregando a vendedor...', { transferId, requestData });
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/warehouse/deliver-to-vendor/${transferId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestData)
      });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, message: 'Entregado a vendedor', status: 'delivered' };
  },

  async acceptReturn(returnData: any) {
    console.log('🔄 Aceptando devolución...', returnData);
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/warehouse/accept-request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          transfer_request_id: returnData.transfer_request_id,
          accepted: returnData.accepted,
          estimated_preparation_time: returnData.estimated_preparation_time || 15,
          warehouse_notes: returnData.warehouse_notes || 'Return aceptado'
        })
      });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, message: 'Return aceptado', status: 'accepted' };
  },

  async confirmReturnReception(returnId: number, confirmationData: any) {
    console.log('🔄 Confirmando recepción de devolución...', { returnId, confirmationData });
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/warehouse/confirm-return-reception/${returnId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(confirmationData)
      });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, message: 'Devolución recibida', status: 'completed' };
  }
};

// ========== CORREDOR APIs ==========
export const courierAPI = {
  async getAvailableRequests() {
    console.log('🔄 Obteniendo entregas disponibles...');
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/available-requests`, { headers: getHeaders() });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, available_requests: [] };
  },

  async acceptRequest(requestId: number, estimatedTime: string, notes?: string) {
    console.log('🔄 Aceptando transporte...', { requestId, estimatedTime });
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/accept-request/${requestId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ estimated_pickup_time: estimatedTime, notes })
      });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, message: 'Transporte aceptado', status: 'courier_assigned' };
  },

  async getMyAssignedTransports() {
    console.log('🔄 Obteniendo mis transportes asignados...');
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/my-transports`, { headers: getHeaders() });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, my_transports: [] };
  },

  async confirmPickup(requestId: number, notes?: string) {
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
    if (result.success) return result.data;
    return { success: true, message: 'Recolección confirmada', status: 'in_transit' };
  },

  async confirmDelivery(requestId: number, successful: boolean, notes?: string) {
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
    if (result.success) return result.data;
    return { success: true, message: 'Entrega confirmada', status: 'delivered' };
  },

  async getMyDeliveries() {
    console.log('🔄 Obteniendo historial de entregas...');
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/my-deliveries`, { headers: getHeaders() });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, recent_deliveries: [] };
  },

  async acceptReturnTransport(returnId: number, estimatedTime: string, notes?: string) {
    console.log('🔄 Aceptando transporte de devolución...', { returnId, estimatedTime });
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/accept-request/${returnId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ estimated_pickup_time: estimatedTime, notes })
      });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, message: 'Return asignado', status: 'courier_assigned' };
  },

  async confirmReturnPickup(returnId: number, pickupNotes?: string) {
    console.log('🔄 Confirmando recolección de devolución...', { returnId });
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/confirm-pickup/${returnId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ pickup_notes: pickupNotes })
      });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, message: 'Recolección confirmada', status: 'in_transit' };
  },

  async confirmReturnDelivery(returnId: number, successful: boolean, notes?: string) {
    console.log('🔄 Confirmando entrega de devolución...', { returnId, successful });
    const backendCall = async () => {
      const params = new URLSearchParams({
        delivery_successful: successful.toString(),
        notes: notes || ''
      });
      const response = await fetch(`${BACKEND_URL}/api/v1/courier/confirm-delivery/${returnId}?${params}`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(response);
    };
    const result = await tryBackendFirst(backendCall);
    if (result.success) return result.data;
    return { success: true, message: 'Entrega confirmada', status: 'delivered' };
  }
};

export const transfersAPI = {
  vendor: vendorAPI,
  warehouse: warehouseAPI,
  courier: courierAPI
};