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

// ========== INTERFACES ==========

interface ProductoMayoreoCreate {
  modelo: string;                        // Obligatorio
  cantidad_cajas_disponibles: number;    // Obligatorio
  pares_por_caja: number;               // Obligatorio
  precio: number;                       // Obligatorio
  foto?: string;                        // Opcional
  tallas?: string;                      // Opcional
}

interface ProductoMayoreoUpdate {
  modelo?: string;
  cantidad_cajas_disponibles?: number;
  pares_por_caja?: number;
  precio?: number;
  foto?: string;
  tallas?: string;
  is_active?: boolean;
}

interface VentaMayoreoCreate {
  mayoreo_id: number;                   // Obligatorio
  cantidad_cajas_vendidas: number;      // Obligatorio
  precio_unitario_venta: number;        // Obligatorio
  notas?: string;                       // Opcional
}

interface ProductoMayoreoResponse {
  id: number;
  user_id: number;
  company_id: number;
  modelo: string;
  foto?: string;
  tallas?: string;
  cantidad_cajas_disponibles: number;
  pares_por_caja: number;
  precio: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface VentaMayoreoResponse {
  id: number;
  mayoreo_id: number;
  user_id: number;
  company_id: number;
  cantidad_cajas_vendidas: number;
  precio_unitario_venta: number;
  total_venta: number;
  fecha_venta: string;
  notas?: string;
  created_at: string;
  mayoreo_producto?: ProductoMayoreoResponse;
}

interface EstadisticasMayoreoResponse {
  success: boolean;
  message: string;
  total_productos: number;
  total_cajas_disponibles: number;
  valor_total_inventario: number;
  total_ventas: number;
  valor_total_ventas: number;
}

// ========== 1. HEALTH CHECK ==========

/**
 * GET /api/v1/mayoreo/health
 * Verificar estado del servicio de mayoreo
 * No requiere autenticación
 */
export const checkMayoreoHealth = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/mayoreo/health`, {
    method: 'GET',
  });
  return handleResponse(response);
};

// ========== 2. PRODUCTOS DE MAYOREO - CRUD ==========

/**
 * POST /api/v1/mayoreo/productos/crear
 * Crear nuevo producto de mayoreo
 * Requiere rol: administrador
 * Envía FormData con multipart/form-data para soportar archivos de imagen
 */
export const crearProductoMayoreo = async (productoData: {
  modelo: string;
  cantidad_cajas_disponibles: number;
  pares_por_caja: number;
  precio: number;
  tallas?: string;
  foto?: File | null;
}): Promise<ProductoMayoreoResponse> => {
  const formData = new FormData();
  
  // Campos obligatorios
  formData.append('modelo', productoData.modelo);
  formData.append('cantidad_cajas_disponibles', productoData.cantidad_cajas_disponibles.toString());
  formData.append('pares_por_caja', productoData.pares_por_caja.toString());
  formData.append('precio', productoData.precio.toString());
  
  // Campos opcionales
  if (productoData.tallas && productoData.tallas.trim()) {
    formData.append('tallas', productoData.tallas);
  }
  
  // Archivo de foto
  if (productoData.foto && productoData.foto instanceof File) {
    formData.append('foto', productoData.foto);
  }
  
  // Headers sin Content-Type (el navegador lo establece automáticamente con el boundary)
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`
  };
  
  const response = await fetch(`${BACKEND_URL}/api/v1/mayoreo/productos/crear`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });
  return handleResponse(response);
};

/**
 * GET /api/v1/mayoreo/productos/listar
 * Listar todos los productos de mayoreo
 * Requiere rol: administrador
 */
