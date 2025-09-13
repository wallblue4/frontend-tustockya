import React from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder,
  icon,
  className = '',
  ...props
}) => {
  const id = props.id || `select-${Math.random().toString(36).substring(2, 9)}`;

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
        <select
          id={id}
          className={`input w-full appearance-none pr-10 ${icon ? 'pl-10' : ''} ${error ? 'border-destructive ring-destructive/50' : ''} ${className}`}
          style={{
            background: 'hsl(var(--card) / 1)',
            color: 'hsl(var(--foreground) / 1)',
            borderColor: error ? 'hsl(var(--destructive) / 1)' : 'hsl(var(--border) / 1)',
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              style={{
                background: 'hsl(var(--card) / 1)',
                color: 'hsl(var(--foreground) / 1)',
              }}
            >
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-4 w-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
};

// Export individual components for flexibility
export const SelectTrigger: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full px-3 py-2 border border-border bg-card text-foreground rounded-md shadow-sm
      focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
      hover:border-primary/50 transition-all duration-200
      flex items-center justify-between
      ${className}
    `}
  >
    {children}
    <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
);

export const SelectContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`
    absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-xl z-50
    max-h-60 overflow-y-auto backdrop-blur-sm
    ${className}
  `}>
    {children}
  </div>
);

export const SelectItem: React.FC<{
  children: React.ReactNode;
  value: string;
  onSelect?: (value: string) => void;
  className?: string;
}> = ({ children, value, onSelect, className = '' }) => (
  <button
    onClick={() => onSelect?.(value)}
    className={`
      w-full px-3 py-2 text-left text-foreground hover:bg-muted/20 transition-colors
      first:rounded-t-md last:rounded-b-md
      ${className}
    `}
  >
    {children}
  </button>
);

export default Select;