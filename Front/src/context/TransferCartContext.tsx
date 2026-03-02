import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { CartItem, CartPhase, TransferCartContextType, AddItemResult, CartAddedFeedback } from '../types/cart';
import { transfersAPI } from '../services/transfersAPI';

const STORAGE_KEY = 'transfer_cart';

const TransferCartContext = createContext<TransferCartContextType | undefined>(undefined);

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage(): { items: CartItem[]; phase: CartPhase; cartGroupId: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], phase: 'building', cartGroupId: null };
    const parsed = JSON.parse(raw);
    return {
      items: parsed.items ?? [],
      phase: parsed.phase ?? 'building',
      cartGroupId: parsed.cartGroupId ?? null,
    };
  } catch {
    return { items: [], phase: 'building', cartGroupId: null };
  }
}

function saveToStorage(items: CartItem[], phase: CartPhase, cartGroupId: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, phase, cartGroupId, _savedAt: Date.now() }));
  } catch {
    // localStorage might be full – ignore silently
  }
}

export const TransferCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => loadFromStorage().items);
  const [phase, setPhase] = useState<CartPhase>(() => loadFromStorage().phase);
  const [cartGroupId, setCartGroupId] = useState<string | null>(() => loadFromStorage().cartGroupId);
  const [lastAddedFeedback, setLastAddedFeedback] = useState<CartAddedFeedback | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist on every change
  useEffect(() => {
    saveToStorage(items, phase, cartGroupId);
  }, [items, phase, cartGroupId]);

  // Auto-expire cart after 24h of inactivity
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed._savedAt && Date.now() - parsed._savedAt > 24 * 60 * 60 * 1000) {
          clearCart();
        }
      }
    } catch { /* ignore */ }
  }, []);

  const showFeedback = useCallback((feedback: CartAddedFeedback) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setLastAddedFeedback(feedback);
    feedbackTimerRef.current = setTimeout(() => setLastAddedFeedback(null), 3000);
  }, []);

  const addItem = useCallback((item: Omit<CartItem, 'id'>): AddItemResult => {
    if (phase !== 'building') {
      return { success: false, message: 'El carrito ya fue enviado. Vacíalo para agregar nuevos items.' };
    }

    if (item.max_stock <= 0) {
      return { success: false, message: 'No hay stock disponible en esta ubicación.' };
    }

    // Check for existing item with same product+size+source
    const existing = items.find(
      i => i.sneaker_reference_code === item.sneaker_reference_code
        && i.size === item.size
        && i.source_location_id === item.source_location_id
    );

    if (existing) {
      const newQty = existing.quantity + 1;
      if (newQty > existing.max_stock) {
        return {
          success: false,
          message: `Stock máximo alcanzado (${existing.max_stock} disponible${existing.max_stock !== 1 ? 's' : ''}).`,
        };
      }
      setItems(prev =>
        prev.map(i => i.id === existing.id ? { ...i, quantity: newQty } : i)
      );
      showFeedback({ itemName: `${item.brand} ${item.model}`, size: item.size, quantity: newQty });
      return { success: true, message: `Cantidad actualizada a ${newQty}.` };
    }

    // New item
    setItems(prev => [...prev, { ...item, id: generateId(), quantity: 1 }]);
    showFeedback({ itemName: `${item.brand} ${item.model}`, size: item.size, quantity: 1 });
    return { success: true, message: 'Agregado al carrito.' };
  }, [phase, items, showFeedback]);

  const removeItem = useCallback((id: string) => {
    if (phase !== 'building') return;
    setItems(prev => prev.filter(i => i.id !== id));
  }, [phase]);

  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    if (phase !== 'building' || quantity < 1) return;
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const clamped = Math.min(quantity, i.max_stock);
      return { ...i, quantity: clamped };
    }));
  }, [phase]);

  const clearCart = useCallback(() => {
    setItems([]);
    setPhase('building');
    setCartGroupId(null);
    setLastAddedFeedback(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const submitCart = useCallback(async () => {
    if (phase !== 'building' || items.length === 0) return;

    const groupId = generateId();
    setCartGroupId(groupId);
    setPhase('submitted');

    // Fire all transfer requests in parallel
    const results = await Promise.allSettled(
      items.map(item =>
        transfersAPI.vendor.requestTransfer({
          source_location_id: item.source_location_id,
          destination_location_id: item.destination_location_id,
          sneaker_reference_code: item.sneaker_reference_code,
          brand: item.brand,
          model: item.model,
          size: item.size,
          quantity: item.quantity,
          purpose: 'cliente',
          pickup_type: item.pickup_type,
          destination_type: 'bodega',
          inventory_type: item.transfer_type === 'pair' ? 'pair' : item.transfer_type === 'left_foot' ? 'left_only' : 'right_only',
          cart_group_id: groupId,
        })
      )
    );

    // Update items with transfer IDs and statuses
    setItems(prev =>
      prev.map((item, idx) => {
        const result = results[idx];
        if (result.status === 'fulfilled') {
          return {
            ...item,
            transfer_id: result.value.transfer_request_id,
            transfer_status: result.value.status || 'pending',
          };
        }
        return { ...item, transfer_status: 'error' };
      })
    );

    setPhase('tracking');
  }, [phase, items]);

  const refreshTransferStatuses = useCallback(async () => {
    if (phase !== 'tracking' && phase !== 'submitted') return;

    try {
      const [pendingRes, completedRes] = await Promise.allSettled([
        transfersAPI.vendor.getPendingTransfers(),
        transfersAPI.vendor.getCompletedTransfers(),
      ]);

      // Build a map of transfer_id -> status from API responses
      const statusMap = new Map<number, string>();

      if (pendingRes.status === 'fulfilled' && pendingRes.value?.pending_transfers) {
        for (const t of pendingRes.value.pending_transfers) {
          statusMap.set(t.id, t.status);
        }
      }
      if (completedRes.status === 'fulfilled' && completedRes.value?.completed_transfers) {
        for (const t of completedRes.value.completed_transfers) {
          statusMap.set(t.id, t.status);
        }
      }

      setItems(prev =>
        prev.map(item => {
          if (item.transfer_id && statusMap.has(item.transfer_id)) {
            return { ...item, transfer_status: statusMap.get(item.transfer_id) };
          }
          return item;
        })
      );

      // Check if all are completed
      const allDone = items.every(
        item => item.transfer_id && statusMap.get(item.transfer_id) === 'completed'
      );
      if (allDone && items.length > 0) {
        setPhase('ready_to_sell');
      }
    } catch (err) {
      console.warn('Error refreshing cart transfer statuses:', err);
    }
  }, [phase, items]);

  // Computed values
  const totalItems = items.length;
  const totalQuantity = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const isCartEmpty = items.length === 0;
  const completedTransferIds = useMemo(
    () => items.filter(i => i.transfer_id && i.transfer_status === 'completed').map(i => i.transfer_id!),
    [items]
  );
  const allTransfersCompleted = useMemo(
    () => items.length > 0 && items.every(i => i.transfer_status === 'completed'),
    [items]
  );
  const pendingCount = useMemo(
    () => items.filter(i => i.transfer_status && i.transfer_status !== 'completed' && i.transfer_status !== 'error').length,
    [items]
  );

  const value: TransferCartContextType = {
    items,
    phase,
    cartGroupId,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    submitCart,
    refreshTransferStatuses,
    totalItems,
    totalQuantity,
    allTransfersCompleted,
    completedTransferIds,
    pendingCount,
    isCartEmpty,
    lastAddedFeedback,
  };

  return (
    <TransferCartContext.Provider value={value}>
      {children}
    </TransferCartContext.Provider>
  );
};

export const useTransferCart = (): TransferCartContextType => {
  const context = useContext(TransferCartContext);
  if (context === undefined) {
    throw new Error('useTransferCart must be used within a TransferCartProvider');
  }
  return context;
};
