import type { InventoryLocation } from '../types';

export const getPriorityColor = (priority: string) => {
  return priority === 'URGENT' || priority === 'high'
    ? 'bg-error/10 text-error border-error/20'
    : 'bg-primary/10 text-primary border-primary/20';
};

export const getPurposeColor = (purpose: string) => {
  switch (purpose) {
    case 'cliente':
      return 'bg-red-100 text-red-700';
    case 'pair_formation':
      return 'bg-info/10 text-info';
    case 'restock':
      return 'bg-blue-100 text-blue-700';
    case 'return':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-red-100 text-red-700';
  }
};

export const getInventoryTypeColor = (inventoryType?: string) => {
  switch (inventoryType) {
    case 'pair':
      return 'bg-success/10 text-success border-success/20';
    case 'left_only':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'right_only':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'both_feet':
      return 'bg-info/10 text-info border-info/20';
    default:
      return 'bg-primary/10 text-primary border-primary/20';
  }
};

export const getRequestTypeColor = (requestType?: string) => {
  switch (requestType) {
    case 'transfer':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'return':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-red-100 text-red-700 border-red-200';
  }
};

export const formatTimeWaiting = (requestedAt: string) => {
  const now = new Date();
  const requested = new Date(requestedAt);
  const diffMs = now.getTime() - requested.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins} minutos`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  }
};

export const formatPrice = (price: string | number) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(numPrice);
};

export const getTotalInventoryValue = (location: InventoryLocation) => {
  return location.products.reduce((total, product) => {
    const unitPrice = parseFloat(product.unit_price);
    return total + unitPrice * product.total_quantity;
  }, 0);
};

export const getTotalProducts = (location: InventoryLocation) => {
  return location.products.reduce((total, product) => total + product.total_quantity, 0);
};
