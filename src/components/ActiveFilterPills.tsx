import { X } from 'lucide-react';
import { format } from 'date-fns';
import type { Sentiment } from '@/types/filing';

interface ActiveFilterPillsProps {
  filters: {
    sentiments: Sentiment[];
    topics: string[];
    subtopics: string[];
    search: string;
    dateFrom: Date | null;
    dateTo: Date | null;
    selectedDate: Date | null;
  };
  onClearSentiments: () => void;
  onRemoveSentiment: (s: Sentiment) => void;
  onRemoveTopic: (t: string) => void;
  onRemoveSubtopic: (s: string) => void;
  onClearSearch: () => void;
  onClearDateFrom: () => void;
  onClearDateTo: () => void;
  onClearSelectedDate: () => void;
  onClearAll: () => void;
}

export function ActiveFilterPills({
  filters, onRemoveSentiment, onRemoveTopic, onRemoveSubtopic,
  onClearSearch, onClearDateFrom, onClearDateTo, onClearSelectedDate, onClearAll,
}: ActiveFilterPillsProps) {
  const pills: { label: string; onRemove: () => void }[] = [];

  filters.sentiments.forEach(s => {
    pills.push({ label: `Sentiment: ${s}`, onRemove: () => onRemoveSentiment(s) });
  });
  filters.topics.forEach(t => {
    pills.push({ label: `Topic: ${t.length > 20 ? t.slice(0, 20) + '…' : t}`, onRemove: () => onRemoveTopic(t) });
  });
  filters.subtopics.forEach(s => {
    pills.push({ label: `Subtopic: ${s.length > 20 ? s.slice(0, 20) + '…' : s}`, onRemove: () => onRemoveSubtopic(s) });
  });
  if (filters.search) {
    pills.push({ label: `Search: "${filters.search}"`, onRemove: onClearSearch });
  }
  if (filters.dateFrom) {
    pills.push({ label: `From: ${format(filters.dateFrom, 'dd MMM yyyy')}`, onRemove: onClearDateFrom });
  }
  if (filters.dateTo) {
    pills.push({ label: `To: ${format(filters.dateTo, 'dd MMM yyyy')}`, onRemove: onClearDateTo });
  }
  if (filters.selectedDate) {
    pills.push({ label: `Date: ${format(filters.selectedDate, 'dd MMM yyyy')}`, onRemove: onClearSelectedDate });
  }

  if (pills.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {pills.map((pill, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
        >
          {pill.label}
          <button
            onClick={pill.onRemove}
            className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
            aria-label={`Remove ${pill.label}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      {pills.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors ml-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
