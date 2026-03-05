import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  PieChart,
  Bell,
  FileText,
  Truck,
  ClipboardList,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const mobileItems = [
  { to: '/administrador', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/administrador/usuarios', label: 'Usuarios', icon: Users },
  { to: '/administrador/inventario', label: 'Inventario', icon: Package },
  { to: '/administrador/mayoreo', label: 'Mayoreo', icon: ShoppingBag },
  { to: '/administrador/costos', label: 'Costos', icon: DollarSign },
  { to: '/administrador/ventas', label: 'Ventas', icon: FileText },
  { to: '/administrador/transferencias', label: 'Transferencias', icon: Truck },
  { to: '/administrador/analiticas', label: 'Graficas', icon: PieChart },
  { to: '/administrador/reporte-dia', label: 'Reporte Día', icon: ClipboardList },
  { to: '/administrador/notificaciones', label: 'Notificaciones', icon: Bell, badge: true },
];

export const AdminMobileNav: React.FC = () => {
  const { notifications } = useAdmin();
  const badgeCount = notifications.discounts.length + notifications.returns.length;

  return (
    <div className="lg:hidden bg-card border-b border-border sticky top-0 z-10">
      <div className="flex overflow-x-auto px-4 py-2 space-x-2">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.badge && badgeCount > 0 && (
                <span className="bg-error text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