export const listarProductosMayoreo = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/mayoreo/productos/listar`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

/**
 * PUT /api/v1/mayoreo/productos/{mayoreo_id}/actualizar
 * Actualizar producto existente de mayoreo
 * Requiere rol: administrador
 * Soporta FormData para actualizar la foto
 */
export const actualizarProductoMayoreo = async (
  mayoreoId: number, 
  productoData: {
    modelo?: string;
    cantidad_cajas_disponibles?: number;
    pares_por_caja?: number;
    precio?: number;
    tallas?: string;
    foto?: File | null;
    is_active?: boolean;
  }
): Promise<ProductoMayoreoResponse> => {
  // Si hay un archivo de foto, usar FormData
  if (productoData.foto instanceof File) {
    const formData = new FormData();
    
    if (productoData.modelo !== undefined) formData.append('modelo', productoData.modelo);
    if (productoData.cantidad_cajas_disponibles !== undefined) formData.append('cantidad_cajas_disponibles', productoData.cantidad_cajas_disponibles.toString());
    if (productoData.pares_por_caja !== undefined) formData.append('pares_por_caja', productoData.pares_por_caja.toString());
    if (productoData.precio !== undefined) formData.append('precio', productoData.precio.toString());
    if (productoData.tallas !== undefined) formData.append('tallas', productoData.tallas);
    if (productoData.is_active !== undefined) formData.append('is_active', productoData.is_active.toString());
    formData.append('foto', productoData.foto);
    
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(`${BACKEND_URL}/api/v1/mayoreo/productos/${mayoreoId}/actualizar`, {
      method: 'PUT',
      headers: headers,
      body: formData,
    });
    return handleResponse(response);
  } else {
    // Si no hay foto, enviar JSON normal (excluyendo el campo foto)
    const { foto, ...dataWithoutFoto } = productoData;
    
    // Filtrar campos undefined/null para evitar enviar datos vacíos
    const filteredData = Object.fromEntries(
      Object.entries(dataWithoutFoto).filter(([_, value]) => value !== undefined && value !== null)
    );
    
    console.log('Actualizando producto mayoreo:', { mayoreoId, filteredData });
    
    const response = await fetch(`${BACKEND_URL}/api/v1/mayoreo/productos/${mayoreoId}/actualizar`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(filteredData),
    });
    return handleResponse(response);
  }
};

/**
 * DELETE /api/v1/mayoreo/productos/{mayoreo_id}/eliminar
 * Eliminar producto de mayoreo (soft delete - marca como inactivo)
 * Requiere rol: administrador
 */
export const eliminarProductoMayoreo = async (mayoreoId: number) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/mayoreo/productos/${mayoreoId}/eliminar`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 3. VENTAS DE MAYOREO ==========

/**
 * POST /api/v1/mayoreo/ventas/registrar
 * Registrar nueva venta de mayoreo (descuenta stock automáticamente)
 * Requiere rol: administrador
 * 
 * Proceso automático:
 * - Calcula total_venta = cantidad_cajas_vendidas × precio_unitario_venta
 * - Descuenta cantidad del inventario
 * - Registra fecha_venta automáticamente
 * - Valida stock suficiente
 */
export const registrarVentaMayoreo = async (ventaData: VentaMayoreoCreate): Promise<VentaMayoreoResponse> => {
  const response = await fetch(`${BACKEND_URL}/api/v1/mayoreo/ventas/registrar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(ventaData),
  });
  return handleResponse(response);
};

/**
 * GET /api/v1/mayoreo/ventas/listar
 * Listar todas las ventas de mayoreo
 * Requiere rol: administrador
 */
export const listarVentasMayoreo = async () => {
  const response = await fetch(`${BACKEND_URL}/api/v1/mayoreo/ventas/listar`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

/**
 * GET /api/v1/mayoreo/productos/{mayoreo_id}/ventas
 * Historial de ventas de un producto específico
 * Requiere rol: administrador
 */
export const obtenerVentasProductoMayoreo = async (mayoreoId: number) => {
  const response = await fetch(`${BACKEND_URL}/api/v1/mayoreo/productos/${mayoreoId}/ventas`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ========== 4. ESTADÍSTICAS ==========

/**
 * GET /api/v1/mayoreo/estadisticas
 * Obtener estadísticas generales de mayoreo
 * Requiere rol: administrador
 * 
 * Métricas incluidas:
 * - total_productos: Cantidad de productos activos
 * - total_cajas_disponibles: Total de cajas en inventario
 * - valor_total_inventario: Valor total del stock
 * - total_ventas: Cantidad total de ventas realizadas
 * - valor_total_ventas: Monto total vendido
 */
export const obtenerEstadisticasMayoreo = async (): Promise<EstadisticasMayoreoResponse> => {
  const response = await fetch(`${BACKEND_URL}/api/v1/mayoreo/estadisticas`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};
