import React, { useState } from 'react';
import {
  ShoppingCart, Trash2, Plus, Minus, Send, RefreshCw,
  CheckCircle, Clock, AlertCircle, Package, XCircle, DollarSign
} from 'lucide-react';
import { useTransferCart } from '../../context/TransferCartContext';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface TransferCartProps {
  onSellAll: () => void;
  onSellPartial: (transferIds: number[]) => void;
}

export const TransferCart: React.FC<TransferCartProps> = ({ onSellAll, onSellPartial }) => {
  const {
    items, phase, clearCart, removeItem, updateItemQuantity,
    submitCart, refreshTransferStatuses, totalItems, totalQuantity,
    allTransfersCompleted, completedTransferIds, pendingCount
  } = useTransferCart();

  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleSubmitCart = async () => {
    setSubmitting(true);
    try {
      await submitCart();
    } catch (err) {
      console.error('Error submitting cart:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTransferStatuses();
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Group items by reference code
  const groupedItems = items.reduce((acc, item) => {
    const key = item.sneaker_reference_code;
    if (!acc[key]) {
      acc[key] = { brand: item.brand, model: item.model, image: item.image, items: [] };
    }
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { brand: string; model: string; image?: string; items: typeof items }>);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted': return <Package className="h-4 w-4 text-blue-500" />;
      case 'in_transit':
      case 'delivered': return <Package className="h-4 w-4 text-purple-500 animate-pulse" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptada';
      case 'in_transit': return 'En transito';
      case 'delivered': return 'Entregada';
      case 'error': return 'Error';
      default: return '';
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Carrito vacio</h3>
          <p className="text-sm text-muted-foreground">
            Escanea o busca productos y selecciona "Agregar al Carrito" para solicitar multiples transferencias.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito ({totalItems} item{totalItems !== 1 ? 's' : ''}, {totalQuantity} unidad{totalQuantity !== 1 ? 'es' : ''})
          </h2>
          {phase !== 'building' && (
            <p className="text-xs text-muted-foreground mt-1">
              {phase === 'tracking' && `${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`}
              {phase === 'ready_to_sell' && 'Todas las transferencias completadas'}
              {phase === 'submitted' && 'Enviando transferencias...'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(phase === 'tracking' || phase === 'submitted') && (
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearCart}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Grouped items */}
      {Object.entries(groupedItems).map(([refCode, group]) => (
        <Card key={refCode}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              {group.image && (
                <img src={group.image} alt={group.model} className="h-12 w-12 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{group.brand} {group.model}</p>
                <p className="text-xs text-muted-foreground">{refCode}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {group.items.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-t border-border/50">
                {/* Status icon (only in tracking phases) */}
                {phase !== 'building' && (
                  <div className="flex items-center gap-1" title={getStatusLabel(item.transfer_status)}>
                    {getStatusIcon(item.transfer_status)}
                  </div>
                )}

                {/* Size */}
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-muted">
                  T. {item.size}
                </span>

                {/* Location */}
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {item.location_name}
                </span>

                {/* Quantity controls (only in building phase) */}
                {phase === 'building' ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-center text-xs font-medium tabular-nums">
                      {item.quantity}/{item.max_stock}
                    </span>
                    <button
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.max_stock}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded hover:bg-red-50 ml-1"
                    >
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted">
                      {getStatusLabel(item.transfer_status)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Action buttons */}
      <div className="sticky bottom-0 bg-background pt-3 pb-2 space-y-2">
        {phase === 'building' && (
          <Button
            className="w-full"
            onClick={handleSubmitCart}
            disabled={submitting || items.length === 0}
          >
            {submitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {submitting ? 'Enviando transferencias...' : `Enviar Todas (${totalItems})`}
          </Button>
        )}

        {phase === 'ready_to_sell' && (
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={onSellAll}>
            <DollarSign className="h-4 w-4 mr-2" />
            Vender Todo ({totalItems} items)
          </Button>
        )}

        {phase === 'tracking' && completedTransferIds.length > 0 && !allTransfersCompleted && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onSellPartial(completedTransferIds)}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Vender Disponibles ({completedTransferIds.length})
          </Button>
        )}

        {phase === 'tracking' && (
          <p className="text-xs text-center text-muted-foreground">
            Esperando que todas las transferencias se completen...
          </p>
        )}
      </div>
    </div>
  );
};
