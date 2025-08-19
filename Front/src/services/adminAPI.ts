// src/services/adminAPI.ts
// API para endpoints exclusivos del administrador

const BACKEND_URL = 'https://tustockya-backend.onrender.com';

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

// Ejemplo: Obtener todos los usuarios
export const fetchAllUsers = async () => {
  const response = await fetch(`${BACKEND_URL}/admin/users`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// Ejemplo: Obtener todas las ubicaciones
export const fetchAllLocations = async () => {
  const response = await fetch(`${BACKEND_URL}/admin/locations`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// Ejemplo: Obtener todas las bodegas
export const fetchAllWarehouses = async () => {
  const response = await fetch(`${BACKEND_URL}/admin/warehouses`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// Ejemplo: Obtener todos los costos
export const fetchAllCosts = async () => {
  const response = await fetch(`${BACKEND_URL}/admin/costs`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// Ejemplo: Obtener todas las ventas al por mayor
export const fetchAllWholesaleOrders = async () => {
  const response = await fetch(`${BACKEND_URL}/admin/wholesale-orders`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// Puedes agregar más funciones según los endpoints del backend para administrador
