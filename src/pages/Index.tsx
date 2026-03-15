import { useEffect, useState, useCallback } from 'react';
import { useFilings } from '@/hooks/useFilings';
import { useFilters } from '@/hooks/useFilters';
import { TopBar } from '@/components/TopBar';
import { FilterSidebar } from '@/components/FilterSidebar';
import { FeedTab } from '@/components/tabs/FeedTab';
import { ChartsTab } from '@/components/tabs/ChartsTab';
import { HeatmapTab } from '@/components/tabs/HeatmapTab';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TabType } from '@/types/filing';

const TABS: { key: TabType; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'charts', label: 'Charts' },
  { key: 'heatmap', label: 'Heatmap' },
];

const Index = () => {
  const { filings, loading, error, lastFetched, fetchFilings } = useFilings();
  const {
    filters, filtered, topics, sentimentCounts, activeFilterCount,
    setSentiment, setTopic, setSearch, setDateFrom, setDateTo, setTimeframe, setSelectedDate, clearAll,
  } = useFilters(filings);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  useEffect(() => { fetchFilings(); }, [fetchFilings]);

  // Responsive: collapse sidebar on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    if (mq.matches) setSidebarOpen(false);
  }, []);

  const handleHeatmapDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setActiveTab('feed');
  }, [setSelectedDate]);

  const handleTopicFilter = useCallback((topic: string) => {
    setTopic(topic);
    setActiveTab('feed');
  }, [setTopic]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="font-mono text-sm uppercase tracking-[0.15em] text-foreground">
          Fetching Filings...
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Connecting to NSE database...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="rounded-md border border-destructive/30 bg-surface-1 p-8 text-center terminal-shadow max-w-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-destructive text-xl">✕</span>
          </div>
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground mb-2">
            Failed to load filings data
          </h2>
          <p className="font-sans text-xs text-muted-foreground mb-1">{error}</p>
          <p className="font-sans text-xs text-muted-foreground mb-4">
            Ensure the Google Sheet is set to "Anyone with link can view"
          </p>
          <Button onClick={fetchFilings} className="gap-2 font-mono text-xs uppercase">
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
          topic={filters.topic}
          onTopic={setTopic}
          topics={topics}
          dateFrom={filters.dateFrom}
          onDateFrom={setDateFrom}
          dateTo={filters.dateTo}
          onDateTo={setDateTo}
          timeframe={filters.timeframe}
          onTimeframe={setTimeframe}
          activeFilterCount={activeFilterCount}
          onClearAll={clearAll}
        />

        <main className="flex-1 overflow-y-auto p-4">
          {/* Tab bar */}
          <div className="mb-4 flex gap-1 border-b border-border">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 -mb-px',
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
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
          {activeTab === 'heatmap' && (
            <HeatmapTab
              filings={filtered}
              onSelectDate={handleHeatmapDateSelect}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
