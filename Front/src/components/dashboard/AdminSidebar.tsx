import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  MapPin,
  PieChart,
  Bell,
  FileText,
  Truck,
  ClipboardList,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const STORAGE_KEY = 'admin-sidebar-collapsed';

const navItems = [
  { to: '/administrador', label: 'Panel Principal', icon: BarChart3, end: true },
  { to: '/administrador/usuarios', label: 'Gestión de Usuarios', icon: Users },
  { to: '/administrador/inventario', label: 'Gestión de Inventario', icon: Package },
  { to: '/administrador/mayoreo', label: 'Ventas Mayoreo', icon: ShoppingBag },
  { to: '/administrador/costos', label: 'Gestión de Costos', icon: DollarSign },
  { to: '/administrador/ubicaciones', label: 'Ubicaciones', icon: MapPin },
  { to: '/administrador/analiticas', label: 'Análisis', icon: PieChart },
  { to: '/administrador/notificaciones', label: 'Notificaciones', icon: Bell, badge: true },
  { to: '/administrador/ventas', label: 'Ventas y Trazabilidad', icon: FileText },
  { to: '/administrador/transferencias', label: 'Transferencias', icon: Truck },
  { to: '/administrador/reporte-dia', label: 'Reporte Día', icon: ClipboardList },
];

export const AdminSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const { notifications } = useAdmin();
  const badgeCount = notifications.discounts.length + notifications.returns.length;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} bg-card border-r border-border h-full flex flex-col transition-all duration-200 flex-shrink-0`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-end'} p-2 border-b border-border`}>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted/20'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {item.badge && badgeCount > 0 && (
                <span
                  className={`${collapsed ? 'absolute -mt-4 -mr-4' : 'ml-auto'} bg-error text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0`}
                >
                  {badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
