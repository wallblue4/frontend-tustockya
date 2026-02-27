import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AdminLocation, Notifications } from '../types/admin';
import {
  fetchManagedLocations,
  fetchPendingDiscountRequests,
  approveDiscountRequest,
  fetchAvailableLocationsForUsers
} from '../services/adminAPI';

interface AdminContextType {
  locations: AdminLocation[];
  availableLocations: AdminLocation[];
  notifications: Notifications;
  receiptPreviewUrl: string | null;
  setReceiptPreviewUrl: (url: string | null) => void;
  loadLocations: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  handleApproveDiscount: (discountId: number, approved: boolean, notes?: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [availableLocations, setAvailableLocations] = useState<AdminLocation[]>([]);
  const [notifications, setNotifications] = useState<Notifications>({
    discounts: [],
    returns: [],
    inventory: []
  });
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    try {
      const response = await fetchManagedLocations();
      setLocations(Array.isArray(response) ? response : response.locations || response.data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      setLocations([]);
    }
  }, []);

  const loadAvailableLocations = useCallback(async () => {
    try {
      const response = await fetchAvailableLocationsForUsers();
      setAvailableLocations(Array.isArray(response) ? response : response.locations || response.data || []);
    } catch (error) {
      console.error('Error loading available locations:', error);
      setAvailableLocations([]);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const discountsResponse = await fetchPendingDiscountRequests();
      setNotifications({
        discounts: Array.isArray(discountsResponse) ? discountsResponse : discountsResponse.requests || discountsResponse.data || [],
        returns: [],
        inventory: []
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications({ discounts: [], returns: [], inventory: [] });
    }
  }, []);

  const handleApproveDiscount = useCallback(async (discountId: number, approved: boolean, notes?: string) => {
    try {
      await approveDiscountRequest({
        discount_request_id: discountId,
        approved,
        admin_notes: notes
      });
      await loadNotifications();
      alert(approved ? 'Descuento aprobado exitosamente' : 'Descuento rechazado');
    } catch (error: any) {
      console.error('Error processing discount:', error);
      alert('Error al procesar descuento: ' + (error.message || 'Error desconocido'));
    }
  }, [loadNotifications]);

  useEffect(() => {
    loadLocations();
    loadAvailableLocations();
    loadNotifications();
  }, [loadLocations, loadAvailableLocations, loadNotifications]);

  return (
    <AdminContext.Provider
      value={{
        locations,
        availableLocations,
        notifications,
        receiptPreviewUrl,
        setReceiptPreviewUrl,
        loadLocations,
        loadNotifications,
        handleApproveDiscount
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminContextProvider');
  }
  return context;
};
