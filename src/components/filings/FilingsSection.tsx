import { useEffect, useState, useCallback, useMemo } from 'react';
import { useFilings } from '@/hooks/useFilings';
import { useFilters } from '@/hooks/useFilters';
import { FilterSidebar } from '@/components/FilterSidebar';
import { FeedTab } from '@/components/tabs/FeedTab';
import { ChartsTab } from '@/components/tabs/ChartsTab';
import { ActiveFilterPills } from '@/components/ActiveFilterPills';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { TabType, ParsedFiling } from '@/types/filing';

const TABS: { key: TabType; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'charts', label: 'Charts' },
];

function exportFilingsToCSV(filings: ParsedFiling[]) {
  const headers = ['Ticker', 'Title', 'Sentiment', 'Topic', 'Subtopic', 'Summary', 'Publication Date', 'Secondary Topic', 'Secondary Subtopic', 'Status'];
  const rows = filings.map(f => [
    `"${(f.Ticker || '').replace(/"/g, '""')}"`,
    `"${(f.Title || '').replace(/"/g, '""')}"`,
    `"${(f.AI_Sentiment || '').replace(/"/g, '""')}"`,
    `"${(f.AI_Topic || '').replace(/"/g, '""')}"`,
    `"${(f.AI_Subtopic || '').replace(/"/g, '""')}"`,
    `"${(f.AI_Summary || '').replace(/"/g, '""')}"`,
    `"${(f.PubDateRaw || '').replace(/"/g, '""')}"`,
    `"${(f.AI_Topic_2 || '').replace(/"/g, '""')}"`,
    `"${(f.AI_Subtopic_2 || '').replace(/"/g, '""')}"`,
    `"${(f.Status || '').replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hubble-filings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface FilingsSectionProps {
  onLoadingChange?: (loading: boolean) => void;
  onRefreshRef?: (fn: () => void) => void;
  onFilingsData?: (filings: ParsedFiling[]) => void;
  readIds?: Set<string>;
  onMarkRead?: (id: string) => void;
}

export function FilingsSection({ onLoadingChange, onRefreshRef, onFilingsData, readIds, onMarkRead }: FilingsSectionProps) {
  const { filings, loading, error, lastFetched, fetchFilings } = useFilings();
  const {
    filters, filtered, topics, subtopics, sentimentCounts, activeFilterCount, dateRange,
    toggleSentiment, clearSentiments, setTopics, setSubtopics, setSearch, setDateFrom, setDateTo, setTimeframe, setSelectedDate, clearAll,
  } = useFilters(filings);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  useEffect(() => { onLoadingChange?.(loading); }, [loading, onLoadingChange]);
  useEffect(() => { onRefreshRef?.(fetchFilings); }, [fetchFilings, onRefreshRef]);
  useEffect(() => { onFilingsData?.(filings); }, [filings, onFilingsData]);

  const searchSuggestions = useMemo(() => {
    const set = new Set<string>();
    filings.forEach(f => {
      if (f.Ticker) set.add(f.Ticker);
      if (f.Title) set.add(f.Title);
    });
    return Array.from(set).sort();
  }, [filings]);

  const searchInputRef = useCallback((node: HTMLInputElement | null) => {
    (window as any).__searchInput = node;
  }, []);

  useEffect(() => { fetchFilings(); }, [fetchFilings]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    if (mq.matches) setSidebarOpen(false);
  }, []);

  const handleTopicFilter = useCallback((topic: string) => {
    setTopics([topic]);
    setActiveTab('feed');
  }, [setTopics]);

  const handleTimelineDate = useCallback((dateLabel: string) => {
    const datePart = dateLabel.includes('|') ? dateLabel.split('|')[0] : dateLabel;
    const match = filings.find(f => {
      if (!f.PubDate) return false;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const key = `${String(f.PubDate.getDate()).padStart(2, '0')} ${months[f.PubDate.getMonth()]}`;
      return key === datePart.trim();
    });
    if (match?.PubDate) {
      setSelectedDate(match.PubDate);
      setActiveTab('feed');
    }
  }, [filings, setSelectedDate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
        <p className="text-[13px] text-muted-foreground">Loading filings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="rounded-lg border border-border bg-card p-8 text-center max-w-md">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-destructive text-lg">✕</span>
          </div>
          <h2 className="text-[13px] font-medium text-foreground mb-2">Failed to load filings data</h2>
          <p className="text-[12px] text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchFilings} size="sm" className="gap-2 text-[12px]">↺ Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <FilterSidebar
        open={sidebarOpen}
        sentiments={filters.sentiments}
        onToggleSentiment={toggleSentiment}
        onClearSentiments={clearSentiments}
        search={filters.search}
        onSearch={setSearch}
        selectedTopics={filters.topics}
        onTopics={setTopics}
        topics={topics}
        selectedSubtopics={filters.subtopics}
        onSubtopics={setSubtopics}
        subtopics={subtopics}
        dateFrom={filters.dateFrom}
        onDateFrom={setDateFrom}
        dateTo={filters.dateTo}
        onDateTo={setDateTo}
        dateRange={dateRange}
        timeframe={filters.timeframe}
        onTimeframe={setTimeframe}
        activeFilterCount={activeFilterCount}
        onClearAll={clearAll}
        searchSuggestions={searchSuggestions}
        searchInputRef={searchInputRef}
      />
      {sidebarOpen && <div className="w-[312px] shrink-0" />}

      <main className="flex-1 min-w-0 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 border-b border-border">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px',
                  activeTab === tab.key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span className={cn(
                  'ml-1.5 text-[11px] rounded-full px-1.5 py-0.5 tabular-nums',
                  activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>{filtered.length}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportFilingsToCSV(filtered)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Export to CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
            <button
              onClick={() => setSidebarOpen(s => !s)}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors md:hidden"
            >
              {sidebarOpen ? 'Hide Filters' : 'Filters'}
              {!sidebarOpen && activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>
          </div>
        </div>

        <ActiveFilterPills
          filters={filters}
          onClearSentiments={clearSentiments}
          onRemoveSentiment={(s) => toggleSentiment(s)}
          onRemoveTopic={(t) => setTopics(filters.topics.filter(x => x !== t))}
          onRemoveSubtopic={(s) => setSubtopics(filters.subtopics.filter(x => x !== s))}
          onClearSearch={() => setSearch('')}
          onClearDateFrom={() => setDateFrom(null)}
          onClearDateTo={() => setDateTo(null)}
          onClearSelectedDate={() => setSelectedDate(null)}
          onClearAll={clearAll}
        />

        {activeTab === 'feed' && (
          <FeedTab
            filings={filtered}
            selectedDate={filters.selectedDate}
            onClearDate={() => setSelectedDate(null)}
            readIds={readIds}
            onMarkRead={onMarkRead}
          />
        )}
        {activeTab === 'charts' && (
          <ChartsTab filings={filtered} timeframe={filters.timeframe} onTopicFilter={handleTopicFilter} onDateFilter={handleTimelineDate} />
        )}
      </main>
    </div>
  );
}
