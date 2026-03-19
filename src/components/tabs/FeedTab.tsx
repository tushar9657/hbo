import { useMemo, useState } from 'react';
import { ArrowUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilingCard } from '@/components/FilingCard';
import type { ParsedFiling } from '@/types/filing';
import { formatDate } from '@/utils/dateUtils';

interface FeedTabProps {
  filings: ParsedFiling[];
  selectedDate: Date | null;
  onClearDate: () => void;
  readIds?: Set<string>;
  onMarkRead?: (id: string) => void;
}

const PAGE_SIZE = 40;

export function FeedTab({ filings, selectedDate, onClearDate, readIds, onMarkRead }: FeedTabProps) {
  const [sortAsc, setSortAsc] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sorted = useMemo(() => {
    return [...filings].sort((a, b) => {
      const da = a.PubDate?.getTime() ?? 0;
      const db = b.PubDate?.getTime() ?? 0;
      return sortAsc ? da - db : db - da;
    });
  }, [filings, sortAsc]);

  const visible = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);
  const hasMore = visibleCount < sorted.length;

  return (
    <div className="mx-auto max-w-[900px]">
      {/* Date filter banner */}
      {selectedDate && (
        <div className="mb-3 flex items-center justify-between rounded-sm border border-primary/20 bg-primary/5 px-3 py-2">
          <span className="font-mono text-xs text-primary">
            Showing filings for {formatDate(selectedDate).split(',')[0]}
          </span>
          <Button variant="ghost" size="sm" onClick={onClearDate} className="h-6 gap-1 px-2 text-xs text-muted-foreground">
            <X className="h-3 w-3" /> Clear
          </Button>
        </div>
      )}

      {/* Sort control */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {sorted.length} filing{sorted.length !== 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortAsc(s => !s)}
          className="gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortAsc ? 'Oldest first' : 'Newest first'}
        </Button>
      </div>

      {/* Cards */}
      <div className="min-h-[400px]">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center min-h-[400px]">
            <p className="font-mono text-sm text-muted-foreground">No filings match your current filters.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {visible.map(f => (
                <FilingCard
                  key={f.id}
                  filing={f}
                  isRead={readIds?.has(f.id)}
                  onOpen={() => onMarkRead?.(f.id)}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="text-[13px] text-muted-foreground"
                >
                  Load more ({sorted.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
