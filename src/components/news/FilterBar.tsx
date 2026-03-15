import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  search: string;
  onSearch: (s: string) => void;
  sectors: string[];
  onSectors: (s: string[]) => void;
  availableSectors: string[];
  categories: string[];
  onCategories: (c: string[]) => void;
  availableCategories: string[];
  impactFilter: string;
  onImpactFilter: (f: string) => void;
  activeFilterCount: number;
  onClear: () => void;
}

const IMPACT_OPTIONS = ['All', 'Has India Impact', 'No India Impact', 'Supply/Demand', 'Regulatory', 'Macro'];

export function FilterBar({
  search, onSearch, sectors, onSectors, availableSectors,
  categories, onCategories, availableCategories,
  impactFilter, onImpactFilter, activeFilterCount, onClear,
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setLocalSearch(search); }, [search]);

  const handleSearch = useCallback((val: string) => {
    setLocalSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(val), 250);
  }, [onSearch]);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search headlines, summaries..."
          value={localSearch}
          onChange={e => handleSearch(e.target.value)}
          className="h-9 pl-8 text-[13px] bg-card border-border"
        />
      </div>

      {/* Sector dropdown */}
      <MultiDropdown
        label="Sector"
        options={availableSectors}
        selected={sectors}
        onChange={onSectors}
      />

      {/* Category dropdown */}
      <MultiDropdown
        label="Category"
        options={availableCategories}
        selected={categories}
        onChange={onCategories}
      />

      {/* Impact dropdown */}
      <SingleDropdown
        label="Impact"
        options={IMPACT_OPTIONS}
        value={impactFilter}
        onChange={onImpactFilter}
      />

      {/* Clear */}
      {activeFilterCount > 0 && (
        <button onClick={onClear} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <X className="h-3 w-3" /> Clear filters
        </button>
      )}
      {activeFilterCount > 0 && (
        <span className="text-[11px] text-muted-foreground">Filters ({activeFilterCount})</span>
      )}
    </div>
  );
}

function MultiDropdown({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (item: string) => {
    onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] transition-colors hover:border-surface-3',
          selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {selected.length > 0 ? `${label} (${selected.length})` : label}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-[240px] rounded-md border border-border bg-card shadow-lg max-h-[280px] overflow-y-auto">
          <div className="p-1">
            <button
              onClick={() => onChange([])}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-surface-2 transition-colors"
            >
              <div className={cn(
                'flex h-3.5 w-3.5 items-center justify-center rounded-sm border',
                selected.length === 0 ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
              )}>
                {selected.length === 0 && <Check className="h-2.5 w-2.5" />}
              </div>
              All
            </button>
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-surface-2 transition-colors text-left"
              >
                <div className={cn(
                  'flex h-3.5 w-3.5 items-center justify-center rounded-sm border shrink-0',
                  selected.includes(opt) ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                )}>
                  {selected.includes(opt) && <Check className="h-2.5 w-2.5" />}
                </div>
                <span className="truncate">{opt}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SingleDropdown({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] transition-colors hover:border-surface-3',
          value !== 'All' ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {value !== 'All' ? `${label}: ${value}` : label}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-[200px] rounded-md border border-border bg-card shadow-lg">
          <div className="p-1">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  'flex w-full items-center rounded px-2 py-1.5 text-[12px] hover:bg-surface-2 transition-colors text-left',
                  value === opt && 'text-primary'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
