import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary', 
  className = '' 
}) => {
  const variantStyles = {
    primary: 'bg-primary/20 text-primary border border-primary/30',
    secondary: 'bg-secondary/20 text-secondary border border-secondary/30',
    success: 'bg-success/20 text-success border border-success/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    error: 'bg-destructive/20 text-destructive border border-destructive/30',
  };

  return (
    <span 
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};