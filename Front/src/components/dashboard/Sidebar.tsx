import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Package, 
  Users, 
  ShoppingBag, 
  BarChart2, 
  Settings, 
  Database, 
  Camera, 
  Truck, 
  User,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const getSidebarLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'superuser':
        return [
          { to: '/superuser', icon: <Home />, label: 'Dashboard' },
          { to: '/superuser/admins', icon: <Users />, label: 'Manage Admins' },
          { to: '/superuser/database', icon: <Database />, label: 'Database Management' },
          { to: '/superuser/settings', icon: <Settings />, label: 'Settings' },
        ];
      case 'admin':
        return [
          { to: '/admin', icon: <Home />, label: 'Dashboard' },
          { to: '/admin/inventory', icon: <Package />, label: 'Inventory' },
          { to: '/admin/sales', icon: <ShoppingBag />, label: 'Sales' },
          { to: '/admin/employees', icon: <Users />, label: 'Employees' },
          { to: '/admin/analytics', icon: <BarChart2 />, label: 'Analytics' },
          { to: '/admin/settings', icon: <Settings />, label: 'Settings' },
        ];
      case 'warehouse':
        return [
          { to: '/warehouse', icon: <Home />, label: 'Dashboard' },
          { to: '/warehouse/requests', icon: <Package />, label: 'Delivery Requests' },
          { to: '/warehouse/inventory', icon: <ShoppingBag />, label: 'Inventory' },
          { to: '/warehouse/settings', icon: <Settings />, label: 'Settings' },
        ];
      case 'seller':
        return [
          { to: '/seller', icon: <Home />, label: 'Dashboard' },
          { to: '/seller/scan', icon: <Camera />, label: 'Scan Product' },
          { to: '/seller/sales', icon: <ShoppingBag />, label: 'Sales' },
          { to: '/seller/requests', icon: <Package />, label: 'Product Requests' },
          { to: '/seller/settings', icon: <Settings />, label: 'Settings' },
        ];
      case 'runner':
        return [
          { to: '/runner', icon: <Home />, label: 'Dashboard' },
          { to: '/runner/deliveries', icon: <Truck />, label: 'Deliveries' },
          { to: '/runner/history', icon: <BarChart2 />, label: 'History' },
          { to: '/runner/settings', icon: <Settings />, label: 'Settings' },
        ];
      default:
        return [];
    }
  };

  const links = getSidebarLinks();

  return (
    <>
      <div 
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed top-0 left-0 z-30 w-64 h-screen bg-white shadow-lg transition-transform duration-300 ease-in-out md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <div className="flex items-center min-w-0">
              <img 
                src={user?.avatar || 'https://via.placeholder.com/40'} 
                alt="User" 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full mr-2 sm:mr-3 flex-shrink-0" 
              />
              <div className="min-w-0">
                <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
              </div>
            </div>
            <button 
              className="md:hidden text-gray-500 hover:text-gray-700 flex-shrink-0"
              onClick={toggleSidebar}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 py-2 sm:py-4 px-2 overflow-y-auto">
            <ul className="space-y-1">
              {links.map((link, index) => (
                <li key={index}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) => 
                      `flex items-center px-3 sm:px-4 py-2 sm:py-3 text-gray-700 rounded-md transition-colors text-sm sm:text-base ${
                        isActive 
                          ? 'bg-primary text-white' 
                          : 'hover:bg-gray-100'
                      }`
                    }
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <span className="mr-2 sm:mr-3 flex-shrink-0">{link.icon}</span>
                    <span className="truncate">{link.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-3 sm:p-4 border-t">
            <button 
              onClick={logout}
              className="flex items-center w-full px-3 sm:px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              <LogOut className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Cerrar sesion</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};