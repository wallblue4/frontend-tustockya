import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, MapPin } from 'lucide-react';
import { Badge } from '../../ui/Badge';

interface Location {
  id: number;
  name: string;
  type: string;
}

interface LocationSearchSelectProps {
  locations: Location[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filterType?: 'local' | 'bodega' | 'all';
}

const LocationSearchSelect: React.FC<LocationSearchSelectProps> = ({
  locations,
  value,
  onChange,
  placeholder = 'Todas las ubicaciones',
  filterType = 'all',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLocations = locations
    .filter((loc) => {
      if (filterType !== 'all' && loc.type?.toLowerCase() !== filterType) return false;
      if (search && !loc.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aIsBodega = a.type?.toLowerCase() === 'bodega' ? 0 : 1;
      const bIsBodega = b.type?.toLowerCase() === 'bodega' ? 0 : 1;
      if (aIsBodega !== bIsBodega) return aIsBodega - bIsBodega;
      return a.name.localeCompare(b.name);
    });

  const selectedLocation = locations.find((loc) => loc.id.toString() === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
          hover:border-primary/50 transition-all duration-200
          flex items-center justify-between text-sm"
      >
        <span className="flex items-center gap-2 truncate">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {selectedLocation ? selectedLocation.name : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-xl z-50 max-h-64 overflow-hidden backdrop-blur-sm">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ubicación..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-md
                  text-foreground placeholder:text-muted-foreground
                  focus:outline-none focus:ring-1 focus:ring-primary/50"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearch('');
              }}
              className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/20 transition-colors"
            >
              {placeholder}
            </button>
            {filteredLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => {
                  onChange(loc.id.toString());
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/20 transition-colors flex items-center justify-between gap-2
                  ${value === loc.id.toString() ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
              >
                <span className="truncate">{loc.name}</span>
                <Badge variant={loc.type?.toLowerCase() === 'bodega' ? 'warning' : 'primary'}>
                  {loc.type}
                </Badge>
              </button>
            ))}
            {filteredLocations.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                No se encontraron ubicaciones
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearchSelect;
