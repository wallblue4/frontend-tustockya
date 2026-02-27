import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import {
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  BarChart3,
  Plus,
  Edit,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { EmptyState } from '../../components/admin/ErrorState';
import { FullScreenPhotoCapture } from '../../components/admin/FullScreenPhotoCapture';
import {
  crearProductoMayoreo,
  listarProductosMayoreo,
  actualizarProductoMayoreo,
  eliminarProductoMayoreo,
  registrarVentaMayoreo,
  listarVentasMayoreo,
  obtenerVentasProductoMayoreo,
  obtenerEstadisticasMayoreo,
} from '../../services/adminMayoreoAPI';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { ProductoMayoreo, VentaMayoreo, EstadisticasMayoreo } from '../../types/admin';

// ========== INLINE MODAL: Crear Producto Mayoreo ==========

const CreateProductoMayoreoModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: {
    modelo: string;
    cantidad_cajas_disponibles: number;
    pares_por_caja: number;
    precio: number;
    tallas?: string;
    foto?: File | null;
  }) => void;
}> = ({ onClose, onSubmit }) => {
  const [modelo, setModelo] = useState('');
  const [cantidadCajas, setCantidadCajas] = useState<number>(0);
  const [paresPorCaja, setParesPorCaja] = useState<number>(0);
  const [precio, setPrecio] = useState<number>(0);
  const [tallas, setTallas] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoTaken = (_url: string | null, blob?: Blob) => {
    if (blob) {
      const file = new File([blob], 'foto_producto.jpg', { type: 'image/jpeg' });
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(blob));
    }
  };

  const handleSubmit = async () => {
    if (!modelo.trim()) { alert('El modelo es obligatorio'); return; }
    if (cantidadCajas <= 0) { alert('La cantidad de cajas debe ser mayor a 0'); return; }
    if (paresPorCaja <= 0) { alert('Los pares por caja deben ser mayor a 0'); return; }
    if (precio <= 0) { alert('El precio debe ser mayor a 0'); return; }

    setSubmitting(true);
    try {
      await onSubmit({
        modelo: modelo.trim(),
        cantidad_cajas_disponibles: cantidadCajas,
        pares_por_caja: paresPorCaja,
        precio,
        tallas: tallas.trim() || undefined,
        foto: fotoFile,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">Nuevo Producto Mayoreo</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <Input
            label="Modelo *"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Ej: Nike Air Max 90"
          />
          <Input
            label="Cantidad de Cajas *"
            type="number"
            value={cantidadCajas || ''}
            onChange={(e) => setCantidadCajas(parseInt(e.target.value) || 0)}
            placeholder="0"
            min={1}
          />
          <Input
            label="Pares por Caja *"
            type="number"
            value={paresPorCaja || ''}
            onChange={(e) => setParesPorCaja(parseInt(e.target.value) || 0)}
            placeholder="0"
            min={1}
          />
          <Input
            label="Precio por Caja *"
            type="number"
            value={precio || ''}
            onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
            placeholder="0"
            min={1}
          />
          <Input
            label="Tallas (opcional)"
            value={tallas}
            onChange={(e) => setTallas(e.target.value)}
            placeholder="Ej: 35-42 o 36,37,38,39,40"
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Foto (opcional)</label>
            <FullScreenPhotoCapture onPhotoTaken={handlePhotoTaken} hideInternalPreview />
            {fotoPreview && (
              <div className="mt-3">
                <img src={fotoPreview} alt="Preview" className="w-full max-w-xs rounded-lg shadow border object-cover" />
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} isLoading={submitting}>Crear Producto</Button>
        </div>
      </div>
    </div>
  );
};

// ========== INLINE MODAL: Editar Producto Mayoreo ==========

const EditProductoMayoreoModal: React.FC<{
  producto: ProductoMayoreo;
  onClose: () => void;
  onSubmit: (id: number, data: any) => void;
  onDelete: (id: number) => void;
}> = ({ producto, onClose, onSubmit, onDelete }) => {
  const [modelo, setModelo] = useState(producto.modelo);
  const [cantidadCajas, setCantidadCajas] = useState(producto.cantidad_cajas_disponibles);
  const [paresPorCaja, setParesPorCaja] = useState(producto.pares_por_caja);
  const [precio, setPrecio] = useState(producto.precio);
  const [tallas, setTallas] = useState(producto.tallas || '');
  const [isActive, setIsActive] = useState(producto.is_active);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoTaken = (_url: string | null, blob?: Blob) => {
    if (blob) {
      const file = new File([blob], 'foto_producto.jpg', { type: 'image/jpeg' });
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(blob));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const updatedData: any = {};
      if (modelo !== producto.modelo) updatedData.modelo = modelo;
      if (cantidadCajas !== producto.cantidad_cajas_disponibles) updatedData.cantidad_cajas_disponibles = cantidadCajas;
      if (paresPorCaja !== producto.pares_por_caja) updatedData.pares_por_caja = paresPorCaja;
      if (precio !== producto.precio) updatedData.precio = precio;
      if (tallas !== (producto.tallas || '')) updatedData.tallas = tallas;
      if (isActive !== producto.is_active) updatedData.is_active = isActive;
      if (fotoFile) updatedData.foto = fotoFile;

      if (Object.keys(updatedData).length === 0) {
        alert('No se han realizado cambios');
        setSubmitting(false);
        return;
      }

      await onSubmit(producto.id, updatedData);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Eliminar el producto "${producto.modelo}"? Esta accion no se puede deshacer.`)) {
      onDelete(producto.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">Editar Producto Mayoreo</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <Input
            label="Modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Modelo del producto"
          />
          <Input
            label="Cantidad de Cajas"
            type="number"
            value={cantidadCajas}
            onChange={(e) => setCantidadCajas(parseInt(e.target.value) || 0)}
            min={0}
          />
          <Input
            label="Pares por Caja"
            type="number"
            value={paresPorCaja}
            onChange={(e) => setParesPorCaja(parseInt(e.target.value) || 0)}
            min={1}
          />
          <Input
            label="Precio por Caja"
            type="number"
            value={precio}
            onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
            min={0}
          />
          <Input
            label="Tallas"
            value={tallas}
            onChange={(e) => setTallas(e.target.value)}
            placeholder="Ej: 35-42"
          />
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is-active-checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="is-active-checkbox" className="text-sm font-medium text-foreground">
              Producto activo
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Foto</label>
            {producto.foto && !fotoPreview && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">Foto actual:</p>
                <img src={producto.foto} alt={producto.modelo} className="w-full max-w-xs rounded-lg shadow border object-cover" />
              </div>
            )}
            <FullScreenPhotoCapture onPhotoTaken={handlePhotoTaken} hideInternalPreview />
            {fotoPreview && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Nueva foto:</p>
                <img src={fotoPreview} alt="Preview" className="w-full max-w-xs rounded-lg shadow border object-cover" />
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-between">
          <Button variant="destructive" onClick={handleDelete} disabled={submitting}>Eliminar</Button>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleSubmit} isLoading={submitting}>Guardar Cambios</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== INLINE MODAL: Registrar Venta Mayoreo ==========

const RegistrarVentaMayoreoModal: React.FC<{
  producto: ProductoMayoreo;
  onClose: () => void;
  onSubmit: (ventaData: {
    mayoreo_id: number;
    cantidad_cajas_vendidas: number;
    precio_unitario_venta: number;
    notas?: string;
  }) => void;
}> = ({ producto, onClose, onSubmit }) => {
  const [cantidadCajasVendidas, setCantidadCajasVendidas] = useState<number>(1);
  const [precioUnitarioVenta, setPrecioUnitarioVenta] = useState<number>(producto.precio);
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalVenta = cantidadCajasVendidas * precioUnitarioVenta;

  const handleSubmit = async () => {
    if (cantidadCajasVendidas <= 0) { alert('La cantidad de cajas debe ser mayor a 0'); return; }
    if (cantidadCajasVendidas > producto.cantidad_cajas_disponibles) {
      alert(`Solo hay ${producto.cantidad_cajas_disponibles} cajas disponibles`);
      return;
    }
    if (precioUnitarioVenta <= 0) { alert('El precio unitario debe ser mayor a 0'); return; }

    setSubmitting(true);
    try {
      await onSubmit({
        mayoreo_id: producto.id,
        cantidad_cajas_vendidas: cantidadCajasVendidas,
        precio_unitario_venta: precioUnitarioVenta,
        notas: notas.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">Registrar Venta Mayoreo</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Info del producto */}
          <div className="bg-muted/20 rounded-lg p-4 border border-border">
            <div className="flex items-center space-x-3">
              {producto.foto ? (
                <img src={producto.foto} alt={producto.modelo} className="w-16 h-16 rounded-lg object-cover border border-border" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted/30 flex items-center justify-center border border-border">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">{producto.modelo}</p>
                <p className="text-sm text-muted-foreground">Cajas disponibles: {producto.cantidad_cajas_disponibles}</p>
                <p className="text-sm text-muted-foreground">Precio: {formatCurrency(producto.precio)}/caja</p>
                {producto.tallas && <p className="text-sm text-muted-foreground">Tallas: {producto.tallas}</p>}
              </div>
            </div>
          </div>

          <Input
            label="Cantidad de Cajas a Vender *"
            type="number"
            value={cantidadCajasVendidas}
            onChange={(e) => setCantidadCajasVendidas(parseInt(e.target.value) || 0)}
            min={1}
            max={producto.cantidad_cajas_disponibles}
          />
          <Input
            label="Precio Unitario de Venta (por caja) *"
            type="number"
            value={precioUnitarioVenta}
            onChange={(e) => setPrecioUnitarioVenta(parseFloat(e.target.value) || 0)}
            min={1}
          />
          <Input
            label="Notas (opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas adicionales sobre la venta"
          />

          {/* Total calculado */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
            <p className="text-sm text-muted-foreground">Total de la venta:</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalVenta)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {cantidadCajasVendidas} caja{cantidadCajasVendidas !== 1 ? 's' : ''} x {formatCurrency(precioUnitarioVenta)}
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} isLoading={submitting}>Registrar Venta</Button>
        </div>
      </div>
    </div>
  );
};

// ========== INLINE MODAL: Ver Ventas de Producto ==========

const VentasProductoModal: React.FC<{
  producto: ProductoMayoreo;
  ventas: VentaMayoreo[];
  onClose: () => void;
}> = ({ producto, ventas, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">
            Ventas de: {producto.modelo}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
        </div>
        <div className="px-6 py-4">
          {ventas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full bg-card text-foreground border border-border rounded-lg overflow-hidden">
                <thead className="bg-popover text-popover-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Cajas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Precio/Caja</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((venta) => (
                    <tr key={venta.id} className="border-b border-border last:border-b-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 text-sm">#{venta.id}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(venta.fecha_venta)}</td>
                      <td className="px-4 py-3 text-sm">{venta.cantidad_cajas_vendidas}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(venta.precio_unitario_venta)}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(venta.total_venta)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{venta.notas || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Sin ventas"
              description="Este producto aun no tiene ventas registradas"
              icon={<ShoppingBag className="h-12 w-12 text-gray-400" />}
            />
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
};

// ========== MAIN PAGE COMPONENT ==========

export const WholesalePage: React.FC = () => {
  const [productosMayoreo, setProductosMayoreo] = useState<ProductoMayoreo[]>([]);
  const [ventasMayoreo, setVentasMayoreo] = useState<VentaMayoreo[]>([]);
  const [estadisticasMayoreo, setEstadisticasMayoreo] = useState<EstadisticasMayoreo | null>(null);
  const [selectedProductoMayoreo, setSelectedProductoMayoreo] = useState<ProductoMayoreo | null>(null);

  const [showCreateProductoMayoreoModal, setShowCreateProductoMayoreoModal] = useState(false);
  const [showEditProductoMayoreoModal, setShowEditProductoMayoreoModal] = useState(false);
  const [showRegistrarVentaMayoreoModal, setShowRegistrarVentaMayoreoModal] = useState(false);
  const [showVentasProductoModal, setShowVentasProductoModal] = useState(false);

  const [ventasProductoSeleccionado, setVentasProductoSeleccionado] = useState<VentaMayoreo[]>([]);
  const [loading, setLoading] = useState(false);

  // ---------- Data Loading ----------

  const loadMayoreoData = async () => {
    setLoading(true);
    try {
      const [productosRes, ventasRes, estadisticasRes] = await Promise.all([
        listarProductosMayoreo(),
        listarVentasMayoreo(),
        obtenerEstadisticasMayoreo(),
      ]);
      setProductosMayoreo(Array.isArray(productosRes) ? productosRes : productosRes.data || productosRes.productos || []);
      setVentasMayoreo(Array.isArray(ventasRes) ? ventasRes : ventasRes.data || ventasRes.ventas || []);
      setEstadisticasMayoreo(estadisticasRes);
    } catch (error) {
      console.error('Error loading mayoreo data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMayoreoData();
  }, []);

  // ---------- Handlers ----------

  const handleCreateProductoMayoreo = async (data: {
    modelo: string;
    cantidad_cajas_disponibles: number;
    pares_por_caja: number;
    precio: number;
    tallas?: string;
    foto?: File | null;
  }) => {
    try {
      await crearProductoMayoreo(data);
      await loadMayoreoData();
      setShowCreateProductoMayoreoModal(false);
      alert('Producto de mayoreo creado exitosamente');
    } catch (error: any) {
      console.error('Error creating producto mayoreo:', error);
      alert('Error al crear producto: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleUpdateProductoMayoreo = async (id: number, data: any) => {
    try {
      await actualizarProductoMayoreo(id, data);
      await loadMayoreoData();
      setShowEditProductoMayoreoModal(false);
      setSelectedProductoMayoreo(null);
      alert('Producto actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating producto mayoreo:', error);
      alert('Error al actualizar producto: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDeleteProductoMayoreo = async (id: number) => {
    try {
      await eliminarProductoMayoreo(id);
      await loadMayoreoData();
      setShowEditProductoMayoreoModal(false);
      setSelectedProductoMayoreo(null);
      alert('Producto eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting producto mayoreo:', error);
      alert('Error al eliminar producto: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleRegistrarVentaMayoreo = async (ventaData: {
    mayoreo_id: number;
    cantidad_cajas_vendidas: number;
    precio_unitario_venta: number;
    notas?: string;
  }) => {
    try {
      const result = await registrarVentaMayoreo(ventaData);
      await loadMayoreoData();
      setShowRegistrarVentaMayoreoModal(false);
      setSelectedProductoMayoreo(null);
      alert(
        `Venta registrada exitosamente!\n\n` +
        `Cajas vendidas: ${ventaData.cantidad_cajas_vendidas}\n` +
        `Precio unitario: ${formatCurrency(ventaData.precio_unitario_venta)}\n` +
        `Total: ${formatCurrency(result.total_venta || ventaData.cantidad_cajas_vendidas * ventaData.precio_unitario_venta)}`
      );
    } catch (error: any) {
      console.error('Error registering venta mayoreo:', error);
      alert('Error al registrar venta: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleVerVentasProducto = async (producto: ProductoMayoreo) => {
    try {
      const ventas = await obtenerVentasProductoMayoreo(producto.id);
      setVentasProductoSeleccionado(Array.isArray(ventas) ? ventas : ventas.data || ventas.ventas || []);
      setSelectedProductoMayoreo(producto);
      setShowVentasProductoModal(true);
    } catch (error: any) {
      console.error('Error fetching ventas producto:', error);
      alert('Error al obtener ventas: ' + (error.message || 'Error desconocido'));
    }
  };

  // ---------- Render ----------

  const recentVentas = [...ventasMayoreo].sort((a, b) =>
    new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime()
  ).slice(0, 10);

  return (
    <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-foreground">Gestion de Ventas al Por Mayor</h2>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={loadMayoreoData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => setShowCreateProductoMayoreoModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {estadisticasMayoreo && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{estadisticasMayoreo.total_productos}</p>
              <p className="text-sm text-muted-foreground">Productos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ShoppingBag className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">{estadisticasMayoreo.total_cajas_disponibles}</p>
              <p className="text-sm text-muted-foreground">Cajas Disponibles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(estadisticasMayoreo.valor_total_inventario)}</p>
              <p className="text-sm text-muted-foreground">Valor Inventario</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{estadisticasMayoreo.total_ventas}</p>
              <p className="text-sm text-muted-foreground">Ventas Realizadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(estadisticasMayoreo.valor_total_ventas)}</p>
              <p className="text-sm text-muted-foreground">Total Vendido</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Productos de Mayoreo</h3>
        </CardHeader>
        <CardContent className="p-0">
          {productosMayoreo.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full bg-card text-foreground border border-border rounded-lg overflow-hidden">
                <thead className="bg-popover text-popover-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Modelo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Tallas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Cajas Disp.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Pares/Caja</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Precio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosMayoreo.map((producto) => (
                    <tr key={producto.id} className="border-b border-border last:border-b-0 bg-card hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          {producto.foto ? (
                            <img
                              src={producto.foto}
                              alt={producto.modelo}
                              className="w-10 h-10 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center border border-border">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{producto.modelo}</p>
                            <p className="text-xs text-muted-foreground">ID: {producto.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{producto.tallas || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={producto.cantidad_cajas_disponibles > 5 ? 'success' : producto.cantidad_cajas_disponibles > 0 ? 'warning' : 'error'}>
                          {producto.cantidad_cajas_disponibles}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{producto.pares_por_caja}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{formatCurrency(producto.precio)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={producto.is_active ? 'success' : 'error'}>
                          {producto.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={producto.cantidad_cajas_disponibles <= 0 || !producto.is_active}
                            onClick={() => {
                              setSelectedProductoMayoreo(producto);
                              setShowRegistrarVentaMayoreoModal(true);
                            }}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Vender
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerVentasProducto(producto)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ventas
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedProductoMayoreo(producto);
                              setShowEditProductoMayoreoModal(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                title="No hay productos de mayoreo"
                description="Agrega tu primer producto para comenzar a gestionar ventas al por mayor"
                icon={<Package className="h-12 w-12 text-gray-400" />}
                action={
                  <Button onClick={() => setShowCreateProductoMayoreoModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sales */}
      {recentVentas.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Ventas Recientes</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full bg-card text-foreground border border-border rounded-lg overflow-hidden">
                <thead className="bg-popover text-popover-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Cajas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Precio/Caja</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-border">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVentas.map((venta) => (
                    <tr key={venta.id} className="border-b border-border last:border-b-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 text-sm">#{venta.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {venta.mayoreo_producto?.modelo || `Producto #${venta.mayoreo_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(venta.fecha_venta)}</td>
                      <td className="px-4 py-3 text-sm">{venta.cantidad_cajas_vendidas}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(venta.precio_unitario_venta)}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(venta.total_venta)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{venta.notas || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showCreateProductoMayoreoModal && (
        <CreateProductoMayoreoModal
          onClose={() => setShowCreateProductoMayoreoModal(false)}
          onSubmit={handleCreateProductoMayoreo}
        />
      )}

      {showEditProductoMayoreoModal && selectedProductoMayoreo && (
        <EditProductoMayoreoModal
          producto={selectedProductoMayoreo}
          onClose={() => { setShowEditProductoMayoreoModal(false); setSelectedProductoMayoreo(null); }}
          onSubmit={handleUpdateProductoMayoreo}
          onDelete={handleDeleteProductoMayoreo}
        />
      )}

      {showRegistrarVentaMayoreoModal && selectedProductoMayoreo && (
        <RegistrarVentaMayoreoModal
          producto={selectedProductoMayoreo}
          onClose={() => { setShowRegistrarVentaMayoreoModal(false); setSelectedProductoMayoreo(null); }}
          onSubmit={handleRegistrarVentaMayoreo}
        />
      )}

      {showVentasProductoModal && selectedProductoMayoreo && (
        <VentasProductoModal
          producto={selectedProductoMayoreo}
          ventas={ventasProductoSeleccionado}
          onClose={() => { setShowVentasProductoModal(false); setSelectedProductoMayoreo(null); setVentasProductoSeleccionado([]); }}
        />
      )}
    </div>
  );
};
