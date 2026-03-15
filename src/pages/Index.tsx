import { useEffect, useState, useCallback, useMemo } from 'react';
import { useFilings } from '@/hooks/useFilings';
import { useFilters } from '@/hooks/useFilters';
import { TopBar } from '@/components/TopBar';
import { FilterSidebar } from '@/components/FilterSidebar';
import { FeedTab } from '@/components/tabs/FeedTab';
import { ChartsTab } from '@/components/tabs/ChartsTab';
import { ActiveFilterPills } from '@/components/ActiveFilterPills';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TabType } from '@/types/filing';

const TABS: { key: TabType; label: string; shortcut: string }[] = [
  { key: 'feed', label: 'Feed', shortcut: '1' },
  { key: 'charts', label: 'Charts', shortcut: '2' },
];

const Index = () => {
  const { filings, loading, error, lastFetched, fetchFilings } = useFilings();
  const {
    filters, filtered, topics, subtopics, sentimentCounts, activeFilterCount, dateRange,
    setSentiment, setTopics, setSubtopics, setSearch, setDateFrom, setDateTo, setTimeframe, setSelectedDate, clearAll,
  } = useFilters(filings);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  const searchSuggestions = useMemo(() => {
    const set = new Set<string>();
    filings.forEach(f => {
      if (f.Ticker) set.add(f.Ticker);
      if (f.Title) set.add(f.Title);
    });
    return Array.from(set).sort();
  }, [filings]);

  const searchInputRef = useCallback((node: HTMLInputElement | null) => {
    // stored for keyboard shortcut focus
    (window as any).__searchInput = node;
  }, []);

  useEffect(() => { fetchFilings(); }, [fetchFilings]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    if (mq.matches) setSidebarOpen(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        (window as any).__searchInput?.focus();
        if (!sidebarOpen) setSidebarOpen(true);
        return;
      }
      
      if (isInput) return;
      
      if (e.key === '1') setActiveTab('feed');
      if (e.key === '2') setActiveTab('charts');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarOpen]);

  const handleTopicFilter = useCallback((topic: string) => {
    setTopics([topic]);
    setActiveTab('feed');
  }, [setTopics]);

  const handleTimelineDate = useCallback((dateLabel: string) => {
    // dateLabel format: "DD Mon|Day" or "DD Mon"
    const datePart = dateLabel.includes('|') ? dateLabel.split('|')[0] : dateLabel;
    // Find a filing matching this date key
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
          <h2 className="text-sm font-semibold text-foreground mb-2">Failed to load filings data</h2>
          <p className="text-xs text-muted-foreground mb-1">{error}</p>
          <p className="text-xs text-muted-foreground mb-4">Ensure the Google Sheet is set to "Anyone with link can view"</p>
          <Button onClick={fetchFilings} className="gap-2 text-xs">↺ Try Again</Button>
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

      <div className="flex flex-1">
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
          searchInputRef={searchInputRef}
        />
        {/* Spacer for fixed sidebar */}
        {sidebarOpen && <div className="w-[280px] shrink-0" />}

        <main className="flex-1 min-w-0 p-4">
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
                <span className="ml-1.5 text-[10px] text-muted-foreground opacity-50">{tab.shortcut}</span>
              </button>
            ))}
          </div>

          <ActiveFilterPills
            filters={filters}
            onClearSentiment={() => setSentiment('All')}
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
            />
          )}
          {activeTab === 'charts' && (
            <ChartsTab
              filings={filtered}
              timeframe={filters.timeframe}
              onTopicFilter={handleTopicFilter}
              onDateFilter={handleTimelineDate}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
