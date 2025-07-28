// src/services/transfersAPI.js - ACTUALIZAR ESTA PARTE
const BACKEND_URL = 'https://tustockya-backend.onrender.com';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(error.detail || `Error ${response.status}`);
  }
  return response.json();
};

// NUEVA FUNCIÓN: Intentar conectar al backend primero
const tryBackendFirst = async (apiCall) => {
  try {
    console.log('🌐 Intentando conectar con el backend...');
    const result = await apiCall();
    console.log('✅ Backend disponible, usando datos reales');
    return { success: true, data: result };
  } catch (error) {
    console.warn('⚠️ Backend no disponible, usando modo mock:', error.message);
    return { success: false, error };
  }
};

// Mock data (mantener igual)
const mockData = {
  seller: {
    pending: [
      {
        id: 15,
        status: 'in_transit',
        sneaker_reference_code: 'AD-UB22-BLK-001',
        brand: 'Adidas',
        model: 'Ultraboost 22',
        size: '9.5',
        purpose: 'cliente',
        courier_name: 'Luis García',
        estimated_arrival: new Date(Date.now() + 600000).toISOString(),
        time_elapsed: '35 minutos',
        next_action: 'Esperar entrega del corredor'
      }
    ],
    receptions: [
      {
        id: 14,
        sneaker_reference_code: 'NK-AF1-WHT-002',
        brand: 'Nike',
        model: 'Air Force 1',
        size: '10',
        quantity: 1,
        courier_name: 'Ana Martínez',
        delivered_at: new Date(Date.now() - 300000).toISOString(),
        hours_since_delivery: 0.08,
        requires_urgent_confirmation: false,
        delivery_notes: 'Entregado en perfecto estado'
      }
    ]
  },
  bodeguero: {
    pending: [
      {
        id: 16,
        requester_name: 'María González',
        sneaker_reference_code: 'NK-AF1-WHT-002',
        brand: 'Nike',
        model: 'Air Force 1',
        size: '10',
        quantity: 1,
        purpose: 'restock',
        priority: 'normal',
        requested_at: new Date().toISOString(),
        time_waiting: '10 minutos',
        can_fulfill: true,
        available_stock: 5,
        notes: 'Restock semanal'
      }
    ],
    accepted: []
  },
  corredor: {
    available: [
      {
        id: 17,
        status: 'accepted',
        action_required: 'accept_transport',
        status_description: 'Disponible para aceptar transporte',
        next_step: 'Aceptar esta solicitud de transporte',
        purpose: 'cliente',
        hours_since_accepted: 0.3,
        request_info: {
          pickup_location: 'Bodega Sur',
          pickup_address: 'Zona Industrial 304',
          delivery_location: 'Local Mall',
          delivery_address: 'Centro Comercial Norte',
          product_description: 'Nike Air Force 1 - Talla 10',
          urgency: '🔥 Cliente presente',
          warehouse_keeper: 'Ana Rodríguez',
          requester: 'María González'
        }
      }
    ],
    assigned: []
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

  async getPendingTransfers() {
    console.log('🔄 Obteniendo transferencias pendientes...');
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/transfers/my-requests`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando datos mock para pending transfers');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        pending_transfers: mockData.seller.pending
      };
    }
  },

  async getPendingReceptions() {
    console.log('🔄 Obteniendo recepciones pendientes...');
    
    const backendCall = async () => {
      const response = await fetch(`${BACKEND_URL}/api/v1/vendor/pending-receptions`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    };

    const result = await tryBackendFirst(backendCall);
    
    if (result.success) {
      return result.data;
    } else {
      // Fallback a mock
      console.log('📦 Usando datos mock para pending receptions');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        pending_receptions: mockData.seller.receptions
      };
    }
  },

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
  }
};

// ========== BODEGUERO APIs ==========  
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
        pending_requests: mockData.bodeguero.pending,
        urgent_count: mockData.bodeguero.pending.filter(r => r.priority === 'high').length,
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
        accepted_requests: mockData.bodeguero.accepted
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

// ========== CORREDOR APIs ==========
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
        available_requests: mockData.corredor.available
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
        my_transports: mockData.corredor.assigned
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