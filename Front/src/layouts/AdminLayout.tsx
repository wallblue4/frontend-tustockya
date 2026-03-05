import React from 'react';
import { Outlet } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AdminSidebar } from '../components/dashboard/AdminSidebar';
import { AdminMobileNav } from '../components/dashboard/AdminMobileNav';
import { useAdmin } from '../context/AdminContext';

export const AdminLayout: React.FC = () => {
  const { receiptPreviewUrl, setReceiptPreviewUrl } = useAdmin();

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card shadow-xl border-b border-border z-10 flex-shrink-0 backdrop-blur-sm">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">Panel de Administración</h1>
          </div>
          <button
            onClick={handleLogout}
            className="ml-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors shadow-md flex-shrink-0"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      <AdminMobileNav />

      {/* Desktop: sidebar + content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden lg:flex">
          <AdminSidebar />
        </div>
        <main className="flex-1 overflow-y-auto min-h-0 bg-background">
          <Outlet />
        </main>
      </div>

      {/* Receipt Preview Modal */}
      {receiptPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setReceiptPreviewUrl(null)} />
          <div className="relative z-10 max-w-6xl w-full bg-card rounded-lg shadow-xl border border-border overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Recibo de venta</h3>
              <Button variant="ghost" size="sm" onClick={() => setReceiptPreviewUrl(null)}>
                Cerrar
              </Button>
            </div>
            <div className="max-h-[80vh] overflow-auto bg-black">
              <img src={receiptPreviewUrl} alt="Recibo de venta" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
