import React, { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';

interface SearchBarProps {
  onSearch: (brand: string, model: string) => void;
  isSearching: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = React.memo(({ onSearch, isSearching }) => {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() && !model.trim()) return;
    onSearch(brand.trim(), model.trim());
  }, [brand, model, onSearch]);

  const canSearch = (brand.trim() || model.trim()) && !isSearching;

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Buscar por marca / modelo</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Marca"
              disabled={isSearching}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
            />
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Modelo"
              disabled={isSearching}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!canSearch}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all
              ${canSearch
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
              }`}
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Buscar
              </>
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
});
