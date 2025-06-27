import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-col flex-1 md:ml-64 min-w-0">
        <header className="bg-white shadow-sm z-10 flex-shrink-0">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <button
                className="md:hidden mr-2 sm:mr-3 text-gray-500 hover:text-gray-700 flex-shrink-0"
                onClick={toggleSidebar}
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
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
    </div>
  );
};