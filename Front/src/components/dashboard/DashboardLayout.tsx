import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  // Función de logout simple
  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="bg-card shadow-xl border-b border-border z-10 flex-shrink-0 backdrop-blur-sm">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <button
              onClick={handleLogout}
              className="mr-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors shadow-md"
            >
              Logout
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{title}</h1>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="h-full bg-background">
          {children}
        </div>
      </main>
    </div>
  );
};