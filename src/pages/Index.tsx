import { useEffect, useState, useCallback, useMemo } from 'react';
import { useFilings } from '@/hooks/useFilings';
import { useFilters } from '@/hooks/useFilters';
import { TopBar } from '@/components/TopBar';
import { FilterSidebar } from '@/components/FilterSidebar';
import { FeedTab } from '@/components/tabs/FeedTab';
import { ChartsTab } from '@/components/tabs/ChartsTab';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TabType } from '@/types/filing';

const TABS: { key: TabType; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'charts', label: 'Charts' },
];

const Index = () => {
  const { filings, loading, error, lastFetched, fetchFilings } = useFilings();
  const {
    filters, filtered, topics, subtopics, sentimentCounts, activeFilterCount, dateRange,
    setSentiment, setTopics, setSubtopics, setSearch, setDateFrom, setDateTo, setTimeframe, setSelectedDate, clearAll,
  } = useFilters(filings);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  // Build search suggestions from unique tickers and titles
  const searchSuggestions = useMemo(() => {
    const set = new Set<string>();
    filings.forEach(f => {
      if (f.Ticker) set.add(f.Ticker);
      if (f.Title) set.add(f.Title);
    });
    return Array.from(set).sort();
  }, [filings]);

  useEffect(() => { fetchFilings(); }, [fetchFilings]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    if (mq.matches) setSidebarOpen(false);
  }, []);

  const handleTopicFilter = useCallback((topic: string) => {
    setTopics([topic]);
    setActiveTab('feed');
  }, [setTopics]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium text-foreground">Fetching Filings...</p>
        <p className="mt-1 text-xs text-muted-foreground">Connecting to NSE database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="rounded-lg border border-border bg-card p-8 text-center card-shadow max-w-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-destructive text-xl">✕</span>
          </div>
          <h2 className="text-sm font-semibold text-foreground mb-2">
            Failed to load filings data
          </h2>
          <p className="text-xs text-muted-foreground mb-1">{error}</p>
          <p className="text-xs text-muted-foreground mb-4">
            Ensure the Google Sheet is set to "Anyone with link can view"
          </p>
          <Button onClick={fetchFilings} className="gap-2 text-xs">
            ↺ Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar
        lastFetched={lastFetched}
        onRefresh={fetchFilings}
        sentimentCounts={sentimentCounts}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(s => !s)}
        activeFilterCount={activeFilterCount}
        isRefreshing={loading}
      />

      <div className="flex flex-1 overflow-hidden">
        <FilterSidebar
          open={sidebarOpen}
          sentiment={filters.sentiment}
          onSentiment={setSentiment}
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
        />

        <main className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 flex gap-1 border-b border-border">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'feed' && (
            <FeedTab
              filings={filtered}
              selectedDate={filters.selectedDate}
              onClearDate={() => setSelectedDate(null)}
            />
          )}
          {activeTab === 'charts' && (
            <ChartsTab
              filings={filtered}
              timeframe={filters.timeframe}
              onTopicFilter={handleTopicFilter}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
