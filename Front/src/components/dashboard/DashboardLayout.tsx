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
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm z-10 flex-shrink-0">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <button
              onClick={handleLogout}
              className="mr-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">{title}</h1>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
};