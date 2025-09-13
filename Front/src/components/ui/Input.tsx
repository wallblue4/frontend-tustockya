import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  const id = props.id || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`
            w-full px-3 py-2 border border-input bg-card rounded-md shadow-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            text-foreground placeholder:text-muted-foreground
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-destructive ring-destructive/50' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
};