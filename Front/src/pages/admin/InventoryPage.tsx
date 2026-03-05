import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import {
  Package,
  DollarSign,
  MapPin,
  Plus,
  Edit,
  Activity,
  RefreshCw,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Camera,
  Video,
} from 'lucide-react';

import { EmptyState } from '../../components/admin/ErrorState';
import { AdjustInventoryModal } from '../../components/admin/AdjustInventoryModal';
import { AdjustPriceModal } from '../../components/admin/AdjustPriceModal';
import { AddSizeModal } from '../../components/admin/AddSizeModal';
import { AssignProductToLocationModal } from '../../components/admin/AssignProductToLocationModal';
import { EditProductInfoModal } from '../../components/admin/EditProductInfoModal';
import { FullScreenCameraCapture } from '../../components/admin/FullScreenCameraCapture';
import { FullScreenPhotoCapture } from '../../components/admin/FullScreenPhotoCapture';

import {
  adjustInventory,
  adjustProductPrice,
  updateProductInfo,
  fetchAdminInventory,
  deleteProductReference,
  updateProductImage,
  retrainProductVideo,
  processVideoInventoryEntry,
} from '../../services/adminAPI';

import type { AdminInventoryLocation, AdminInventoryProduct, AdminInventorySize } from '../../types';
import { useAdmin } from '../../context/AdminContext';
import { formatCurrency } from '../../utils/formatters';

// ========== HELPER FUNCTIONS ==========

const findSiblingLocation = (
  locationId: number,
  inventory: AdminInventoryLocation[]
): AdminInventoryLocation | null => {
  const currentLocation = inventory.find((loc) => loc.location_id === locationId);
  if (!currentLocation?.sibling_pair_id) return null;
  return (
    inventory.find(
      (loc) => loc.sibling_pair_id === currentLocation.sibling_pair_id && loc.location_id !== locationId
    ) || null
  );
};

const getOppositeFootType = (inventoryType: 'pair' | 'left_only' | 'right_only'): 'left_only' | 'right_only' | null => {
  if (inventoryType === 'left_only') return 'right_only';
  if (inventoryType === 'right_only') return 'left_only';
  return null;
};

const getInventoryTypeLabel = (type: string) => {
  switch (type) {
    case 'pair':
      return 'Par';
    case 'left_only':
      return 'Izq.';
    case 'right_only':
      return 'Der.';
    default:
      return type;
  }
};

const getInventoryTypeFullLabel = (type: string) => {
  switch (type) {
    case 'pair':
      return 'Par completo';
    case 'left_only':
      return 'Pie izquierdo';
    case 'right_only':
      return 'Pie derecho';
    default:
      return type;
  }
};

const getInventoryTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'pair':
      return 'bg-success/10 text-success border-success/20';
    case 'left_only':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'right_only':
      return 'bg-info/10 text-info border-info/20';
    default:
      return 'bg-primary/10 text-primary border-primary/20';
  }
};

const getAdminInventoryStats = (locations: AdminInventoryLocation[]) => {
  let totalProducts = 0;
  let totalUnits = 0;
  let totalValue = 0;

  locations.forEach((location) => {
    location.products.forEach((product) => {
      totalProducts++;
      totalUnits += product.total_quantity;
      totalValue += parseFloat(product.unit_price) * product.total_quantity;
    });
  });

  return { totalProducts, totalUnits, totalValue };
};

// ========== COMPONENT ==========

