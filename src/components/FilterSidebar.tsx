import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, ChevronDown, Check, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Sentiment, TimeFrame } from '@/types/filing';

interface SidebarProps {
  open: boolean;
  sentiment: Sentiment | 'All';
  onSentiment: (s: Sentiment | 'All') => void;
  search: string;
  onSearch: (s: string) => void;
  selectedTopics: string[];
  onTopics: (t: string[]) => void;
  topics: string[];
  selectedSubtopics: string[];
  onSubtopics: (s: string[]) => void;
  subtopics: string[];
  dateFrom: Date | null;
  onDateFrom: (d: Date | null) => void;
  dateTo: Date | null;
  onDateTo: (d: Date | null) => void;
  dateRange: { min: Date | null; max: Date | null };
  timeframe: TimeFrame;
  onTimeframe: (t: TimeFrame) => void;
  activeFilterCount: number;
  onClearAll: () => void;
  searchSuggestions: string[];
  searchInputRef?: (node: HTMLInputElement | null) => void;
}

const SENTIMENT_BUTTONS: { value: Sentiment | 'All'; label: string; activeClass: string }[] = [
  { value: 'All', label: 'All', activeClass: 'bg-primary text-primary-foreground' },
  { value: 'Positive', label: 'Pos', activeClass: 'bg-sentiment-pos/15 text-sentiment-pos border border-sentiment-pos-border' },
  { value: 'Negative', label: 'Neg', activeClass: 'bg-sentiment-neg/15 text-sentiment-neg border border-sentiment-neg-border' },
  { value: 'Neutral', label: 'Neu', activeClass: 'bg-sentiment-neu/15 text-sentiment-neu border border-sentiment-neu-border' },
];

export function FilterSidebar({
  open, sentiment, onSentiment, search, onSearch,
  selectedTopics, onTopics, topics,
  selectedSubtopics, onSubtopics, subtopics,
  dateFrom, onDateFrom, dateTo, onDateTo, dateRange,
  timeframe, onTimeframe, activeFilterCount, onClearAll,
  searchSuggestions, searchInputRef,
}: SidebarProps) {
  const minTime = dateRange.min?.getTime() ?? 0;
  const maxTime = dateRange.max?.getTime() ?? 0;
  const fromTime = dateFrom?.getTime() ?? minTime;
  const toTime = dateTo?.getTime() ?? maxTime;

  // Debounced search
  const [localSearch, setLocalSearch] = useState(search);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setLocalSearch(search); }, [search]);

  const handleSearchChange = useCallback((val: string) => {
    setLocalSearch(val);
    setShowSuggestions(val.length > 0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(val), 250);
  }, [onSearch]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setLocalSearch(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  }, [onSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (!localSearch) return [];
    const q = localSearch.toLowerCase();
    return searchSuggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 8);
  }, [localSearch, searchSuggestions]);

  const handleSliderChange = useCallback((values: number[]) => {
    const newFrom = new Date(values[0]);
    const newTo = new Date(values[1]);
    newFrom.setHours(0, 0, 0, 0);
    newTo.setHours(23, 59, 59, 999);
    onDateFrom(values[0] <= minTime ? null : newFrom);
    onDateTo(values[1] >= maxTime ? null : newTo);
  }, [minTime, maxTime, onDateFrom, onDateTo]);

  if (!open) return null;

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-card p-4 overflow-y-auto fixed top-[48px] h-[calc(100vh-48px)] z-[100]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-sans text-sm font-semibold text-foreground">Filters</h2>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" /> Clear All
          </Button>
        )}
      </div>

      <FilterSection label="Timeframe">
        <div className="flex gap-1 rounded-lg bg-muted p-0.5">
          {(['daily', 'weekly'] as TimeFrame[]).map(tf => (
            <button
              key={tf}
              onClick={() => onTimeframe(tf)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                timeframe === tf
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Sentiment">
        <div className="flex flex-wrap gap-1.5">
          {SENTIMENT_BUTTONS.map(s => (
            <button
              key={s.value}
              onClick={() => onSentiment(s.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all',
                sentiment === s.value
                  ? s.activeClass
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Search">
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Ticker or keyword... (press /)"
            value={localSearch}
            onChange={e => handleSearchChange(e.target.value)}
            onFocus={() => localSearch && setShowSuggestions(true)}
            className="h-9 pl-8 text-xs bg-muted/50 border-border"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-[200px] overflow-y-auto">
              {filteredSuggestions.map(s => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="flex w-full items-center px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </FilterSection>

      <FilterSection label="Topics">
        <MultiSelect options={topics} selected={selectedTopics} onChange={onTopics} placeholder="All Topics" />
      </FilterSection>

      <FilterSection label="Subtopics">
        <MultiSelect options={subtopics} selected={selectedSubtopics} onChange={onSubtopics} placeholder="All Subtopics" />
      </FilterSection>

      <FilterSection label="Date Range">
        <div className="space-y-3">
          {minTime > 0 && maxTime > 0 && (
            <Slider
              min={minTime}
              max={maxTime}
              step={86400000}
              value={[fromTime, toTime]}
              onValueChange={handleSliderChange}
              className="w-full"
            />
          )}
          <div className="flex gap-2">
            <DatePickerField label="From" value={dateFrom} onChange={onDateFrom} />
            <DatePickerField label="To" value={dateTo} onChange={onDateTo} />
          </div>
        </div>
      </FilterSection>
    </aside>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function MultiSelect({ options, selected, onChange, placeholder }: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, search]);

  const toggle = (item: string) => {
    onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item]);
  };

  const isAll = selected.length === 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-border bg-muted/50 px-3 text-xs transition-colors',
          selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        <span className="truncate">
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-[240px] overflow-hidden">
          <div className="p-1.5">
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 text-xs bg-muted/50 border-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-[190px] p-1">
            {/* All option */}
            <button
              onClick={() => onChange([])}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted transition-colors text-left font-medium"
            >
              <div className={cn(
                'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border',
                isAll
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border'
              )}>
                {isAll && <Check className="h-2.5 w-2.5" />}
              </div>
              <span>All</span>
            </button>
            {filtered.length === 0 && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No results</p>
            )}
            {filtered.map(option => (
              <button
                key={option}
                onClick={() => toggle(option)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted transition-colors text-left"
              >
                <div className={cn(
                  'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border',
                  selected.includes(option)
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-border'
                )}>
                  {selected.includes(option) && <Check className="h-2.5 w-2.5" />}
                </div>
                <span className="truncate">{option}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DatePickerField({ label, value, onChange }: { label: string; value: Date | null; onChange: (d: Date | null) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-8 flex-1 justify-start text-xs border-border bg-muted/50',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-1.5 h-3 w-3" />
          {value ? format(value, 'dd MMM') : label}
          {value && (
            <X
              className="ml-auto h-3 w-3 text-muted-foreground hover:text-foreground"
              onClick={e => { e.stopPropagation(); onChange(null); }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => onChange(d ?? null)}
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
