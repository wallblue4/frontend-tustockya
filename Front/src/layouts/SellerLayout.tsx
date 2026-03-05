import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useSeller } from '../context/SellerContext';
import { CameraCapture } from '../components/seller/CameraCapture';

const VIEW_TITLES: Record<string, string> = {
  '/seller': 'Panel de Vendedor',
  '/seller/scan': 'Escanear Producto',
  '/seller/scan/transfer': 'Solicitar Transferencia',
  '/seller/scan/sale': 'Confirmar Venta',
  '/seller/new-sale': 'Nueva Venta',
  '/seller/sales': 'Ventas del Dia',
  '/seller/expenses': 'Registrar Gasto',
  '/seller/expenses-list': 'Gastos del Dia',
  '/seller/transfers': 'Gestion de Pedidos',
};

export const SellerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    showCamera,
    isProcessingImage,
    handleCameraCapture,
    handleCloseCameraCapture,
    setShowCamera,
    setIsSearchMode,
    isSearchMode,
    scanViewTitle,
  } = useSeller();

  const isHome = location.pathname === '/seller';

  const getTitle = () => {
    if (location.pathname === '/seller/scan') {
      return isSearchMode ? 'Buscar Producto' : scanViewTitle;
    }
    return VIEW_TITLES[location.pathname] || 'Panel de Vendedor';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="bg-card shadow-xl border-b border-border z-10 flex-shrink-0 backdrop-blur-sm">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center min-w-0">
            {!isHome && (
              <button
                onClick={() => navigate('/seller')}
                className="mr-3 p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
                aria-label="Ir al inicio"
              >
                <Home className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{getTitle()}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="ml-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors shadow-md flex-shrink-0"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="h-full bg-background">
          {showCamera && (
            <CameraCapture
              onCapture={async (imageFile: File) => {
                await handleCameraCapture(imageFile);
                navigate('/seller/scan');
              }}
              onClose={handleCloseCameraCapture}
              onSearchMode={() => {
                setShowCamera(false);
                setIsSearchMode(true);
                navigate('/seller/scan');
              }}
              isProcessing={isProcessingImage}
            />
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
};