export const InventoryPage: React.FC = () => {
  const { locations } = useAdmin();

  // Tab state
  const [inventoryActiveTab, setInventoryActiveTab] = useState<'view' | 'entry'>('view');

  // Admin Inventory states
  const [adminInventory, setAdminInventory] = useState<AdminInventoryLocation[]>([]);
  const [adminInventoryLoading, setAdminInventoryLoading] = useState(false);
  const [adminInventoryError, setAdminInventoryError] = useState<string | null>(null);
  const [selectedAdminLocation, setSelectedAdminLocation] = useState<number | 'all'>('all');
  const [adminInventorySearchTerm, setAdminInventorySearchTerm] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Inventory adjustment modal states
  const [showAdjustInventoryModal, setShowAdjustInventoryModal] = useState(false);
  const [showAdjustPriceModal, setShowAdjustPriceModal] = useState(false);
  const [showEditProductInfoModal, setShowEditProductInfoModal] = useState(false);
  const [showAddSizeModal, setShowAddSizeModal] = useState(false);
  const [showAssignProductModal, setShowAssignProductModal] = useState(false);

  const [selectedSizeForAdjustment, setSelectedSizeForAdjustment] = useState<{
    brand: string;
    model: string;
    reference_code: string;
    location_id: number;
    location_name: string;
    size: string;
    inventory_type: 'pair' | 'left_only' | 'right_only';
    current_quantity: number;
    siblingInfo?: { sibling_location_name: string; opposite_inventory_type_label: string } | null;
  } | null>(null);

  const [selectedProductForPriceAdjustment, setSelectedProductForPriceAdjustment] = useState<{
    brand: string;
    model: string;
    reference_code: string;
    current_price: number;
    image_url?: string;
  } | null>(null);

  const [selectedProductForInfoEdit, setSelectedProductForInfoEdit] = useState<{
    brand: string;
    model: string;
    reference_code: string;
    image_url?: string;
  } | null>(null);

  const [selectedProductForAddSize, setSelectedProductForAddSize] = useState<{
    brand: string;
    model: string;
    reference_code: string;
    location_id: number;
    location_name: string;
    existing_sizes: { size: string; inventory_type: 'pair' | 'left_only' | 'right_only' }[];
    siblingLocationInfo?: { sibling_location_name: string } | null;
  } | null>(null);

  // Edit dropdown
  const [openEditDropdown, setOpenEditDropdown] = useState<string | null>(null);
  const [editDropdownPos, setEditDropdownPos] = useState<{ top: number; left: number } | null>(null);

  // Delete / image update states
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [updatingImageRef, setUpdatingImageRef] = useState<string | null>(null);

  // Retrain modal states
  const [showRetrainModal, setShowRetrainModal] = useState(false);
  const [retrainProduct, setRetrainProduct] = useState<AdminInventoryProduct | null>(null);
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainFormData, setRetrainFormData] = useState({
    video_file: null as File | null,
    warehouse_location_id: '',
    notes: '',
  });

  // Ref for hidden image input
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Video inventory form state
  const [videoInventoryForm, setVideoInventoryForm] = useState({
    product_brand: '',
    product_model: '',
    unit_price: 0,
    box_price: 0,
    sizes_distribution: [
      {
        size: '',
        pairs: [{ location_id: 0, quantity: 0 }],
        left_feet: [] as Array<{ location_id: number; quantity: number }>,
        right_feet: [] as Array<{ location_id: number; quantity: number }>,
      },
    ],
    reference_image: null as File | null,
    video_file: null as File | null,
  });

  // Captured file previews
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);

  // Prevent double submission
  const [isSubmittingVideoInventory, setIsSubmittingVideoInventory] = useState(false);

  // ========== EFFECTS ==========

  useEffect(() => {
    loadAdminInventory();
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (capturedPhotoUrl) {
        URL.revokeObjectURL(capturedPhotoUrl);
      }
      if (capturedVideoUrl) {
        URL.revokeObjectURL(capturedVideoUrl);
      }
    };
  }, [capturedPhotoUrl, capturedVideoUrl]);

  // ========== DATA LOADING ==========

  const loadAdminInventory = async () => {
    try {
      setAdminInventoryLoading(true);
      setAdminInventoryError(null);
      console.log('Cargando inventario administrativo...');

      const response = await fetchAdminInventory();
      console.log('Inventario administrativo cargado:', response);

      const inventoryLocations = response.locations || [];
      setAdminInventory(inventoryLocations);
    } catch (error: any) {
      console.error('Error cargando inventario administrativo:', error);
      setAdminInventoryError(error.message || 'Error al cargar el inventario');
      setAdminInventory([]);
    } finally {
      setAdminInventoryLoading(false);
    }
  };

  // ========== FILTERING ==========

  const getFilteredAdminInventory = () => {
    let filteredLocations = adminInventory;

    // Filter by selected location
    if (selectedAdminLocation !== 'all') {
      filteredLocations = adminInventory.filter((location) => location.location_id === selectedAdminLocation);
    }

    // Filter products by search term
    if (adminInventorySearchTerm) {
      const searchTerm = adminInventorySearchTerm.toLowerCase();
      filteredLocations = filteredLocations.map((location) => ({
        ...location,
        products: location.products.filter(
          (product) =>
            product.brand.toLowerCase().includes(searchTerm) ||
            product.model.toLowerCase().includes(searchTerm) ||
            product.reference_code.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm)) ||
            (product.color_info && product.color_info.toLowerCase().includes(searchTerm))
        ),
      }));
    }

    // Filter out empty locations
    return filteredLocations.filter((location) => location.products.length > 0);
  };

  const toggleProductExpansion = (productKey: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productKey)) {
        newSet.delete(productKey);
      } else {
        newSet.add(productKey);
      }
      return newSet;
    });
  };

  // ========== MODAL OPENERS ==========

  const handleOpenAdjustInventoryModal = (
    product: AdminInventoryProduct,
    size: AdminInventorySize,
    locationId: number,
    locationName: string
  ) => {
    const invType = size.inventory_type || 'pair';
    const oppositeType = getOppositeFootType(invType);
    const sibling = oppositeType ? findSiblingLocation(locationId, adminInventory) : null;

    setSelectedSizeForAdjustment({
      brand: product.brand,
      model: product.model,
      reference_code: product.reference_code,
      location_id: locationId,
      location_name: locationName,
      size: size.size,
      inventory_type: invType,
      current_quantity: size.quantity,
      siblingInfo:
        sibling && oppositeType
          ? {
              sibling_location_name: sibling.location_name,
              opposite_inventory_type_label: getInventoryTypeFullLabel(oppositeType),
            }
          : null,
    });
    setShowAdjustInventoryModal(true);
  };

  const handleOpenAdjustPriceModal = (product: AdminInventoryProduct) => {
    setSelectedProductForPriceAdjustment({
      brand: product.brand,
      model: product.model,
      reference_code: product.reference_code,
      current_price: parseFloat(product.unit_price),
      image_url: product.image_url,
    });
    setShowAdjustPriceModal(true);
  };

  const handleOpenEditProductInfoModal = (product: AdminInventoryProduct) => {
    setSelectedProductForInfoEdit({
      brand: product.brand,
      model: product.model,
      reference_code: product.reference_code,
      image_url: product.image_url,
    });
    setShowEditProductInfoModal(true);
  };

  const handleOpenAddSizeModal = (product: AdminInventoryProduct, locationId: number, locationName: string) => {
    const sibling = findSiblingLocation(locationId, adminInventory);
    setSelectedProductForAddSize({
      brand: product.brand,
      model: product.model,
      reference_code: product.reference_code,
      location_id: locationId,
      location_name: locationName,
      existing_sizes: product.sizes.map((s) => ({
        size: s.size,
        inventory_type: s.inventory_type || ('pair' as const),
      })),
      siblingLocationInfo: sibling ? { sibling_location_name: sibling.location_name } : null,
    });
    setShowAddSizeModal(true);
  };

  const handleOpenEditDropdown = (refCode: string, buttonEl: HTMLButtonElement) => {
    if (openEditDropdown === refCode) {
      setOpenEditDropdown(null);
      setEditDropdownPos(null);
      return;
    }
    const rect = buttonEl.getBoundingClientRect();
    setEditDropdownPos({ top: rect.bottom + 4, left: rect.right });
    setOpenEditDropdown(refCode);
  };

  const closeEditDropdown = () => {
    setOpenEditDropdown(null);
    setEditDropdownPos(null);
  };

  const handleOpenRetrainModal = (product: AdminInventoryProduct) => {
    setRetrainProduct(product);
    setRetrainFormData({ video_file: null, warehouse_location_id: '', notes: '' });
    setShowRetrainModal(true);
  };

  // ========== INVENTORY HANDLERS ==========

  const handleAddSize = async (data: {
    location_id: number;
    product_reference: string;
    size: string;
    adjustment_type: 'set_quantity';
    quantity: number;
    reason: string;
    inventory_type: 'pair' | 'left_only' | 'right_only';
  }) => {
    try {
      const response = await adjustInventory(data);
      console.log('Talla agregada:', response);

      // Sibling sync logic
      let siblingMessage = '';
      const oppositeType = getOppositeFootType(data.inventory_type);
      if (oppositeType) {
        const sibling = findSiblingLocation(data.location_id, adminInventory);
        if (sibling) {
          try {
            await adjustInventory({
              ...data,
              location_id: sibling.location_id,
              inventory_type: oppositeType,
              reason: `[SYNC] ${data.reason || 'Talla sincronizada desde local hermano'}`,
            });
            siblingMessage = `\nTambien se agrego ${getInventoryTypeFullLabel(oppositeType)} en ${sibling.location_name}.`;
          } catch (syncError) {
            console.error('Error en sync con hermano:', syncError);
            siblingMessage = `\n⚠️ Advertencia: la talla se agrego pero fallo el sync con ${sibling.location_name}.`;
          }
        }
      }

      await loadAdminInventory();

      alert(`Talla agregada exitosamente.

Producto: ${data.product_reference}
Nueva Talla: ${data.size}
Cantidad: ${data.quantity}
Tipo: ${data.inventory_type === 'pair' ? 'Par completo' : data.inventory_type === 'left_only' ? 'Pie izquierdo' : 'Pie derecho'}${siblingMessage}`);

      setShowAddSizeModal(false);
      setSelectedProductForAddSize(null);
    } catch (error: any) {
      console.error('Error agregando talla:', error);
      alert('Error al agregar talla: ' + (error.message || 'Error desconocido'));
      throw error;
    }
  };

  const handleAssignProductToLocation = async (data: {
    location_id: number;
    product_reference: string;
    size_quantities: Record<string, number>;
    adjustment_type: 'set_quantity';
    inventory_type: 'pair' | 'left_only' | 'right_only';
  }) => {
    try {
      const defaultReason = 'Asignacion de producto a ubicacion';
      let siblingMessage = '';

      for (const [size, quantity] of Object.entries(data.size_quantities)) {
        const payload = {
          location_id: data.location_id,
          product_reference: data.product_reference,
          size,
          adjustment_type: data.adjustment_type,
          quantity,
          reason: defaultReason,
          inventory_type: data.inventory_type,
        };
        await adjustInventory(payload);

        // Sibling sync logic
        const oppositeType = getOppositeFootType(data.inventory_type);
        if (oppositeType) {
          const sibling = findSiblingLocation(data.location_id, adminInventory);
          if (sibling) {
            try {
              await adjustInventory({
                ...payload,
                location_id: sibling.location_id,
                inventory_type: oppositeType,
                reason: `[SYNC] ${defaultReason}`,
              });
              if (!siblingMessage) {
                siblingMessage = `\nTambien se asigno ${getInventoryTypeFullLabel(oppositeType)} en ${sibling.location_name}.`;
              }
            } catch (syncError) {
              console.error('Error en sync con hermano:', syncError);
              siblingMessage = `\n⚠️ Advertencia: fallo el sync con ${sibling.location_name}.`;
            }
          }
        }
      }

      await loadAdminInventory();

      const locationName = locations.find((l) => l.id === data.location_id)?.name || `ID ${data.location_id}`;
      const sizeSummary = Object.entries(data.size_quantities)
        .map(([size, qty]) => `${size} (${qty})`)
        .join(', ');
      alert(`Producto asignado exitosamente.

Producto: ${data.product_reference}
Ubicacion: ${locationName}
Talla(s): ${sizeSummary}
Tipo: ${data.inventory_type === 'pair' ? 'Par completo' : data.inventory_type === 'left_only' ? 'Pie izquierdo' : 'Pie derecho'}${siblingMessage}`);

      setShowAssignProductModal(false);
    } catch (error: any) {
      console.error('Error asignando producto:', error);
      alert('Error al asignar producto: ' + (error.message || 'Error desconocido'));
      throw error;
    }
  };

  const handleAdjustInventory = async (data: {
    location_id: number;
    product_reference: string;
    size: string;
    adjustment_type: 'set_quantity' | 'increment' | 'decrement';
    quantity: number;
    reason: string;
    inventory_type: 'pair' | 'left_only' | 'right_only';
  }) => {
    try {
      const response = await adjustInventory(data);
      console.log('Inventario ajustado:', response);

      // Sibling sync logic
      let siblingMessage = '';
      const oppositeType = getOppositeFootType(data.inventory_type);
      if (oppositeType) {
        const sibling = findSiblingLocation(data.location_id, adminInventory);
        if (sibling) {
          try {
            await adjustInventory({
              ...data,
              location_id: sibling.location_id,
              inventory_type: oppositeType,
              reason: `[SYNC] ${data.reason || 'Ajuste sincronizado desde local hermano'}`,
            });
            siblingMessage = `\nTambien se ajusto ${getInventoryTypeFullLabel(oppositeType)} en ${sibling.location_name}.`;
          } catch (syncError) {
            console.error('Error en sync con hermano:', syncError);
            siblingMessage = `\n⚠️ Advertencia: el ajuste principal fue exitoso pero fallo el sync con ${sibling.location_name}.`;
          }
        }
      }

      await loadAdminInventory();

      alert(`Inventario ajustado exitosamente.

Producto: ${data.product_reference}
Talla: ${data.size}
Ajuste: ${data.adjustment_type === 'set_quantity' ? 'Establecido a' : data.adjustment_type === 'increment' ? 'Incrementado en' : 'Decrementado en'} ${data.quantity}
Motivo: ${data.reason}${siblingMessage}`);

      setShowAdjustInventoryModal(false);
      setSelectedSizeForAdjustment(null);
    } catch (error: any) {
      console.error('Error ajustando inventario:', error);
      alert('Error al ajustar inventario: ' + (error.message || 'Error desconocido'));
      throw error;
    }
  };

  const handleAdjustPrice = async (data: {
    product_reference: string;
    new_unit_price: number;
    update_all_locations: boolean;
    location_id?: number | null;
  }) => {
    try {
      const response = await adjustProductPrice(data);
      console.log('Precio ajustado:', response);

      await loadAdminInventory();

      alert(`Precio actualizado exitosamente.

Producto: ${data.product_reference}
Nuevo precio: ${formatCurrency(data.new_unit_price)}
Alcance: ${data.update_all_locations ? 'Todas las ubicaciones' : 'Ubicacion especifica'}`);

      setShowAdjustPriceModal(false);
      setSelectedProductForPriceAdjustment(null);
    } catch (error: any) {
      console.error('Error ajustando precio:', error);
      alert('Error al ajustar precio: ' + (error.message || 'Error desconocido'));
      throw error;
    }
  };

  const handleEditProductInfo = async (data: { product_reference: string; brand: string; model: string }) => {
    try {
      const response = await updateProductInfo(data);
      console.log('Info actualizada:', response);

      await loadAdminInventory();

      const oldBrand = selectedProductForInfoEdit?.brand || '';
      const oldModel = selectedProductForInfoEdit?.model || '';
      const changes: string[] = [];
      if (data.brand !== oldBrand) changes.push(`Marca: ${oldBrand} → ${data.brand}`);
      if (data.model !== oldModel) changes.push(`Modelo: ${oldModel} → ${data.model}`);

      alert(`Informacion actualizada exitosamente.\n\nProducto: ${data.product_reference}\n${changes.join('\n')}`);

      setShowEditProductInfoModal(false);
      setSelectedProductForInfoEdit(null);
    } catch (error: any) {
      console.error('Error actualizando info:', error);
      alert('Error al actualizar informacion: ' + (error.message || 'Error desconocido'));
      throw error;
    }
  };

  const handleDeleteSize = async (
    product: AdminInventoryProduct,
    size: AdminInventorySize,
    locationId: number,
    locationName: string
  ) => {
    const typeLabel =
      size.inventory_type === 'pair' ? 'Par' : size.inventory_type === 'left_only' ? 'Pie izquierdo' : 'Pie derecho';
    const confirmed = window.confirm(
      `¿Eliminar talla ${size.size} (${typeLabel}) del producto ${product.brand} ${product.model} en ${locationName}?\n\nEsta accion pondra la cantidad en 0.`
    );
    if (!confirmed) return;

    try {
      await adjustInventory({
        location_id: locationId,
        product_reference: product.reference_code,
        size: size.size,
        adjustment_type: 'set_quantity',
        quantity: 0,
        reason: `Eliminacion de talla ${size.size} (${typeLabel}) - correccion de inventario`,
        inventory_type: size.inventory_type || 'pair',
      });
      await loadAdminInventory();
      alert(`Talla ${size.size} (${typeLabel}) eliminada exitosamente.`);
    } catch (error: any) {
      console.error('Error eliminando talla:', error);
      alert('Error al eliminar talla: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDeleteProductReference = async (product: AdminInventoryProduct) => {
    const confirmed = window.confirm(
      `¿Estas seguro de que deseas ELIMINAR COMPLETAMENTE la referencia "${product.brand} ${product.model}" (${product.reference_code})?\n\nEsta accion desactivara el producto y eliminara sus vectores de IA. No se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingProductId(product.product_id);
    try {
      const data = await deleteProductReference(product.product_id);

      if (data.jobs_with_errors > 0) {
        alert(
          `Referencia ${data.reference_code} eliminada.\n\n` +
            `Producto: ${data.brand} ${data.model}\n` +
            `Vectores de IA eliminados: ${data.vectors_deleted}\n` +
            `Jobs limpiados: ${data.jobs_cleaned}/${data.jobs_found}\n\n` +
            `${data.jobs_with_errors} job(s) con error al limpiar vectores de IA.\n` +
            `El producto fue desactivado correctamente.`
        );
      } else {
        alert(
          `Referencia ${data.reference_code} eliminada completamente.\n\n` +
            `Producto: ${data.brand} ${data.model}\n` +
            `Vectores de IA eliminados: ${data.vectors_deleted}\n` +
            `Jobs limpiados: ${data.jobs_cleaned}/${data.jobs_found}`
        );
      }

      await loadAdminInventory();
    } catch (error: any) {
      console.error('Error eliminando referencia:', error);
      alert(error.message || 'Error al eliminar la referencia.');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleUpdateProductImage = async (file: File) => {
    if (!updatingImageRef) return;

    try {
      const response = await updateProductImage(updatingImageRef, file);
      console.log('Imagen actualizada:', response);
      await loadAdminInventory();
      alert(`Imagen actualizada exitosamente para ${updatingImageRef}.`);
    } catch (error: any) {
      console.error('Error actualizando imagen:', error);
      alert('Error al actualizar imagen: ' + (error.message || 'Error desconocido'));
    } finally {
      setUpdatingImageRef(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleRetrainProduct = async () => {
    if (!retrainProduct) return;

    if (!retrainFormData.video_file) {
      alert('Por favor selecciona un archivo de video.');
      return;
    }
    if (!retrainFormData.warehouse_location_id) {
      alert('Por favor selecciona una bodega.');
      return;
    }

    setRetrainLoading(true);
    try {
      const response = await retrainProductVideo(retrainProduct.product_id, {
        video_file: retrainFormData.video_file,
        warehouse_location_id: parseInt(retrainFormData.warehouse_location_id),
        notes: retrainFormData.notes || undefined,
      });

      alert(
        `Re-entrenamiento iniciado exitosamente.\n\nProducto: ${response.brand} ${response.model}\nCodigo: ${response.reference_code}\nJob ID: ${response.new_job_id}\nEstado: ${response.new_job_status}\n\n${response.previous_vectors_will_be_replaced ? 'Los vectores anteriores se reemplazaran al completar.' : ''}`
      );

      setShowRetrainModal(false);
      setRetrainProduct(null);
    } catch (error: any) {
      console.error('Error retraining product:', error);
      alert('Error al re-entrenar producto: ' + (error.message || 'Error desconocido'));
    } finally {
      setRetrainLoading(false);
    }
  };

  // ========== VIDEO INVENTORY ENTRY ==========

  const handleVideoInventoryEntry = async (videoData: {
    unit_price: number;
    product_brand?: string;
    product_model?: string;
    box_price?: number;
    sizes_distribution: Array<{
      size: string;
      pairs: Array<{ location_id: number; quantity: number }>;
      left_feet: Array<{ location_id: number; quantity: number }>;
      right_feet: Array<{ location_id: number; quantity: number }>;
    }>;
    video_file: File | null;
    reference_image?: File | null;
  }) => {
    try {
      // Validate video file
      if (!videoData.video_file) {
        alert('Error: No se encontro el archivo de video');
        return;
      }

      // Validate and prepare sizes distribution
      const validSizesDistribution = videoData.sizes_distribution.filter((sd) => {
        if (!sd.size.trim()) return false;
        const hasPairs = sd.pairs.some((p) => p.location_id > 0 && p.quantity > 0);
        const hasLeftFeet = sd.left_feet.some((lf) => lf.location_id > 0 && lf.quantity > 0);
        const hasRightFeet = sd.right_feet.some((rf) => rf.location_id > 0 && rf.quantity > 0);
        return hasPairs || (hasLeftFeet && hasRightFeet);
      });

      if (validSizesDistribution.length === 0) {
        alert('Por favor ingresa al menos una talla con distribucion valida');
        return;
      }

      // Validate left/right feet balance per size
      for (const sizeDistro of validSizesDistribution) {
        const totalLeftFeet = sizeDistro.left_feet.reduce((sum, lf) => sum + lf.quantity, 0);
        const totalRightFeet = sizeDistro.right_feet.reduce((sum, rf) => sum + rf.quantity, 0);

        if (totalLeftFeet !== totalRightFeet) {
          alert(
            `Error en talla ${sizeDistro.size}: El total de pies izquierdos (${totalLeftFeet}) debe ser igual al total de pies derechos (${totalRightFeet})`
          );
          return;
        }
      }

      // Convert to JSON format required by endpoint
      const sizesDistributionJson = JSON.stringify(
        validSizesDistribution.map((sd) => ({
          size: sd.size.trim(),
          pairs: sd.pairs
            .filter((p) => p.location_id > 0 && p.quantity > 0)
            .map((p) => ({
              location_id: p.location_id,
              quantity: p.quantity,
            })),
          left_feet: sd.left_feet
            .filter((lf) => lf.location_id > 0 && lf.quantity > 0)
            .map((lf) => ({
              location_id: lf.location_id,
              quantity: lf.quantity,
            })),
          right_feet: sd.right_feet
            .filter((rf) => rf.location_id > 0 && rf.quantity > 0)
            .map((rf) => ({
              location_id: rf.location_id,
              quantity: rf.quantity,
            })),
        }))
      );

      const inventoryPayload = {
        sizes_distribution_json: sizesDistributionJson,
        unit_price: videoData.unit_price,
        video_file: videoData.video_file,
        product_brand: videoData.product_brand || '',
        product_model: videoData.product_model || '',
        box_price: videoData.box_price || 0,
        notes: '',
        reference_image:
          videoData.reference_image && videoData.reference_image instanceof File ? videoData.reference_image : null,
      };

      console.log('Enviando datos de inventario con distribucion:', inventoryPayload);
      console.log('JSON de distribucion:', sizesDistributionJson);

      const response = await processVideoInventoryEntry(inventoryPayload);

      console.log('Respuesta del servidor:', response);

      // Check if response indicates success
      if (response && (response.success || response.product_id)) {
        const distributionSummary = response.distribution_summary || [];

        alert(`Inventario registrado exitosamente con distribucion!

Producto: ${response.brand || videoData.product_brand || 'N/A'} ${response.model || videoData.product_model || 'N/A'}
Codigo: ${response.reference_code}
Ubicaciones: ${response.locations_count || distributionSummary.length}
Precio Unitario: ${formatCurrency(response.unit_price || videoData.unit_price)}
${response.box_price ? `Precio por Caja: ${formatCurrency(response.box_price)}` : ''}

${
  distributionSummary.length > 0
    ? `Distribucion por ubicacion:
${distributionSummary.map((ds: any) => `- ${ds.location_name}: ${ds.total_pairs} pares${ds.total_left_feet ? ` + ${ds.total_left_feet} izq` : ''}${ds.total_right_feet ? ` + ${ds.total_right_feet} der` : ''}`).join('\n')}`
    : ''
}

${response.processing_time_seconds ? `Procesado en ${response.processing_time_seconds}s` : ''}`);
      } else {
        throw new Error('La respuesta del servidor no indica exito');
      }
    } catch (error: any) {
      console.error('Error processing video inventory:', error);

      let errorMessage = 'Error al procesar inventario por video';

      if (error.message && error.message.includes('ValidationError')) {
        errorMessage = `Error en el servidor: El backend proceso tu peticion pero hay un problema en la respuesta.

Esto significa que:
- Tu video y datos fueron recibidos correctamente
- El procesamiento de IA se ejecuto
- Hay un error en el formato de respuesta del servidor

El equipo tecnico debe revisar la configuracion del endpoint.

Error tecnico: ${error.message}`;
      } else if (error.message && error.message.includes('Field required')) {
        errorMessage = `Error de configuracion del servidor: Falta un campo en la respuesta.

Tu inventario puede haberse procesado correctamente, pero el servidor no puede devolver la respuesta completa.

Detalle tecnico: ${error.message}`;
      } else if (error.message && error.message.includes('balance')) {
        errorMessage = `Error de balance: ${error.message}

Por favor verifica que:
- El total de pies izquierdos sea igual al de pies derechos para cada talla
- Todas las ubicaciones especificadas existan
- Tengas permisos sobre todas las ubicaciones`;
      } else {
        errorMessage = `Error al procesar inventario: ${error.message || 'Error desconocido'}`;
      }

      alert(errorMessage);
    }
  };

  // ========== RENDER ==========

  const filteredInventory = getFilteredAdminInventory();
  const stats = getAdminInventoryStats(adminInventory);

  return (
    <div className="space-y-6 p-4 md:p-6 bg-background min-h-screen">
      {/* Hidden file input for image updates */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleUpdateProductImage(file);
          }
        }}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-foreground">Gestion de Inventario</h2>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowAssignProductModal(true)}
            size="sm"
            disabled={adminInventoryLoading || adminInventory.length === 0}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Asignar a Ubicacion
          </Button>
          <Button onClick={() => loadAdminInventory()} size="sm" variant="outline" disabled={adminInventoryLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${adminInventoryLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-border">
        <button
          onClick={() => setInventoryActiveTab('view')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            inventoryActiveTab === 'view'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="h-4 w-4 inline mr-2" />
          Ver Inventario
        </button>
        <button
          onClick={() => setInventoryActiveTab('entry')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            inventoryActiveTab === 'entry'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Video className="h-4 w-4 inline mr-2" />
          Registrar con Video
        </button>
      </div>

      {/* ========== VIEW TAB ========== */}
      {inventoryActiveTab === 'view' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-sm text-muted-foreground">Productos Totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalUnits}</p>
                <p className="text-sm text-muted-foreground">Unidades en Stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-muted-foreground">Valor Total</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Ubicacion</label>
                  <select
                    value={selectedAdminLocation === 'all' ? 'all' : selectedAdminLocation.toString()}
                    onChange={(e) =>
                      setSelectedAdminLocation(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
                  >
                    <option value="all">Todas las ubicaciones</option>
                    {[...adminInventory]
                      .sort((a, b) => {
                        const locA = locations.find((l) => l.id === a.location_id);
                        const locB = locations.find((l) => l.id === b.location_id);
                        const typeA = locA?.type === 'bodega' ? 0 : 1;
                        const typeB = locB?.type === 'bodega' ? 0 : 1;
                        return typeA - typeB;
                      })
                      .map((location) => {
                        const loc = locations.find((l) => l.id === location.location_id);
                        const isBodega = loc?.type === 'bodega';
                        return (
                          <option key={location.location_id} value={location.location_id}>
                            {isBodega ? '🏭 ' : '🏪 '}
                            {location.location_name}
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Buscar producto</label>
                  <Input
                    placeholder="Buscar por marca, modelo o referencia..."
                    value={adminInventorySearchTerm}
                    onChange={(e) => setAdminInventorySearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading state */}
          {adminInventoryLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Cargando inventario...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {adminInventoryError && !adminInventoryLoading && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-destructive">Error al cargar inventario</h3>
                  <p className="text-muted-foreground text-sm mt-2">{adminInventoryError}</p>
                  <Button onClick={() => loadAdminInventory()} className="mt-4" variant="outline">
                    Reintentar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory by location */}
          {!adminInventoryLoading && !adminInventoryError && (
            <div className="space-y-6">
              {filteredInventory.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <EmptyState
                      title={adminInventorySearchTerm ? 'No se encontraron productos' : 'No hay inventario disponible'}
                      description={
                        adminInventorySearchTerm
                          ? 'Intenta con otros terminos de busqueda'
                          : 'El inventario se cargara automaticamente'
                      }
                      icon={<Package className="h-12 w-12 text-muted-foreground" />}
                    />
                  </CardContent>
                </Card>
              ) : (
                filteredInventory.map((location) => (
                  <Card key={location.location_id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-5 w-5 text-primary" />
                          <h3 className="text-xl font-semibold text-foreground">{location.location_name}</h3>
                          <Badge variant="secondary">{location.products.length} productos</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {location.products.map((product) => {
                          const productKey = `${location.location_id}-${product.product_id}`;
                          const isExpanded = expandedProducts.has(productKey);

                          return (
                            <Card key={product.product_id} className="border border-border">
                              <CardContent className="p-4">
                                {/* Product Summary */}
                                <div className="flex space-x-3">
                                  {/* Product image */}
                                  <div className="flex-shrink-0">
                                    <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-lg overflow-hidden border border-border bg-muted">
                                      <img
                                        src={
                                          product.image_url ||
                                          `https://via.placeholder.com/80x112/e5e7eb/6b7280?text=${encodeURIComponent(product.brand)}`
                                        }
                                        alt={`${product.brand} ${product.model}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          if (!e.currentTarget.dataset.fallback) {
                                            e.currentTarget.dataset.fallback = 'true';
                                            e.currentTarget.src = `https://via.placeholder.com/80x112/f3f4f6/9ca3af?text=${encodeURIComponent(product.brand)}`;
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>

                                  {/* Product info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <h4 className="font-semibold text-sm leading-tight text-foreground truncate">
                                        {product.brand} {product.model}
                                      </h4>
                                      <span className="flex-shrink-0 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                                        {product.total_quantity}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono truncate mb-1">
                                      {product.reference_code}
                                    </p>
                                    <span className="text-sm font-bold text-success">
                                      {formatCurrency(parseFloat(product.unit_price))}
                                    </span>
                                    <div className="flex items-center flex-wrap gap-1 mt-1">
                                      <span className="text-xs text-muted-foreground">
                                        {product.sizes.length} tallas
                                      </span>
                                      {product.total_quantity === 0 && (
                                        <Badge variant="error" className="text-xs">
                                          Sin stock
                                        </Badge>
                                      )}
                                      {location.location_type === 'bodega' &&
                                        product.total_quantity > 0 &&
                                        product.total_quantity <= 3 && (
                                          <Badge variant="warning" className="text-xs">
                                            Stock bajo
                                          </Badge>
                                        )}
                                      {product.total_quantity > 0 &&
                                        !(location.location_type === 'bodega' && product.total_quantity <= 3) && (
                                          <Badge variant="success" className="text-xs">
                                            Con stock
                                          </Badge>
                                        )}
                                    </div>
                                  </div>
                                </div>

                                {/* Actions row */}
                                <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => handleOpenEditDropdown(product.reference_code, e.currentTarget)}
                                    className="text-xs h-8 px-3"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Editar
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                  </Button>
                                </div>

                                {/* Expand/Collapse button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleProductExpansion(productKey)}
                                  className="w-full mt-3 text-sm"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-2" />
                                      Ocultar tallas
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-2" />
                                      Ver tallas ({product.sizes.length})
                                    </>
                                  )}
                                </Button>

                                {/* Expanded view - Sizes */}
                                {isExpanded && (
                                  <div className="mt-4 pt-4 border-t border-border">
                                    <h5 className="text-sm font-medium text-foreground mb-3">Tallas disponibles</h5>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {product.sizes.map((size, sizeIdx) => (
                                        <div
                                          key={sizeIdx}
                                          className={`p-2.5 rounded-lg border ${size.quantity > 0 ? 'bg-card border-border' : 'bg-muted/50 border-border/50'}`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                              <span className="font-semibold text-foreground text-sm w-10">
                                                {size.size}
                                              </span>
                                              <span
                                                className={`px-1.5 py-0.5 rounded text-xs border ${getInventoryTypeBadgeColor(size.inventory_type || 'pair')}`}
                                              >
                                                {getInventoryTypeLabel(size.inventory_type || 'pair')}
                                              </span>
                                              <span
                                                className={`text-sm font-medium ${size.quantity > 0 ? 'text-foreground' : 'text-muted-foreground'}`}
                                              >
                                                {size.quantity} uds
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                  handleOpenAdjustInventoryModal(
                                                    product,
                                                    size,
                                                    location.location_id,
                                                    location.location_name
                                                  )
                                                }
                                                className="text-xs h-7 px-2"
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                  handleDeleteSize(
                                                    product,
                                                    size,
                                                    location.location_id,
                                                    location.location_name
                                                  )
                                                }
                                                className="text-xs h-7 px-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {/* Add Size Button */}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleOpenAddSizeModal(product, location.location_id, location.location_name)
                                      }
                                      className="w-full mt-3 text-sm border-dashed"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Agregar Talla
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ========== ENTRY TAB ========== */}
      {inventoryActiveTab === 'entry' && (
        <>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Registrar Inventario con Video</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Product Data */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground mb-3">Datos del Producto</h4>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Marca</label>
                    <Input
                      placeholder="Ej: Nike, Adidas"
                      value={videoInventoryForm.product_brand}
                      onChange={(e) => setVideoInventoryForm((prev) => ({ ...prev, product_brand: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Marca del producto</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Modelo</label>
                    <Input
                      placeholder="Ej: Air Max 90"
                      value={videoInventoryForm.product_model}
                      onChange={(e) => setVideoInventoryForm((prev) => ({ ...prev, product_model: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Modelo del producto</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Precio Unitario <span className="text-error">*</span>
                    </label>
                    <Input
                      placeholder="Ej: 45000"
                      type="number"
                      value={videoInventoryForm.unit_price}
                      onChange={(e) =>
                        setVideoInventoryForm((prev) => ({ ...prev, unit_price: parseFloat(e.target.value) }))
                      }
                      min="0"
                      step="1000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Precio por unidad individual</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Distribucion de Tallas <span className="text-error">*</span>
                    </label>
                    <div className="space-y-4 max-h-96 overflow-y-auto p-3 border border-border rounded-md bg-muted/5">
                      {videoInventoryForm.sizes_distribution.map((sizeDistro, sizeIdx) => (
                        <div key={sizeIdx} className="border border-border rounded-lg p-4 bg-card space-y-3">
                          {/* Size Header */}
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Talla (ej: 42)"
                              value={sizeDistro.size}
                              onChange={(e) => {
                                const newDistro = [...videoInventoryForm.sizes_distribution];
                                newDistro[sizeIdx].size = e.target.value;
                                setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                              }}
                              className="w-32"
                            />
                            <div className="flex-1 text-sm text-muted-foreground">
                              Balance: {sizeDistro.left_feet.reduce((s, lf) => s + lf.quantity, 0)} izq /{' '}
                              {sizeDistro.right_feet.reduce((s, rf) => s + rf.quantity, 0)} der
                              {sizeDistro.left_feet.reduce((s, lf) => s + lf.quantity, 0) !==
                                sizeDistro.right_feet.reduce((s, rf) => s + rf.quantity, 0) && (
                                <span className="text-error ml-2">Desbalanceado</span>
                              )}
                            </div>
                            {videoInventoryForm.sizes_distribution.length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setVideoInventoryForm((prev) => ({
                                    ...prev,
                                    sizes_distribution: prev.sizes_distribution.filter((_, i) => i !== sizeIdx),
                                  }));
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {/* Complete Pairs */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground">Pares Completos</label>
                            {sizeDistro.pairs.map((pair, pairIdx) => (
                              <div key={pairIdx} className="flex items-center gap-2">
                                <Select
                                  value={pair.location_id.toString()}
                                  onChange={(e) => {
                                    const newDistro = [...videoInventoryForm.sizes_distribution];
                                    newDistro[sizeIdx].pairs[pairIdx].location_id = parseInt(e.target.value);
                                    setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                  }}
                                  options={[
                                    { value: '0', label: 'Seleccionar ubicacion' },
                                    ...locations.map((loc) => ({ value: loc.id.toString(), label: loc.name })),
                                  ]}
                                  className="flex-1"
                                />
                                <Input
                                  placeholder="Cant"
                                  type="number"
                                  value={pair.quantity || ''}
                                  onChange={(e) => {
                                    const newDistro = [...videoInventoryForm.sizes_distribution];
                                    newDistro[sizeIdx].pairs[pairIdx].quantity = parseInt(e.target.value) || 0;
                                    setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                  }}
                                  className="w-20"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newDistro = [...videoInventoryForm.sizes_distribution];
                                    newDistro[sizeIdx].pairs.push({ location_id: 0, quantity: 0 });
                                    setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                  }}
                                >
                                  +
                                </Button>
                                {sizeDistro.pairs.length > 1 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newDistro = [...videoInventoryForm.sizes_distribution];
                                      newDistro[sizeIdx].pairs = newDistro[sizeIdx].pairs.filter(
                                        (_, i) => i !== pairIdx
                                      );
                                      setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                    }}
                                    className="text-destructive"
                                  >
                                    -
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Left Feet */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-foreground">Izquierdos</label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newDistro = [...videoInventoryForm.sizes_distribution];
                                  newDistro[sizeIdx].left_feet.push({ location_id: 0, quantity: 0 });
                                  setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                }}
                              >
                                +
                              </Button>
                            </div>
                            {sizeDistro.left_feet.map((leftFoot, lfIdx) => (
                              <div key={lfIdx} className="flex items-center gap-2">
                                <Select
                                  value={leftFoot.location_id.toString()}
                                  onChange={(e) => {
                                    const newDistro = [...videoInventoryForm.sizes_distribution];
                                    newDistro[sizeIdx].left_feet[lfIdx].location_id = parseInt(e.target.value);
                                    setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                  }}
                                  options={[
                                    { value: '0', label: 'Seleccionar ubicacion' },
                                    ...locations.map((loc) => ({ value: loc.id.toString(), label: loc.name })),
                                  ]}
                                  className="flex-1"
                                />
                                <Input
                                  placeholder="Cant"
                                  type="number"
                                  value={leftFoot.quantity || ''}
                                  onChange={(e) => {
                                    const newDistro = [...videoInventoryForm.sizes_distribution];
                                    newDistro[sizeIdx].left_feet[lfIdx].quantity = parseInt(e.target.value) || 0;
                                    setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                  }}
                                  className="w-20"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const newDistro = [...videoInventoryForm.sizes_distribution];
                                    newDistro[sizeIdx].left_feet = newDistro[sizeIdx].left_feet.filter(
                                      (_, i) => i !== lfIdx
                                    );
                                    setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                  }}
                                  className="text-destructive"
                                >
                                  -
                                </Button>
                              </div>
                            ))}
                            {sizeDistro.left_feet.length === 0 && (
                              <p className="text-xs text-muted-foreground italic">Sin pies izquierdos separados</p>
                            )}
                          </div>

                          {/* Right Feet */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-foreground">Derechos</label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newDistro = [...videoInventoryForm.sizes_distribution];
                                  newDistro[sizeIdx].right_feet.push({ location_id: 0, quantity: 0 });
                                  setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                }}
                              >
                                +
                              </Button>
                            </div>
                            {sizeDistro.right_feet.map((rightFoot, rfIdx) => (
                              <div key={rfIdx} className="flex items-center gap-2">
                                <Select
                                  value={rightFoot.location_id.toString()}
                                  onChange={(e) => {
                                    const newDistro = [...videoInventoryForm.sizes_distribution];
                                    newDistro[sizeIdx].right_feet[rfIdx].location_id = parseInt(e.target.value);
                                    setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                  }}
                                  options={[
                                    { value: '0', label: 'Seleccionar ubicacion' },
                                    ...locations.map((loc) => ({ value: loc.id.toString(), label: loc.name })),
                                  ]}
                                  className="flex-1"
                                />
                                <Input
                                  placeholder="Cant"
                                  type="number"
                                  value={rightFoot.quantity || ''}
                                  onChange={(e) => {
                                    const newDistro = [...videoInventoryForm.sizes_distribution];
                                    newDistro[sizeIdx].right_feet[rfIdx].quantity = parseInt(e.target.value) || 0;
                                    setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                  }}
                                  className="w-20"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const newDistro = [...videoInventoryForm.sizes_distribution];
                                    newDistro[sizeIdx].right_feet = newDistro[sizeIdx].right_feet.filter(
                                      (_, i) => i !== rfIdx
                                    );
                                    setVideoInventoryForm((prev) => ({ ...prev, sizes_distribution: newDistro }));
                                  }}
                                  className="text-destructive"
                                >
                                  -
                                </Button>
                              </div>
                            ))}
                            {sizeDistro.right_feet.length === 0 && (
                              <p className="text-xs text-muted-foreground italic">Sin pies derechos separados</p>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add new size button */}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setVideoInventoryForm((prev) => ({
                            ...prev,
                            sizes_distribution: [
                              ...prev.sizes_distribution,
                              {
                                size: '',
                                pairs: [{ location_id: 0, quantity: 0 }],
                                left_feet: [],
                                right_feet: [],
                              },
                            ],
                          }));
                        }}
                        className="w-full"
                      >
                        + Agregar Talla
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Puedes distribuir el inventario entre multiples ubicaciones. Los pies izquierdos y derechos deben
                      estar balanceados.
                    </p>
                  </div>
                </div>

                {/* Column 2: Product Photo */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground mb-3">Foto del Producto (Opcional)</h4>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Capturar Foto de Referencia
                    </label>
                    <FullScreenPhotoCapture
                      onPhotoTaken={async (url, blob) => {
                        if (blob && url) {
                          if (capturedPhotoUrl) {
                            URL.revokeObjectURL(capturedPhotoUrl);
                          }

                          setCapturedPhotoUrl(url);

                          const fileType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
                          const ext = fileType.split('/')[1] || 'jpg';
                          const imageFile = new File([blob], `reference-image.${ext}`, { type: fileType });

                          setVideoInventoryForm((prev) => ({
                            ...prev,
                            reference_image: imageFile,
                          }));
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Toca el boton para abrir la camara en pantalla completa
                    </p>
                  </div>

                  {/* Photo preview */}
                  {capturedPhotoUrl && (
                    <div className="border border-border rounded-lg p-4 bg-muted/10">
                      <h4 className="text-sm font-medium text-foreground mb-2">Foto Capturada</h4>
                      <div className="space-y-3">
                        <img
                          src={capturedPhotoUrl}
                          alt="Foto del inventario"
                          className="w-full h-64 object-cover rounded-lg border shadow-sm"
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Foto de referencia del producto</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (capturedPhotoUrl) {
                                URL.revokeObjectURL(capturedPhotoUrl);
                              }
                              setCapturedPhotoUrl(null);
                              setVideoInventoryForm((prev) => ({ ...prev, reference_image: null }));
                            }}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 3: Product Video */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground mb-3">
                    Video del Producto <span className="text-error">*</span>
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Grabar Video del Inventario
                    </label>
                    <FullScreenCameraCapture
                      onVideoRecorded={async (url, blob) => {
                        if (blob && url) {
                          if (capturedVideoUrl) {
                            URL.revokeObjectURL(capturedVideoUrl);
                          }

                          setCapturedVideoUrl(url);

                          const fileType = blob.type && blob.type.startsWith('video/') ? blob.type : 'video/webm';
                          const ext = fileType.split('/')[1] || 'webm';
                          const videoFile = new File([blob], `inventory-video.${ext}`, { type: fileType });

                          setVideoInventoryForm((prev) => ({
                            ...prev,
                            video_file: videoFile,
                          }));
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Toca el boton para abrir la camara en pantalla completa
                    </p>
                  </div>

                  {/* Video preview */}
                  {capturedVideoUrl && (
                    <div className="border border-border rounded-lg p-4 bg-muted/10">
                      <h4 className="text-sm font-medium text-foreground mb-2">Video Grabado</h4>
                      <div className="space-y-3">
                        <video
                          src={capturedVideoUrl}
                          controls
                          className="w-full rounded-lg border shadow-sm"
                          preload="metadata"
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Video del inventario del producto</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (capturedVideoUrl) {
                                URL.revokeObjectURL(capturedVideoUrl);
                              }
                              setCapturedVideoUrl(null);
                              setVideoInventoryForm((prev) => ({ ...prev, video_file: null }));
                            }}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Enviar Inventario</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Asegurate de haber completado todos los campos requeridos y grabado el video antes de enviar.
                  </p>
                </div>

                <Button
                  onClick={async () => {
                    // Prevent double submission
                    if (isSubmittingVideoInventory) return;

                    // Full validations
                    if (videoInventoryForm.unit_price <= 0) {
                      alert('Por favor ingresa un precio unitario valido');
                      return;
                    }

                    // Validate at least one valid size distribution
                    const hasValidDistribution = videoInventoryForm.sizes_distribution.some((sd) => {
                      if (!sd.size.trim()) return false;
                      const hasPairs = sd.pairs.some((p) => p.location_id > 0 && p.quantity > 0);
                      const hasLeftFeet = sd.left_feet.some((lf) => lf.location_id > 0 && lf.quantity > 0);
                      const hasRightFeet = sd.right_feet.some((rf) => rf.location_id > 0 && rf.quantity > 0);
                      return hasPairs || (hasLeftFeet && hasRightFeet);
                    });

                    if (!hasValidDistribution) {
                      alert('Por favor ingresa al menos una talla con distribucion valida');
                      return;
                    }

                    // Validate feet balance
                    for (const sd of videoInventoryForm.sizes_distribution) {
                      if (!sd.size.trim()) continue;
                      const totalLeft = sd.left_feet.reduce((sum, lf) => sum + lf.quantity, 0);
                      const totalRight = sd.right_feet.reduce((sum, rf) => sum + rf.quantity, 0);
                      if (totalLeft !== totalRight) {
                        alert(
                          `Error en talla ${sd.size}: Pies izquierdos (${totalLeft}) debe ser igual a pies derechos (${totalRight})`
                        );
                        return;
                      }
                    }

                    if (!videoInventoryForm.video_file) {
                      alert('Por favor graba un video del producto antes de enviar');
                      return;
                    }

                    // Set loading state
                    setIsSubmittingVideoInventory(true);

                    try {
                      console.log('=== ANTES DE ENVIAR ===');
                      console.log('Estado del formulario:', {
                        unit_price: videoInventoryForm.unit_price,
                        product_brand: videoInventoryForm.product_brand,
                        product_model: videoInventoryForm.product_model,
                        box_price: videoInventoryForm.box_price,
                        sizes_distribution: videoInventoryForm.sizes_distribution,
                        video_file: videoInventoryForm.video_file
                          ? `File(${videoInventoryForm.video_file.size} bytes)`
                          : 'null',
                        reference_image: videoInventoryForm.reference_image
                          ? `File(${videoInventoryForm.reference_image.size} bytes)`
                          : 'null',
                      });
                      console.log('=======================');

                      await handleVideoInventoryEntry(videoInventoryForm);

                      // Reset form after successful submission
                      setVideoInventoryForm({
                        product_brand: '',
                        product_model: '',
                        unit_price: 0,
                        box_price: 0,
                        sizes_distribution: [
                          {
                            size: '',
                            pairs: [{ location_id: 0, quantity: 0 }],
                            left_feet: [],
                            right_feet: [],
                          },
                        ],
                        reference_image: null,
                        video_file: null,
                      });

                      // Cleanup preview URLs
                      if (capturedPhotoUrl) {
                        URL.revokeObjectURL(capturedPhotoUrl);
                      }
                      if (capturedVideoUrl) {
                        URL.revokeObjectURL(capturedVideoUrl);
                      }
                      setCapturedPhotoUrl(null);
                      setCapturedVideoUrl(null);
                    } catch (error) {
                      console.error('Error processing inventory:', error);
                    } finally {
                      setIsSubmittingVideoInventory(false);
                    }
                  }}
                  className="w-full bg-success hover:bg-success/90 text-white py-4 text-lg font-semibold"
                  disabled={
                    !videoInventoryForm.video_file || videoInventoryForm.unit_price <= 0 || isSubmittingVideoInventory
                  }
                >
                  {isSubmittingVideoInventory
                    ? 'Enviando inventario...'
                    : !videoInventoryForm.video_file
                      ? 'Graba un video primero'
                      : videoInventoryForm.unit_price <= 0
                        ? 'Ingresa el precio'
                        : 'Registrar Inventario con Distribucion'}
                </Button>

                {/* Status indicators */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div
                    className={`flex items-center space-x-2 ${videoInventoryForm.unit_price > 0 ? 'text-success' : 'text-muted-foreground'}`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${videoInventoryForm.unit_price > 0 ? 'bg-success' : 'bg-muted'}`}
                    ></div>
                    <span>Precio</span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 ${videoInventoryForm.sizes_distribution.some((sd) => sd.size.trim() && (sd.pairs.some((p) => p.location_id > 0 && p.quantity > 0) || (sd.left_feet.length > 0 && sd.right_feet.length > 0))) ? 'text-success' : 'text-muted-foreground'}`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${videoInventoryForm.sizes_distribution.some((sd) => sd.size.trim() && (sd.pairs.some((p) => p.location_id > 0 && p.quantity > 0) || (sd.left_feet.length > 0 && sd.right_feet.length > 0))) ? 'bg-success' : 'bg-muted'}`}
                    ></div>
                    <span>Distribucion</span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 ${videoInventoryForm.video_file ? 'text-success' : 'text-muted-foreground'}`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${videoInventoryForm.video_file ? 'bg-success' : 'bg-muted'}`}
                    ></div>
                    <span>Video</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ========== MODALS & DROPDOWNS ========== */}

      {/* Edit Product Dropdown (fixed position) */}
      {openEditDropdown &&
        editDropdownPos &&
        (() => {
          const product = adminInventory
            .flatMap((loc) => loc.products)
            .find((p) => p.reference_code === openEditDropdown);
          if (!product) return null;

          // Clamp so menu doesn't overflow viewport
          const menuW = 192; // w-48
          const left = Math.min(editDropdownPos.left, window.innerWidth - menuW - 8);
          const top = editDropdownPos.top;

          return (
            <>
              <div
                className="fixed inset-0 z-40"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeEditDropdown();
                }}
              />
              <div
                className="fixed z-50 w-48 bg-card border border-border rounded-md shadow-lg py-1"
                style={{ top, left: left }}
              >
                <button
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center text-foreground"
                  onClick={() => {
                    closeEditDropdown();
                    handleOpenAdjustPriceModal(product);
                  }}
                >
                  <DollarSign className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  Precio
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center text-foreground"
                  onClick={() => {
                    closeEditDropdown();
                    handleOpenEditProductInfoModal(product);
                  }}
                >
                  <Edit className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  Marca / Modelo
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center text-foreground"
                  onClick={() => {
                    closeEditDropdown();
                    setUpdatingImageRef(product.reference_code);
                    imageInputRef.current?.click();
                  }}
                >
                  <Camera className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  Imagen
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center text-foreground"
                  onClick={() => {
                    closeEditDropdown();
                    handleOpenRetrainModal(product);
                  }}
                >
                  <Video className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  Re-entrenar IA
                </button>
                <div className="border-t border-border my-1" />
                <button
                  className="w-full text-left px-3 py-2 text-xs hover:bg-destructive/10 flex items-center text-destructive"
                  onClick={() => {
                    closeEditDropdown();
                    handleDeleteProductReference(product);
                  }}
                  disabled={deletingProductId === product.product_id}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  {deletingProductId === product.product_id ? 'Eliminando...' : 'Eliminar Referencia'}
                </button>
              </div>
            </>
          );
        })()}

      {/* Inventory Adjustment Modal */}
      {showAdjustInventoryModal && selectedSizeForAdjustment && (
        <AdjustInventoryModal
          onClose={() => {
            setShowAdjustInventoryModal(false);
            setSelectedSizeForAdjustment(null);
          }}
          onSubmit={handleAdjustInventory}
          productData={selectedSizeForAdjustment}
          siblingInfo={selectedSizeForAdjustment.siblingInfo}
        />
      )}

      {/* Price Adjustment Modal */}
      {showAdjustPriceModal && selectedProductForPriceAdjustment && (
        <AdjustPriceModal
          onClose={() => {
            setShowAdjustPriceModal(false);
            setSelectedProductForPriceAdjustment(null);
          }}
          onSubmit={handleAdjustPrice}
          productData={selectedProductForPriceAdjustment}
        />
      )}

      {/* Edit Product Info Modal */}
      {showEditProductInfoModal && selectedProductForInfoEdit && (
        <EditProductInfoModal
          onClose={() => {
            setShowEditProductInfoModal(false);
            setSelectedProductForInfoEdit(null);
          }}
          onSubmit={handleEditProductInfo}
          productData={selectedProductForInfoEdit}
        />
      )}

      {/* Add Size Modal */}
      {showAddSizeModal && selectedProductForAddSize && (
        <AddSizeModal
          onClose={() => {
            setShowAddSizeModal(false);
            setSelectedProductForAddSize(null);
          }}
          onSubmit={handleAddSize}
          productData={selectedProductForAddSize}
          siblingLocationInfo={selectedProductForAddSize.siblingLocationInfo}
        />
      )}

      {/* Assign Product To Location Modal */}
      {showAssignProductModal && (
        <AssignProductToLocationModal
          onClose={() => setShowAssignProductModal(false)}
          onSubmit={handleAssignProductToLocation}
          allInventory={adminInventory}
          allLocations={locations.map((l) => ({ id: l.id, name: l.name }))}
        />
      )}

      {/* Retrain AI Modal */}
      {showRetrainModal && retrainProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md border border-border flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Video className="h-5 w-5 mr-2 text-primary" />
                Re-entrenar IA
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRetrainModal(false);
                  setRetrainProduct(null);
                }}
                disabled={retrainLoading}
              >
                ×
              </Button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  {retrainProduct.image_url && (
                    <img
                      src={retrainProduct.image_url}
                      alt={`${retrainProduct.brand} ${retrainProduct.model}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {retrainProduct.brand} {retrainProduct.model}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">{retrainProduct.reference_code}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Video del producto *</label>
                <FullScreenCameraCapture
                  onVideoRecorded={(_url, blob) => {
                    if (blob) {
                      const file =
                        blob instanceof File
                          ? blob
                          : new File([blob], `retrain-${retrainProduct.reference_code}-${Date.now()}.webm`, {
                              type: blob.type || 'video/webm',
                            });
                      setRetrainFormData((prev) => ({ ...prev, video_file: file }));
                    }
                  }}
                />
                {retrainFormData.video_file && (
                  <p className="text-xs text-success">
                    Video listo: {retrainFormData.video_file.name} (
                    {(retrainFormData.video_file.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Bodega *</label>
                <Select
                  value={retrainFormData.warehouse_location_id}
                  onChange={(e) => setRetrainFormData((prev) => ({ ...prev, warehouse_location_id: e.target.value }))}
                  options={[
                    { value: '', label: 'Seleccionar bodega...' },
                    ...locations
                      .filter((l) => l.type === 'bodega')
                      .map((l) => ({ value: l.id.toString(), label: l.name })),
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notas (opcional)</label>
                <Input
                  type="text"
                  value={retrainFormData.notes}
                  onChange={(e) => setRetrainFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Motivo del re-entrenamiento..."
                />
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <p className="text-xs text-warning">
                  Al re-entrenar, los vectores de IA anteriores se reemplazaran cuando el procesamiento complete. Este
                  proceso puede tardar varios minutos.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t border-border shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRetrainModal(false);
                  setRetrainProduct(null);
                }}
                disabled={retrainLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRetrainProduct}
                disabled={retrainLoading || !retrainFormData.video_file || !retrainFormData.warehouse_location_id}
              >
                {retrainLoading ? 'Enviando...' : 'Iniciar Re-entrenamiento'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
