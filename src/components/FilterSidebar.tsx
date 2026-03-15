import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { Sentiment, TimeFrame } from '@/types/filing';

interface SidebarProps {
  open: boolean;
  sentiment: Sentiment | 'All';
  onSentiment: (s: Sentiment | 'All') => void;
  search: string;
  onSearch: (s: string) => void;
  topic: string;
  onTopic: (t: string) => void;
  topics: string[];
  dateFrom: Date | null;
  onDateFrom: (d: Date | null) => void;
  dateTo: Date | null;
  onDateTo: (d: Date | null) => void;
  timeframe: TimeFrame;
  onTimeframe: (t: TimeFrame) => void;
  activeFilterCount: number;
  onClearAll: () => void;
}

const SENTIMENTS: (Sentiment | 'All')[] = ['All', 'Positive', 'Negative', 'Neutral'];

export function FilterSidebar({
  open,
  sentiment,
  onSentiment,
  search,
  onSearch,
  topic,
  onTopic,
  topics,
  dateFrom,
  onDateFrom,
  dateTo,
  onDateTo,
  timeframe,
  onTimeframe,
  activeFilterCount,
  onClearAll,
}: SidebarProps) {
  if (!open) return null;

  return (
    <aside className="w-[280px] shrink-0 border-r border-border bg-surface-1 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Filters
        </h2>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 gap-1 px-2 font-mono text-xs text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" /> Clear All
          </Button>
        )}
      </div>

      {/* Timeframe */}
      <div className="mb-5">
        <label className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Timeframe
        </label>
        <div className="flex gap-1">
          {(['daily', 'weekly'] as TimeFrame[]).map(tf => (
            <Button
              key={tf}
              variant={timeframe === tf ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTimeframe(tf)}
              className={cn(
                'flex-1 font-mono text-xs uppercase',
                timeframe === tf ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Sentiment */}
      <div className="mb-5">
        <label className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Sentiment
        </label>
        <div className="flex flex-wrap gap-1">
          {SENTIMENTS.map(s => (
            <Button
              key={s}
              variant={sentiment === s ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onSentiment(s)}
              className={cn(
                'font-mono text-xs',
                sentiment === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <label className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Ticker or keyword..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="h-8 bg-surface-2 pl-8 font-mono text-xs border-border"
          />
        </div>
      </div>

      {/* Topic */}
      <div className="mb-5">
        <label className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Topic
        </label>
        <Select value={topic || '__all__'} onValueChange={v => onTopic(v === '__all__' ? '' : v)}>
          <SelectTrigger className="h-8 bg-surface-2 font-mono text-xs border-border">
            <SelectValue placeholder="All Topics" />
          </SelectTrigger>
          <SelectContent className="bg-surface-2 border-border">
            <SelectItem value="__all__" className="font-mono text-xs">All Topics</SelectItem>
            {topics.map(t => (
              <SelectItem key={t} value={t} className="font-mono text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="mb-5">
        <label className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Date Range
        </label>
        <div className="flex flex-col gap-2">
          <DatePickerField label="From" value={dateFrom} onChange={onDateFrom} />
          <DatePickerField label="To" value={dateTo} onChange={onDateTo} />
        </div>
      </div>
    </aside>
  );
}

function DatePickerField({ label, value, onChange }: { label: string; value: Date | null; onChange: (d: Date | null) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-8 w-full justify-start bg-surface-2 font-mono text-xs border-border',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
          {value ? format(value, 'dd MMM yyyy') : label}
          {value && (
            <X
              className="ml-auto h-3 w-3 text-muted-foreground hover:text-foreground"
              onClick={e => { e.stopPropagation(); onChange(null); }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-surface-2 border-border" align="start">
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
